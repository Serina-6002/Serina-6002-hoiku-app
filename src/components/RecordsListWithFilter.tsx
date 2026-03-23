"use client";

import { useState } from "react";
import Link from "next/link";
import RecordCard from "./RecordCard";
import DailySummarySection from "./DailySummarySection";
import type { Record as RecordType } from "@/lib/types";
import type { DailySummary } from "@/lib/types";

type FilterType = "all" | "出席" | "欠席" | "遅刻" | "早退";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "出席", label: "出席" },
  { value: "欠席", label: "欠席" },
  { value: "遅刻", label: "遅刻" },
  { value: "早退", label: "早退" },
];

type Props = {
  childId: string;
  childName: string;
  todayRecords: RecordType[];
  olderRecords: RecordType[];
  savedSummary: DailySummary | null;
};

export default function RecordsListWithFilter({
  childId,
  childName,
  todayRecords,
  olderRecords,
  savedSummary,
}: Props) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filterRecords = (records: RecordType[]) =>
    filter === "all" ? records : records.filter((r) => r.attendance_type === filter);

  const filteredTodayRecords = filterRecords(todayRecords);
  const filteredOlderRecords = filterRecords(olderRecords);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              filter === opt.value
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-light hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {todayRecords.length > 0 && (
          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-primary">
                今日の記録（{filteredTodayRecords.length}件）
              </h3>
              <DailySummarySection
                childId={childId}
                childName={childName}
                todayRecords={todayRecords}
                savedSummary={savedSummary}
              />
            </div>
            <div className="space-y-3">
              {filteredTodayRecords.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  compact
                  summaryText={savedSummary?.summary_text}
                />
              ))}
            </div>
          </section>
        )}

        {filteredOlderRecords.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-text-light">
              過去の記録（{filteredOlderRecords.length}件）
            </h3>
            <div className="space-y-3">
              {filteredOlderRecords.map((record) => (
                <RecordCard key={record.id} record={record} compact />
              ))}
            </div>
          </section>
        )}

        {filteredTodayRecords.length === 0 && filteredOlderRecords.length === 0 && (
          <p className="py-8 text-center text-sm text-text-light">
            {filter === "all" ? "記録がありません" : "該当する記録がありません"}
          </p>
        )}
      </div>
    </>
  );
}
