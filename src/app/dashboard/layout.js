import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <div className="bg-[#181818] flex h-screen p-[1%] w-full">
          <div className="w-[20%] flex flex-col gap-4 p-4">
            <h1 className="text-white text-2xl font-bold mb-4">Documi</h1>
            <nav className="flex flex-col gap-2">
              <a
                href="/"
                className="text-white hover:bg-[#2a2a2a] p-3 rounded-lg transition-colors"
              >
                Home
              </a>
              <a
                href="/documents"
                className="text-white hover:bg-[#2a2a2a] p-3 rounded-lg transition-colors"
              >
                Documents
              </a>
            </nav>
          </div>
          <div className="bg-[#f3f5ec] rounded-xl w-[80%]">{children}</div>
        </div>
      </body>
    </html>
  );
}
