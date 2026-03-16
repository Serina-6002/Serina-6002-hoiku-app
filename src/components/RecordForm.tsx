"use client";

import { useActionState, useState, useEffect } from "react";
import { createRecord, updateRecord } from "@/lib/actions/records";
import type { Record as RecordType, AttendanceType, Child } from "@/lib/types";

type RecordFormProps = {
  child: Child;
  record?: RecordType;
};

const DRAFT_KEY_PREFIX = "hoiku-draft-";

export default function RecordForm({ child, record }: RecordFormProps) {
  const isEdit = !!record;
  const action = isEdit ? updateRecord : createRecord;
  const [state, formAction, isPending] = useActionState(action, null);

  const [attendanceType, setAttendanceType] = useState<AttendanceType>(
    record?.attendance_type ?? "出席"
  );
  const [memo, setMemo] = useState(record?.memo ?? "");
  const [reason, setReason] = useState(record?.reason ?? "");
  const [mood, setMood] = useState(record?.mood ?? "");
  const [moodMemo, setMoodMemo] = useState(record?.mood_memo ?? "");
  const [meal, setMeal] = useState(record?.meal ?? "");
  const [mealMemo, setMealMemo] = useState(record?.meal_memo ?? "");
  const [snack, setSnack] = useState(record?.snack ?? "");
  const [snackMemo, setSnackMemo] = useState(record?.snack_memo ?? "");

  type NapEntry = { hour: string; minute: string; position: string };
  const emptyNapEntries: NapEntry[] = [
    { hour: "", minute: "", position: "" },
    { hour: "", minute: "", position: "" },
    { hour: "", minute: "", position: "" },
  ];
  const parseNapEntries = (raw: string): NapEntry[] => {
    if (!raw) return emptyNapEntries;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) return parsed;
    } catch { /* ignore */ }
    return emptyNapEntries;
  };
  const [napEntries, setNapEntries] = useState<NapEntry[]>(
    parseNapEntries(record?.nap ?? "")
  );
  const [napMemo, setNapMemo] = useState(record?.nap_memo ?? "");

  type BowelEntry = { hour: string; minute: string; condition: string };
  const emptyBowelEntries: BowelEntry[] = [
    { hour: "", minute: "", condition: "" },
    { hour: "", minute: "", condition: "" },
    { hour: "", minute: "", condition: "" },
  ];
  const parseBowelEntries = (raw: string): BowelEntry[] => {
    if (!raw) return emptyBowelEntries;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) return parsed;
    } catch { /* ignore */ }
    return emptyBowelEntries;
  };
  const [bowelEntries, setBowelEntries] = useState<BowelEntry[]>(
    parseBowelEntries(record?.bowel ?? "")
  );
  const [bowelMemo, setBowelMemo] = useState(record?.bowel_memo ?? "");

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});

  const isAbsent = ["欠席", "遅刻", "早退"].includes(attendanceType);

  const validateTime = (key: string, hour: string, minute: string) => {
    if (!hour && !minute) {
      setTimeErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || isNaN(m)) {
      setTimeErrors((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const entryMinutes = h * 60 + m;
    if (entryMinutes > nowMinutes) {
      setTimeErrors((prev) => ({
        ...prev,
        [key]: "現在より先の時間は入力できません",
      }));
    } else {
      setTimeErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const hasTimeErrors = Object.values(timeErrors).some((v) => v !== "");

  const draftKey = DRAFT_KEY_PREFIX + child.id;

  useEffect(() => {
    if (isEdit) return;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.memo) setMemo(draft.memo);
        if (draft.attendanceType) setAttendanceType(draft.attendanceType);
        if (draft.reason) setReason(draft.reason);
      } catch {
        // ignore
      }
    }
  }, [draftKey, isEdit]);

  useEffect(() => {
    if (isEdit) return;
    const timer = setTimeout(() => {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ memo, attendanceType, reason })
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [memo, attendanceType, reason, draftKey, isEdit]);

  useEffect(() => {
    if (state === null && !isPending) return;
    if (!state?.error) {
      localStorage.removeItem(draftKey);
    }
  }, [state, isPending, draftKey]);

  const attendanceOptions: AttendanceType[] = ["出席", "欠席", "遅刻", "早退"];

  const toggleCategory = (name: string) => {
    setOpenCategory((prev) => (prev === name ? null : name));
  };

  const moodOptions = ["良", "普通", "悪"];
  const mealOptions = ["完食", "ほぼ完食", "半分", "ほぼ残し", "食べず"];
  const snackOptions = ["完食", "半分", "食べず"];
  const napPositions = ["うつ伏せ", "横向き", "仰向け"];
  const bowelConditions = ["硬便", "普通", "軟便", "下痢"];

  const updateNapEntry = (index: number, field: keyof NapEntry, value: string) => {
    setNapEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "hour" || field === "minute") {
        const entry = next[index];
        validateTime(`nap-${index}`, entry.hour, entry.minute);
      }
      return next;
    });
  };

  const fillCurrentTime = (index: number) => {
    const now = new Date();
    updateNapEntry(index, "hour", now.getHours().toString().padStart(2, "0"));
    updateNapEntry(index, "minute", now.getMinutes().toString().padStart(2, "0"));
  };

  const napHasData = napEntries.some((e) => e.hour || e.minute || e.position);
  const napJsonValue = JSON.stringify(napEntries);

  const updateBowelEntry = (index: number, field: keyof BowelEntry, value: string) => {
    setBowelEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "hour" || field === "minute") {
        const entry = next[index];
        validateTime(`bowel-${index}`, entry.hour, entry.minute);
      }
      return next;
    });
  };

  const fillCurrentTimeBowel = (index: number) => {
    const now = new Date();
    updateBowelEntry(index, "hour", now.getHours().toString().padStart(2, "0"));
    updateBowelEntry(index, "minute", now.getMinutes().toString().padStart(2, "0"));
  };

  const bowelHasData = bowelEntries.some((e) => e.hour || e.minute || e.condition);
  const bowelJsonValue = JSON.stringify(bowelEntries);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="child_id" value={child.id} />
      {isEdit && <input type="hidden" name="record_id" value={record.id} />}

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-bold text-text-light">出欠区分</p>
        <div className="grid grid-cols-4 gap-2">
          {attendanceOptions.map((opt) => (
            <label
              key={opt}
              className={`cursor-pointer rounded-xl border-2 py-2.5 text-center text-sm font-bold transition ${
                attendanceType === opt
                  ? opt === "出席"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-red-400 bg-red-50 text-red-700"
                  : "border-border bg-white text-text-light hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="attendance_type"
                value={opt}
                checked={attendanceType === opt}
                onChange={() => setAttendanceType(opt)}
                className="sr-only"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      {isAbsent && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="mb-2 block text-sm font-bold text-text-light">
            理由 <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="例: 発熱のため"
            className="w-full rounded-xl border border-border px-4 py-3 text-base transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {!isAbsent && (
        <input type="hidden" name="reason" value="" />
      )}

      {!isAbsent && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-bold text-text-light">記録項目</p>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => toggleCategory("mood")}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                  openCategory === "mood"
                    ? "border-primary bg-primary-light"
                    : mood
                      ? "border-primary/50 bg-primary-light/50"
                      : "border-border bg-white hover:border-primary hover:bg-primary-light"
                }`}
              >
                <span className="text-xl">😊</span>
                <span className="font-medium">体調</span>
                {mood && openCategory !== "mood" && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary-dark">
                    {mood}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleCategory("meal")}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                  openCategory === "meal"
                    ? "border-primary bg-primary-light"
                    : meal
                      ? "border-primary/50 bg-primary-light/50"
                      : "border-border bg-white hover:border-primary hover:bg-primary-light"
                }`}
              >
                <span className="text-xl">🍚</span>
                <span className="font-medium">昼食</span>
                {meal && openCategory !== "meal" && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary-dark">
                    {meal}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleCategory("snack")}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                  openCategory === "snack"
                    ? "border-primary bg-primary-light"
                    : snack
                      ? "border-primary/50 bg-primary-light/50"
                      : "border-border bg-white hover:border-primary hover:bg-primary-light"
                }`}
              >
                <span className="text-xl">🍪</span>
                <span className="font-medium">おやつ</span>
                {snack && openCategory !== "snack" && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary-dark">
                    {snack}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleCategory("nap")}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                  openCategory === "nap"
                    ? "border-primary bg-primary-light"
                    : napHasData
                      ? "border-primary/50 bg-primary-light/50"
                      : "border-border bg-white hover:border-primary hover:bg-primary-light"
                }`}
              >
                <span className="text-xl">😴</span>
                <span className="font-medium">午睡</span>
                {napHasData && openCategory !== "nap" && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary-dark">
                    記録あり
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleCategory("bowel")}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${
                  openCategory === "bowel"
                    ? "border-primary bg-primary-light"
                    : bowelHasData
                      ? "border-primary/50 bg-primary-light/50"
                      : "border-border bg-white hover:border-primary hover:bg-primary-light"
                }`}
              >
                <span className="text-xl">🚽</span>
                <span className="font-medium">排便</span>
                {bowelHasData && openCategory !== "bowel" && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary-dark">
                    記録あり
                  </span>
                )}
              </button>
            </div>

            {openCategory === "mood" && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary-light/30 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {moodOptions.map((opt) => (
                    <label
                      key={opt}
                      className={`cursor-pointer rounded-xl border-2 py-2.5 text-center text-sm font-bold transition ${
                        mood === opt
                          ? opt === "良"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : opt === "普通"
                              ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                              : "border-red-400 bg-red-50 text-red-700"
                          : "border-border bg-white text-text-light hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="mood"
                        value={opt}
                        checked={mood === opt}
                        onChange={() => setMood(opt)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  name="mood_memo"
                  value={moodMemo}
                  onChange={(e) => setMoodMemo(e.target.value)}
                  placeholder="体調メモ（自由記入）"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
            {openCategory !== "mood" && (
              <>
                <input type="hidden" name="mood" value={mood} />
                <input type="hidden" name="mood_memo" value={moodMemo} />
              </>
            )}

            {openCategory === "meal" && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary-light/30 p-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {mealOptions.map((opt) => {
                    const activeColor =
                      opt === "完食" || opt === "ほぼ完食"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : opt === "半分"
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                          : "border-red-400 bg-red-50 text-red-700";
                    return (
                    <label
                      key={opt}
                      className={`cursor-pointer rounded-xl border-2 py-2.5 text-center text-sm font-bold transition ${
                        meal === opt
                          ? activeColor
                          : "border-border bg-white text-text-light hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="meal"
                        value={opt}
                        checked={meal === opt}
                        onChange={() => setMeal(opt)}
                        className="sr-only"
                      />
                      {opt}
                    </label>
                    );
                  })}
                </div>
                <input
                  type="text"
                  name="meal_memo"
                  value={mealMemo}
                  onChange={(e) => setMealMemo(e.target.value)}
                  placeholder="昼食メモ（自由記入）"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
            {openCategory !== "meal" && (
              <>
                <input type="hidden" name="meal" value={meal} />
                <input type="hidden" name="meal_memo" value={mealMemo} />
              </>
            )}

            {openCategory === "snack" && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary-light/30 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {snackOptions.map((opt) => {
                    const activeColor =
                      opt === "完食"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : opt === "半分"
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                          : "border-red-400 bg-red-50 text-red-700";
                    return (
                      <label
                        key={opt}
                        className={`cursor-pointer rounded-xl border-2 py-2.5 text-center text-sm font-bold transition ${
                          snack === opt
                            ? activeColor
                            : "border-border bg-white text-text-light hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="snack"
                          value={opt}
                          checked={snack === opt}
                          onChange={() => setSnack(opt)}
                          className="sr-only"
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
                <input
                  type="text"
                  name="snack_memo"
                  value={snackMemo}
                  onChange={(e) => setSnackMemo(e.target.value)}
                  placeholder="おやつメモ（自由記入）"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
            {openCategory !== "snack" && (
              <>
                <input type="hidden" name="snack" value={snack} />
                <input type="hidden" name="snack_memo" value={snackMemo} />
              </>
            )}

            {openCategory === "nap" && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary-light/30 p-3">
                {napEntries.map((entry, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-text-light w-4">{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => fillCurrentTime(i)}
                      className="rounded-lg bg-white border border-border px-2 py-1.5 text-lg transition hover:bg-primary-light"
                      title="現在時刻を入力"
                    >
                      🕛
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={entry.hour}
                      onChange={(e) => updateNapEntry(i, "hour", e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="HH"
                      className="w-12 rounded-lg border border-border bg-white px-2 py-1.5 text-center text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="font-bold text-text-light">:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={entry.minute}
                      onChange={(e) => updateNapEntry(i, "minute", e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="MM"
                      className="w-12 rounded-lg border border-border bg-white px-2 py-1.5 text-center text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex gap-1">
                      {napPositions.map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => updateNapEntry(i, "position", entry.position === pos ? "" : pos)}
                          className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition ${
                            entry.position === pos
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white text-text-light hover:border-gray-300"
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                    {timeErrors[`nap-${i}`] && (
                      <p className="w-full text-xs font-medium text-danger">{timeErrors[`nap-${i}`]}</p>
                    )}
                  </div>
                ))}
                <input
                  type="text"
                  name="nap_memo"
                  value={napMemo}
                  onChange={(e) => setNapMemo(e.target.value)}
                  placeholder="午睡メモ（自由記入）"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input type="hidden" name="nap" value={napJsonValue} />
              </div>
            )}
            {openCategory !== "nap" && (
              <>
                <input type="hidden" name="nap" value={napJsonValue} />
                <input type="hidden" name="nap_memo" value={napMemo} />
              </>
            )}

            {openCategory === "bowel" && (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary-light/30 p-3">
                {bowelEntries.map((entry, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-text-light w-4">{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => fillCurrentTimeBowel(i)}
                      className="rounded-lg bg-white border border-border px-2 py-1.5 text-lg transition hover:bg-primary-light"
                      title="現在時刻を入力"
                    >
                      🕛
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={entry.hour}
                      onChange={(e) => updateBowelEntry(i, "hour", e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="HH"
                      className="w-12 rounded-lg border border-border bg-white px-2 py-1.5 text-center text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="font-bold text-text-light">:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={entry.minute}
                      onChange={(e) => updateBowelEntry(i, "minute", e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="MM"
                      className="w-12 rounded-lg border border-border bg-white px-2 py-1.5 text-center text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex gap-1">
                      {bowelConditions.map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => updateBowelEntry(i, "condition", entry.condition === cond ? "" : cond)}
                          className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition ${
                            entry.condition === cond
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white text-text-light hover:border-gray-300"
                          }`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                    {timeErrors[`bowel-${i}`] && (
                      <p className="w-full text-xs font-medium text-danger">{timeErrors[`bowel-${i}`]}</p>
                    )}
                  </div>
                ))}
                <input
                  type="text"
                  name="bowel_memo"
                  value={bowelMemo}
                  onChange={(e) => setBowelMemo(e.target.value)}
                  placeholder="排便メモ（自由記入）"
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input type="hidden" name="bowel" value={bowelJsonValue} />
              </div>
            )}
            {openCategory !== "bowel" && (
              <>
                <input type="hidden" name="bowel" value={bowelJsonValue} />
                <input type="hidden" name="bowel_memo" value={bowelMemo} />
              </>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <label className="mb-2 block text-sm font-bold text-text-light">
          メモ（任意）
        </label>
        <textarea
          name="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="気づいたことがあれば..."
          rows={3}
          className="w-full resize-none rounded-xl border border-border px-4 py-3 text-base transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {state?.error && (
        <div className="rounded-xl bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </div>
      )}

      {hasTimeErrors && (
        <div className="rounded-xl bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          現在より先の時間が入力されています。修正してください。
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || hasTimeErrors}
          className="flex-1 rounded-xl bg-sky-400 py-3.5 text-base font-bold text-white transition hover:bg-sky-300 disabled:opacity-50"
        >
          {isPending ? "保存中..." : isEdit ? "更新する" : "保存する"}
        </button>
      </div>
    </form>
  );
}
