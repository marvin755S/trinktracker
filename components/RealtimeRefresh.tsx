"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type RealtimeTable = "invitations" | "group_members" | "drinks" | "groups";

export default function RealtimeRefresh({
  tables,
  filter,
}: {
  tables: RealtimeTable[];
  filter?: string;
}) {
  const router = useRouter();
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel("realtime-refresh")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          const table = payload.table as RealtimeTable;
          if (tables.includes(table)) {
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tables, router]);

  return null;
}