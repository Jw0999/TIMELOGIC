import { STATUS_MAP } from "../lib/constants";

export default function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  const c = STATUS_MAP[status] ?? { bg: "#F1F5F9", text: "#64748B", label: status };
  return (
    <span
      className={`inline-block self-start rounded-md font-bold ${small ? "px-[7px] py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}
