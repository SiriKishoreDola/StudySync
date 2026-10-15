"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

function Topbar() {
  const pathname = usePathname();
  const isProfile = pathname === "/profile";

  return (
    <header className="topbar">
      <Link
        href="/"
        className="flex items-center gap-3"
        aria-label="Return to timeline"
      >
        <span className="logo-mark">
          <span />
          <span />
          <span />
        </span>
        <span className="text-[17px] font-semibold tracking-[-0.04em]">
          StudySync
        </span>
      </Link>

      <div className="flex items-center gap-4 text-sm text-zinc-600 sm:gap-7">
        <span className="hidden sm:inline">Fall Semester</span>
        <span className="hidden h-4 w-px bg-black/10 sm:block" />
        <button className="icon-button" aria-label="Open dashboard">
          <Icon name="grid" size={18} />
        </button>
        <Link
          href="/profile"
          aria-label="Open profile"
          aria-current={isProfile ? "page" : undefined}
          className={`profile-trigger ${isProfile ? "is-active" : ""}`}
        >
          JD
        </Link>
      </div>
    </header>
  );
}

export default Topbar;
