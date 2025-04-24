import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiConfig } from "../settings";

type SenderIdContextType = {
  senderId: string;
};

const SenderIdContext = createContext<SenderIdContextType>({ senderId: "Loading..." });

export function SenderIdProvider({ children }: { children: ReactNode }) {
  const [senderId, setSenderId] = useState("Loading...");

  useEffect(() => {
    async function fetchSenderId() {
      const apiKeyToUse = apiConfig.encodedApiKey;
      const url = `https://app.brandtxt.io/api/v2/SenderId?ApiKey=${apiKeyToUse}&ClientId=${apiConfig.clientId}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const id = data.Data[0].SenderId || "Unknown";
        setSenderId(id);
      } catch {
        setSenderId("Error");
      }
    }

    fetchSenderId();
  }, []);

  return (
    <SenderIdContext.Provider value={{ senderId }}>
      {children}
    </SenderIdContext.Provider>
  );
}

export function useSenderId() {
  return useContext(SenderIdContext);
}
