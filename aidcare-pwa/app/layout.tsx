import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AidCare - Medical Triage Assistant",
  description: "AI-powered medical triage for community health workers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
