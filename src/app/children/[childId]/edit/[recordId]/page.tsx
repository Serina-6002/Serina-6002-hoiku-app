import { redirect } from "next/navigation";
import { getStaffName } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import RecordForm from "@/components/RecordForm";
import type { Child, Record as RecordType } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ childId: string; recordId: string }>;
};

export default async function EditRecordPage({ params }: Props) {
  const { childId, recordId } = await params;
  const staffName = await getStaffName();
  if (!staffName) redirect("/login");

  const supabase = await createClient();

  const [childResult, recordResult] = await Promise.all([
    supabase.from("children").select("*").eq("id", childId).single(),
    supabase.from("records").select("*").eq("id", recordId).single(),
  ]);

  if (!childResult.data || !recordResult.data) redirect("/");

  return (
    <div className="min-h-screen">
      <Header
        staffName={staffName}
        title={`${(childResult.data as Child).name} の記録を編集`}
        backHref="/"
        saveBeforeBack
      />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <RecordForm
          child={childResult.data as Child}
          record={recordResult.data as RecordType}
        />
      </main>
    </div>
  );
}
