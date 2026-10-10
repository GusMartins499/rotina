import "./globals.css";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import { DARK_SCHEME_QUERY, THEME_SCRIPT } from "./theme";

export const metadata = {
  title: "Rotina",
  description: "Organizador de rotina semanal",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f7" },
    { media: DARK_SCHEME_QUERY, color: "#121215" },
  ],
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
