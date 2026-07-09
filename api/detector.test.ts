import { describe, expect, it } from "vitest";
import {
  analyzeText,
  splitSentences,
  tokenizeWords,
  windowedTypeTokenRatio,
  MIN_WORDS,
} from "./detector";

// Uniform sentence rhythm, heavy connectors, stock phrases — the pattern
// LLM-generated Turkish academic prose tends to follow.
const AI_LIKE = `
Bu çalışmada derin öğrenme yöntemleri kapsamlı bir şekilde ele alınmıştır.
Ayrıca makine öğrenmesi teknikleri detaylı olarak incelenmiştir.
Bununla birlikte yapay zekâ uygulamaları önemli bir rol oynamaktadır.
Ayrıca sinir ağları modelleri kapsamlı bir şekilde değerlendirilmiştir.
Bu bağlamda elde edilen bulgular literatüre katkı sağlamaktadır.
Ayrıca deneysel sonuçlar detaylı olarak ele alınmıştır.
Bununla birlikte önerilen yöntem önemli bir rol oynamaktadır.
Bu doğrultuda gelecek çalışmalar kapsamlı bir şekilde incelenmiştir.
Ayrıca veri kümeleri detaylı olarak değerlendirilmiştir.
Sonuç olarak bu çalışma literatüre katkı sağlamaktadır.
Ayrıca elde edilen sonuçlar önemli bir rol oynamaktadır.
Bu bağlamda önerilen model kapsamlı bir şekilde ele alınmıştır.
`.trim();

// Bursty rhythm, varied starters, colloquial texture — human-like.
const HUMAN_LIKE = `
Deneyi üçüncü kez tekrarladığımızda beklenmedik bir şey oldu. Sonuçlar tutmadı.
Hocam önce ölçüm hatası sandı; iki gün boyunca kalibrasyonla uğraştık, kabloları
söktük, sensörleri değiştirdik, hatta laboratuvarın klimasını bile kapattık.
Hiçbiri işe yaramadı. Sorun çok daha basitmiş: örneklerden biri etiketlenirken
karışmış. İnsan hata yapıyor işte. Yine de bu karışıklık bize ilginç bir kapı
araladı çünkü yanlış örneğin verdiği tepki, asıl hipotezimizin eksik olduğunu
gösteriyordu. Kısacası dört haftalık gecikme, tezin en özgün bölümünü doğurdu.
Şimdi geriye dönüp bakınca o hatayı yapan stajyere teşekkür etmem gerektiğini
düşünüyorum. Bilim bazen böyle ilerliyor: plan, kaza, tekrar plan. Verileri
yeniden topladık elbette. Bu sefer protokolü de sıkılaştırdık ki aynı karışıklık
bir daha yaşanmasın. Sonuçlar makalede; yorumu okuyucuya bırakıyorum.
`.trim();

describe("tokenizers", () => {
  it("splits sentences on Turkish punctuation", () => {
    const s = splitSentences("Bu bir deneme. Peki ya bu? Evet!");
    expect(s).toHaveLength(3);
  });

  it("tokenizes Turkish characters and lowercases with tr locale", () => {
    expect(tokenizeWords("Iğdır'da ŞİİR okudum")).toEqual([
      "ığdır",
      "da",
      "şiir",
      "okudum",
    ]);
  });

  it("computes windowed type-token ratio in (0, 1]", () => {
    const words = tokenizeWords(AI_LIKE);
    const ttr = windowedTypeTokenRatio(words);
    expect(ttr).toBeGreaterThan(0);
    expect(ttr).toBeLessThanOrEqual(1);
  });
});

describe("analyzeText", () => {
  it("rejects texts below the minimum word count", () => {
    expect(() => analyzeText("Çok kısa bir metin.")).toThrow(
      new RegExp(`${MIN_WORDS}`),
    );
  });

  it("returns bounded probability, verdict, signals, and stats", () => {
    const result = analyzeText(AI_LIKE);
    expect(result.aiProbability).toBeGreaterThanOrEqual(0);
    expect(result.aiProbability).toBeLessThanOrEqual(100);
    expect(["low", "medium", "high"]).toContain(result.verdict);
    expect(result.signals.length).toBeGreaterThanOrEqual(6);
    for (const signal of result.signals) {
      expect(signal.score).toBeGreaterThanOrEqual(0);
      expect(signal.score).toBeLessThanOrEqual(1);
      expect(signal.detail.length).toBeGreaterThan(0);
    }
    expect(result.stats.words).toBeGreaterThan(MIN_WORDS - 1);
    expect(result.stats.sentences).toBeGreaterThan(5);
  });

  it("scores formulaic uniform text higher than bursty human text", () => {
    const ai = analyzeText(AI_LIKE);
    const human = analyzeText(HUMAN_LIKE);
    expect(ai.aiProbability).toBeGreaterThan(human.aiProbability);
    expect(ai.aiProbability).toBeGreaterThan(50);
    expect(human.aiProbability).toBeLessThan(50);
  });

  it("flags connector and formulaic-phrase overuse in generated-style text", () => {
    const result = analyzeText(AI_LIKE);
    const connector = result.signals.find((s) => s.key === "connector_density");
    const formulaic = result.signals.find((s) => s.key === "formulaic_phrases");
    expect(connector!.score).toBeGreaterThan(0.5);
    expect(formulaic!.score).toBeGreaterThan(0.5);
  });
});
