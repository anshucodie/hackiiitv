// app/layout.js
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Documi",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#181818] h-screen w-full">{children}</body>
      </html>
    </ClerkProvider>
  );
}
