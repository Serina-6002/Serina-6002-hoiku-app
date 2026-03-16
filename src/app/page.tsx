import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffName } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import ChildCard from "@/components/ChildCard";
import type { Child } from "@/lib/types";

export default async function HomePage() {
  const staffName = await getStaffName();
  if (!staffName) redirect("/login");

  const supabase = await createClient();
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .order("id");

  return (
    <div className="min-h-screen">
      <Header staffName={staffName} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">子どもを選んでください</h2>
          <Link
            href="/children/add"
            className="rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-500 transition hover:bg-violet-100"
          >
            + 園児追加
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(children as Child[])?.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      </main>
    </div>
  );
}
