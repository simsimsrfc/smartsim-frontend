// Bloc stat coloré selon valeur — réutilisé partout (cards, rows, fiche match)

type Size = "sm" | "md" | "lg";

function tone(p: number) {
  if (p >= 0.65) return { text: "text-[#35E75A]", bg: "bg-[rgba(53,231,90,0.075)]", border: "border-[rgba(53,231,90,0.20)]" };
  if (p >= 0.5)  return { text: "text-[#D8AC2F]", bg: "bg-[rgba(245,197,66,0.10)]", border: "border-[rgba(245,197,66,0.18)]" };
  return { text: "text-[#D65C5C]", bg: "bg-[rgba(214,92,92,0.08)]", border: "border-[rgba(214,92,92,0.18)]" };
}

const SIZES: Record<Size, { height: string; label: string; value: string }> = {
  sm: { height: "h-[42px]", label: "text-[8px]",  value: "text-[15px]" },
  md: { height: "h-[58px]", label: "text-[10px]", value: "text-lg" },
  lg: { height: "h-[64px]", label: "text-[11px]", value: "text-xl" },
};

export function StatPill({
  label, value, size = "md",
}: { label: string; value: number; size?: Size }) {
  const t = tone(value);
  const s = SIZES[size];
  return (
    <div className={`flex ${s.height} w-[76px] flex-col items-center justify-center rounded-[13px] border px-2 py-1 text-center ${t.bg} ${t.border}`}>
      <div className={`${s.label} uppercase tracking-[0.12em] text-fg/60 font-extrabold leading-none`}>
        {label}
      </div>
      <div className={`${s.value} font-black ${t.text} mt-0.5 leading-none`}>
        {Math.round(value * 100)}<span className="text-[10px] opacity-60">%</span>
      </div>
    </div>
  );
}
