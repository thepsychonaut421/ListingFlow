'use client';

import * as React from 'react';

type ErpRecord = {
  sku: string;
  ean: string;
  name: string;
  category: string;
};

type ErpDataContextType = {
  erpData: ErpRecord[];
  setErpData: (data: ErpRecord[]) => void;
};

const ErpDataContext = React.createContext<ErpDataContextType | undefined>(undefined);

export function ErpDataProvider({ children }: { children: React.ReactNode }) {
  const [erpData, setErpDataState] = React.useState<ErpRecord[]>([]);

  const setErpData = (data: ErpRecord[]) => {
    setErpDataState(data);
    // Optionally, save to session storage to persist across reloads
    sessionStorage.setItem('listingFlowErpData', JSON.stringify(data));
  };
  
  React.useEffect(() => {
    // Load from session storage on initial load
    try {
        const storedData = sessionStorage.getItem('listingFlowErpData');
        if (storedData) {
            setErpDataState(JSON.parse(storedData));
        }
    } catch (error) {
        console.error('Failed to parse ERP data from sessionStorage', error);
    }
  }, []);

  return (
    <ErpDataContext.Provider value={{ erpData, setErpData }}>
      {children}
    </ErpDataContext.Provider>
  );
}

export function useErpData() {
  const context = React.useContext(ErpDataContext);
  if (context === undefined) {
    throw new Error('useErpData must be used within an ErpDataProvider');
  }
  return context;
}
