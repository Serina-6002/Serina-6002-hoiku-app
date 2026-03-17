import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffName } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import ChildCard from "@/components/ChildCard";
import BatchSummaryButton from "@/components/BatchSummaryButton";
import type { Child } from "@/lib/types";

type TodayStatus = "出席" | "欠席" | "未入力";

const VALID_ATTENDANCE = ["出席", "欠席", "遅刻", "早退"] as const;

export default async function HomePage() {
  const staffName = await getStaffName();
  if (!staffName) redirect("/login");

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [childrenResult, recordsResult] = await Promise.all([
    supabase.from("children").select("*").order("id"),
    supabase
      .from("records")
      .select("child_id, attendance_type, created_at")
      .eq("date", today)
      .order("created_at", { ascending: false }),
  ]);

  const children = (childrenResult.data as Child[]) ?? [];
  const todayRecords = (recordsResult.data as { child_id: string; attendance_type: string; created_at: string }[]) ?? [];

  const latestByChild = new Map<string, string>();
  for (const r of todayRecords) {
    if (!latestByChild.has(r.child_id)) {
      latestByChild.set(r.child_id, r.attendance_type);
    }
  }

  const statusMap = new Map<string, TodayStatus>();
  let attendCount = 0;
  let absentCount = 0;
  let unenteredCount = 0;

  for (const child of children) {
    const att = latestByChild.get(child.id);
    const isValid = att && typeof att === "string" && VALID_ATTENDANCE.includes(att as (typeof VALID_ATTENDANCE)[number]);
    let status: TodayStatus;
    if (!isValid) {
      status = "未入力";
      unenteredCount++;
    } else if (att === "欠席") {
      status = "欠席";
      absentCount++;
    } else {
      status = "出席";
      attendCount++;
    }
    statusMap.set(child.id, status);
  }

  return (
    <div className="min-h-screen">
      <Header staffName={staffName} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">園児一覧</h2>
          <div className="flex items-center gap-2">
            <BatchSummaryButton targetCount={attendCount + absentCount} unenteredCount={unenteredCount} />
            <Link
              href="/children/add"
              className="rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-500 transition hover:bg-violet-100"
            >
              + 園児追加
            </Link>
          </div>
        </div>

        <p className="mb-4 text-sm text-text-light">
          出席 {attendCount}人 / 欠席 {absentCount}人 / 未入力 {unenteredCount}人
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              todayStatus={statusMap.get(child.id)!}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
