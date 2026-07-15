# ScholarMap — Ürün Yol Haritası

Amaç: MVP'yi TÜBİTAK panelinde savunulabilir bir **Ar-Ge ürününe** ve sürdürülebilir bir
SaaS işine dönüştürmek. TÜBİTAK "sıradan yazılım geliştirme"yi desteklemez; değerlendirmede
belirleyici olan, teknik belirsizliği olan özgün bileşenlerdir. Yol haritası buna göre kurgulandı.

## Faz 0 — Temizlik ve sağlamlaştırma (1–2 hafta)

Başvurudan önce demo ve repo profesyonel görünmeli:

- [x] PR #2'yi (ödeme altyapısı + 147 makale) `cf`'e merge et, production'a deploy et
- [ ] Özel alan adı bağla (`scholarmap.io` rotaları `wrangler.toml`'da hazır, yorum satırında)
- [ ] `.env.example` dosyasını tamamla; README'deki kurulum adımlarını doğrula
- [ ] Test kapsamını genişlet (`vitest` kurulu; kritik yol: arama, abonelik, webhook)
- [ ] GitHub Actions CI: lint + typecheck + test her PR'da çalışsın
- [ ] Temel izleme: hata takibi (Sentry/Workers Analytics), kullanım metrikleri
- [ ] Landing sayfasına gerçek ekran görüntüleri + değer önerisi metni (panel jürisi ilk oraya bakar)

## Faz 1 — Veri omurgası (1–3. ay)

Şu an arama arXiv/Crossref'e canlı gidiyor; ölçek ve zenginlik için yerel indeks gerekli:

- [ ] **OpenAlex** entegrasyonu (açık lisanslı, 250M+ çalışma, atıf verisi dahil) — ana omurga
- [ ] Semantic Scholar API bağdaştırıcısı (atıf bağlamları için)
- [ ] **DergiPark / TR Dizin / YÖK Tez** bağdaştırıcıları — Türkçe içerik farklılaştırıcısı
- [ ] Meta-veri normalizasyon katmanı (DOI eşleme, yazar birleştirme, mükerrer temizliği)
- [ ] D1'den ölçeklenebilir depoya geçiş planı (büyük indeks için R2 + Vectorize)

## Faz 2 — Anlamsal arama (3–7. ay) · Ar-Ge

- [ ] Özet embedding'leri (çok dilli model — TR sorgu ile EN makale eşleşmeli)
- [ ] Vektör indeksi (Cloudflare Vectorize) + hibrit sıralama (BM25 + vektör + atıf ağırlığı)
- [ ] Değerlendirme seti: bilinen-öğe testi, ilk-10 isabet ölçümü (başarı kriteri: ≥%85)
- [ ] "Benzer makaleler" ve "bu makaleyi okuyanlar" önerileri

## Faz 3 — Atıf grafiği ve görselleştirme (5–9. ay) · Ar-Ge

`plan.md`'deki 3B yıldız haritası fikri burada ürünleşiyor:

- [ ] Atıf/ko-atıf grafı çıkarımı (OpenAlex referans verisi)
- [ ] Louvain topluluk tespiti → literatür kollarının otomatik renklendirilmesi
- [ ] Merkezîlik ölçütleriyle "temel makale" (seminal paper) tespiti
- [ ] İnteraktif 3B görselleştirme (react-force-graph-3d) — Pro özelliği

## Faz 4 — LLM literatür sentezi (7–12. ay) · Ar-Ge

- [x] RAG mimarisi: kullanıcının seçili makaleleri üzerinden kaynak-atıflı özet üretimi (Workers AI Llama — harici API anahtarı yok)
- [x] Cümle düzeyinde kaynak gösterimi (`[n]` işaretleri + tıklanabilir kaynak listesi)
- [ ] Sadakat (faithfulness) değerlendirme hattı
- [ ] "Bu iki makaleyi karşılaştır", "bu alandaki açık problemler" şablon sorguları
- [x] Maliyet kontrolü: küçük model (Llama 3.1 8B fp8) + makale sayısı üst sınırı (12); kota katmanı sonraki adım
- [ ] Pro kota / ücretsiz katman sınırları

## Faz 5 — Ticarileşme (10–14. ay)

- [ ] Kurumsal panel (üniversite kütüphaneleri/TTO'lar için çoklu kullanıcı lisansı)
- [ ] KVKK uyum dokümantasyonu, veri işleme sözleşmeleri
- [ ] 2 üniversite pilotu; akademik konferanslarda tanıtım
- [ ] Fiyatlandırma iterasyonu (TR pazarına yerel fiyat, uluslararası USD fiyat)

## Öncelik özeti

Panelde en çok puan getirecek üç şey:
1. **Çalışan canlı demo** (var — güçlendir: özel domain, gerçek veri, akıcı UX)
2. **Türkçe akademik ekosistem entegrasyonu** (kimsede yok — en güçlü farklılaşma ve "yerli katma değer" anlatısı)
3. **Ölçülebilir Ar-Ge kriterleri** (İP tablosundaki isabet/NMI/sadakat metrikleri — "yazılım projesi değil Ar-Ge projesi" algısını bu kurar)
