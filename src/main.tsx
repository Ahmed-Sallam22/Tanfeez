import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

// Initialize i18n before any component that uses it
import "./i18n";

import App from "./App.tsx";
import { store } from "./app/store";
import { I18nProvider } from "./app/providers/I18nProvider";
import { ToasterProvider } from "./app/providers/ToasterProvider";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import "./utils/console"; // Import console utility to disable logs in production
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nProvider>
        <ThemeProvider>
          <NotificationsProvider>
            <BrowserRouter>
              <App />
              <ToasterProvider />
            </BrowserRouter>
          </NotificationsProvider>
        </ThemeProvider>
      </I18nProvider>
    </Provider>
  </React.StrictMode>,
);
