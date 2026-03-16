"use client";

import { useTransition } from "react";
import Link from "next/link";
import AttendanceBadge from "./AttendanceBadge";
import { deleteRecord } from "@/lib/actions/records";
import type { Record as RecordType, AttendanceType } from "@/lib/types";

type RecordCardProps = {
  record: RecordType;
};


export default function RecordCard({ record }: RecordCardProps) {
  const [isPending, startTransition] = useTransition();
  const isAbsent = ["欠席", "遅刻", "早退"].includes(record.attendance_type);

  const handleDelete = () => {
    if (!confirm("この記録を削除しますか？")) return;
    startTransition(async () => {
      await deleteRecord(record.id, record.child_id);
    });
  };

  const date = new Date(record.created_at);
  const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 shadow-sm transition ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-light">{record.date}</span>
          <span className="text-sm text-text-light">{timeStr}</span>
          <AttendanceBadge type={record.attendance_type as AttendanceType} />
        </div>
        <span className="text-xs text-text-light">{record.staff_name}</span>
      </div>

      {isAbsent && record.reason && (
        <p className="mb-2 text-sm text-red-600">理由: {record.reason}</p>
      )}

      {!isAbsent && (
        <div className="mb-2 space-y-1.5">
          {record.mood && (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${
                  record.mood === "良"
                    ? "bg-green-100 text-green-700"
                    : record.mood === "普通"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                😊 体調: {record.mood}
              </span>
              {record.mood_memo && (
                <span className="text-xs text-text-light">{record.mood_memo}</span>
              )}
            </div>
          )}
          {record.meal && (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${
                  record.meal === "完食" || record.meal === "ほぼ完食"
                    ? "bg-green-100 text-green-700"
                    : record.meal === "半分"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                🍚 昼食: {record.meal}
              </span>
              {record.meal_memo && (
                <span className="text-xs text-text-light">{record.meal_memo}</span>
              )}
            </div>
          )}
          {record.snack && (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${
                  record.snack === "完食"
                    ? "bg-green-100 text-green-700"
                    : record.snack === "半分"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                🍪 おやつ: {record.snack}
              </span>
              {record.snack_memo && (
                <span className="text-xs text-text-light">{record.snack_memo}</span>
              )}
            </div>
          )}
          {record.nap && record.nap !== "[]" && record.nap !== '[{"hour":"","minute":"","position":""},{"hour":"","minute":"","position":""},{"hour":"","minute":"","position":""}]' && (() => {
            try {
              const entries = JSON.parse(record.nap) as { hour: string; minute: string; position: string }[];
              const filled = entries.filter((e) => e.hour || e.minute || e.position);
              if (filled.length === 0) return null;
              return (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-text-light">😴 午睡:</span>
                  {filled.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 pl-2">
                      {(e.hour || e.minute) && (
                        <span className="inline-flex items-center rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                          {e.hour || "--"}:{e.minute || "--"}
                        </span>
                      )}
                      {e.position && (
                        <span className="inline-flex items-center rounded-lg bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                          {e.position}
                        </span>
                      )}
                    </div>
                  ))}
                  {record.nap_memo && (
                    <span className="pl-2 text-xs text-text-light">{record.nap_memo}</span>
                  )}
                </div>
              );
            } catch { return null; }
          })()}
          {record.bowel && record.bowel !== "[]" && record.bowel !== '[{"hour":"","minute":"","condition":""},{"hour":"","minute":"","condition":""},{"hour":"","minute":"","condition":""}]' && (() => {
            try {
              const entries = JSON.parse(record.bowel) as { hour: string; minute: string; condition: string }[];
              const filled = entries.filter((e) => e.hour || e.minute || e.condition);
              if (filled.length === 0) return null;
              return (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-text-light">🚽 排便:</span>
                  {filled.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 pl-2">
                      {(e.hour || e.minute) && (
                        <span className="inline-flex items-center rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                          {e.hour || "--"}:{e.minute || "--"}
                        </span>
                      )}
                      {e.condition && (
                        <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                          e.condition === "普通"
                            ? "bg-green-100 text-green-700"
                            : e.condition === "硬便"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}>
                          {e.condition}
                        </span>
                      )}
                    </div>
                  ))}
                  {record.bowel_memo && (
                    <span className="pl-2 text-xs text-text-light">{record.bowel_memo}</span>
                  )}
                </div>
              );
            } catch { return null; }
          })()}
        </div>
      )}

      {record.memo && (
        <p className="mb-3 rounded-lg bg-accent-light p-2 text-sm">
          {record.memo}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Link
          href={`/children/${record.child_id}/edit/${record.id}`}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-light transition hover:bg-gray-50"
        >
          編集
        </Link>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-light disabled:opacity-50"
        >
          削除
        </button>
      </div>
    </div>
  );
}
