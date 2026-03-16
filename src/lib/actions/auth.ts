"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const password = formData.get("password") as string;

  if (!password || password.length !== 8) {
    return { error: "8桁のパスワードを入力してください" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("name")
    .eq("password", password)
    .single();

  if (error || !data) {
    return { error: "パスワードが正しくありません" };
  }

  const cookieStore = await cookies();
  cookieStore.set("staff_name", data.name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("staff_name");
  redirect("/login");
}

export async function getStaffName(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("staff_name")?.value ?? null;
}
