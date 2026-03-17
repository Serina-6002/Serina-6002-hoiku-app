"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AttendanceBadge from "./AttendanceBadge";
import { deleteRecord } from "@/lib/actions/records";
import type { Record as RecordType, AttendanceType } from "@/lib/types";

type RecordCardProps = {
  record: RecordType;
  compact?: boolean;
  summaryText?: string;
};

export default function RecordCard({ record, compact = false, summaryText }: RecordCardProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAbsent = ["欠席", "遅刻", "早退"].includes(record.attendance_type);

  const handleDeleteClick = () => setShowConfirm(true);
  const handleCancel = () => {
    setShowConfirm(false);
    setError(null);
  };
  const handleConfirmDelete = async () => {
    setIsPending(true);
    setError(null);
    const result = await deleteRecord(record.id, record.child_id);
    setIsPending(false);
    setShowConfirm(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setDeleted(true);
  };

  useEffect(() => {
    if (!deleted) return;
    const timer = setTimeout(() => router.refresh(), 2000);
    return () => clearTimeout(timer);
  }, [deleted, router]);

  const date = new Date(record.created_at);
  const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  if (deleted) {
    return (
      <div className="rounded-2xl border border-border bg-green-100 p-4">
        <p className="text-sm font-medium text-green-700">削除しました</p>
      </div>
    );
  }

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

      {!compact && record.attendance_type !== "欠席" && (
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
          {record.nap && record.nap !== "[]" && (() => {
            try {
              const entries = JSON.parse(record.nap) as { hour: string; minute: string; endHour: string; endMinute: string; position: string }[];
              const filled = entries.filter((e) => e.hour || e.minute || e.endHour || e.endMinute || e.position);
              if (filled.length === 0) return null;
              return (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-text-light">😴 午睡:</span>
                  {filled.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 pl-2">
                      {(e.hour || e.minute || e.endHour || e.endMinute) && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                          <span>🕛{e.hour || "--"}:{e.minute || "--"}～🕛{e.endHour || "--"}:{e.endMinute || "--"}</span>
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

      {summaryText && (
        <div className="mb-3 rounded-lg bg-accent-light p-2">
          <p className="mb-1 text-xs font-bold text-accent">AIまとめ</p>
          <p className="text-sm leading-relaxed">{summaryText}</p>
        </div>
      )}

      {record.memo && (
        <p className="mb-3 rounded-lg bg-accent-light p-2 text-sm">
          {record.memo}
        </p>
      )}

      {error && (
        <div className="mb-3 rounded-xl bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          削除に失敗しました
        </div>
      )}

      {showConfirm ? (
        <div className="mt-3 rounded-xl border border-border bg-gray-50 p-3">
          <p className="mb-3 text-sm font-medium">本当に削除しますか？</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white transition hover:bg-danger/90 disabled:opacity-50"
            >
              {isPending ? "削除中..." : "削除"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-gray-100 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Link
            href={`/children/${record.child_id}/edit/${record.id}`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-light transition hover:bg-gray-50"
          >
            編集
          </Link>
          <button
            onClick={handleDeleteClick}
            disabled={isPending}
            className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-light disabled:opacity-50"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
