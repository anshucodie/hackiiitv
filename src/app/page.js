import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function HomePage() {
  const user = await currentUser();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-4xl font-bold mb-2">🧾 LegalDocs for Startups</h1>
      <p className="text-gray-600 max-w-xl mb-6">
        Generate legal docs like NDAs, Contracts, and Founder Agreements in
        seconds. Perfect for small teams and solo founders.
      </p>

      {!user ? (
        <div className="flex gap-4">
          <Link href="/sign-in">
            <button className=" border-gray-300 px-4 py-2 rounded transition cursor-pointer hover:bg-gray-100">
              Sign In
            </button>
          </Link>
          <Link href="/sign-up">
            <button className="bg-black px-4 py-2 rounded hover:bg-gray-800 transition cursor-pointer">
              Sign Up
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <UserButton />
          <Link href="/dashboard" className="text-blue-500 underline">
            Go to Dashboard
          </Link>
        </div>
      )}
    </main>
  );
}
