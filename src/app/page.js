// app/page.js
"use client";

import { SignedIn, SignedOut, SignOutButton, SignUpButton, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

// At the top of your page.js
import { Allura } from 'next/font/google'
import { Dancing_Script } from 'next/font/google';
import { Pacifico } from 'next/font/google';
import { Great_Vibes } from 'next/font/google';

const allura = Allura({
  subsets: ['latin'],
  weight: '400',
});

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
});


const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['700'], // use 600 or 700 for bolder strokes
});

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
});

export default function HomePage() {
  return (
    <div className="w-full h-screen flex flex-col items-center ">
      <nav className="px-[4%] py-[.5%] w-full absolute flex justify-between items-center shadow-xs mt-[2%]">
        <h1 className="text-xl font-bold text-center text-black">Documi</h1>

        <div className="flex flex-row gap-3 font-medium">
          <SignedOut>
            <SignInButton className="px-8   border-[#181818] p-2 rounded-3xl text-sm text-center text-black  font-light hover:bg-[#181818] hover:border-2 hover:text-white transition duration-300 hover:scale-110" />
            <SignUpButton className="px-8 border-2 border-[#181818] p-2 rounded-3xl text-sm text-center text-black font-light hover:bg-[#181818] hover:text-white transition duration-300 hover:scale-110"/>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard-home"
              className="cursor-pointer px-8 border-2 border-[#181818] p-2 rounded-3xl text-sm text-center text-black font-light hover:bg-[#181818] hover:text-white transition duration-300 hover:scale-110"
            >
              Dashboard
            </Link>
            <UserButton className="h-full w-full"/>
          </SignedIn>
        </div>
      </nav>

      <div className="bg-[#f3f5ec] w-full  h-full flex flex-col  justify-center items-center text-center 
       -z-10 inset-0  
bg-[radial-gradient(circle,#73737350_1px,transparent_1px)] 
bg-[size:10px_10px]">
        <h1 className="font-bold text-7xl text-black">
          Simplify the Paperwork.
        </h1>
        <h1 className="font-bold text-6xl text-[#C5C69A]">
          Power Your <span className={`border-b-2 border-black italic ${pacifico.className} `}> Business</span>.
        </h1>
        <p className="text-gray-900 mt-8 text-sm  font-bold">
          Your one-stop tool to create, customize, and organize legal docs effortlessly
        </p>
      </div>
    </div>
  );
}
