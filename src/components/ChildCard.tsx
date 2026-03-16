import Link from "next/link";
import type { Child } from "@/lib/types";

type ChildCardProps = {
  child: Child;
};

const avatarColors = [
  "bg-sky-100 text-sky-500",
  "bg-violet-100 text-violet-500",
  "bg-indigo-100 text-indigo-500",
  "bg-cyan-100 text-cyan-500",
  "bg-purple-100 text-purple-400",
  "bg-sky-50 text-sky-400",
  "bg-violet-50 text-violet-400",
  "bg-indigo-50 text-indigo-400",
];

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function ChildCard({ child }: ChildCardProps) {
  const colorIndex =
    child.id.charCodeAt(child.id.length - 1) % avatarColors.length;
  const initial = child.name_kana.charAt(0);
  const age = getAge(child.birth_date);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${avatarColors[colorIndex]}`}
        >
          {initial}
        </div>
        <div className="flex-1">
          <p className="text-base font-bold">{child.name}</p>
          <p className="text-sm text-text-light">
            {child.name_kana} / {age}歳
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          href={`/children/${child.id}/new`}
          className="flex-1 rounded-xl bg-sky-500 py-2.5 text-center text-sm font-bold text-white transition hover:bg-sky-300"
        >
          記録入力
        </Link>
        <Link
          href={`/children/${child.id}/records`}
          className="flex-1 rounded-xl border-2 border-violet-300 bg-violet-100 py-2.5 text-center text-sm font-bold text-violet-500 transition hover:bg-violet-50"
        >
          記録一覧
        </Link>
      </div>
    </div>
  );
}
