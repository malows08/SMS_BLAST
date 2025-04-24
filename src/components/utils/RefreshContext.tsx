import React, { createContext, useContext, useState } from 'react';

const RefreshContext = createContext({ refresh: () => {} });

export const RefreshProvider: React.FC = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refresh, refreshKey }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);