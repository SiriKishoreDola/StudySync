"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Timeline" },
  { href: "/profile", label: "Profile" },
  { href: "/courses", label: "Courses" },
];

function Topbar() {
  const pathname = usePathname();

  return (
    <header className="demo-nav">
     <Link className="mr-5 inline-flex items-center gap-2 text-xl font-semibold" href="/">
        <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
          <rect x="0" y="7" width="5" height="11" fill="currentColor" />
          <rect x="7.5" y="0" width="5" height="18" fill="currentColor" />
          <rect x="15" y="4" width="5" height="14" fill="currentColor" />
        </svg>
        StudySync
      </Link>
      <nav aria-label="Main" className="flex flex-wrap gap-2">
        {links.map((link) => {
          const isCurrent = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);
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
      <div className="ml-auto flex items-center gap-4">
        <Link
          href="/extraction"
          className="inline-flex items-center gap-2 rounded-md bg-[#a37c76] text-black px-4 py-2 text-sm font-semibold transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Add Syllabus
          <span aria-hidden="true">→</span>
        </Link>
        <span className="text-sm">Fall Semester</span>
      </div>
</header>
  );
}

export default Topbar;
