import { MessageCircle } from "lucide-react";

export function NarrativeSummaryCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[rgba(7,16,24,0.82)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:rounded-3xl sm:p-5 lg:p-6 xl:col-span-2">
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#35E75A]/10 text-[#35E75A]">
          <MessageCircle size={18} />
        </span>
        <h2 className="text-base font-black tracking-[-0.02em] text-[#F3F6F7] sm:text-lg lg:text-xl">{title}</h2>
      </div>
      <p className="text-sm font-medium leading-relaxed text-[rgba(243,246,247,0.72)] sm:text-[15px]">{text}</p>
    </section>
  );
}
