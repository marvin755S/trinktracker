"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavigationItem = {
  href: string;
  label: string;
  active: boolean;
};

export default function Sidebar({
  name,
  isAdmin,
  avatarUrl,
}: {
  name: string | null;
  isAdmin: boolean;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme === "dark") {
      const frame = window.requestAnimationFrame(() => {
        setTheme("dark");
        document.documentElement.dataset.theme = "dark";
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  }

  const items: NavigationItem[] = [
    { href: "/dashboard", label: "Dashboard", active: pathname === "/dashboard" },
    { href: "/drinks", label: "Getränke", active: pathname === "/drinks" },
    { href: "/categories", label: "Kategorien", active: pathname === "/categories" },
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
        <div className="mt-2 flex items-center gap-2">
          {avatarUrl ? <img className="h-9 w-9 rounded-full object-cover" src={avatarUrl} alt="Profilbild" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">{(name || "P").slice(0, 1).toUpperCase()}</div>}
          <p className="truncate text-lg font-semibold">{name || "Mein Profil"}</p>
        </div>
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

      <button
        type="button"
        onClick={toggleTheme}
        className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-center text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 lg:mt-6 lg:text-left"
        aria-label={theme === "light" ? "Dunkelmodus aktivieren" : "Hellmodus aktivieren"}
      >
        {theme === "light" ? "Dunkelmodus" : "Hellmodus"}
      </button>
    </aside>
  );
}
