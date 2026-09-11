import type { Metadata } from "next";
import { Spectral, Archivo } from "next/font/google";
import "./globals.css";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Redline — Know what you're signing.",
  description:
    "Upload a contract you've been sent. Redline finds the clauses worth a closer look and shows the exact sentence each one came from.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${spectral.variable} ${archivo.variable}`}>
        {children}
      </body>
    </html>
  );
}
