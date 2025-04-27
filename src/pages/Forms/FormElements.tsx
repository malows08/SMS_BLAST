import { useEffect, useState } from "react";
import {
  Input,
  Textarea,
  Checkbox,
  Button,
  Label,
  Select,
  SelectItem,
} from "../../components/ui/index.ts";
import SMSLogsGrid from "../../components/grid/SMSLogsGrid";
import { Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { apiConfig } from "../../settings";
import { useRefresh } from "../../context/RefreshContext";
import { useSmsProvider } from "../../context/SmsProviderContext";
import toast from "react-hot-toast";

export default function ComposeSMS() {
  const { refresh } = useRefresh();
  const { setProvider } = useSmsProvider(); // ✅ use Provider Context

  // 🛠 Default provider is "default" for ComposeSMS
  useEffect(() => {
    setProvider("default");
  }, [setProvider]);

  const [message, setMessage] = useState("");
  const [unicode, setUnicode] = useState(true);
  const [flash, setFlash] = useState(true);
  const [schedule, setSchedule] = useState(false);
  const [senderIds, setSenderIds] = useState<string[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState("");
  const [loadingSenderIds, setLoadingSenderIds] = useState(true);
  const [contacts, setContacts] = useState("");
  const [sentMessages, setSentMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({
    total: 0,
    sent: 0,
    failed: 0,
  });

  //for error message
  const [messageError, setMessageError] = useState("");
  const [contactsError, setContactsError] = useState("");

  const maxLength = 1500;

  // 🔥 API keys always from Default here
  const apiKeyToUse = apiConfig.encodedApiKey;
  const clientIdToUse = apiConfig.clientId;
  const rawApiKeyToUse = apiConfig.apiKey;

  useEffect(() => {
    const fetchSenderIds = async () => {
      setLoadingSenderIds(true);
      try {
        const response = await fetch(
          `https://app.brandtxt.io/api/v2/SenderId?ApiKey=${apiKeyToUse}&ClientId=${clientIdToUse}`
        );
        const data = await response.json();
        if (data && Array.isArray(data.Data)) {
          const ids = data.Data.map((item: any) => item.SenderId);
          setSenderIds(ids);
          if (ids.length > 0) setSelectedSenderId(ids[0]);
        }
      } catch (error) {
        console.error("Failed to fetch sender IDs:", error);
      } finally {
        setLoadingSenderIds(false);
      }
    };

    const fetchGroupId = async () => {
      try {
        const response = await fetch(
          `https://app.brandtxt.io/api/v2/Group?ApiKey=${apiKeyToUse}&ClientId=${clientIdToUse}`
        );
        const data = await response.json();
        if (data && Array.isArray(data.Data) && data.Data.length > 0) {
          localStorage.setItem("groupId", data.Data[0].GroupId);
        }
      } catch (error) {
        console.error("Error fetching Group ID:", error);
      }
    };

    fetchSenderIds();
    fetchGroupId();
  }, []);

  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const handleSendSMS = async () => {
    let hasError = false;
    //errormessage for empty field
    // Reset errors first
    setMessageError("");
    setContactsError("");
    if (!message.trim()) {
      setMessageError("⚠️ Message cannot be blank");
      toast.error("❌ Message cannot be blank.");
      hasError = true;
    }

    if (!contacts.trim()) {
      setContactsError("⚠️ Contacts cannot be blank");
      toast.error("❌ Contacts cannot be blank.");
      hasError = true;
    }

    if (hasError) {
      return; // ❌ Stop sending if there are errors
    }
    setIsSending(true);

    const allNumbers = contacts
      .split(",")
      .map((num) => num.trim())
      .filter((num) => (num.startsWith("63") ? num.length === 12 : num.length === 11));

    const numberChunks = chunkArray(allNumbers, 100);

    setSentMessages([]);
    setSendingProgress({ total: allNumbers.length, sent: 0, failed: 0 });

    const sendToBrandtxt = async (payload, isBulk = false) => {
      const url = isBulk
        ? "http://localhost:5000/proxy/send-bulk-sms"
        : "http://localhost:5000/proxy/send-sms";

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return await res.json();
      } catch (err) {
        console.error("Sending error:", err);
        return null;
      }
    };

    for (const chunk of numberChunks) {
      const groupId = localStorage.getItem("groupId") || "";
      const isBulk = chunk.length > 1;

      const payload = isBulk
        ? {
          senderId: selectedSenderId,
          isUnicode: unicode,
          isFlash: flash,
          scheduleDateTime: schedule ? new Date().toISOString() : "",
          principleEntityId: "",
          templateId: "",
          messageParameters: chunk.map((num) => ({
            number: num,
            text: message,
            serviceId: "",
            coRelator: "",
            linkId: "",
          })),
          apiKey: rawApiKeyToUse,
          clientId: clientIdToUse,
        }
        : {
          senderId: selectedSenderId,
          is_Unicode: unicode,
          is_Flash: flash,
          schedTime: schedule ? new Date().toISOString() : "",
          groupId: groupId,
          message: message,
          mobileNumbers: chunk.join(","),
          serviceId: "",
          coRelator: "",
          linkId: "",
          principleEntityId: "",
          templateId: "",
          apiKey: rawApiKeyToUse,
          clientId: clientIdToUse,
        };

      const result = await sendToBrandtxt(payload, isBulk);

      if (result?.ErrorCode === 0 && Array.isArray(result.Data)) {
        setSentMessages((prev) => [...prev, ...result.Data]);
        setSendingProgress((prev) => ({
          ...prev,
          sent: prev.sent + chunk.length,
        }));
      } else {
        setSendingProgress((prev) => ({
          ...prev,
          failed: prev.failed + chunk.length,
        }));
        console.warn("Failed chunk", result?.ErrorDescription);
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    setIsSending(false);
    refresh();
  };

  const handleContactsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let input = e.target.value.replace(/[^\d,]/g, "");
    const chunks = input.split(",").map((c) => c.trim());
    const cleaned = chunks.map((c) =>
      c.startsWith("63") ? c.slice(0, 12) : c.slice(0, 11)
    );
    setContacts(cleaned.join(","));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

      const numbers = raw
        .flat()
        .map((val) => String(val).replace(/[^\d]/g, ""))
        .filter((n) => n.length === 11 || (n.startsWith("63") && n.length === 12));

      const formatted = numbers.join(",");
      setContacts((prev) => (prev ? prev + "," + formatted : formatted));
    };

    reader.readAsArrayBuffer(file);
  };

  const campaignName = (() => {
    const now = new Date();
    const date = now.toLocaleDateString("en-GB").replace(/\//g, "-");
    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `Camp_${date}_${time}`;
  })();

  return (
    <div className="bg-gray-100 p-4 rounded-xl min-h-screen">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Compose SMS</h2>

      <div>
        <Label>Campaign Name</Label>
        <Input value={campaignName} readOnly />
      </div>

      <div>
        <Label>Sender ID</Label>
        {loadingSenderIds ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="animate-spin h-5 w-5" />
            Loading sender IDs...
          </div>
        ) : (
          <Select value={selectedSenderId} onValueChange={setSelectedSenderId}>
            {senderIds.map((id) => (
              <SelectItem key={id} value={id}>
                {id}
              </SelectItem>
            ))}
          </Select>
        )}
      </div>

      <div>
        <Label>Contacts</Label>
        <Textarea
          value={contacts}
          onChange={handleContactsChange}
          placeholder="Enter 11-digit numbers (comma-separated)"
          rows={4}
        />
        {contactsError && (
          <p className="text-red-500 text-sm mt-1">{contactsError}</p>
        )}
        <div className="my-4">
          <Label>Upload Contacts (.csv or .xlsx)</Label>
          <Input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} />
          <p className="text-sm text-gray-500 mt-1">
            The file should contain mobile numbers in a single column.
          </p>
        </div>
      </div>

      <div>
        <Label>Enter Message</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={maxLength}
        />
        {messageError && (
          <p className="text-red-500 text-sm mt-1">{messageError}</p>
        )}
        <div className="text-sm text-gray-500 mt-1">
          Used: {message.length} | Left: {maxLength - message.length} | SMS Count:{" "}
          {Math.ceil(message.length / 160)}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Checkbox id="unicode" checked={unicode} onChange={() => setUnicode(!unicode)} />
        <Label htmlFor="unicode">Unicode</Label>

        <Checkbox id="flash" checked={flash} onChange={() => setFlash(!flash)} />
        <Label htmlFor="flash">Flash</Label>
      </div>

      <div className="flex items-center gap-4">
        <Checkbox id="schedule" checked={schedule} onChange={() => setSchedule(!schedule)} />
        <Label htmlFor="schedule">Schedule</Label>
      </div>

      <div className="my-4">
        <h3 className="font-semibold mb-2">📊 Sending Progress</h3>
        <p>Total: {sendingProgress.total}</p>
        <p>Sent: {sendingProgress.sent}</p>
        <p>Failed: {sendingProgress.failed}</p>
      </div>

      {sentMessages.length > 0 && (
        <div className="my-4">
          <h4 className="font-semibold mb-2">📨 Sent Messages</h4>
          <ul className="text-sm">
            {sentMessages.map((msg, idx) => (
              <li key={idx}>
                📱 {msg.MobileNumber} → 🆔 {msg.MessageId}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Send Button */}
      <div className="brndtxtcontainer">
        <Button
          className="send-button"
          onClick={handleSendSMS}
          disabled={isSending}
        >
          <i className="fa-solid fa-paper-plane"></i>
          {isSending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin w-4 h-4" />
              Sending...
            </div>
          ) : (
            "Send"
          )}
        </Button>
      </div>

      <SMSLogsGrid /> {/* ✅ SMS Logs auto reload based on provider */}
    </div>
  );
}
