"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-violet-100">
            <span className="text-4xl">📝</span>
          </div>
          <h1 className="text-2xl font-bold text-text">保育メモ</h1>
          <p className="mt-1 text-sm text-text-light">
            パスワードを入力してログイン
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-text-light"
            >
              パスワード（8桁）
            </label>
            <input
              id="password"
              type="password"
              name="password"
              maxLength={8}
              minLength={8}
              required
              autoFocus
              placeholder="8桁のパスワード"
              className="w-full rounded-xl border border-border px-4 py-3.5 text-center text-lg tracking-widest transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {state?.error && (
            <div className="rounded-xl bg-danger-light px-4 py-3 text-center text-sm font-medium text-danger">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-yellow-100/40 py-3.5 text-base font-bold text-gray-500 transition hover:bg-yellow-100/70 disabled:opacity-50"
          >
            {isPending ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
