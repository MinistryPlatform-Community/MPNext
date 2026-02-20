"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface RuntimeConfig {
  /** Ministry Platform file API URL (e.g. https://mpi.ministryplatform.com/ministryplatformapi/files) */
  mpFileUrl: string | null;
  /** Application display name */
  appName: string;
}

const RuntimeConfigContext = createContext<RuntimeConfig>({
  mpFileUrl: null,
  appName: "Pastor App",
});

export function RuntimeConfigProvider({
  config,
  children,
}: {
  config: RuntimeConfig;
  children: ReactNode;
}) {
  return (
    <RuntimeConfigContext.Provider value={config}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig(): RuntimeConfig {
  return useContext(RuntimeConfigContext);
}
