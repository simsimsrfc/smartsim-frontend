// Pastilles V/D/N (5 derniers matchs) — réutilisable
import clsx from "clsx";

const COLORS: Record<string, string> = {
  W: "bg-prob-high text-bg-app",
  D: "bg-prob-medium text-bg-app",
  L: "bg-prob-low text-fg",
};
const LABELS: Record<string, string> = { W: "V", D: "N", L: "D" };

export function FormPills({ form, size = 22 }: { form: string[]; size?: number }) {
  if (!form?.length) return null;
  return (
    <div className="flex gap-1 justify-center">
      {form.map((r, i) => (
        <span
          key={i}
          style={{ width: size, height: size, fontSize: size * 0.5 }}
          className={clsx(
            "rounded-full inline-flex items-center justify-center font-extrabold shadow-sm",
            COLORS[r] || "bg-white/10 text-fg-muted"
          )}
        >
          {LABELS[r] || "?"}
        </span>
      ))}
    </div>
  );
}
