"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/session-actions";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/timeline", label: "Timeline" },
  { href: "/profile", label: "Profile" },
  { href: "/courses", label: "Courses" },
];

function Navbar() {
  const pathname = usePathname();

  return (
    <header className="demo-nav">
      <Link
        className="mr-5 inline-flex items-center gap-2 text-xl font-semibold"
        href="/dashboard"
      >
        <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
          <rect x="0" y="7" width="5" height="11" fill="currentColor" />
          <rect x="7.5" y="0" width="5" height="18" fill="currentColor" />
          <rect x="15" y="4" width="5" height="14" fill="currentColor" />
        </svg>
        StudySync
      </Link>
      <nav aria-label="Main" className="flex flex-wrap gap-2">
        {links.map((link) => {
          const isCurrent =
            link.href === "/"
              ? pathname === "/"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              aria-current={isCurrent ? "page" : undefined}
              className={`nav-button ${isCurrent ? "selected" : ""}`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-4">
        <Link
          href="/extraction"
          className="inline-flex items-center gap-2 rounded-md bg-[#a37c76] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#8c6862] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a37c76]"
        >
          Add Syllabus
          <span aria-hidden="true">→</span>
        </Link>
        <span className="text-sm">Fall Semester</span>
        <form action={logOut}>
          <button className="nav-button" type="submit">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}

export default Navbar;