import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "LegalDocs — Startup Legal Generator",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>
          <div className="bg-[#181818] flex h-screen p-[1%] w-full">
            <div className="bg-[#f3f5ec] rounded-xl w-[80%]">{children}</div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
