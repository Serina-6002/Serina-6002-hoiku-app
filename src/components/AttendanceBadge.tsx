import type { AttendanceType } from "@/lib/types";

const badgeStyles: Record<AttendanceType, string> = {
  出席: "bg-green-100 text-green-700",
  欠席: "bg-red-100 text-red-700",
  遅刻: "bg-yellow-100 text-yellow-700",
  早退: "bg-orange-100 text-orange-700",
};

export default function AttendanceBadge({ type }: { type: AttendanceType }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${badgeStyles[type]}`}
    >
      {type}
    </span>
  );
}
