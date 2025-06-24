import { useEffect, useState } from "react";
import {
  Input,
  Textarea,
  Checkbox,
  Button,
  Label,
} from "../../components/ui/index.ts";
import SMSLogsGrid from "../../components/grid/SMSLogsGrid";
import { Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useRefresh } from "../../context/RefreshContext";
import { useSenderId } from "../../context/SenderIdContext";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import useApiBaseUrl from "../../hooks/useApiBaseUrl";

interface ProviderInfo {
  id: number;
  name: string;
  senderid: string;
  groupid: string;
  clientId: string;
  apiKey: string;
}

export default function KizunaSMS() {
  const { refresh } = useRefresh();
  const { setKeys } = useSenderId();

  const [message, setMessage] = useState("");
  const [unicode, setUnicode] = useState(true);
  const [flash, setFlash] = useState(true);
  const [schedule, setSchedule] = useState(false);
  const [contacts, setContacts] = useState("");
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [sentMessages, setSentMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ total: 0, sent: 0, failed: 0 });
  const [messageError, setMessageError] = useState("");
  const [contactsError, setContactsError] = useState("");
  const [uid, setUid] = useState<number>(0);
  const [userCredit, setUserCredit] = useState<number>(0);
  const { apiBaseUrl } = useApiBaseUrl();
  const maxLength = 1500;
  // for campaign name
  const campaignName = `Camp_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}_${new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded: any = jwtDecode(token);
      setUid(decoded.userId);
      setUserCredit(decoded.credit ?? 0); // ✅ Use JWT credit
    }
  }, []);

  useEffect(() => {
    if (!apiBaseUrl) return;

    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {//for render https://sms-blast-backend.onrender.com/api
        // const res = await fetch("http://localhost:4000/api/sender-ids");
        const res = await fetch(`${apiBaseUrl}/api/sender-ids`);
        const data = await res.json();
        console.log(data)
        if (Array.isArray(data)) {
          setProviders(data);
          if (!selectedProvider && data.length > 0) {
            setSelectedProvider(data[0]);
            setKeys(data[0].apiKey, data[0].clientId);
          }
        }
      } catch (err) {
        toast.error("❌ Failed to load providers");
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, [apiBaseUrl]);

  const handleProviderChange = (providerId: string) => {
    const selected = providers.find((p) => p.id.toString() === providerId);
    if (selected) {
      setSelectedProvider(selected);
      setKeys(selected.apiKey, selected.clientId);
    }
  };

  const chunkArray = (arr: string[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const handleSendSMS = async () => {
    setMessageError("");
    setContactsError("");

    if (!message.trim()) {
      setMessageError("⚠️ Message cannot be blank");
      toast.error("❌ Message cannot be blank.");
      return;
    }

    if (!contacts.trim()) {
      setContactsError("⚠️ Contacts cannot be blank");
      toast.error("❌ Contacts cannot be blank.");
      return;
    }

    if (!selectedProvider) return;

    const allNumbers = contacts
      .split(",")
      .map((n) => n.trim())
      .filter((num) =>
        num.startsWith("63") ? num.length === 12 : num.length === 11
      );

    const totalPartsPerMessage = Math.ceil(message.length / 160);
    const totalSmsCount = allNumbers.length * totalPartsPerMessage;

    // ✅ Compare with frontend credit
    if (totalSmsCount > userCredit) {
      toast.error(`❌ Insufficient credits. Needed: ${totalSmsCount}, Available: ${userCredit}`, {
        duration: 4000,
      });

      // setTimeout(() => {
      setContacts("");
      setMessage("");
      // }, 4000);// 1.5 second buffer before clearing
      return;
    }

    setIsSending(true);
    const numberChunks = chunkArray(allNumbers, 100);
    setSentMessages([]);
    setSendingProgress({ total: allNumbers.length, sent: 0, failed: 0 });

    const sendToBrandtxt = async (payload: any, isBulk = false) => {
      const url = isBulk
        ? "http://localhost:4000/api/send-bulk-sms"
        : "http://localhost:4000/api/send-sms";
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return await res.json();
      } catch (err) {
        console.error("API error:", err);
        return null;
      }
    };

    for (const chunk of numberChunks) {
      const isBulk = chunk.length > 1;

      if (selectedProvider.name === "provider 1") {
        const payload = isBulk
          ? {
            senderId: selectedProvider.senderid,
            isUnicode: unicode,
            isFlash: flash,
            scheduleDateTime: schedule ? new Date().toISOString() : "",
            messageParameters: chunk.map((num) => ({
              number: num,
              text: message,
            })),
            apiKey: selectedProvider.apiKey,
            clientId: selectedProvider.clientId,
          }
          : {
            senderId: selectedProvider.senderid,
            is_Unicode: unicode,
            is_Flash: flash,
            schedTime: schedule ? new Date().toISOString() : "",
            groupId: selectedProvider.groupid,
            message: message,
            mobileNumbers: chunk.join(","),
            apiKey: selectedProvider.apiKey,
            clientId: selectedProvider.clientId,
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
        }
      } else if (selectedProvider.name === "provider 2") {
        const smsPayload = chunk.map((number) => ({
          senderId: selectedProvider.senderid || "",
          Is_Unicode: unicode,
          Is_Flash: flash,
          IsRegisteredForDelivery: false,
          ValidityPeriod: "24h",
          DataCoding: 0,
          SchedTime: schedule ? new Date().toISOString() : new Date().toISOString(),
          groupId: selectedProvider.groupid || "",
          message,
          mobilenumbers: number,
          ServiceId: "",
          apikey: selectedProvider.apiKey || "",
          clientId: selectedProvider.clientId || "",
          campaignName,// added campaign name
        }));

        const fullPayload = {
          userId: uid,
          data: smsPayload,
        };

        try { // for render https://sms-blast-backend.onrender.com/api
          const response = await fetch(`${apiBaseUrl}/api/sms-insert`,
            // const response = await fetch("http://localhost:4000/api/sms-insert", 
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(fullPayload),
            });

          if (response.ok) {
            setSendingProgress((prev) => ({
              ...prev,
              sent: prev.sent + chunk.length,
            }));
            toast.success("📦 SMS inserted into DB (provider 2)");
          } else {
            toast.error("❌ DB insert failed (provider 2)");
          }
        } catch (error) {
          toast.error("❌ DB insert error.");
        }
      }
    }

    setIsSending(false);
    toast.success(`✅ Sending complete! Total: ${allNumbers.length}`);

    // ✅ Deduct credits after successful send
    try { // for render https://sms-blast-backend.onrender.com/api
      const response = await fetch(`${apiBaseUrl}/api/credits_deduct`,
        // const response = await fetch("http://localhost:4000/api/credits_deduct",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: uid,
            deductAmount: totalSmsCount,
          }),
        });

      if (response.ok) {
        toast.success("✅ Credits deducted");
        refresh();
        window.location.reload();
      } else {
        toast.error("❌ Failed to deduct credits.");
      }
    } catch (error) {
      toast.error("❌ Error during credit deduction.");
    }
  };

  const handleContactsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value.replace(/[^\d,]/g, "");
    const cleaned = input
      .split(",")
      .map((chunk) => (chunk.startsWith("63") ? chunk.slice(0, 12) : chunk.slice(0, 11)));
    setContacts(cleaned.join(","));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const fileType = file.name.split(".").pop()?.toLowerCase();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (!result) return;

      let rawNumbers: string[] = [];

      if (fileType === "txt") {
        rawNumbers = (result as string).split(/[\r\n,; ]+/).map((val) => val.trim());
      } else {
        const data = new Uint8Array(result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
        rawNumbers = rawData.flat().map((val) => String(val));
      }

      const numbers = rawNumbers
        .map((val) => val.replace(/[^\d]/g, ""))
        .filter((num) => num.length === 11 || (num.startsWith("63") && num.length === 12));

      setContacts((prev) => (prev ? prev + "," + numbers.join(",") : numbers.join(",")));

      // ✅ Reset file input value so selecting same file works again
      fileInput.value = "";
    };

    fileType === "txt" ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
  };


  return (
    <div className="bg-gray-100 p-4 rounded-xl min-h-screen">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Compose SMS</h2>

      <div>
        <Label>Campaign Name</Label>
        <Input value={campaignName} readOnly />
      </div>

      <div className="mt-4">
        <Label>Provider</Label>
        {!loadingProviders ? (
          <>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={selectedProvider?.id?.toString() || ""}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              {providers.map(({ id, name }) => (
                <option key={id} value={id.toString()}>
                  {name}
                </option>
              ))}
            </select>
            {selectedProvider && false && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Sender ID</Label>
                  <Input value={selectedProvider.senderid ?? ""} readOnly />
                </div>
                <div>
                  <Label>Group ID</Label>
                  <Input value={selectedProvider.groupid ?? ""} readOnly />
                </div>
                <div>
                  <Label>Client ID</Label>
                  <Input value={selectedProvider.clientId ?? ""} readOnly />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input value={selectedProvider.apiKey ?? ""} readOnly />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="animate-spin h-5 w-5" />
            Loading...
          </div>
        )}
      </div>

      <div className="mt-4">
        <Label>Contacts</Label>
        <Textarea
          value={contacts}
          onChange={handleContactsChange}
          rows={4}
          placeholder="e.g. 09171234567,09181234567"
        />
        {contactsError && <p className="text-red-500 text-sm">{contactsError}</p>}
        <Input type="file" accept=".csv,.xlsx,.txt" onChange={handleFileUpload} className="mt-2" />
      </div>

      <div className="mt-4">
        <Label>Message</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={maxLength}
        />
        {messageError && <p className="text-red-500 text-sm">{messageError}</p>}
        <p className="text-sm text-gray-500">
          Used: {message.length} | Left: {maxLength - message.length} | SMS Count:{" "}
          {Math.ceil(message.length / 160)}
        </p>
      </div>

      <div className="mt-4 flex gap-4">
        <Checkbox checked={unicode} onChange={() => setUnicode(!unicode)} />
        <Label>Unicode</Label>
        <Checkbox checked={flash} onChange={() => setFlash(!flash)} />
        <Label>Flash</Label>
        <Checkbox checked={schedule} onChange={() => setSchedule(!schedule)} />
        <Label>Schedule</Label>
      </div>

      <div className="mt-4">
        <Button onClick={handleSendSMS} disabled={isSending}>
          {isSending ? (
            <span className="flex gap-2 items-center">
              <Loader2 className="animate-spin h-4 w-4" />
              Sending...
            </span>
          ) : (
            <i className="fa-solid fa-paper-plane mr-2"></i>
          )}
          Send
        </Button>
      </div>

      {/* <div className="mt-4 text-sm">
        <strong>Progress:</strong> Sent {sendingProgress.sent} / {sendingProgress.total}, Failed:{" "}
        {sendingProgress.failed}
      </div> */}

      <SMSLogsGrid />
    </div>
  );
}
