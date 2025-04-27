import { useEffect, useState } from "react";
import { Input, Textarea, Checkbox, Button, Label, Select, SelectItem } from "../../components/ui/index.ts"; // Import UI components
import SMSLogsGrid from "../../components/grid/SMSLogsGrid"; // Import grid for SMS logs
import { Loader2 } from "lucide-react"; // Loader component for indicating loading state
import * as XLSX from "xlsx";
import { apiConfig } from "../../settings"; // Importing the centralized API config
import { useRefresh } from "../../context/RefreshContext.tsx";// Import the context
import { useSmsProvider } from "../../context/SmsProviderContext";
import { useSenderId } from "../../context/SenderIdContext";
import toast from "react-hot-toast";


export default function KizunaSMS() {
  const { refresh } = useRefresh(); // Get the refresh function from context
  const { setKeys } = useSenderId(); //for sender id to be display on the header
  // State variables for SMS form
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
  const [refreshLogs, setRefreshLogs] = useState(false);
  const maxLength = 1500;
  const { setProvider } = useSmsProvider();

  //for error message
  const [messageError, setMessageError] = useState("");
  const [contactsError, setContactsError] = useState("");

  // Fetch sender IDs and group ID
  useEffect(() => {
    setProvider("kizuna-sms");
    setKeys(apiConfig.newEncodedApiKey, apiConfig.newClientId);
    const fetchSenderIds = async () => {
      setLoadingSenderIds(true);
      try {
        const apiKeyToUse = apiConfig.newEncodedApiKey;
        //const response = await fetch("https://app.brandtxt.io/api/v2/SenderId?ApiKey=Qu%2Ba14KExO3viOV21Ar6qbal9s6kq2zGTGqeOZ96DO0%3D&ClientId=6005b6a1-5446-483a-83d0-b841d2e44b9a");
        const response = await fetch(`https://app.brandtxt.io/api/v2/SenderId?ApiKey=${apiKeyToUse}&ClientId=${apiConfig.newClientId}`);
        const data = await response.json();
        console.log(data)
        if (data && Array.isArray(data.Data)) {
          const ids = data.Data.map((item: any) => item.SenderId);
          console.log(ids)
          setSenderIds(ids);
          if (ids.length > 0) {
            setSelectedSenderId(ids[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch sender IDs:", error);
      } finally {
        setLoadingSenderIds(false);
      }
    };

    fetchSenderIds();
    //fetch groupid
    const fetchGroupId = async () => {
      try {
        const apiKeyToUse = apiConfig.newEncodedApiKey;
        const response = await fetch(`https://app.brandtxt.io/api/v2/Group?ApiKey=${apiKeyToUse}&ClientId=${apiConfig.newClientId}`);
        const data = await response.json();
        if (data && Array.isArray(data.Data) && data.Data.length > 0) {
          const firstGroupId = data.Data[0].GroupId;
          console.log(firstGroupId)
          localStorage.setItem("groupId", firstGroupId);
        }
      } catch (error) {
        console.error("Error fetching Group ID:", error);
      }
    };

    fetchGroupId();
    // return () => {
    //   setProvider("default");
    //   setKeys(apiConfig.encodedApiKey, apiConfig.clientId);
    // };
  }, [setProvider, setKeys]);

  // Helper function to chunk the array of numbers
  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  // Retry sending a failed chunk of messages
  const retryChunk = async (payload) => {
    try {
      const res = await fetch("http://localhost:5000/proxy/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const retryResult = await res.json();
      if (retryResult.ErrorCode === 0 && Array.isArray(retryResult.Data)) {
        setSentMessages((prev) => [...prev, ...retryResult.Data]);
        setSendingProgress((prev) => ({
          ...prev,
          sent: prev.sent + retryResult.Data.length,
        }));
      } else {
        console.error("Retry failed:", retryResult.ErrorDescription);
      }
    } catch (retryErr) {
      console.error("Retry error:", retryErr);
    }
  };

  // Send SMS function
  const handleSendSMS = async () => {
    let hasError = false;

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
      .filter((num) =>
        num.startsWith("63") ? num.length === 12 : num.length === 11
      );

    const MAX_PER_BATCH = 100;
    const numberChunks = chunkArray(allNumbers, MAX_PER_BATCH);

    setSentMessages([]);
    setSendingProgress({ total: allNumbers.length, sent: 0, failed: 0 });

    const sendToBrandtxt = async (payload, isBulk = false) => {
      const url = isBulk
        ? "http://localhost:5000/proxy/send-bulk-sms"
        : "http://localhost:5000/proxy/send-sms";

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        return await response.json();
      } catch (err) {
        console.error("Error sending SMS:", err);
        return null;
      }
    };

    for (const chunk of numberChunks) {
      const groupId = localStorage.getItem("groupId") || "";
      const numbers = chunk; // or allNumbers if not batching

      const isBulk = numbers.length > 1;

      let payload;
      if (isBulk) {
        payload = {
          senderId: selectedSenderId,
          isUnicode: unicode,
          isFlash: flash,
          scheduleDateTime: schedule ? new Date().toISOString() : "",
          principleEntityId: "",
          templateId: "",
          messageParameters: numbers.map((num) => ({
            number: num,
            text: message,
            serviceId: "",
            coRelator: "",
            linkId: "",
          })),
          apiKey: apiConfig.newApiKey,  // Using the centralized API key
          clientId: apiConfig.newClientId,  // Using the centralized Client ID
        };
      } else {
        payload = {
          senderId: selectedSenderId,
          is_Unicode: unicode,
          is_Flash: flash,
          schedTime: schedule ? new Date().toISOString() : "",
          groupId: groupId,
          message: message,
          mobileNumbers: numbers.join(","),
          serviceId: "",
          coRelator: "",
          linkId: "",
          principleEntityId: "",
          templateId: "",
          apiKey: apiConfig.newApiKey,  // Using the centralized API key
          clientId: apiConfig.newClientId,  // Using the centralized Client ID
        };
      }
      console.log(payload)
      const result = await sendToBrandtxt(payload, isBulk);
      //console.log(result)
      if (result && result.ErrorCode === 0 && Array.isArray(result.Data)) {
        setSentMessages((prev) => [...prev, ...result.Data]);
        setSendingProgress((prev) => ({
          ...prev,
          sent: prev.sent + chunk.length,
        }));

      } else {
        console.warn("Initial send failed:", result?.ErrorDescription || "Unknown error");
        setSendingProgress((prev) => ({
          ...prev,
          failed: prev.failed + chunk.length,
        }));

        // Retry once
        const retryResult = await sendToBrandtxt(payload);
        if (retryResult && retryResult.ErrorCode === 0 && Array.isArray(retryResult.Data)) {
          setSentMessages((prev) => [...prev, ...retryResult.Data]);
          setSendingProgress((prev) => ({
            ...prev,
            sent: prev.sent + chunk.length,
            failed: prev.failed - chunk.length, // Adjust failed count
          }));
        } else {
          console.error("Retry also failed:", retryResult?.ErrorDescription || "Unknown retry error");
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500)); // Delay between batches
    }

    setIsSending(false);
    refresh(); // Trigger refresh of CreditsPage after sending SMS
    setRefreshLogs((prev) => !prev); // 🔁 reload SMSLogsGrid
  };

  // Format campaign name with current date and time
  const getFormattedCampaignName = () => {
    const now = new Date();
    const date = now.toLocaleDateString("en-GB").replace(/\//g, "-");
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `Camp_${date}_${time}`;
  };

  const campaignName = getFormattedCampaignName();

  // Handle contacts input change
  const handleContactsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let input = e.target.value;
    input = input.replace(/[^\d,]/g, "");
    const chunks = input.split(",").map((chunk) => chunk.trim());
    const cleaned = chunks.map((chunk) => (chunk.startsWith("63") ? chunk.slice(0, 12) : chunk.slice(0, 11)));
    const formatted = cleaned.join(",");
    setContacts(formatted);
  };

  // Handler to parse Excel or CSV and extract mobile numbers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

      // Flatten data, extract only valid phone numbers
      const numbers = rawData
        .flat()
        .map((val) => String(val).replace(/[^\d]/g, ""))
        .filter((num) => num.length === 11 || (num.startsWith("63") && num.length === 12));

      const formatted = numbers.join(",");
      setContacts((prev) => (prev ? prev + "," + formatted : formatted));
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    // <div className="container">
    <div className="bg-gray-100 p-4 rounded-xl min-h-screen">
      {/* <div className="bg-white p-6 rounded-md shadow-md max-w-4xl mx-auto"> */}
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Compose SMS</h2>

      {/* Campaign Name Input */}
      <div>
        <Label>Campaign Name</Label>
        <Input value={campaignName} readOnly />
      </div>

      {/* Sender ID Selection */}
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

      {/* Contacts Input */}
      <div>
        <Label>Contacts</Label>
        <Textarea
          value={contacts}
          onChange={handleContactsChange}
          placeholder="Enter 11-digit numbers only (comma added automatically)"
          rows={4}
        />
        {contactsError && (
          <p className="text-red-500 text-sm mt-1">{contactsError}</p>
        )}
        <div className="my-4">
          <Label>Upload Contacts (.csv or .xlsx)</Label>
          <Input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} />
          <p className="text-sm text-gray-500 mt-1">The file should contain mobile numbers in a single column.</p>
        </div>
      </div>


      {/* Message Input */}
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
          Used: {message.length} | Left: {maxLength - message.length} | SMS Count: {Math.ceil(message.length / 160)}
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center gap-4">
        <Checkbox id="unicode" checked={unicode} onChange={() => setUnicode(!unicode)} />
        <Label htmlFor="unicode">Unicode (Language SMS)</Label>

        <Checkbox id="flash" checked={flash} onChange={() => setFlash(!flash)} />
        <Label htmlFor="flash">Flash</Label>
      </div>

      {/* Schedule Option */}
      <div className="flex items-center gap-4">
        <Checkbox id="schedule" checked={schedule} onChange={() => setSchedule(!schedule)} />
        <Label htmlFor="schedule">Schedule</Label>
      </div>

      {/* Sending Progress */}
      <div className="my-4">
        <h3 className="font-semibold mb-2">📊 Sending Progress</h3>
        <p>Total: {sendingProgress.total}</p>
        <p>Sent: {sendingProgress.sent}</p>
        <p>Failed: {sendingProgress.failed}</p>
      </div>

      {/* Sent Messages */}
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
      <SMSLogsGrid />
    </div>

  );
}
