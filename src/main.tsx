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
import "./utils/console"; // Import console utility to disable logs in production
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nProvider>
        <NotificationsProvider>
          <BrowserRouter>
            <App />
            <ToasterProvider />
          </BrowserRouter>
        </NotificationsProvider>
      </I18nProvider>
    </Provider>
  </React.StrictMode>
);
