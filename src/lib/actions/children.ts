"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffName } from "./auth";

export async function addChild(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const staffName = await getStaffName();
  if (!staffName) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const nameKana = (formData.get("name_kana") as string)?.trim();
  const birthDate = formData.get("birth_date") as string;

  if (!name) return { error: "名前を入力してください" };
  if (!nameKana) return { error: "ひらがな名を入力してください" };
  if (!birthDate) return { error: "生年月日を入力してください" };

  const supabase = await createClient();

  const id = crypto.randomUUID();

  const { error } = await supabase.from("children").insert({
    id,
    name,
    name_kana: nameKana,
    birth_date: birthDate,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "この園児は既に登録されています" };
    }
    return { error: "追加に失敗しました: " + error.message };
  }

  revalidatePath("/");
  redirect("/");
}
