"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/actions/auth";

type HeaderProps = {
  staffName: string;
  title?: string;
  backHref?: string;
  saveBeforeBack?: boolean;
};

export default function Header({ staffName, title, backHref, saveBeforeBack }: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (saveBeforeBack) {
      window.dispatchEvent(new CustomEvent("save-before-navigate", { detail: { backHref } }));
    } else {
      router.push(backHref!);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-sky-400 to-violet-400 text-white shadow-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {backHref && (
            <button
              onClick={handleBack}
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
            </button>
          )}
          <Link href="/" className="text-lg font-bold">
            {title ?? "保育メモ"}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90">{staffName}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium transition hover:bg-white/30"
            >
              ログアウト
            </button>
          </form>
          <Link
            href="/"
            className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium transition hover:bg-white/30"
          >
            園児一覧
          </Link>
        </div>
      </div>
    </header>
  );
}
