import { createContext, useContext, useState } from "react";

const CreditContext = createContext({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export const CreditProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <CreditContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCreditContext = () => useContext(CreditContext);
