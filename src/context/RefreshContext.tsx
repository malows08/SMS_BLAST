import React, { createContext, useContext, useState } from 'react';
import { apiConfig } from "../settings";

type RefreshContextType = {
  refresh: () => void;
  refreshKey: number;
  apiKey: string;
  clientId: string;
  setApiKeys: (key: string, client: string) => void;
};

const RefreshContext = createContext<RefreshContextType>({
  refresh: () => {},
  refreshKey: 0,
  apiKey: "",
  clientId: "",
  setApiKeys: () => {},
});

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [apiKey, setApiKey] = useState(apiConfig.encodedApiKey);
  const [clientId, setClientId] = useState(apiConfig.clientId);

  const refresh = () => setRefreshKey(prev => prev + 1);
  const setApiKeys = (key: string, client: string) => {
    setApiKey(key);
    setClientId(client);
  };

  return (
    <RefreshContext.Provider value={{ refresh, refreshKey, apiKey, clientId, setApiKeys }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);