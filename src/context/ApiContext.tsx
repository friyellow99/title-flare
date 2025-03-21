
import React, { createContext, useContext, useState, ReactNode } from "react";
import { ApiKeys } from "@/types";

interface ApiContextProps {
  apiKeys: ApiKeys | null;
  setApiKeys: React.Dispatch<React.SetStateAction<ApiKeys | null>>;
  isApiKeysSet: boolean;
}

const ApiContext = createContext<ApiContextProps | undefined>(undefined);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const [apiKeys, setApiKeys] = useState<ApiKeys | null>(() => {
    const savedKeys = localStorage.getItem("articleGen_apiKeys");
    return savedKeys ? JSON.parse(savedKeys) : null;
  });

  const isApiKeysSet = !!apiKeys?.geminiApiKey;

  // Store API keys in localStorage when they change
  React.useEffect(() => {
    if (apiKeys) {
      localStorage.setItem("articleGen_apiKeys", JSON.stringify(apiKeys));
    }
  }, [apiKeys]);

  return (
    <ApiContext.Provider value={{ apiKeys, setApiKeys, isApiKeysSet }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = (): ApiContextProps => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};
