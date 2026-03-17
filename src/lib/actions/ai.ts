"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getStaffName } from "./auth";
import type { Record as RecordType, DailySummary } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateDailySummary(
  childName: string,
  records: RecordType[]
): Promise<{ summary: string } | { error: string }> {
  if (records.length === 0) {
    return { error: "今日の記録がありません" };
  }

  const formatNap = (nap: string) => {
    if (!nap) return "";
    try {
      const entries = JSON.parse(nap) as { hour: string; minute: string; endHour?: string; endMinute?: string; position: string }[];
      const filled = entries.filter((e) => e.hour || e.minute || e.endHour || e.endMinute || e.position);
      if (filled.length === 0) return "";
      return filled.map((e) => {
        const start = (e.hour || "--") + ":" + (e.minute || "--");
        const end = (e.endHour || "--") + ":" + (e.endMinute || "--");
        return `🕛${start}～🕛${end}${e.position ? ` ${e.position}` : ""}`;
      }).join("、");
    } catch { return nap; }
  };

  const recordLines = records.map((r, i) => {
    const parts: string[] = [];
    if (r.attendance_type) parts.push(`出欠: ${r.attendance_type}`);
    if (r.reason) parts.push(`理由: ${r.reason}`);
    if (r.meal) parts.push(`ごはん: ${r.meal}`);
    if (r.meal_memo) parts.push(`ごはんメモ: ${r.meal_memo}`);
    if (r.snack) parts.push(`おやつ: ${r.snack}`);
    if (r.snack_memo) parts.push(`おやつメモ: ${r.snack_memo}`);
    if (r.nap) parts.push(`午睡: ${formatNap(r.nap)}`);
    if (r.nap_memo) parts.push(`午睡メモ: ${r.nap_memo}`);
    if (r.bowel) parts.push(`排便: ${r.bowel}`);
    if (r.bowel_memo) parts.push(`排便メモ: ${r.bowel_memo}`);
    if (r.mood) parts.push(`機嫌: ${r.mood}`);
    if (r.mood_memo) parts.push(`機嫌メモ: ${r.mood_memo}`);
    if (r.memo) parts.push(`メモ: ${r.memo}`);
    return `記録${i + 1}: ${parts.join("、")}`;
  });

  const prompt = `以下は「${childName}」さんの今日の保育記録データです。
この記録を、保育記録の1日の要約として100〜150文字程度にまとめてください。

条件:
- 事実ベースで簡潔にまとめること
- 「〜した」「〜だった」の記録文体を使うこと
- 保護者への語りかけや感情表現は使わないこと
- 「明日も楽しみ」「お疲れ様」などの連絡帳的な表現は禁止
- 子どもの名前は「${childName}さん」と表記すること
- 箇条書きではなく、自然な文章にすること

${recordLines.join("\n")}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    if (!summary) {
      return { error: "AIからの応答が空でした" };
    }
    return { summary };
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI生成に失敗しました";
    return { error: message };
  }
}

export async function saveDailySummary(
  childId: string,
  date: string,
  summaryText: string
): Promise<{ success: true } | { error: string }> {
  const staffName = await getStaffName();
  if (!staffName) {
    return { error: "ログインしていません" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("daily_summaries").upsert(
    {
      child_id: childId,
      date,
      summary_text: summaryText,
      created_by: staffName,
    },
    { onConflict: "child_id,date" }
  );

  if (error) {
    return { error: "保存に失敗しました: " + error.message };
  }
  return { success: true };
}

const VALID_ATTENDANCE = ["出席", "欠席", "遅刻", "早退"] as const;

export async function batchGenerateDailySummaries(): Promise<
  { generated: number } | { error: string }
> {
  const staffName = await getStaffName();
  if (!staffName) return { error: "ログインしていません" };

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [childrenResult, recordsResult] = await Promise.all([
    supabase.from("children").select("id, name").order("id"),
    supabase
      .from("records")
      .select("*")
      .eq("date", today)
      .order("created_at", { ascending: false }),
  ]);

  const children = (childrenResult.data as { id: string; name: string }[]) ?? [];
  const records = (recordsResult.data as RecordType[]) ?? [];

  const latestRecordByChild = new Map<string, RecordType>();
  for (const r of records) {
    if (!latestRecordByChild.has(r.child_id)) {
      latestRecordByChild.set(r.child_id, r);
    }
  }

  let generated = 0;
  for (const child of children) {
    const record = latestRecordByChild.get(child.id);
    const att = record?.attendance_type;
    const isValid = att && typeof att === "string" && VALID_ATTENDANCE.includes(att as (typeof VALID_ATTENDANCE)[number]);
    if (!record || !isValid) continue;

    const childRecords = records.filter((r) => r.child_id === child.id);
    const result = await generateDailySummary(child.name, childRecords);
    if ("error" in result) continue;

    const saveResult = await saveDailySummary(child.id, today, result.summary);
    if ("error" in saveResult) continue;
    generated++;
  }

  return { generated };
}

export async function getDailySummary(
  childId: string,
  date: string
): Promise<DailySummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("child_id", childId)
    .eq("date", date)
    .single();

  return (data as DailySummary) ?? null;
}
