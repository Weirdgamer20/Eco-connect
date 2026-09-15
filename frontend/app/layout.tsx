import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoConnect — Community Civic Issue Reporting",
  description:
    "Report civic problems, track resolutions, and hold authorities accountable. AI-powered civic issue clustering and routing for your community.",
  keywords: ["civic issues", "community reporting", "government accountability", "potholes", "pollution"],
  authors: [{ name: "EcoConnect Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#315A78",
  openGraph: {
    title: "EcoConnect",
    description: "Community-first civic issue reporting and accountability platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
