"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/session-actions";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/timeline", label: "Timeline" },
  { href: "/upload", label: "Upload" },
  { href: "/profile", label: "Profile" },
];

function Navbar() {
  const pathname = usePathname();

  return (
    <header className="demo-nav">
      <Link className="mr-5 text-xl font-semibold" href="/dashboard">
        StudySync
      </Link>
      <nav aria-label="Main" className="flex flex-wrap gap-2">
        {links.map((link) => {
          const isCurrent = pathname === link.href;
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
      <div className="ml-auto flex items-center gap-2">
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
