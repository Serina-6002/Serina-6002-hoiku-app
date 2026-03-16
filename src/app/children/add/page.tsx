"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { addChild } from "@/lib/actions/children";

export default function AddChildPage() {
  const [state, formAction, isPending] = useActionState(addChild, null);
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-sky-400 to-violet-400 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
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
            <span className="text-lg font-bold">園児追加</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <form action={formAction} className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-4">
            <label className="mb-2 block text-sm font-bold text-text-light">
              名前 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="例: 田中 優太"
              className="w-full rounded-xl border border-border px-4 py-3 text-base transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <label className="mb-2 block text-sm font-bold text-text-light">
              名前（ひらがな） <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name_kana"
              required
              placeholder="例: たなか ゆうた"
              className="w-full rounded-xl border border-border px-4 py-3 text-base transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <label className="mb-2 block text-sm font-bold text-text-light">
              生年月日 <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              name="birth_date"
              required
              className="w-full rounded-xl border border-border px-4 py-3 text-base transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {state?.error && (
            <div className="rounded-xl bg-danger-light px-4 py-3 text-sm font-medium text-danger">
              {state.error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 rounded-xl border-2 border-border py-3.5 text-base font-bold text-text-light transition hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-sky-400 py-3.5 text-base font-bold text-white transition hover:bg-sky-300 disabled:opacity-50"
            >
              {isPending ? "追加中..." : "園児を追加"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
