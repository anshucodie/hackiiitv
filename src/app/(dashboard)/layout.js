import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
    <div className="bg-[#181818] flex h-screen p-[1%] w-full">
      <div className="w-[20%] flex flex-col gap-4 p-4">
        <h1 className="text-white text-2xl font-bold mb-4">Documi</h1>
        <nav className="flex flex-col gap-2">
          <Link
            href="/dashboard-home"
            className="text-white hover:bg-[#2a2a2a] p-3 rounded-lg transition-all hover:text-[#cfd490] hover:ring-2 hover:ring-[#cfd490] hover:ring-opacity-70 hover:shadow-[0_0_10px_rgba(148,147,36,0.7)]"
          >
            Home
          </Link>
          <Link
            href="/documents"
            className="text-white hover:bg-[#2a2a2a] p-3 rounded-lg transition-all hover:text-[#cfd490] hover:ring-2 hover:ring-[#cfd490] hover:ring-opacity-70 hover:shadow-[0_0_10px_rgba(148,147,36,0.7)]"
          >
            Documents
          </Link>
        </nav>
      </div>
      <div className="bg-[#f3f5ec] text-black rounded-xl w-[100%]">
        {children}
      </div>
    </div>
  );
}
