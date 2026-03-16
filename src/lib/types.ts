export type Staff = {
  id: string;
  name: string;
  password: string;
};

export type Child = {
  id: string;
  name: string;
  name_kana: string;
  birth_date: string;
  class_name: string | null;
};

export type AttendanceType = "出席" | "欠席" | "遅刻" | "早退";

export type Record = {
  id: string;
  child_id: string;
  staff_name: string;
  date: string;
  attendance_type: AttendanceType;
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
  created_at: string;
  updated_at: string;
};
