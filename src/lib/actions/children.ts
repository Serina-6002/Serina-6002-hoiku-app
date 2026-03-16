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

  const { data: existing } = await supabase
    .from("children")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  let nextId = "c1";
  if (existing && existing.length > 0) {
    const lastNum = parseInt(existing[0].id.replace("c", ""), 10);
    nextId = `c${lastNum + 1}`;
  }

  const { error } = await supabase.from("children").insert({
    id: nextId,
    name,
    name_kana: nameKana,
    birth_date: birthDate,
  });

  if (error) {
    return { error: "追加に失敗しました: " + error.message };
  }

  revalidatePath("/");
  redirect("/");
}
