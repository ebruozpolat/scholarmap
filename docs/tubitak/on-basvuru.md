# BiGG Ön Başvuru — Yapıştırmaya Hazır Metinler

Uygulayıcı kuruluşların (BiGG Masters, Bilişim Vadisi, Girişim Fabrikası, üniversite TTO'ları)
ön başvuru formları benzer soruları sorar. Aşağıdaki metinler form alanlarına doğrudan
yapıştırılabilir; karakter limiti dar olan formlar için her bölümün sonunda **kısa versiyon** var.

> Doldurmadan önce: `[...]` içindeki kişisel bilgileri tamamla.

---

## Girişim adı ve tek cümlelik tanım

**ScholarMap** — Araştırmacılar için yapay zekâ destekli, Türkçe akademik ekosistemi de
kapsayan hepsi-bir-arada literatür keşif ve analiz platformu.

---

## Sorun (müşterinin yaşadığı problem)

Bir araştırmacı literatür taraması için ortalama beş farklı araç arasında gidip gelir: Google
Scholar'da arar, arXiv'de ön baskılara bakar, atıf ilişkilerini ayrı bir araçta izler, bulduklarını
başka bir uygulamada not eder. Anahtar kelime tabanlı arama, aynı kavramı farklı terimlerle
anlatan çalışmaları kaçırır; hangi makalenin hangi literatür kolundan beslendiğini gösteren
atıf analizi ise ya hiç yoktur ya da üniversitelerin ödediği pahalı kurumsal aboneliklerin
(Scopus, Web of Science) arkasındadır. Türkiye özelinde sorun daha derindir: DergiPark'taki
yüz binlerce makale ve YÖK Tez'deki bir milyondan fazla tez, modern keşif araçlarının tamamen
dışındadır — Türkçe akademik üretim uluslararası araçlarda görünmezdir.

**Kısa versiyon:** Araştırmacılar literatür taramasında 5+ kopuk araç kullanıyor; anahtar
kelime araması ilişkili çalışmaları kaçırıyor, atıf analizi pahalı kurumsal aboneliklerin
arkasında ve Türkçe akademik içerik (DergiPark, YÖK Tez) modern keşif araçlarının tamamen dışında.

---

## Çözüm (ürün/hizmet)

ScholarMap, literatür taramasının tüm adımlarını tek platformda toplar: arXiv, Crossref ve
OpenAlex üzerinde gerçek zamanlı arama; DOI veya başlıktan üretilen interaktif atıf haritası
(makale + referansları + ona atıf yapan çalışmalar, tıkla-genişlet); sonuçları anlamlandıran
konu ve trend analizi; kişisel kütüphane ve koleksiyonlar; abonelik tabanlı erişim. Proje
kapsamında platform dört Ar-Ge bileşeniyle akıllı literatür asistanına dönüşecek: (1) kavram
düzeyinde eşleşme yapan çok dilli anlamsal arama — Türkçe sorguyla İngilizce literatür
taranabilecek, (2) bugün canlıda olan atıf haritasının literatür kollarını otomatik tespit
eden 3B analiz aracına dönüştürülmesi, (3) kullanıcının makale kümesi üzerinden
kaynak-atıflı özet üreten LLM destekli literatür sentezi, (4) DergiPark / TR Dizin / YÖK Tez
entegrasyonuyla Türkçe akademik üretimin ilk kez modern anlamsal keşif katmanına taşınması.
Ürün Cloudflare edge mimarisinde çalışır; bu, altyapı maliyetini rakiplerin çok altında tutarak
uygun fiyatlı bireysel abonelik modelini sürdürülebilir kılar.

**Kısa versiyon:** Tek platformda gerçek zamanlı akademik arama + interaktif atıf haritası
(canlıda) + kişisel kütüphane + analiz. Ar-Ge hedefi: çok dilli anlamsal arama (TR sorgu → EN
literatür), atıf haritasına otomatik literatür kolu tespiti ve 3B görselleştirme eklenmesi,
kaynak-atıflı LLM literatür sentezi ve DergiPark/YÖK Tez entegrasyonu.
Edge mimarisi sayesinde rakiplerden çok daha düşük maliyet ve fiyat.

---

## Yenilikçi / özgün yön

1. **Çok dilli anlamsal arama:** Mevcut araçlar anahtar kelime eşleşmesine dayanır. İlk sürüm
   canlıda: Türkçe sorgu, akademik terim eşlemesiyle İngilizce'ye genişletilip OpenAlex'te her iki
   dilde taranıyor (ör. "derin öğrenme ile tümör tespiti" → "deep learning tumor detection"), ve
   Workers AI çok dilli embedding'leriyle (bge-m3) anlam benzerliğine göre yeniden sıralanıyor.
   Ar-Ge ile bu, makale özetlerinin embedding'leri üzerinden tam kavram düzeyinde eşleştirmeye
   derinleştirilecek (hedef: bilinen-öğe testinde ilk-10 isabet ≥%85, TR→EN eşleştirme ≥%75).
2. **Otomatik literatür kolu tespiti:** İnteraktif atıf haritasının ilk sürümü canlıda
   (OpenAlex tabanlı; DOI/başlıktan makale + referansları + atıf yapanlar, tıkla-genişlet).
   Ar-Ge ile atıf/ko-atıf grafında topluluk tespiti (Louvain) eklenerek literatür kolları
   otomatik ayrıştırılacak, temel makaleler merkezîlik ölçütleriyle işaretlenecek ve
   görselleştirme 3B'ye taşınacak.
3. **Kaynak-sadık LLM sentezi:** İlk sürüm canlıda: kullanıcı arama sonuçlarından makale seçer,
   sistem yalnızca seçilen özetleri bağlam alarak (RAG) kaynak-atıflı bir literatür sentezi üretir;
   üretilen her cümle `[n]` biçiminde ilgili makaleye atıfla bağlanır ve model dış olgu eklememeye
   yönlendirilir (Claude Sonnet). Ar-Ge ile bu, otomatik iddia-doğrulama katmanıyla derinleştirilecek
   (hedef: ≥%90 doğrulanabilir iddia oranı) — halüsinasyon kontrolü açık bir araştırma problemidir.
4. **Türkçe akademik ekosistem:** DergiPark, TR Dizin ve YÖK Tez içeriğini anlamsal keşfe açan
   ilk platform olma hedefi; hiçbir küresel rakipte (Semantic Scholar, Elicit, Connected Papers)
   bu kapsam yok.

---

## Pazar ve rakipler

Türkiye'de 208 üniversite, ~180 bin öğretim elemanı ve ~8 milyon üniversite öğrencisi var;
birincil hedef kitle lisansüstü öğrenciler ve araştırmacılardır (bireysel Pro abonelik), ikincil
hedef üniversite kütüphaneleri ve TTO'lardır (kurumsal lisans). Küresel pazarda Semantic Scholar
(ücretsiz ama iş akışı zayıf), Elicit (aylık ~$12+, TR desteği yok), Connected Papers (tek makale
odaklı) ve Scopus/WoS (yalnızca kurumsal, çok pahalı) konumlanmıştır. ScholarMap "Türkçe
akademik ekosistemi de kapsayan, uygun fiyatlı, hepsi-bir-arada akıllı literatür asistanı"
olarak farklılaşır; edge mimarisi sayesinde birim maliyet avantajı fiyata yansıtılabilir.

---

## İş modeli

Freemium SaaS: Ücretsiz katman (10 arama/gün) ile viral edinim; Pro abonelik (sınırsız arama,
gelişmiş analitik, atıf haritası, LLM sentezi) ile gelir. Lemon Squeezy (Merchant of Record)
ödeme altyapısı canlı — şirket kurulumu gerektirmeden yasal olarak ödeme alınabiliyor.
İkinci yıl: üniversite kütüphaneleri/TTO'lara çok kullanıcılı kurumsal lisans.
İlk yıl hedefi: 5.000 kayıtlı kullanıcı, 100+ ödeyen abone, 2 üniversite pilotu.

---

## Mevcut durum (geliştirme aşaması)

Çalışan MVP canlıda: **https://scholarmap.alignxdigital.workers.dev** — arXiv/Crossref/OpenAlex
gerçek zamanlı arama (Türkçe ve tez filtreleri dahil), çok dilli anlamsal aramanın ilk sürümü
(Türkçe sorgu → İngilizce literatür + embedding yeniden sıralama), OpenAlex destekli interaktif
atıf haritası (DOI/başlık → makale + referansları + atıf yapanlar; düğüme tıklayınca özet ve
genişletme), seçilen makalelerden kaynak-atıflı LLM literatür sentezi (Claude Sonnet),
Türkçe akademik metinler için AI dedektörü (ücretsiz edinim aracı), konu/trend analizi
panosu, kişisel kütüphane, Lemon Squeezy ile Pro abonelik akışı ve
147 makalelik başlangıç veri seti. Teknoloji Hazırlık Seviyesi: **TRL 6** (gerçek ortamda
çalışan prototip). Teknik altyapı: React 19 + TypeScript, tRPC, Cloudflare Workers/D1 (edge).
Proje desteğiyle hedef: Ar-Ge bileşenlerinin geliştirilip ürünleştirilmesi ve TRL 8–9'a ulaşmak.

> Panelde en güçlü kartın bu: başvuranların büyük çoğunluğu fikir aşamasında; senin elinde
> çalışan, ödeme alabilen canlı ürün var.

---

## Takım

[Ad Soyad] — Kurucu. [Üniversite/bölüm, mezuniyet yılı veya öğrencilik durumu]. ScholarMap'in
tasarımı ve geliştirmesinin tamamını yürüttü: React/TypeScript ön yüz, tRPC/Cloudflare Workers
arka uç, ödeme entegrasyonu ve veri toplama hattı. [Varsa: yayın, staj, iş deneyimi,
hackathon, önceki proje.]

*(BiGG bireysel başvurudur; ekip üyesi eklenecekse aynı formatta devam et.)*

---

## Neden BiGG / destekle ne yapılacak?

Destek; (1) OpenAlex + DergiPark/TR Dizin/YÖK Tez veri omurgasının kurulması, (2) çok dilli
anlamsal arama motorunun geliştirilmesi, (3) atıf grafiği analizi ve 3B görselleştirme,
(4) kaynak-sadık LLM sentez hattı ve (5) iki üniversite pilotuyla ticarileşme doğrulaması için
kullanılacaktır (14 aylık iş planı, ölçülebilir başarı kriterleri `proje-onerisi.md`'de).
Sermaye desteği ağırlıkla personel (1 tam + 1 yarı zamanlı geliştirici), LLM/embedding API
maliyetleri ve pilot yaygınlaştırma giderlerine ayrılacaktır.

---

## Form dışı hazırlıklar (panel/mülakat için)

- **60 saniyelik asansör konuşması:** "Google Scholar'da arıyorsun ama Türkçe tezler orada yok,
  atıf haritası yok, bulduklarını başka yere not ediyorsun. ScholarMap hepsini tek yerde
  topluyor ve yapay zekâyla Türkçe sorudan İngilizce literatüre ulaştırıyor. Canlıda çalışıyor,
  ödeme altyapısı hazır — destekle bunu Türkiye'nin akademik keşif standardı yapacağız."
- Demo senaryosu: "attention mechanism" araması → trend grafiği → "Attention Is All You Need"
  DOI'siyle atıf haritası (düğüme tıkla, özeti göster, haritayı genişlet) → makaleyi kütüphaneye
  ekleme → Pro'ya yükseltme ekranı. 3 dakikada bitmeli.
- Sık sorulan panel soruları: "Google Scholar ücretsizken neden ödesinler?" (iş akışı + TR içerik
  + sentez), "Veriyi nereden alıyorsun, lisansı ne?" (OpenAlex açık lisans, DergiPark açık erişim),
  "LLM maliyetini nasıl karşılayacaksın?" (kota + önbellek + küçük model fallback).
