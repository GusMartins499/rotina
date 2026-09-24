import type { ReactNode } from "react";

export const metadata = {
  title: "Rotina",
  description: "Organizador de rotina semanal",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
