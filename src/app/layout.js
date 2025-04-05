import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";

export const metadata = {
  title: "Documi",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>
          <div className="bg-[#181818] flex h-screen  w-full">
            <SignedIn>
              <div className="bg-[#f3f5ec] rounded-xl m-[1%] w-[80%]">
                {children}
              </div>
            </SignedIn>
            <SignedOut>
              <div className="bg-[#181818] w-full h-screen flex flex-col items-center ">
                <nav className=" px-[4%] py-[.5%]  shadow-xs ">
                  
                  <div className=" text-xl font-bold text-center  ">
                    <h1 className=" ">Documi</h1>
                  </div>


                  <div className="flex gap-6 text-[#181818] font-medium">
                    
                  </div>
                </nav>
                <div className="bg-[#f3f5ec]  w-[98%] rounded-3xl h-screen flex flex-col justify-center items-center text-center  ">
                
                  <h1 className="font-bold text-7xl text-black ">
                    Simplify the Paperwork.
                  </h1>
                  <h1 className="font-bold text-6xl text-[#C5C69A]  ">
                    Power Your <span className="border-b-2 border-black"> Business</span>.
                  </h1>
                  <p className="text-gray-900 mt-8 text-sm italic font-bold ">Your one-stop tool to create, customize, and organize legal docs effortlessly</p>
                  
                </div>
              </div>

            </SignedOut>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}