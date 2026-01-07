import React from "react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <React.Fragment>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </React.Fragment>
  );
}
