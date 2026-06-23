# Akademik Arama SaaS — Plan

## Ürün Vizyonu
Attention mechanism (ve genişletilebilir şekilde tüm akademik konular) için premium bir araştırma platformu.

## Özellikler
### MVP (V1)
1. **Gelişmiş Arama** — arXiv + Google Scholar entegrasyonu, keyword, yazar, yıl filtresi
2. **İnteraktif Dashboard** — sonuçları tablo/kart görünümü, sıralama, filtreleme
3. **Konu Analizi** — otomatik konu kategorizasyonu, trend grafikleri, atıf dağılımı
4. **Kullanıcı Kütüphanesi** — favori makaleleri kaydetme, koleksiyon oluşturma
5. **Abonelik Sistemi** — Free (10 arama/gün) / Pro (sınırsız + ileri analiz)
6. **Auth** — Kimi OAuth ile giriş

## Teknik Stack
- **Frontend**: React 19 + TypeScript + Tailwind + shadcn/ui
- **Backend**: tRPC + Drizzle ORM + Hono + MySQL
- **Auth**: Kimi OAuth
- **Deployment**: *.kimi.page (dynamic)

## Aşamalar
1. Phase 1: Init project + backend graft (db, auth)
2. Phase 2: Pro_Designer ile UI/UX tasarımı
3. Phase 3: Scaffold (landing + shared components)
4. Phase 4: Sayfa implementasyonları (parallel)
5. Phase 5: Merge, build, deploy
