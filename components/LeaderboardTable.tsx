"use client";

import { useMemo, useState } from "react";

type Column = { id: string; name: string };

type Row = {
  id: string;
  name: string;
  avatarUrl: string | null;
  total: number;
  counts: Record<string, number>;
};

export default function LeaderboardTable({
  columns,
  rows,
}: {
  columns: Column[];
  rows: Row[];
}) {
  const [sortKey, setSortKey] = useState<string>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => {
      let leftValue: string | number = 0;
      let rightValue: string | number = 0;

      if (sortKey === "name") {
        leftValue = left.name.toLowerCase();
        rightValue = right.name.toLowerCase();
      } else if (sortKey === "total") {
        leftValue = left.total;
        rightValue = right.total;
      } else {
        leftValue = left.counts[sortKey] ?? 0;
        rightValue = right.counts[sortKey] ?? 0;
      }

      if (typeof leftValue === "string" && typeof rightValue === "string") {
        const compare = leftValue.localeCompare(rightValue);
        return sortDir === "asc" ? compare : -compare;
      }

      return sortDir === "asc" ? (leftValue as number) - (rightValue as number) : (rightValue as number) - (leftValue as number);
    });
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  }

  function sortIndicator(key: string) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 rounded-tl-lg bg-white px-3 py-2 text-left font-semibold text-zinc-700 shadow-sm">#</th>
            <th className="sticky left-12 z-10 rounded-tr-lg bg-white px-3 py-2 text-left font-semibold text-zinc-700 shadow-sm">Name</th>
            {columns.map((column) => (
              <th key={column.id} className="px-3 py-2 text-right font-semibold text-zinc-700">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort(column.id)}>
                  {column.name}
                  <span className="text-xs text-zinc-400">{sortIndicator(column.id)}</span>
                </button>
              </th>
            ))}
            <th className="px-3 py-2 text-right font-semibold text-zinc-700">
              <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("total")}>Gesamt<span className="text-xs text-zinc-400">{sortIndicator("total")}</span></button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr key={row.id} className="border-t border-zinc-100 hover:bg-zinc-50">
              <td className="whitespace-nowrap px-3 py-2 text-zinc-600">{index + 1}</td>
              <td className="flex items-center gap-3 whitespace-nowrap px-3 py-2">
                {row.avatarUrl ? (
                  <img src={row.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">{row.name.slice(0, 1).toUpperCase()}</span>
                )}
                <span className="truncate">{row.name}</span>
              </td>
              {columns.map((column) => (
                <td key={column.id} className="whitespace-nowrap px-3 py-2 text-right text-zinc-700">{row.counts[column.id] ?? 0}</td>
              ))}
              <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-zinc-700">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
