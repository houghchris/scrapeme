'use client';

import { usePathname } from "next/navigation";
import ButtonAccount from "./ButtonAccount";
import Link from "next/link";

const NavigationBar = () => {
  const pathname = usePathname();

  return (
    <div className="navbar bg-base-100">
      <div className="flex-1 flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="logo-text text-3xl">Scrape.me.uk</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 rotate-180 mt-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
          </svg>
        </Link>
      </div>
      <div className="flex-none gap-2">
        <Link href="/setup" className="btn btn-outline btn-primary">
          New Scraper
        </Link>
        <ButtonAccount />
      </div>
    </div>
  );
};

export default NavigationBar;
