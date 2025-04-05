// app/page.js
"use client";

import { SignedIn, SignedOut, SignOutButton, SignUpButton, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from 'next/image'

import { motion } from 'framer-motion';

import { Pacifico } from 'next/font/google';



const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};


export default function HomePage() {
  return (
    <div className="w-full h-screen flex flex-col items-center ">
      <nav className="px-[4%] py-[.5%] w-full absolute flex justify-between items-center  mt-[1%]">

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Image
            src="./pooralogo.svg"
            width={110}
            height={60}
            alt="Documi logo"
          />
        </motion.div>

        <div className="flex flex-row gap-3 font-medium">
          <SignedOut>
            <SignInButton className="px-8   border-[#181818] p-2 rounded-3xl text-sm text-center text-black  font-light hover:bg-[#181818]  hover:text-white transition duration-300 hover:scale-110" />
            <SignUpButton className="px-8 border-2 border-[#181818] p-2 rounded-3xl text-sm text-center text-black font-light hover:bg-[#181818] hover:text-white transition duration-300 hover:scale-110" />
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard-home"
              className="cursor-pointer px-8 border-2 border-[#181818] p-2 rounded-3xl text-sm text-center text-black font-light hover:bg-[#181818] hover:text-white transition duration-300 hover:scale-110"
            >
              Dashboard
            </Link>
            <UserButton className="h-full w-full" />
          </SignedIn>
        </div>
      </nav>

      <div className="bg-[#f3f5ec] w-full  h-full flex flex-col  justify-center items-center text-center 
       -z-10 inset-0  
bg-[radial-gradient(circle,#73737350_1px,transparent_1px)] 
bg-[size:10px_10px]">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center flex flex-col items-center justify-center"
        >
          <motion.h1 variants={item} className="font-bold text-7xl  text-black typing-text ">
            Simplify the Paperwork.
          </motion.h1>

          <motion.h2
            variants={item}
            className="font-bold text-6xl text-[#C5C69A] mt-4"
          >
            Power Your <span className={`border-b-2 border-black italic ${pacifico.className}  `}>Business</span>.
          </motion.h2>

          <motion.p
            variants={item}
            className="text-gray-900 mt-8 text-sm font-bold shimmer-dark  "
          >
            Your one-stop tool to create, customize, and organize legal docs effortlessly
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
