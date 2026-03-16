"use client";

import { useRouter } from "next/navigation";
import type { Child } from "@/lib/types";

type ChildSwitcherProps = {
  children: Child[];
  currentChildId: string;
  basePath: string;
};

export default function ChildSwitcher({
  children,
  currentChildId,
  basePath,
}: ChildSwitcherProps) {
  const router = useRouter();

  return (
    <select
      value={currentChildId}
      onChange={(e) => router.push(`/children/${e.target.value}/${basePath}`)}
      className="rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-sm text-white outline-none"
    >
      {children.map((child) => (
        <option key={child.id} value={child.id} className="text-text">
          {child.name}
        </option>
      ))}
    </select>
  );
}
