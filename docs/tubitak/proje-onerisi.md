# ScholarMap — Ar-Ge Proje Önerisi Çekirdeği

> Bu doküman program-bağımsız yazılmıştır: BiGG iş planı şablonuna veya 1507 proje önerisi
> formatına (AGY101) aktarılacak içeriğin tek kaynağıdır.

## 1. Proje özeti

ScholarMap, araştırmacıların akademik literatürü **tek noktadan araması, görselleştirmesi ve
anlamlandırması** için geliştirilen yapay zekâ destekli bir araştırma platformudur. Mevcut MVP;
arXiv ve Crossref üzerinde gerçek zamanlı arama, kişisel kütüphane, konu/trend analizi ve
abonelik altyapısını (Lemon Squeezy) Cloudflare edge mimarisi üzerinde sunmaktadır
(canlı: https://scholarmap.alignxdigital.workers.dev).

Proje kapsamında MVP, dört Ar-Ge bileşeniyle **akıllı literatür asistanına** dönüştürülecektir:
anlamsal (vektör) arama, atıf grafiği analizi ve görselleştirme, büyük dil modeli (LLM) destekli
literatür sentezi ve Türkçe akademik ekosistem entegrasyonu (DergiPark, TR Dizin, YÖK Tez).

## 2. Sorun ve mevcut durum

- Bir araştırmacı literatür taramasında ortalama 5+ farklı araç kullanır (Google Scholar, arXiv,
  Scopus, atıf takip araçları, not uygulamaları); bilgi kopuk ve dağınıktır.
- Anahtar kelime tabanlı arama, kavramsal olarak ilişkili ama farklı terminoloji kullanan
  çalışmaları kaçırır.
- Atıf ilişkileri (hangi çalışma hangi literatür kolundan besleniyor) mevcut araçlarda ya yoktur
  ya da pahalı kurumsal aboneliklerin arkasındadır.
- Türkçe akademik üretim (DergiPark ~700 bin+ makale, YÖK Tez ~1M+ tez) uluslararası keşif
  araçlarının tamamen dışındadır.

## 3. Önerilen çözüm ve özgün/yenilikçi yön

| Ar-Ge bileşeni | Yenilikçi yön | Teknik yaklaşım |
|---|---|---|
| **Anlamsal arama** | Anahtar kelime değil kavram düzeyinde eşleşme; çok dilli (TR/EN) sorgu desteği | Makale özeti embedding'leri (çok dilli model), vektör indeksi (Cloudflare Vectorize / pgvector), hibrit sıralama (BM25 + vektör) |
| **Atıf grafiği analizi** | Literatür kollarının otomatik tespiti ve interaktif 3B "yıldız haritası" görselleştirmesi | Atıf/ko-atıf grafı çıkarımı (OpenAlex/Semantic Scholar verisi), Louvain topluluk tespiti, merkezîlik ölçütleriyle "temel makale" tespiti |
| **LLM literatür sentezi** | Seçilen makale kümesi üzerinden kaynak-atıflı özet ve karşılaştırma üretimi (halüsinasyon kontrolü ile) | RAG mimarisi: yalnızca kullanıcının kümesindeki makalelerden alıntılayan, cümle-düzeyi kaynak gösteren sentez |
| **Türkçe akademik entegrasyon** | DergiPark/TR Dizin/YÖK Tez içeriğinin ilk kez modern anlamsal keşif katmanına taşınması | Kaynak bağdaştırıcıları (adapter), TR-EN çapraz dil eşleştirme, meta-veri normalizasyonu |

**Teknoloji Hazırlık Seviyesi (TRL):** Mevcut MVP TRL 6 (gerçek ortamda çalışan prototip);
proje sonunda hedef TRL 8–9 (ticari ürün).

**Neden Ar-Ge?** Çok dilli anlamsal eşleştirme kalitesi, atıf grafında topluluk tespitinin
literatür kollarıyla örtüşme doğruluğu ve LLM sentezinde kaynak sadakati (faithfulness) açık
araştırma problemleridir; her biri için ölçülebilir başarı kriteri tanımlanmıştır (bkz. İP'ler).

## 4. İş paketleri

| İP | Başlık | Süre | Çıktı ve başarı kriteri |
|----|--------|------|------------------------|
| İP1 | Veri altyapısı: OpenAlex/Semantic Scholar/DergiPark bağdaştırıcıları, meta-veri normalizasyonu | 1–3. ay | ≥5M makale meta-verisi indekslenmiş; kaynak başına ≥%95 alan bütünlüğü |
| İP2 | Anlamsal arama motoru: embedding üretimi, vektör indeksi, hibrit sıralama | 3–7. ay | Bilinen-öğe testinde ilk-10 isabet ≥%85; TR sorgu → EN sonuç eşleştirme ≥%75 |
| İP3 | Atıf grafiği analizi ve 3B görselleştirme | 5–9. ay | Topluluk tespiti ile uzman etiketli literatür kolları arasında ≥0.6 NMI; 10K düğümde <2 sn etkileşim gecikmesi |
| İP4 | LLM literatür sentezi (RAG) | 7–12. ay | Üretilen özetlerde cümle düzeyi kaynak gösterimi; sadakat değerlendirmesinde ≥%90 doğrulanabilir iddia oranı |
| İP5 | Ticarileşme: kurumsal panel, kullanım analitiği, güvenlik/KVKK uyumu, pilot müşteriler | 10–14. ay | 2 üniversite/TTO pilotu; ödeme yapan ≥100 bireysel kullanıcı |

## 5. Pazar ve rakip analizi

**Pazar:** Küresel akademik araştırma yazılımları pazarı milyarlarca dolar ölçeğindedir;
Türkiye'de 208 üniversite, ~180 bin öğretim elemanı ve ~8 milyon üniversite öğrencisi
bulunmaktadır. Birincil hedef: lisansüstü öğrenciler ve araştırmacılar (bireysel Pro abonelik),
ikincil hedef: üniversite kütüphaneleri/TTO'lar (kurumsal lisans).

| Rakip | Güçlü yönü | ScholarMap farkı |
|---|---|---|
| Semantic Scholar | Dev veri, ücretsiz | Kişisel kütüphane/iş akışı zayıf; TR içerik yok |
| Connected Papers | Atıf grafiği görselleştirme | Tek makale odaklı; arama/kütüphane/sentez yok |
| Elicit | LLM destekli tarama | Pahalı (aylık ~$12+); TR desteği yok |
| ResearchRabbit / Litmaps | Keşif ve harita | Sentez yok; TR ekosistemi yok |
| Scopus / WoS | Kurumsal standart | Çok pahalı; bireysel erişim yok |

**Konumlandırma:** "Türkçe akademik ekosistemi de kapsayan, uygun fiyatlı, hepsi-bir-arada
akıllı literatür asistanı." Edge mimarisi (Cloudflare Workers) sayesinde altyapı maliyeti
rakiplerin çok altındadır; bu, agresif fiyatlamayı sürdürülebilir kılar.

## 6. Ticarileşme planı

- **Gelir modeli:** Freemium — Free (10 arama/gün) / Pro (sınırsız + analitik + sentez).
  Lemon Squeezy (Merchant of Record) ödeme altyapısı canlıdır — şirket kurulumundan önce de yasal olarak ödeme alınabilir. Kurumsal lisans (üniversite/TTO) 2. yıl hedefi.
- **1. yıl hedefleri:** 5.000 kayıtlı kullanıcı, 100+ Pro abone, 2 kurumsal pilot.
- **Büyüme kanalları:** Akademik Twitter/X ve LinkedIn, lisansüstü öğrenci toplulukları,
  TTO iş birlikleri, DergiPark entegrasyonunun yaratacağı organik TR trafiği.
- **Fikri mülkiyet:** Kaynak kodu kapalı; marka tescili (ScholarMap) başvurusu proje
  başlangıcında yapılacak.

## 7. Riskler ve önlemler

| Risk | Olasılık | Önlem |
|---|---|---|
| Veri sağlayıcı API limit/politika değişikliği | Orta | Çoklu kaynak (OpenAlex ana omurga — açık lisanslı), yerel önbellekleme |
| LLM maliyetlerinin fiyatlamayı zorlaması | Orta | Küçük/açık modellerle embedding, sentezde kullanım kotası, önbellek |
| Büyük oyuncuların benzer özellik çıkarması | Orta | TR ekosistem entegrasyonu ve fiyat avantajıyla nişte derinleşme |
| KVKK/veri güvenliği | Düşük | Kullanıcı verisi minimizasyonu, AB/TR veri lokasyonu seçenekleri |

## 8. Bütçe kalemleri (taslak)

| Kalem | Açıklama |
|---|---|
| Personel | 1 kurucu tam zamanlı + 1 yarı zamanlı geliştirici (12–14 ay) |
| Hizmet alımı | LLM API kullanımı, embedding üretimi, tasarım |
| Bulut altyapı | Cloudflare Workers/D1/Vectorize/R2, izleme |
| Donanım | Geliştirme bilgisayarı |
| Seyahat/tanıtım | Akademik konferans standları, pilot üniversite ziyaretleri |
| Marka/hukuk | Marka tescili, sözleşmeler, KVKK danışmanlığı |

*Tutarlar, başvurulan programın güncel üst limitlerine göre uygulayıcı kuruluş/PRODİS
şablonunda detaylandırılacaktır.*
