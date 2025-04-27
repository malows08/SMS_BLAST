import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiConfig } from "../settings";
import { useSmsProvider } from "../context/SmsProviderContext"; // ✅ Import your provider

type SenderIdContextType = {
  senderId: string;
  setKeys: (apiKey: string, clientId: string) => void;
};

const SenderIdContext = createContext<SenderIdContextType>({
  senderId: "Loading...",
  setKeys: () => {},
});

export function SenderIdProvider({ children }: { children: ReactNode }) {
  const { provider } = useSmsProvider(); // ✅ Use the provider
  const [senderId, setSenderId] = useState("Loading...");
  const [apiKey, setApiKey] = useState(apiConfig.encodedApiKey);
  const [clientId, setClientId] = useState(apiConfig.clientId);

  const setKeys = (newApiKey: string, newClientId: string) => {
    setApiKey(newApiKey);
    setClientId(newClientId);
  };

  // ✅ Watch provider changes
  useEffect(() => {
    if (provider === "kizuna-sms") {
      setApiKey(apiConfig.newEncodedApiKey);
      setClientId(apiConfig.newClientId);
    } else {
      setApiKey(apiConfig.encodedApiKey);
      setClientId(apiConfig.clientId);
    }
  }, [provider]); // 👈 re-run when provider changes

  useEffect(() => {
    async function fetchSenderId() {
      const url = `https://app.brandtxt.io/api/v2/SenderId?ApiKey=${apiKey}&ClientId=${clientId}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(res)
        console.log(data)
        const id = data.Data[0]?.SenderId || "Unknown";
        setSenderId(id);
      } catch {
        setSenderId("Error");
      }
    }

    fetchSenderId();
  }, [apiKey, clientId]); // 👈 re-fetch when keys change

  return (
    <SenderIdContext.Provider value={{ senderId, setKeys }}>
      {children}
    </SenderIdContext.Provider>
  );
}

export function useSenderId() {
  return useContext(SenderIdContext);
}
