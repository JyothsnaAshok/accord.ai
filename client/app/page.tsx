"use client";
import Link from "next/link";
import { Play } from "lucide-react";
import Image from "next/image";
import { Button } from "@mantine/core";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle/ColorSchemeToggle";

const ICON_SIZE = 16;

export default function Home() {
  return (
    <div className="flex flex-col gap-20">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-3 items-center font-semibold">
            <Image
              src="/accord_logo.png"
              alt="Supabase"
              width={40}
              height={80}
            />
            <div className="text-lg font-medium">accord.ai</div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/auth/sign-in"
              className="relative inline-flex items-center bg-black rounded-md border border-transparent px-4 py-2 text-xs text-white font-medium shadow-sm focus:outline-none  focus:ring-2 focus:ring-offset-2 md:text-sm "
            >
              <span>Sign In</span>
            </Link>
            <Link
              href="/auth/sign-up"
              className="relative inline-flex items-center rounded-md border border-black  px-4 py-2 text-xs font-medium shadow-sm focus:outline-none  focus:ring-2 focus:ring-offset-2 md:text-sm "
            >
              <span>Sign up</span>
            </Link>
          </div>
        </div>
      </nav>
      <div className="flex flex-col gap-2 items-center max-w-5xl mx-auto">
        <div className="bg-green-100 text-green-600 px-4 py-2 rounded-full font-semibold opacity-80">
          The Docusign Hackathon: Unlocked 2025
        </div>
        <div className="text-5xl font-semibold leading-tight mb-4 relative text-center">
          Extract insights, automate workflows, and unlock the full potential of
          your contracts with{" "}
          <span
            className="relative inline-block"
            style={{
              position: "relative",
              display: "inline-block",
            }}
          >
            AI-powered
            <span
              style={{
                content: '""',
                position: "absolute",
                bottom: "-15px",
                left: 0,
                height: "7px",
                width: "100%",
                border: "solid 8px #ea653e",
                borderColor: "#ea653e transparent transparent transparent",
                borderRadius: "50%",
              }}
            />
          </span>{" "}
          precision
        </div>
        <div className="text-gray-500 text-lg mt-4 mb-8 px-8 dark:text-gray-400 text-center">
          Whether managing complex agreements or ensuring compliance across
          multiple regions, AccordAI empowers organizations to unlock the true
          potential of their contracts with ease and precision.
        </div>
        <div className="flex justify-center items-center mt-8">
          <div className="bg-orange-600 px-6 py-2 rounded-lg cursor-pointer text-white mr-4 hover:bg-orange-700">
            Github Repo
          </div>
          <div className="border-2 border-orange-600 px-6 py-2 rounded-lg cursor-pointer ml-4 hover:border-orange-700 dark:border-orange-500 dark:hover:border-orange-400">
            <Link
              href="https://supabase.com/docs/guides/auth/auth-smtp"
              target="_blank"
              className="text-orange-500 flex items-center text-sm gap-1 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
            >
              <Play size={ICON_SIZE} /> See Demo
            </Link>
          </div>
        </div>
        <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
      </div>
    </div>
  );
}
