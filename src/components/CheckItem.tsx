"use client";

type CheckItemProps = {
  name: string;
  label: string;
  icon: string;
  defaultChecked?: boolean;
};

export default function CheckItem({
  name,
  label,
  icon,
  defaultChecked = false,
}: CheckItemProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition has-[:checked]:border-primary has-[:checked]:bg-primary-light">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 rounded border-gray-300 text-primary accent-primary"
      />
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </label>
  );
}
