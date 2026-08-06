"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type NavigationItem = {
  href: string;
  label: string;
  active: boolean;
};

export default function Sidebar({
  name,
  isAdmin,
  avatarUrl,
  groupName,
}: {
  name: string | null;
  isAdmin: boolean;
  avatarUrl: string | null;
  groupName?: string | null;
}) {
  const pathname = usePathname();
  const [fetchedGroupName, setFetchedGroupName] = useState<string | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; role?: string }>>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const router = useRouter();

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
    { href: "/invitations", label: "Einladungen", active: pathname === "/invitations" },
    { href: "/profile", label: "Profil", active: pathname === "/profile" },
  ];

  useEffect(() => {
    // Wenn kein groupName als Prop übergeben wurde, clientseitig laden
    const supabase = createClient();

    if (!groupName && pathname.startsWith("/groups/")) {
      const parts = pathname.split("/");
      const groupId = parts[2];
      if (groupId) {
        (async () => {
          try {
            const { data } = await supabase.from("groups").select("name").eq("id", groupId).single();
            setFetchedGroupName(data?.name ?? null);
          } catch (e) {
            setFetchedGroupName(null);
          }
        })();
      }
    }

    // Lade die Gruppenliste des aktuellen Users
    (async () => {
      try {
        const { data: userResp } = await supabase.auth.getUser();
        const userId = userResp?.user?.id;
        if (!userId) return;

        const { data: memberships } = await supabase.from("group_members").select("group_id, role").eq("user_id", userId);
        const groupIds = (memberships ?? []).map((m: any) => m.group_id);
        if (groupIds.length === 0) {
          setGroups([]);
          return;
        }

        const { data: groupsData } = await supabase.from("groups").select("id, name").in("id", groupIds);

        const roleById = new Map((memberships ?? []).map((m: any) => [m.group_id, m.role]));
        const mapped = (groupsData ?? []).map((g: any) => ({ id: g.id, name: g.name, role: roleById.get(g.id) }));
        setGroups(mapped);
      } catch (e) {
        // ignore
      }
    })();
  }, [groupName, pathname]);

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

      {/* Gruppenliste */}
      <div className="hidden lg:block lg:mt-6">
        <p className="mb-2 text-sm font-medium text-zinc-500">Deine Gruppen</p>
        <ul className="space-y-1">
          {groups.length === 0 && <li className="text-sm text-zinc-500">Keine Gruppen</li>}
          {groups.map((g) => {
            const isActive = pathname === `/groups/${g.id}` || pathname.startsWith(`/groups/${g.id}/`);
            return (
              <li key={g.id}>
                <Link
                  href={`/groups/${g.id}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition lg:text-left ${isActive ? "bg-sky-600 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
                >
                  <span className={`${isActive ? "font-semibold" : ""}`}>{g.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-center text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 lg:mt-6 lg:text-left"
        aria-label={theme === "light" ? "Dunkelmodus aktivieren" : "Hellmodus aktivieren"}
      >
        {theme === "light" ? "Dunkelmodus" : "Hellmodus"}
      </button>
      <LogoutButton />
    </aside>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function logout() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 lg:mt-6">
      <button onClick={logout} disabled={loading} className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium hover:bg-zinc-200">
        {loading ? 'Ausloggen...' : 'Ausloggen'}
      </button>
    </div>
  );
}
