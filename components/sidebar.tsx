"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  href: string;
  label: string;
  active: boolean;
};

export default function Sidebar({
  name,
  isAdmin,
}: {
  name: string | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const items: NavigationItem[] = [
    { href: "/dashboard", label: "Dashboard", active: pathname === "/dashboard" },
    { href: "/profile", label: "Profil", active: pathname === "/profile" },
  ];

  if (pathname.startsWith("/groups/")) {
    items.splice(1, 0, { href: pathname, label: "Aktuelle Gruppe", active: true });
  }

  if (isAdmin) {
    items.push({ href: "/admin", label: "Admin", active: pathname === "/admin" });
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white px-3 py-2 shadow-lg lg:inset-y-0 lg:left-0 lg:right-auto lg:w-64 lg:border-r lg:border-t-0 lg:px-5 lg:py-6">
      <div className="hidden lg:block">
        <p className="text-sm font-medium text-sky-600">Drink Tracker</p>
        <p className="mt-1 truncate text-lg font-semibold">{name || "Mein Profil"}</p>
      </div>

      <nav className="flex justify-around gap-1 lg:mt-8 lg:flex-col lg:justify-start" aria-label="Hauptnavigation">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-center text-sm font-medium transition lg:text-left ${
              item.active
                ? "bg-sky-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
