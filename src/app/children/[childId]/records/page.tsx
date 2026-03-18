import Link from "next/link";
import ChildSwitcher from "@/components/ChildSwitcher";
import RecordsListWithFilter from "@/components/RecordsListWithFilter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FetchError =
  | { type: "child"; message: string }
  | { type: "allChildren"; message: string }
  | { type: "records"; message: string }
  | null;

function ErrorFallback({
  message,
  detail,
}: {
  message: string;
  detail?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-text-light">{message}</p>
        {detail && (
          <p className="mt-1 text-sm text-text-light/80">{detail}</p>
        )}
        <Link href="/" className="mt-4 inline-block text-primary underline">
          園児一覧へ戻る
        </Link>
      </div>
    </div>
  );
}

export default async function RecordsPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  try {
    let childId = "";
    try {
      const resolved = await params;
      childId = typeof resolved?.childId === "string" ? resolved.childId : "";
    } catch {
      childId = "";
    }

    if (!childId) {
      console.error("[RecordsPage] childId が不正です", { childId });
      return <ErrorFallback message="園児を指定してください" />;
    }

    const { getStaffName } = await import("@/lib/actions/auth");
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

    const { createClient } = await import("@/lib/supabase/server");
    const { getDailySummary } = await import("@/lib/actions/ai");
    type Child = import("@/lib/types").Child;
    type RecordType = import("@/lib/types").Record;

    let child: Child | null = null;
    let allChildren: Child[] = [];
    let records: RecordType[] = [];
    let fetchError: FetchError = null;

    let supabase: Awaited<ReturnType<typeof createClient>>;
    try {
      supabase = await createClient();
    } catch (err) {
      console.error("[RecordsPage] createClient 失敗", {
        childId,
        error: err instanceof Error ? err.message : String(err),
      });
      return (
        <ErrorFallback
          message="データ取得に失敗しました"
          detail="接続エラーが発生しました"
        />
      );
    }

    try {
      const childResult = await supabase
        .from("children")
        .select("*")
        .eq("id", childId)
        .single();

      if (childResult.error) {
        fetchError = { type: "child", message: childResult.error.message };
        console.error("[RecordsPage] child 取得失敗", {
          childId,
          error: childResult.error.message,
          code: childResult.error.code,
          details: childResult.error.details,
        });
      } else {
        child = (childResult.data as Child) ?? null;
        if (!child) {
          console.error("[RecordsPage] child 取得: data が null", { childId });
          fetchError = { type: "child", message: "園児が見つかりません" };
        }
      }
    } catch (err) {
      fetchError = { type: "child", message: "園児の取得で例外が発生しました" };
      console.error("[RecordsPage] child 取得で例外", {
        childId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      const childrenResult = await supabase
        .from("children")
        .select("*")
        .order("id");

      if (childrenResult.error) {
        if (!fetchError) fetchError = { type: "allChildren", message: childrenResult.error.message };
        console.error("[RecordsPage] allChildren 取得失敗", {
          childId,
          error: childrenResult.error.message,
          code: childrenResult.error.code,
          details: childrenResult.error.details,
        });
      } else {
        const rawChildren = childrenResult.data;
        allChildren = Array.isArray(rawChildren) ? (rawChildren as Child[]) : [];
      }
    } catch (err) {
      if (!fetchError) fetchError = { type: "allChildren", message: "園児一覧の取得で例外が発生しました" };
      console.error("[RecordsPage] allChildren 取得で例外", {
        childId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      const recordsResult = await supabase
        .from("records")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false });

      if (recordsResult.error) {
        if (!fetchError) fetchError = { type: "records", message: recordsResult.error.message };
        console.error("[RecordsPage] records 取得失敗", {
          childId,
          error: recordsResult.error.message,
          code: recordsResult.error.code,
          details: recordsResult.error.details,
          hint: recordsResult.error.hint,
        });
      } else {
        const rawRecords = recordsResult.data;
        records = Array.isArray(rawRecords) ? (rawRecords as RecordType[]) : [];
      }
    } catch (err) {
      if (!fetchError) fetchError = { type: "records", message: "記録一覧の取得で例外が発生しました" };
      console.error("[RecordsPage] records 取得で例外", {
        childId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (!child) {
      const errorMessage =
        fetchError?.type === "child"
          ? "園児が見つかりません"
          : fetchError?.type === "records"
            ? "記録一覧の取得に失敗しました"
            : fetchError?.type === "allChildren"
              ? "園児一覧の取得に失敗しました"
              : "園児が見つかりません";
      return (
        <ErrorFallback
          message={errorMessage}
          detail={fetchError?.message}
        />
      );
    }

    let savedSummary: Awaited<ReturnType<typeof getDailySummary>> = null;
    try {
      const today = new Date().toISOString().split("T")[0];
      savedSummary = await getDailySummary(childId, today);
    } catch (err) {
      console.error("[RecordsPage] getDailySummary 失敗（記録表示は継続）", {
        childId,
        error: err instanceof Error ? err.message : String(err),
      });
      savedSummary = null;
    }

    if (fetchError?.type === "records") {
      return (
        <div className="min-h-screen">
          <header className="sticky top-0 z-10 bg-gradient-to-r from-sky-400 to-violet-400 text-white shadow-md">
            <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-lg font-bold">
                保育メモ
              </Link>
              <Link
                href="/"
                className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium transition hover:bg-white/30"
              >
                園児一覧
              </Link>
            </div>
          </header>
          <main className="mx-auto max-w-2xl px-4 py-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="font-medium text-amber-800">
                記録一覧の取得に失敗しました
              </p>
              <p className="mt-1 text-sm text-amber-700">
                しばらくしてから再度お試しください
              </p>
              <Link
                href="/"
                className="mt-4 inline-block text-primary underline"
              >
                園児一覧へ戻る
              </Link>
            </div>
          </main>
        </div>
      );
    }

    if (fetchError?.type === "allChildren") {
      console.error("[RecordsPage] allChildren のみ失敗、園児切り替えは非表示で続行", { childId });
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
  } catch (err) {
    console.error("[RecordsPage] 予期しないエラー", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return (
      <ErrorFallback
        message="データ取得に失敗しました"
        detail="予期しないエラーが発生しました"
      />
    );
  }
}
