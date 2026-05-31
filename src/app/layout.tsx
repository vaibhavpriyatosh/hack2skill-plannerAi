import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { initDatabase } from "@/lib/db";
import "./globals.css";

initDatabase();

export const metadata: Metadata = {
  title: "Travel Planning Engine | Production Starter",
  description: "Production-ready Next.js starter with Google auth, SQLite, validation, and tests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
