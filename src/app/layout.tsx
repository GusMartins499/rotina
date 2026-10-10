import "./globals.css";
import type { ReactNode } from "react";
import { THEME_SCRIPT } from "./theme";

export const metadata = {
  title: "Rotina",
  description: "Organizador de rotina semanal",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
