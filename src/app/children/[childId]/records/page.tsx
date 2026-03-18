import Link from "next/link";
import { getStaffName } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import ChildSwitcher from "@/components/ChildSwitcher";
import RecordsListWithFilter from "@/components/RecordsListWithFilter";
import type { Child, Record as RecordType } from "@/lib/types";
import { getDailySummary } from "@/lib/actions/ai";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ childId: string }>;
};

function ErrorFallback({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-text-light">{message}</p>
        <Link href="/" className="mt-4 inline-block text-primary underline">
          園児一覧へ戻る
        </Link>
      </div>
    </div>
  );
}

export default async function RecordsPage({ params }: Props) {
  try {
    let childId = "";
    try {
      const resolved = await params;
      childId = typeof resolved?.childId === "string" ? resolved.childId : "";
    } catch {
      childId = "";
    }

    if (!childId) {
      return <ErrorFallback message="園児を指定してください" />;
    }

    let staffName: string | null = null;
    try {
      staffName = await getStaffName();
    } catch {
      staffName = null;
    }
    if (!staffName) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-text-light">ログインが必要です</p>
            <Link href="/login" className="mt-4 inline-block text-primary underline">
              ログインページへ
            </Link>
          </div>
        </div>
      );
    }

    let child: Child | null = null;
    let allChildren: Child[] = [];
    let records: RecordType[] = [];

    try {
      const supabase = await createClient();
      const [childResult, childrenResult, recordsResult] = await Promise.all([
        supabase.from("children").select("*").eq("id", childId).single(),
        supabase.from("children").select("*").order("id"),
        supabase
          .from("records")
          .select("*")
          .eq("child_id", childId)
          .order("created_at", { ascending: false }),
      ]);

      child = (childResult?.data as Child) ?? null;
      const rawChildren = childrenResult?.data;
      allChildren = Array.isArray(rawChildren) ? (rawChildren as Child[]) : [];
      const rawRecords = recordsResult?.data;
      records = Array.isArray(rawRecords) ? (rawRecords as RecordType[]) : [];
    } catch {
      child = null;
      allChildren = [];
      records = [];
    }

    if (!child) {
      return <ErrorFallback message="園児が見つかりません" />;
    }

    let savedSummary: Awaited<ReturnType<typeof getDailySummary>> = null;
    try {
      const today = new Date().toISOString().split("T")[0];
      savedSummary = await getDailySummary(childId, today);
    } catch {
      savedSummary = null;
    }

    const today = new Date().toISOString().split("T")[0];
    const safeRecords = Array.isArray(records) ? records : [];
    const todayRecords = safeRecords.filter((r) => r != null && r.date === today);
    const olderRecords = safeRecords.filter((r) => r != null && r.date !== today);
    const childName = child?.name ?? "園児";
    const safeAllChildren = Array.isArray(allChildren) ? allChildren : [];

    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 bg-gradient-to-r from-sky-400 to-violet-400 text-white shadow-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-full p-1 transition hover:bg-white/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <ChildSwitcher
                children={safeAllChildren}
                currentChildId={childId}
                basePath="records"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm opacity-90">{staffName}</span>
              <Link
                href="/"
                className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium transition hover:bg-white/30"
              >
                園児一覧
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{childName} の記録</h2>
            <Link
              href={`/children/${childId}/new`}
              className="rounded-xl bg-yellow-100/40 px-4 py-2 text-sm font-bold text-gray-500 transition hover:bg-yellow-100/70"
            >
              + 新規記録
            </Link>
          </div>

          {todayRecords.length === 0 && olderRecords.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-4xl">📋</p>
              <p className="mt-2 font-medium text-text-light">
                まだ記録がありません
              </p>
              <Link
                href={`/children/${childId}/new`}
                className="mt-4 inline-block rounded-xl bg-yellow-100/40 px-6 py-2.5 text-sm font-bold text-gray-500 transition hover:bg-yellow-100/70"
              >
                最初の記録を作成
              </Link>
            </div>
          ) : (
            <RecordsListWithFilter
              childId={childId}
              childName={childName}
              todayRecords={todayRecords}
              olderRecords={olderRecords}
              savedSummary={savedSummary}
            />
          )}
        </main>
      </div>
    );
  } catch {
    return <ErrorFallback message="データ取得に失敗しました" />;
  }
}
