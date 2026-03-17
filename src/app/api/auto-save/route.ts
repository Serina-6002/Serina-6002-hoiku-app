import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaffName } from "@/lib/actions/auth";

export async function POST(request: Request) {
  const staffName = await getStaffName();
  if (!staffName) {
    return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  }

  const { recordId, data } = await request.json();
  if (!recordId || !data) {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
