// app/page.js
"use client";

import { SignedIn, SignedOut, SignOutButton, SignUpButton, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="w-full h-screen flex flex-col items-center">
      <nav className="px-[4%] py-[.5%] w-full flex justify-between items-center shadow-xs">
        <h1 className="text-xl font-bold text-center text-white">Documi</h1>

        <div className="flex flex-row gap-3 font-medium">
          <SignedOut>
            <SignInButton className="px-8  border-[#f3f5ec] p-2 rounded-3xl text-sm text-center font-light hover:bg-[#f3f5ec] hover:text-black tranblacksition duration-300 hover:scale-110" />
            <SignUpButton className="px-8 border-1 border-[#f3f5ec] p-2 rounded-3xl text-sm text-center font-light hover:bg-[#f3f5ec] hover:text-black tranblacksition duration-300 hover:scale-110"/>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard-home"
              className="cursor-pointer px-8 border border-[#f3f5ec] p-2 rounded-3xl text-sm text-center font-light hover:bg-[#f3f5ec] hover:text-black transition duration-300 hover:scale-110"
            >
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      <div className="bg-[#f3f5ec] w-[98%] rounded-3xl h-full flex flex-col justify-center items-center text-center">
        <h1 className="font-bold text-7xl text-black">
          Simplify the Paperwork.
        </h1>
        <h1 className="font-bold text-6xl text-[#C5C69A]">
          Power Your <span className="border-b-2 border-black italic "> Business</span>.
        </h1>
        <p className="text-gray-900 mt-8 text-sm italic font-bold">
          Your one-stop tool to create, customize, and organize legal docs effortlessly
        </p>
      </div>
    </div>
  );
}
