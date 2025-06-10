import { createContext, useContext, useState, ReactNode } from "react";

type ProviderType = "default" | "kizuna-sms";

interface SmsProviderContextType {
  provider: ProviderType;
  setProvider: (provider: ProviderType) => void;
}

const SmsProviderContext = createContext<SmsProviderContextType | undefined>(undefined);

export function SmsProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ProviderType>("kizuna-sms");

  return (
    <SmsProviderContext.Provider value={{ provider, setProvider }}>
      {children}
    </SmsProviderContext.Provider>
  );
}

export function useSmsProvider() {
  const context = useContext(SmsProviderContext);
  if (!context) {
    throw new Error("useSmsProvider must be used within a SmsProvider");
  }
  return context;
}
