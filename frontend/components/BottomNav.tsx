"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/issues", label: "Issues", icon: "📋" },
  { href: "/my-reports", label: "My Reports", icon: "📁" },
  { href: "/notifications", label: "Alerts", icon: "🔔" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottomnav" role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.slice(0, 2).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`bottomnav__item ${pathname === item.href ? "active" : ""}`}
          aria-current={pathname === item.href ? "page" : undefined}
          aria-label={item.label}
        >
          <span className="bottomnav__icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}

      {/* Primary CTA */}
      <Link
        href="/report"
        className="bottomnav__item bottomnav__report"
        aria-label="Report a problem"
      >
        <span aria-hidden="true">+</span> Report
      </Link>

      {NAV_ITEMS.slice(2).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`bottomnav__item ${pathname === item.href ? "active" : ""}`}
          aria-current={pathname === item.href ? "page" : undefined}
          aria-label={item.label}
        >
          <span className="bottomnav__icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
