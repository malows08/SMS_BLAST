import React, { useState, useEffect } from 'react';
import '../../components/ui/App.css';
import { Input, Textarea, Checkbox, Button, Label, Select, SelectItem } from "../../components/ui/index.ts";
import * as XLSX from "xlsx";

const QuickSend = () => {
  const [senderId, setSenderId] = useState('');
  const [availableSenderId, setAvailableSenderId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('+63');
  const [contacts, setContacts] = useState('');
  const [smsTemplate, setSmsTemplate] = useState('');
  const [message, setMessage] = useState('');

  const totalRecipients = contacts ? contacts.split(',').filter(Boolean).length : 0;
  const charactersRemaining = 160 - message.length;

  // 🔌 Fetch Sender ID (uid) from API
  useEffect(() => {
    const fetchSenderId = async () => {
      try {
        const res = await fetch("https://txtlinkpro.online/api/v3/me", {
          headers: {
            Authorization: "Bearer 9|8qjT92AOfNZkXk8vvONWeUVMGfOOQU29fIIGnUzm0db03f19"
          }
        });
  
        if (!res.ok) throw new Error("Unauthorized");
  
        const data = await res.json();
        //console.log(data?.data?.uid)
        setAvailableSenderId(data?.data?.uid || null);
        setSenderId(data?.data?.uid || '');
      } catch (err) {
        console.error("❌ Failed to fetch Sender ID:", err.message);
      }
    };
  
    fetchSenderId();
  }, []);

  const handleContactsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let input = e.target.value;
    input = input.replace(/[^\d,]/g, "");
    const chunks = input.split(",").map((chunk) => chunk.trim());
    const cleaned = chunks.map((chunk) =>
      chunk.startsWith("63") ? chunk.slice(0, 12) : chunk.slice(0, 11)
    );
    const formatted = cleaned.join(",");
    setContacts(formatted);
  };

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
    <div className="bg-gray-100 p-4 rounded-xl min-h-80">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">SMS Sender</h2>

      <div className="Input-group">
        <Label>Sending Server *</Label>
        <Input type="text" value="TXLINKPRO" readOnly />
      </div>

      <div className="Input-group">
        <Label>Sender ID</Label>
        <Select value={senderId} onChange={(e) => setSenderId(e.target.value)}>
          <option value="">REQUEST NEW</option>
          {availableSenderId && <option value={availableSenderId}>{availableSenderId}</option>}
        </Select>
      </div>

      <div className="Input-group">
        <Label>Country Code</Label>
        <Input type="text" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} />
      </div>

      <div className="Input-group">
        <Label>Recipients</Label>
        <Textarea
          value={contacts}
          onChange={handleContactsChange}
          placeholder="Note: You can upload a maximum of 100 rows by copy-pasting."
          rows={4}
        />
        <p>Total Number of Recipients: {totalRecipients}</p>
      </div>

      <div className="my-4">
        <Label>Upload Contacts (.csv or .xlsx)</Label>
        <Input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} />
        <p className="text-sm text-gray-500 mt-1">The file should contain mobile numbers in a single column.</p>
      </div>

      <div className="Input-group">
        <Label>SMS Template (Optional)</Label>
        <Select value={smsTemplate} onChange={(e) => setSmsTemplate(e.target.value)}>
          <option value="">Select one</option>
          <option value="Template1">Template1</option>
        </Select>
      </div>

      <div className="Input-group">
        <Label>Message</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Don't have SMS Template? Then type Your Message here"
        />
        <p>Remaining: {charactersRemaining} / 160 (0 CHARACTERS)</p>
      </div>

      <div className="button-container">
        <button className="preview-button">
          <i className="fa fa-mobile" aria-hidden="true"></i> Preview
        </button>
        <button className="send-button">
          <i className="fa-solid fa-paper-plane"></i> Send
        </button>
      </div>
    </div>
  );
};

export default QuickSend;
