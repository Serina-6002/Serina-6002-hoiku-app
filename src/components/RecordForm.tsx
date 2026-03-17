"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createRecord, updateRecord, autoSaveRecord, createRecordForBack } from "@/lib/actions/records";
import type { Record as RecordType, AttendanceType, Child } from "@/lib/types";

type RecordFormProps = {
  child: Child;
  record?: RecordType;
};

const DRAFT_KEY_PREFIX = "hoiku-draft-";

type FormDataShape = {
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
};

export default function RecordForm({ child, record }: RecordFormProps) {
  const router = useRouter();
  const isEdit = !!record;
  const action = isEdit ? updateRecord : createRecord;
  const [state, formAction, isPending] = useActionState(action, null);
  const [backSaveError, setBackSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [attendanceType, setAttendanceType] = useState<AttendanceType | "">(
    record?.attendance_type ?? ""
  );
  const [memo, setMemo] = useState(record?.memo ?? "");
  const [reason, setReason] = useState(record?.reason ?? "");
  const [mood, setMood] = useState(record?.mood ?? "");
  const [moodMemo, setMoodMemo] = useState(record?.mood_memo ?? "");
  const [meal, setMeal] = useState(record?.meal ?? "");
  const [mealMemo, setMealMemo] = useState(record?.meal_memo ?? "");
  const [snack, setSnack] = useState(record?.snack ?? "");
  const [snackMemo, setSnackMemo] = useState(record?.snack_memo ?? "");

  type NapEntry = { hour: string; minute: string; endHour: string; endMinute: string; position: string };
  const emptyNapEntries: NapEntry[] = [
    { hour: "", minute: "", endHour: "", endMinute: "", position: "" },
    { hour: "", minute: "", endHour: "", endMinute: "", position: "" },
    { hour: "", minute: "", endHour: "", endMinute: "", position: "" },
  ];
  const parseNapEntries = (raw: string): NapEntry[] => {
    if (!raw) return emptyNapEntries;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) {
        return parsed.map((p: unknown) => {
          const e = p as Record<string, string>;
          return {
            hour: e.hour ?? "",
            minute: e.minute ?? "",
            endHour: e.endHour ?? "",
            endMinute: e.endMinute ?? "",
            position: e.position ?? "",
          };
        });
      }
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
      if (Array.isArray(parsed) && parsed.length === 3) {
        return parsed.map((p: unknown) => {
          const e = p as Record<string, string>;
          return {
            hour: e.hour ?? "",
            minute: e.minute ?? "",
            condition: e.condition ?? "",
          };
        });
      }
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

  useEffect(() => {
    if (state?.success) {
      setSuccessMessage(isEdit ? "更新しました" : "保存しました");
    }
  }, [state, isEdit]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000);
    return () => clearTimeout(timer);
  }, [successMessage, router]);

  const attendanceOptions: AttendanceType[] = ["出席", "欠席", "遅刻", "早退"];
  const isValidAttendance = (v: string): v is AttendanceType =>
    attendanceOptions.includes(v as AttendanceType);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!attendanceType || !isValidAttendance(attendanceType)) {
      e.preventDefault();
      setAttendanceError("出欠区分を選択してください");
      return;
    }
    setAttendanceError(null);
  };

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
      if (field === "endHour" || field === "endMinute") {
        const entry = next[index];
        validateTime(`nap-end-${index}`, entry.endHour, entry.endMinute);
      }
      return next;
    });
  };

  const fillCurrentTime = (index: number) => {
    const now = new Date();
    updateNapEntry(index, "endHour", now.getHours().toString().padStart(2, "0"));
    updateNapEntry(index, "endMinute", now.getMinutes().toString().padStart(2, "0"));
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

  const toData = (): FormDataShape => ({
    child_id: child.id,
    attendance_type: attendanceType,
    reason,
    meal, meal_memo: mealMemo, snack, snack_memo: snackMemo,
    nap: napJsonValue, nap_memo: napMemo,
    bowel: bowelJsonValue, bowel_memo: bowelMemo,
    mood, mood_memo: moodMemo, memo,
  });

  const initialDataRef = useRef<FormDataShape | null>(null);
  if (initialDataRef.current === null) {
    initialDataRef.current = record
      ? {
          child_id: child.id,
          attendance_type: record.attendance_type ?? "出席",
          reason: record.reason ?? "",
          meal: record.meal ?? "",
          meal_memo: record.meal_memo ?? "",
          snack: record.snack ?? "",
          snack_memo: record.snack_memo ?? "",
          nap: record.nap ?? "",
          nap_memo: record.nap_memo ?? "",
          bowel: record.bowel ?? "",
          bowel_memo: record.bowel_memo ?? "",
          mood: record.mood ?? "",
          mood_memo: record.mood_memo ?? "",
          memo: record.memo ?? "",
        }
      : toData();
  }

  const hasChanges = () => {
    const cur = toData();
    const init = initialDataRef.current!;
    return (
      cur.attendance_type !== init.attendance_type ||
      cur.reason !== init.reason ||
      cur.meal !== init.meal ||
      cur.meal_memo !== init.meal_memo ||
      cur.snack !== init.snack ||
      cur.snack_memo !== init.snack_memo ||
      cur.nap !== init.nap ||
      cur.nap_memo !== init.nap_memo ||
      cur.bowel !== init.bowel ||
      cur.bowel_memo !== init.bowel_memo ||
      cur.mood !== init.mood ||
      cur.mood_memo !== init.mood_memo ||
      cur.memo !== init.memo
    );
  };

  const didMount = useRef(false);
  const isDirty = useRef(false);
  const recordRef = useRef(record);
  recordRef.current = record;
  const currentData = useRef({
    child_id: child.id, attendance_type: attendanceType, reason,
    meal, meal_memo: mealMemo, snack, snack_memo: snackMemo,
    nap: napJsonValue, nap_memo: napMemo,
    bowel: bowelJsonValue, bowel_memo: bowelMemo,
    mood, mood_memo: moodMemo, memo,
  });
  currentData.current = {
    child_id: child.id, attendance_type: attendanceType, reason,
    meal, meal_memo: mealMemo, snack, snack_memo: snackMemo,
    nap: napJsonValue, nap_memo: napMemo,
    bowel: bowelJsonValue, bowel_memo: bowelMemo,
    mood, mood_memo: moodMemo, memo,
  };

  useEffect(() => {
    if (!isEdit || !record) return;
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    isDirty.current = true;
    const timer = setTimeout(() => {
      autoSaveRecord(record.id, currentData.current).then(() => {
        isDirty.current = false;
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [isEdit, record, child.id, attendanceType, reason, meal, mealMemo, snack, snackMemo, napJsonValue, napMemo, bowelJsonValue, bowelMemo, mood, moodMemo, memo]);

  useEffect(() => {
    const handleSaveBeforeNavigate = async (e: Event) => {
      const ev = e as CustomEvent<{ backHref: string }>;
      const backHref = ev.detail?.backHref ?? "/";
      setBackSaveError(null);

      if (!hasChanges()) {
        router.push(backHref);
        return;
      }

      if (!attendanceType || !isValidAttendance(attendanceType)) {
        setAttendanceError("出欠区分を選択してください");
        return;
      }

      const data = toData();
      if (isEdit && record) {
        const result = await autoSaveRecord(record.id, data);
        if ("error" in result) {
          setBackSaveError(result.error);
          return;
        }
      } else {
        const result = await createRecordForBack(data);
        if ("error" in result) {
          setBackSaveError(result.error);
          return;
        }
      }
      router.push(backHref);
    };
    window.addEventListener("save-before-navigate", handleSaveBeforeNavigate);
    return () => window.removeEventListener("save-before-navigate", handleSaveBeforeNavigate);
  }, [isEdit, record, child.id, attendanceType, reason, meal, mealMemo, snack, snackMemo, napJsonValue, napMemo, bowelJsonValue, bowelMemo, mood, moodMemo, memo]);

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
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
                onChange={() => {
                  setAttendanceType(opt);
                  setAttendanceError(null);
                }}
                className="sr-only"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      {attendanceError && (
        <div className="rounded-xl bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          {attendanceError}
        </div>
      )}

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

      {attendanceType !== "欠席" && (
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
                      onClick={() => {
                        const now = new Date();
                        updateNapEntry(i, "hour", now.getHours().toString().padStart(2, "0"));
                        updateNapEntry(i, "minute", now.getMinutes().toString().padStart(2, "0"));
                      }}
                      className="rounded-lg border border-border px-2 py-1.5 text-lg transition hover:bg-primary-light"
                      title="開始時刻を入力"
                    >
                      🕛
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={entry.hour ?? ""}
                      onChange={(e) => updateNapEntry(i, "hour", e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="HH"
                      className="w-12 rounded-lg border border-border bg-white px-2 py-1.5 text-center text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="font-bold text-text-light">:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={entry.minute ?? ""}
                      onChange={(e) => updateNapEntry(i, "minute", e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="MM"
                      className="w-12 rounded-lg border border-border bg-white px-2 py-1.5 text-center text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="font-bold text-text-light">～</span>
                    <button
                      type="button"
                      onClick={() => fillCurrentTime(i)}
                      className="rounded-lg border border-border px-2 py-1.5 text-lg transition hover:bg-primary-light"
                      title="終了時刻を入力"
                    >
                      🕛
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={entry.endHour ?? ""}
                      onChange={(e) => updateNapEntry(i, "endHour", e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="HH"
                      className="w-12 rounded-lg border border-border bg-white px-2 py-1.5 text-center text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="font-bold text-text-light">:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={entry.endMinute ?? ""}
                      onChange={(e) => updateNapEntry(i, "endMinute", e.target.value.replace(/\D/g, "").slice(0, 2))}
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
                      value={entry.hour ?? ""}
                      onChange={(e) => updateBowelEntry(i, "hour", e.target.value.replace(/\D/g, "").slice(0, 2))}
                      placeholder="HH"
                      className="w-12 rounded-lg border border-border bg-white px-2 py-1.5 text-center text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="font-bold text-text-light">:</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={entry.minute ?? ""}
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

      {successMessage && (
        <div className="rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-700">
          {successMessage}
        </div>
      )}

      {(state?.error || backSaveError) && (
        <div className="rounded-xl bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          {state?.error ?? backSaveError}
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
