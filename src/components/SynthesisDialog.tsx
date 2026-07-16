import { useMemo, useState, type ReactNode } from "react";
import { Sparkles, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface SynthesisPaperInput {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url?: string;
}

interface Props {
  papers: SynthesisPaperInput[];
  disabled?: boolean;
}

/**
 * Render the synthesis text: split into paragraphs and turn inline [n]
 * citations into small badges so the reader can map claims to sources.
 */
function renderSynthesis(text: string): ReactNode {
  return text.split(/\n{2,}/).map((para, pi) => {
    const parts = para.split(/(\[\d{1,3}\])/g);
    return (
      <p key={pi} className="text-sm text-[#C7C7D1] leading-relaxed mb-3 last:mb-0">
        {parts.map((part, i) => {
          const m = /^\[(\d{1,3})\]$/.exec(part);
          if (m) {
            return (
              <sup
                key={i}
                className="inline-flex items-center justify-center min-w-4 h-4 px-1 mx-0.5 rounded bg-[#6366F1]/15 text-[#818CF8] text-[9px] font-semibold align-super"
              >
                {m[1]}
              </sup>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  });
}

export default function SynthesisDialog({ papers, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const synth = trpc.synthesis.generate.useMutation();

  const canRun = papers.length >= 2 && !disabled;
  const result = synth.data;

  const citedPapers = useMemo(() => {
    if (!result) return [];
    return result.citedIndices
      .map((n) => ({ n, paper: papers[n - 1] }))
      .filter((x) => x.paper);
  }, [result, papers]);

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (next && !synth.data && !synth.isPending) {
      synth.mutate({ papers });
    }
    if (!next) synth.reset();
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => handleOpen(true)}
        disabled={!canRun}
        className="h-8 bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs disabled:opacity-50"
        title={
          papers.length < 2
            ? "Sentez için en az 2 makale seçin"
            : "Seçili makaleleri yapay zekâ ile sentezle"
        }
      >
        <Sparkles className="size-3.5 mr-1" />
        Sentezle
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-2xl bg-[#0F0F14] border-[#23232D] text-[#F0F0F5] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#F0F0F5]">
              <Sparkles className="size-4 text-[#818CF8]" />
              Literatür Sentezi
            </DialogTitle>
            <DialogDescription className="text-[#8A8A98]">
              {papers.length} makale, kaynak-atıflı olarak sentezleniyor.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            {synth.isPending && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="size-8 text-[#6366F1] animate-spin mb-3" />
                <p className="text-sm text-[#8A8A98]">
                  Makaleler sentezleniyor…
                </p>
                <p className="text-xs text-[#5A5A68] mt-1">
                  Bu birkaç saniye sürebilir
                </p>
              </div>
            )}

            {synth.isError && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg p-4 text-xs text-[#F87171]">
                {synth.error.message}
              </div>
            )}

            {result && (
              <div>
                <div className="prose-none">{renderSynthesis(result.synthesis)}</div>

                {citedPapers.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[#23232D]">
                    <h4 className="text-xs font-semibold text-[#F0F0F5] mb-2">
                      Kaynaklar
                    </h4>
                    <ol className="space-y-1.5">
                      {citedPapers.map(({ n, paper }) => (
                        <li key={n} className="flex gap-2 text-xs text-[#8A8A98]">
                          <span className="text-[#818CF8] font-semibold shrink-0">
                            [{n}]
                          </span>
                          <span className="min-w-0">
                            {paper.url ? (
                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-[#F0F0F5] inline-flex items-center gap-1"
                              >
                                {paper.title}
                                <ExternalLink className="size-3 shrink-0" />
                              </a>
                            ) : (
                              paper.title
                            )}
                            <span className="text-[#5A5A68]">
                              {" "}
                              — {paper.authors[0] ?? "Bilinmeyen"}
                              {paper.authors.length > 1 ? " et al." : ""}, {paper.year}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="flex items-start gap-2 mt-4 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-lg p-3">
                  <AlertTriangle className="size-3.5 text-[#F59E0B] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#8A8A98] leading-relaxed">
                    Bu sentez yapay zekâ tarafından yalnızca seçilen makalelerin
                    özetlerinden üretilmiştir. Kullanmadan önce iddiaları asıl
                    kaynaklardan doğrulayın.
                    {result.usage.inputTokens > 0 && (
                      <span className="text-[#5A5A68]">
                        {" "}
                        ({result.usage.inputTokens + result.usage.outputTokens} token)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
