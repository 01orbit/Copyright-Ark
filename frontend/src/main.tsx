import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { BrowserRouter } from "react-router-dom";
import { config } from "./config";
import App from "./App";
import { LanguageProvider } from "./i18n";
import { NetworkProvider } from "./market";
import "./styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <BrowserRouter>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </BrowserRouter>
        </NetworkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
