import { redirect } from "next/navigation";
import { getStaffName } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import RecordForm from "@/components/RecordForm";
import type { Child, Record as RecordType } from "@/lib/types";

type Props = {
  params: Promise<{ childId: string }>;
};

export default async function NewRecordPage({ params }: Props) {
  const { childId } = await params;
  const staffName = await getStaffName();
  if (!staffName) redirect("/login");

  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("*")
    .eq("id", childId)
    .single();

  if (!child) redirect("/");

  const today = new Date().toISOString().split("T")[0];
  const { data: todayRecord } = await supabase
    .from("records")
    .select("*")
    .eq("child_id", childId)
    .eq("date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="min-h-screen">
      <Header
        staffName={staffName}
        title={`${(child as Child).name} の記録`}
        backHref="/"
        saveBeforeBack
      />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <RecordForm child={child as Child} {...(todayRecord ? { record: todayRecord as RecordType } : {})} />
      </main>
    </div>
  );
}
