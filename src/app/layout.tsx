import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import ThemeScript from "@/components/ThemeScript";

export const metadata: Metadata = {
  title: "MyLife",
  description: "Your personal hub for routines, workouts, diet and finances",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript /> 
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-app p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
