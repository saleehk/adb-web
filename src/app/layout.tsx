import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Providers } from "@/lib/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ADB Web Interface",
  description: "A modern web interface for Android Debug Bridge",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Layout>
            <NuqsAdapter>{children}</NuqsAdapter>
          </Layout>
        </Providers>
      </body>
    </html>
  );
}
