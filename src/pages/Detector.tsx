import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, ScanSearch, ShieldCheck, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";

const VERDICTS = {
  low: {
    label: "Düşük olasılık",
    color: "#22C55E",
    text: "Metin ağırlıklı olarak insan yazımı örüntüleri taşıyor.",
  },
  medium: {
    label: "Belirsiz",
    color: "#F59E0B",
    text: "Karışık sinyaller var; metin kısmen üretilmiş veya yoğun düzenlenmiş olabilir.",
  },
  high: {
    label: "Yüksek olasılık",
    color: "#EF4444",
    text: "Metin, yapay zekâ üretimine özgü örüntülerle güçlü benzerlik gösteriyor.",
  },
} as const;

function countWords(text: string): number {
  return (text.match(/[a-zA-ZçğıöşüÇĞİÖŞÜâîû]+/g) ?? []).length;
}

export default function Detector() {
  const [text, setText] = useState("");
  const analyze = trpc.detector.analyze.useMutation();

  const wordCount = useMemo(() => countWords(text), [text]);
  const result = analyze.data;
  const verdict = result ? VERDICTS[result.verdict] : null;

  return (
    <div className="flex flex-col h-full bg-[#08080C]">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-8 py-3 border-b border-[#23232D] bg-[#08080C]/80 backdrop-blur-md h-14">
        <div>
          <h1 className="text-lg font-semibold text-[#F0F0F5]">AI Dedektörü</h1>
          <p className="text-[11px] text-[#5A5A68]">
            Türkçe akademik metinler için yapay zekâ yazım analizi (Beta)
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#5A5A68]">
          <ShieldCheck className="size-3.5 text-[#22C55E]" />
          Metniniz kaydedilmez — yalnızca anlık analiz edilir
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
          {/* Input */}
          <div className="bg-[#0F0F14] border border-[#23232D] rounded-2xl p-5 focus-within:border-[#6366F1] transition-all">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Analiz edilecek Türkçe akademik metni buraya yapıştırın (en az 80 kelime)…"
              className="w-full h-80 bg-transparent text-sm text-[#F0F0F5] placeholder-[#5A5A68] outline-none resize-none leading-relaxed"
              maxLength={60000}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#23232D]">
              <span
                className={`text-[11px] font-mono ${wordCount >= 80 ? "text-[#22C55E]" : "text-[#5A5A68]"}`}
              >
                {wordCount} kelime {wordCount < 80 ? "(en az 80 gerekli)" : ""}
              </span>
              <div className="flex items-center gap-2">
                {text.length > 0 && (
                  <button
                    onClick={() => {
                      setText("");
                      analyze.reset();
                    }}
                    className="p-1.5 rounded-md text-[#5A5A68] hover:bg-[#1E1E28] hover:text-[#F0F0F5] transition-colors"
                    title="Temizle"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <Button
                  size="sm"
                  onClick={() => analyze.mutate({ text })}
                  disabled={wordCount < 80 || analyze.isPending}
                  className="h-8 bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs"
                >
                  {analyze.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ScanSearch className="size-3.5" />
                  )}
                  Analiz Et
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {analyze.isError && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-4 text-xs text-[#F87171]">
                {analyze.error.message}
              </div>
            )}

            {!result && !analyze.isError && (
              <div className="bg-[#16161D] border border-[#23232D] rounded-2xl p-8 flex flex-col items-center text-center">
                <ScanSearch className="size-10 text-[#5A5A68] opacity-50 mb-3" />
                <p className="text-sm text-[#8A8A98] mb-1">
                  Sonuçlar burada görünecek
                </p>
                <p className="text-xs text-[#5A5A68] max-w-sm">
                  Dedektör; cümle ritmi, kelime çeşitliliği, öbek tekrarı,
                  geçiş ifadesi yoğunluğu ve kalıp akademik ifadeler gibi
                  bağımsız dilbilimsel sinyalleri birlikte değerlendirir.
                </p>
              </div>
            )}

            {result && verdict && (
              <>
                {/* Score card */}
                <div className="bg-[#16161D] border border-[#23232D] rounded-2xl p-6 flex items-center gap-6">
                  <div
                    className="relative size-24 rounded-full grid place-items-center shrink-0"
                    style={{
                      background: `conic-gradient(${verdict.color} ${result.aiProbability * 3.6}deg, #23232D 0deg)`,
                    }}
                  >
                    <div className="size-[76px] rounded-full bg-[#16161D] grid place-items-center">
                      <span
                        className="text-xl font-bold font-mono"
                        style={{ color: verdict.color }}
                      >
                        %{result.aiProbability}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div
                      className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold mb-1.5"
                      style={{
                        background: `${verdict.color}1A`,
                        color: verdict.color,
                      }}
                    >
                      {verdict.label}
                    </div>
                    <p className="text-xs text-[#8A8A98] leading-relaxed">
                      {verdict.text}
                    </p>
                    <p className="text-[10px] text-[#5A5A68] mt-1.5 font-mono">
                      {result.stats.words} kelime · {result.stats.sentences} cümle
                    </p>
                  </div>
                </div>

                {/* Signals */}
                <div className="bg-[#16161D] border border-[#23232D] rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-[#F0F0F5]">
                    Sinyal dökümü
                  </h3>
                  {result.signals.map((signal) => (
                    <div key={signal.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[#8A8A98]">
                          {signal.label}
                        </span>
                        <span className="text-[11px] font-mono text-[#5A5A68]">
                          %{Math.round(signal.score * 100)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#1E1E28] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(2, signal.score * 100)}%`,
                            background:
                              signal.score > 0.65
                                ? "#EF4444"
                                : signal.score > 0.35
                                  ? "#F59E0B"
                                  : "#22C55E",
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-[#5A5A68] mt-0.5">
                        {signal.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Disclaimer — always visible */}
            <div className="flex items-start gap-2.5 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-4">
              <AlertTriangle className="size-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#8A8A98] leading-relaxed">
                Bu analiz <strong className="text-[#F0F0F5]">olasılıksal bir tahmindir</strong>,
                kesin kanıt değildir. Hiçbir yapay zekâ dedektörü %100 doğru
                değildir; insan yazımı metinler de yüksek puan alabilir. Sonuçlar
                tek başına akademik veya disipliner karar gerekçesi olarak
                kullanılmamalıdır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
