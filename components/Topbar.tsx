"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Timeline" },
  { href: "/profile", label: "Profile" },
];

function Topbar() {
  const pathname = usePathname();

  return (
    <header className="demo-nav">
      <Link className="mr-5 text-xl font-semibold" href="/">
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
        <span className="nav-placeholder">Dashboard</span>
      </nav>
      <span className="ml-auto text-sm">Fall Semester</span>
    </header>
  );
}

export default Topbar;
