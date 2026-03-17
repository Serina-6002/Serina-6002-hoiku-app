"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffName } from "./auth";

export async function createRecord(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const staffName = await getStaffName();
  if (!staffName) redirect("/login");

  const childId = formData.get("child_id") as string;
  const attendanceType = formData.get("attendance_type") as string;
  const reason = formData.get("reason") as string;
  const memo = formData.get("memo") as string;

  if (
    ["欠席", "遅刻", "早退"].includes(attendanceType) &&
    !reason.trim()
  ) {
    return { error: "欠席・遅刻・早退の場合は理由を入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("records").insert({
    child_id: childId,
    staff_name: staffName,
    date: new Date().toISOString().split("T")[0],
    attendance_type: attendanceType,
    reason: reason || "",
    meal: (formData.get("meal") as string) || "",
    meal_memo: (formData.get("meal_memo") as string) || "",
    snack: (formData.get("snack") as string) || "",
    snack_memo: (formData.get("snack_memo") as string) || "",
    nap: (formData.get("nap") as string) || "",
    nap_memo: (formData.get("nap_memo") as string) || "",
    bowel: (formData.get("bowel") as string) || "",
    bowel_memo: (formData.get("bowel_memo") as string) || "",
    mood: (formData.get("mood") as string) || "",
    mood_memo: (formData.get("mood_memo") as string) || "",
    memo: memo || "",
  });

  if (error) {
    return { error: "保存に失敗しました: " + error.message };
  }

  revalidatePath(`/children/${childId}/records`);
  return { success: true };
}

export async function createRecordForBack(data: {
  child_id: string;
  attendance_type: string;
  reason: string;
  meal: string;
  meal_memo: string;
  snack: string;
  snack_memo: string;
  nap: string;
  nap_memo: string;
  bowel: string;
  bowel_memo: string;
  mood: string;
  mood_memo: string;
  memo: string;
}): Promise<{ success: true } | { error: string }> {
  const staffName = await getStaffName();
  if (!staffName) return { error: "未ログイン" };

  if (
    ["欠席", "遅刻", "早退"].includes(data.attendance_type) &&
    !(data.reason || "").trim()
  ) {
    return { error: "欠席・遅刻・早退の場合は理由を入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("records").insert({
    child_id: data.child_id,
    staff_name: staffName,
    date: new Date().toISOString().split("T")[0],
    attendance_type: data.attendance_type,
    reason: data.reason || "",
    meal: data.meal || "",
    meal_memo: data.meal_memo || "",
    snack: data.snack || "",
    snack_memo: data.snack_memo || "",
    nap: data.nap || "",
    nap_memo: data.nap_memo || "",
    bowel: data.bowel || "",
    bowel_memo: data.bowel_memo || "",
    mood: data.mood || "",
    mood_memo: data.mood_memo || "",
    memo: data.memo || "",
  });

  if (error) return { error: "保存に失敗しました: " + error.message };
  revalidatePath(`/children/${data.child_id}/records`);
  return { success: true };
}

export async function updateRecord(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const staffName = await getStaffName();
  if (!staffName) redirect("/login");

  const recordId = formData.get("record_id") as string;
  const childId = formData.get("child_id") as string;
  const attendanceType = formData.get("attendance_type") as string;
  const reason = formData.get("reason") as string;
  const memo = formData.get("memo") as string;

  if (
    ["欠席", "遅刻", "早退"].includes(attendanceType) &&
    !reason.trim()
  ) {
    return { error: "欠席・遅刻・早退の場合は理由を入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("records")
    .update({
      attendance_type: attendanceType,
      reason: reason || "",
      meal: (formData.get("meal") as string) || "",
      meal_memo: (formData.get("meal_memo") as string) || "",
      snack: (formData.get("snack") as string) || "",
      snack_memo: (formData.get("snack_memo") as string) || "",
      nap: (formData.get("nap") as string) || "",
      nap_memo: (formData.get("nap_memo") as string) || "",
      bowel: (formData.get("bowel") as string) || "",
      bowel_memo: (formData.get("bowel_memo") as string) || "",
      mood: (formData.get("mood") as string) || "",
      mood_memo: (formData.get("mood_memo") as string) || "",
      memo: memo || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId);

  if (error) {
    return { error: "更新に失敗しました: " + error.message };
  }

  revalidatePath(`/children/${childId}/records`);
  return { success: true };
}

export async function autoSaveRecord(
  recordId: string,
  data: {
    child_id: string;
    attendance_type: string;
    reason: string;
    meal: string;
    meal_memo: string;
    snack: string;
    snack_memo: string;
    nap: string;
    nap_memo: string;
    bowel: string;
    bowel_memo: string;
    mood: string;
    mood_memo: string;
    memo: string;
  }
): Promise<{ success: true } | { error: string }> {
  const staffName = await getStaffName();
  if (!staffName) return { error: "未ログイン" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("records")
    .update({
      attendance_type: data.attendance_type,
      reason: data.reason,
      meal: data.meal,
      meal_memo: data.meal_memo,
      snack: data.snack,
      snack_memo: data.snack_memo,
      nap: data.nap,
      nap_memo: data.nap_memo,
      bowel: data.bowel,
      bowel_memo: data.bowel_memo,
      mood: data.mood,
      mood_memo: data.mood_memo,
      memo: data.memo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteRecord(
  recordId: string,
  childId: string
): Promise<{ success: true } | { error: string }> {
  const staffName = await getStaffName();
  if (!staffName) return { error: "未ログイン" };

  const supabase = await createClient();
  const { error } = await supabase.from("records").delete().eq("id", recordId);

  if (error) return { error: "削除に失敗しました" };

  revalidatePath(`/children/${childId}/records`);
  return { success: true };
}
