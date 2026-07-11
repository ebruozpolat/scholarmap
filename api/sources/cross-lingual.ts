// Cross-lingual query expansion: turn a Turkish research query into a
// multilingual one so a Turkish grad student searching "derin öğrenme ile
// tümör tespiti" also reaches the English literature ("deep learning tumor
// detection"). This is the deterministic, zero-dependency baseline of
// ScholarMap's semantic search — it runs on Cloudflare Workers with no
// external call. An optional embedding reranker (semantic-rerank.ts) layers
// on top when a Workers AI binding is available.

// Curated Turkish → English academic/technical term map. Keys are stored in
// their normalized (suffix-stripped, lowercased) form; see normalizeTr.
// This is intentionally high-precision rather than exhaustive: a wrong
// translation hurts recall more than a missing one.
const TR_EN_TERMS: Record<string, string> = {
  // Method / ML / CS
  "derin öğrenme": "deep learning",
  "makine öğrenme": "machine learning",
  "yapay zeka": "artificial intelligence",
  "yapay sinir ağ": "artificial neural network",
  "sinir ağ": "neural network",
  "evrişimli sinir ağ": "convolutional neural network",
  "evrişimli": "convolutional",
  "öğrenme": "learning",
  "denetimli öğrenme": "supervised learning",
  "denetimsiz öğrenme": "unsupervised learning",
  "pekiştirmeli öğrenme": "reinforcement learning",
  "aktarım öğrenme": "transfer learning",
  "büyük dil model": "large language model",
  "dil model": "language model",
  "doğal dil işleme": "natural language processing",
  "bilgisayarlı görü": "computer vision",
  "görüntü işleme": "image processing",
  "görüntü sınıflandırma": "image classification",
  "sınıflandırma": "classification",
  "kümeleme": "clustering",
  "bağlanım": "regression",
  "öznitelik çıkarımı": "feature extraction",
  "veri madenciliği": "data mining",
  "büyük veri": "big data",
  "veri kümesi": "dataset",
  "veri seti": "dataset",
  "algoritma": "algorithm",
  "eniyileme": "optimization",
  "optimizasyon": "optimization",
  "dikkat mekanizma": "attention mechanism",
  "dönüştürücü": "transformer",
  "üretken çekişmeli ağ": "generative adversarial network",
  "anlamsal": "semantic",
  "gömme": "embedding",
  // Medical / bio
  "tümör": "tumor",
  "tümör tespiti": "tumor detection",
  "kanser": "cancer",
  "meme kanser": "breast cancer",
  "akciğer kanser": "lung cancer",
  "tespit": "detection",
  "teşhis": "diagnosis",
  "tanı": "diagnosis",
  "hastalık": "disease",
  "tedavi": "treatment",
  "hasta": "patient",
  "tıbbi görüntüleme": "medical imaging",
  "manyetik rezonans": "magnetic resonance imaging",
  "bilgisayarlı tomografi": "computed tomography",
  "gen ifadesi": "gene expression",
  "protein": "protein",
  "hücre": "cell",
  "bağışıklık": "immune",
  "aşı": "vaccine",
  "ilaç": "drug",
  "beyin": "brain",
  "nöron": "neuron",
  // Engineering / physics / chem
  "enerji": "energy",
  "yenilenebilir enerji": "renewable energy",
  "güneş enerji": "solar energy",
  "malzeme": "material",
  "nanomalzeme": "nanomaterial",
  "katalizör": "catalyst",
  "kuantum": "quantum",
  "sonlu elemanlar": "finite element",
  "akışkanlar dinamiği": "fluid dynamics",
  "kontrol sistem": "control system",
  "robotik": "robotics",
  "gömülü sistem": "embedded system",
  // Social science / humanities / econ
  "iklim değişikliği": "climate change",
  "sürdürülebilirlik": "sustainability",
  "ekonomi": "economics",
  "büyüme": "growth",
  "enflasyon": "inflation",
  "eğitim": "education",
  "öğrenci": "student",
  "öğretmen": "teacher",
  "psikoloji": "psychology",
  "sosyoloji": "sociology",
  "kaygı": "anxiety",
  "depresyon": "depression",
  "toplumsal cinsiyet": "gender",
  "göç": "migration",
  "siyaset": "politics",
  "demokrasi": "democracy",
  "hukuk": "law",
  "sürdürülebilir": "sustainable",
  // Generic research vocabulary
  "yöntem": "method",
  "model": "model",
  "analiz": "analysis",
  "değerlendirme": "evaluation",
  "karşılaştırma": "comparison",
  "etki": "effect",
  "sistem": "system",
  "ağ": "network",
  "veri": "data",
  "performans": "performance",
  "doğruluk": "accuracy",
  "tahmin": "prediction",
  "gözetim": "monitoring",
  "güvenlik": "security",
  "gizlilik": "privacy",
  "algılama": "detection",
};

// Turkish inflectional suffixes, longest-first so we strip the biggest match.
// Conservative on purpose: we only need enough to hit dictionary stems.
const TR_SUFFIXES = [
  "larından", "lerinden", "larının", "lerinin", "larıyla", "leriyle",
  "sında", "sinde", "sunda", "sünde", "ndan", "nden", "ları", "leri",
  "ında", "inde", "unda", "ünde", "dan", "den", "tan", "ten", "lar",
  "ler", "nın", "nin", "nun", "nün", "ya", "ye", "da", "de", "ta", "te",
  "yı", "yi", "yu", "yü", "ın", "in", "un", "ün", "la", "le", "sı", "si",
  "su", "sü", "yla", "yle", "ı", "i", "u", "ü", "a", "e",
];

// A handful of Turkish-only characters + very common Turkish stopwords are a
// strong signal the query is Turkish.
const TR_CHARS = /[çğıöşüİ]/;
const TR_STOPWORDS = new Set([
  "ve", "ile", "için", "bir", "bu", "da", "de", "en", "gibi", "üzerine",
  "arasında", "etkisi", "üzerindeki", "nasıl", "nedir",
]);

export function normalizeTr(word: string): string {
  const w = word.toLocaleLowerCase("tr").replace(/[^a-zçğıöşü]/g, "");
  if (w.length <= 3) return w;
  for (const suffix of TR_SUFFIXES) {
    // Strip the longest matching suffix, but keep a stem of at least 2 chars.
    if (w.endsWith(suffix) && w.length - suffix.length >= 2) {
      return w.slice(0, w.length - suffix.length);
    }
  }
  return w;
}

function normalizePhrase(phrase: string): string {
  return phrase.split(/\s+/).map(normalizeTr).join(" ");
}

// Precompute a normalized-key lookup so query spans and dictionary entries
// pass through identical normalization (over-stripping is then symmetric and
// harmless). Later insertions win ties, but our keys don't collide.
const NORM_TERMS: Record<string, string> = {};
for (const [tr, en] of Object.entries(TR_EN_TERMS)) {
  NORM_TERMS[normalizePhrase(tr)] = en;
}

export function looksTurkish(query: string): boolean {
  if (TR_CHARS.test(query)) return true;
  const words = query.toLocaleLowerCase("tr").split(/\s+/);
  return words.some((w) => TR_STOPWORDS.has(w));
}

export interface Expansion {
  /** The query actually sent upstream (original + English terms). */
  expandedQuery: string;
  /** Turkish→English pairs that were substituted, for UI transparency. */
  translations: { tr: string; en: string }[];
  /** True when the input was detected as Turkish and expansion ran. */
  translated: boolean;
}

/**
 * Expand a (possibly Turkish) query with English academic equivalents.
 * Tries multi-word phrases first (normalized), then single tokens. English
 * or unrecognized queries pass through unchanged.
 */
export function expandQuery(query: string): Expansion {
  const trimmed = query.trim();
  if (!trimmed || !looksTurkish(trimmed)) {
    return { expandedQuery: trimmed, translations: [], translated: false };
  }

  const rawTokens = trimmed.split(/\s+/);
  const normTokens = rawTokens.map(normalizeTr);
  const translations: { tr: string; en: string }[] = [];
  const seenEn = new Set<string>();

  // Greedy longest-phrase match over normalized tokens (up to 3 words).
  let i = 0;
  while (i < normTokens.length) {
    let matched = false;
    for (let span = Math.min(3, normTokens.length - i); span >= 1; span--) {
      const phrase = normTokens.slice(i, i + span).join(" ");
      const en = NORM_TERMS[phrase];
      if (en) {
        if (!seenEn.has(en)) {
          seenEn.add(en);
          translations.push({
            tr: rawTokens.slice(i, i + span).join(" "),
            en,
          });
        }
        i += span;
        matched = true;
        break;
      }
    }
    if (!matched) i++;
  }

  if (translations.length === 0) {
    return { expandedQuery: trimmed, translations: [], translated: false };
  }

  // Send both the English terms and the original query so OpenAlex can match
  // either language. English first: it carries most of the world literature.
  const englishPart = translations.map((t) => t.en).join(" ");
  return {
    expandedQuery: `${englishPart} ${trimmed}`.trim(),
    translations,
    translated: true,
  };
}
