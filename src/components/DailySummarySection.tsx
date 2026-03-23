"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import loadingAnimation from "@/lottie/loading.json";
import { generateDailySummary, saveDailySummary } from "@/lib/actions/ai";
import type { Record as RecordType, DailySummary } from "@/lib/types";

type Props = {
  childId: string;
  childName: string;
  todayRecords: RecordType[];
  savedSummary: DailySummary | null;
};

export default function DailySummarySection({
  childId,
  childName,
  todayRecords,
  savedSummary,
}: Props) {
  const router = useRouter();
  const [summaryText, setSummaryText] = useState(
    savedSummary?.summary_text ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (todayRecords.length === 0) return null;

  const today = new Date().toISOString().split("T")[0];

  async function handleGenerate() {
    setLoading(true);
    setError("");

    const result = await generateDailySummary(childName, todayRecords);
    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const saveResult = await saveDailySummary(childId, today, result.summary);
    if ("error" in saveResult) {
      setError(saveResult.error);
      setLoading(false);
      return;
    }

    setSummaryText(result.summary);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-xl bg-violet-100/40 px-4 py-2 text-sm font-bold text-gray-500 transition hover:bg-violet-100/70 disabled:opacity-50"
      >
        {loading ? "生成中..." : summaryText ? "AIまとめを再生成" : "AIまとめを生成"}
      </button>

      {loading && (
        <div className="mt-2 flex items-center gap-2">
          <Lottie
            animationData={loadingAnimation}
            loop
            className="h-10 w-10"
          />
          <p className="text-sm text-text-light">AI文生成中...</p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
