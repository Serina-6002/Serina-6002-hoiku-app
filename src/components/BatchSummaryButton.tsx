"use client";

import { useState, useEffect } from "react";
import { batchGenerateDailySummaries } from "@/lib/actions/ai";

const ENCOURAGING_MESSAGES = [
  "子どもたちの笑顔は、あなたの日々の積み重ねの証です。",
  "毎日の小さな気づきが、子どもたちの成長につながっています。",
  "子どもたちにとって、あなたはかけがえのない存在です。",
  "あなたの優しさが、子どもたちの安心につながっています。",
  "子どもたちの「できた」を支えるあなたの存在、本当にありがたいです。",
  "忙しい中でも一人ひとりに向き合う、その心遣いが伝わります。",
  "あなたの見守りがあるから、子どもたちは安心して過ごせています。",
  "毎日コツコツと記録を残すその積み重ね、きっと誰かの支えになっています。",
  "子どもたちの「楽しかった」が、あなたの愛情の証です。",
  "一人で抱え込まなくて大丈夫。あなたは十分に頑張っています。",
  "子どもたちの「また明日ね」が、あなたへの信頼の表れです。",
  "完璧じゃなくて大丈夫。今日もよく頑張りました。",
  "子どもたちの笑い声が、あなたの仕事の成果です。",
  "無理をしすぎないで。あなたの心の余裕が、子どもたちにも届きます。",
  "「ありがとう」と言われなくても、あなたの存在は確かに届いています。",
];

type Props = {
  targetCount: number;
  unenteredCount: number;
};

export default function BatchSummaryButton({ targetCount, unenteredCount }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);

  async function handleClick() {
    if (unenteredCount > 0 || loading) return;
    setLoading(true);
    setMessage("");
    setOverlayMessage(
      ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)]
    );

    const result = await batchGenerateDailySummaries();
    setLoading(false);
    setOverlayMessage(null);

    if ("error" in result) {
      setMessage(result.error);
      return;
    }
    setMessage("今日も一日お疲れさまでした 🌷");
  }

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={loading || unenteredCount > 0}
            className="rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-500 transition hover:bg-violet-100 disabled:opacity-50"
          >
            {loading ? "生成中..." : "今日のまとめ"}
          </button>
        </div>
        {message && (
          <p className="text-sm text-text-light">{message}</p>
        )}
      </div>

      {loading && overlayMessage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-pink-100/90 px-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold leading-relaxed text-gray-800">
              {overlayMessage}
            </p>
            <p className="text-sm text-gray-600">
              今日も一日お疲れさまでした 🌷
            </p>
            <p className="text-xs text-gray-600/80">
              完了後はトップに戻ります・・・
            </p>
          </div>
        </div>
      )}
    </>
  );
}
