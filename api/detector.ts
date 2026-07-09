// Turkish academic AI-text detector.
//
// A pure-TypeScript, server-side heuristic analyzer in the spirit of
// Turkish "AI detector" tools: it scores several independent linguistic
// signals that tend to separate LLM-generated Turkish academic prose from
// human writing (uniform sentence rhythm, connector overuse, formulaic
// stock phrases, low burstiness). No external API calls, no storage —
// the text is processed in memory and discarded, so it runs on
// Cloudflare Workers at zero marginal cost.
//
// IMPORTANT: this is a probabilistic estimate, not proof. The UI must
// present it with that caveat; false positives are a known failure mode
// of every AI detector.

export interface DetectorSignal {
  key: string;
  /** Turkish display label. */
  label: string;
  /** 0..1 — higher means more AI-like on this signal. */
  score: number;
  weight: number;
  /** Human-readable measurement backing the score. */
  detail: string;
}

export interface DetectorResult {
  /** 0..100 weighted probability estimate that the text is AI-generated. */
  aiProbability: number;
  verdict: "low" | "medium" | "high";
  signals: DetectorSignal[];
  stats: { words: number; sentences: number; characters: number };
}

export const MIN_WORDS = 80;

// Discourse connectors that LLMs sprinkle at a much higher rate than
// human Turkish academic writers.
const CONNECTORS = [
  "ayrıca",
  "ancak",
  "bununla birlikte",
  "bunun yanı sıra",
  "öte yandan",
  "sonuç olarak",
  "bu bağlamda",
  "bu doğrultuda",
  "dolayısıyla",
  "özellikle",
  "genel olarak",
  "buna ek olarak",
  "ek olarak",
  "diğer yandan",
  "bu nedenle",
  "böylece",
];

// Stock academic phrases that appear verbatim in generated Turkish text.
const FORMULAIC_PHRASES = [
  "önemli bir rol oynamaktadır",
  "önemli bir rol oynar",
  "literatüre katkı sağlamaktadır",
  "literatüre katkı sağlaması",
  "bu çalışmada",
  "bu çalışma kapsamında",
  "ele alınmıştır",
  "incelenmiştir",
  "değerlendirilmiştir",
  "ortaya koymaktadır",
  "büyük önem taşımaktadır",
  "dikkat çekmektedir",
  "göz önünde bulundurulmalıdır",
  "kapsamlı bir şekilde",
  "giderek artan",
  "son yıllarda",
];

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Coefficient of variation — the classic "burstiness" measure. */
function cv(xs: number[]): number {
  const m = mean(xs);
  if (m === 0 || xs.length < 2) return 0;
  const variance = mean(xs.map((x) => (x - m) ** 2));
  return Math.sqrt(variance) / m;
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

export function tokenizeWords(text: string): string[] {
  const matches = text.match(/[a-zA-ZçğıöşüÇĞİÖŞÜâîû]+/g) ?? [];
  return matches.map((w) => w.toLocaleLowerCase("tr"));
}

/** Average type-token ratio over fixed windows so length doesn't bias it. */
export function windowedTypeTokenRatio(words: string[], windowSize = 100): number {
  if (words.length === 0) return 0;
  if (words.length <= windowSize) return new Set(words).size / words.length;
  const ratios: number[] = [];
  for (let start = 0; start + windowSize <= words.length; start += windowSize) {
    const window = words.slice(start, start + windowSize);
    ratios.push(new Set(window).size / windowSize);
  }
  return mean(ratios);
}

function countOccurrences(haystack: string, needles: string[]): number {
  let count = 0;
  for (const needle of needles) {
    let idx = 0;
    while ((idx = haystack.indexOf(needle, idx)) !== -1) {
      count++;
      idx += needle.length;
    }
  }
  return count;
}

export function analyzeText(text: string): DetectorResult {
  const sentences = splitSentences(text);
  const words = tokenizeWords(text);
  const lower = text.toLocaleLowerCase("tr");

  if (words.length < MIN_WORDS) {
    throw new Error(
      `Analiz için en az ${MIN_WORDS} kelime gerekli (metinde ${words.length} kelime var).`,
    );
  }

  const signals: DetectorSignal[] = [];

  // 1 — Sentence rhythm: humans alternate short and long sentences;
  // LLM output keeps a steady beat (low coefficient of variation).
  const sentenceLengths = sentences.map((s) => tokenizeWords(s).length);
  const sentenceCv = cv(sentenceLengths);
  signals.push({
    key: "sentence_uniformity",
    label: "Cümle uzunluğu homojenliği",
    score: clamp01((0.5 - sentenceCv) / 0.35),
    weight: 1.5,
    detail: `Cümle uzunluğu değişkenliği (CV): ${sentenceCv.toFixed(2)} — insan yazımı genelde 0.45 üzerindedir.`,
  });

  // 2 — Lexical diversity over 100-word windows.
  const ttr = windowedTypeTokenRatio(words);
  signals.push({
    key: "lexical_diversity",
    label: "Kelime çeşitliliği",
    score: clamp01((0.62 - ttr) / 0.2),
    weight: 1.0,
    detail: `Pencereli tip/simge oranı: ${ttr.toFixed(2)} — düşük çeşitlilik kalıplaşmış üretime işaret eder.`,
  });

  // 3 — Repeated word trigrams (verbatim self-repetition).
  const trigrams: string[] = [];
  for (let i = 0; i + 2 < words.length; i++) {
    trigrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  const repeatRatio =
    trigrams.length === 0 ? 0 : 1 - new Set(trigrams).size / trigrams.length;
  signals.push({
    key: "ngram_repetition",
    label: "Üçlü kelime öbeği tekrarı",
    score: clamp01(repeatRatio / 0.08),
    weight: 1.2,
    detail: `Tekrarlanan üçlü öbek oranı: %${(repeatRatio * 100).toFixed(1)}.`,
  });

  // 4 — Discourse-connector density per sentence.
  const connectorCount = countOccurrences(lower, CONNECTORS);
  const connectorDensity = sentences.length === 0 ? 0 : connectorCount / sentences.length;
  signals.push({
    key: "connector_density",
    label: "Bağlaç/geçiş ifadesi yoğunluğu",
    score: clamp01((connectorDensity - 0.25) / 0.75),
    weight: 1.2,
    detail: `Cümle başına ${connectorDensity.toFixed(2)} geçiş ifadesi (${connectorCount} adet).`,
  });

  // 5 — Stock academic phrases per 1000 words.
  const formulaicCount = countOccurrences(lower, FORMULAIC_PHRASES);
  const formulaicPer1000 = (formulaicCount / words.length) * 1000;
  signals.push({
    key: "formulaic_phrases",
    label: "Kalıp akademik ifadeler",
    score: clamp01(formulaicPer1000 / 12),
    weight: 1.3,
    detail: `1000 kelimede ${formulaicPer1000.toFixed(1)} kalıp ifade (${formulaicCount} adet).`,
  });

  // 6 — Sentence-starter variety.
  const starters = sentences
    .map((s) => tokenizeWords(s)[0])
    .filter((w): w is string => Boolean(w));
  const starterRepeat =
    starters.length === 0 ? 0 : 1 - new Set(starters).size / starters.length;
  signals.push({
    key: "starter_repetition",
    label: "Cümle başlangıcı tekrarı",
    score: clamp01((starterRepeat - 0.1) / 0.4),
    weight: 1.0,
    detail: `Cümlelerin %${(starterRepeat * 100).toFixed(0)}'i daha önce kullanılan bir kelimeyle başlıyor.`,
  });

  // 7 — Word-length burstiness. Turkish agglutination makes human word
  // lengths vary a lot; generated text flattens the distribution.
  const wordLengthCv = cv(words.map((w) => w.length));
  signals.push({
    key: "word_length_uniformity",
    label: "Kelime uzunluğu homojenliği",
    score: clamp01((0.45 - wordLengthCv) / 0.25),
    weight: 0.8,
    detail: `Kelime uzunluğu değişkenliği (CV): ${wordLengthCv.toFixed(2)}.`,
  });

  const totalWeight = signals.reduce((a, s) => a + s.weight, 0);
  const weighted = signals.reduce((a, s) => a + s.score * s.weight, 0);
  const aiProbability = Math.round((weighted / totalWeight) * 100);

  const verdict: DetectorResult["verdict"] =
    aiProbability < 35 ? "low" : aiProbability <= 65 ? "medium" : "high";

  return {
    aiProbability,
    verdict,
    signals,
    stats: {
      words: words.length,
      sentences: sentences.length,
      characters: text.length,
    },
  };
}
