Yeni Özellikler ve Yapılandırmalar

- Tema ve Dashboard Kabuğu: `ThemeProvider` ve `AppShell` ile uygulama genel iskeleti oluşturuldu (`src/app/layout.tsx:31–38`, `src/components/app-shell.tsx:10–48`).
- Sidebar: Kategorilere ayrılmış, tek kaynaklı yapılandırmaya bağlı, responsive sidebar eklendi (`src/components/sidebar.tsx:18–39`, `:41–71`).
- Merkezi Rotalar: Tüm uygulama rotaları tek dosyada toplandı ve dinamik rotalar için yardımcılar tanımlandı (`src/lib/routes.ts:1–17`).
- Müşteri Listesi Sayfası: `/customers` rotası eklendi ve liste/işlemler bu sayfaya taşındı (`src/app/customers/page.tsx:1–44`).
- Login’de Sidebar Gizleme: `/login` rotasında sidebar otomatik gizlenir (`src/components/app-shell.tsx:11–13`).
- Tema Değiştirici: Üst barda ışık/karanlık tema geçişi için bileşen eklendi (`src/components/theme-toggle.tsx:6–14`).
- CSS Tema Değişkenleri: `.dark :root` değişkenleri eklenerek tema tutarlılığı sağlandı (`src/app/globals.css:69–107`).
- Rota Kullanımları: Tüm sayfalarda yönlendirmeler `routes` üzerinden yapılacak şekilde güncellendi (örnekler: `src/app/page.tsx:20–29`, `src/app/login/page.tsx:44–50`, `src/app/users/page.tsx:103–109`, `:162–167`).

Sidebar Hiyerarşisi

- Genel
  - Ana Sayfa (`/`)
- Müşteriler
  - Liste (`/customers`)
  - Ekle (`/customers/add`)
- Kullanıcılar
  - Liste (`/users`)
  - Ekle (`/users/add`)

Notlar

- Küçük ekranlarda sidebar artık görünür (sol panel), üst bardaki menü düğmesi ile mobil diyalog da kullanılabilir.
- Yeni rotalar eklemek veya menüye yeni kategoriler eklemek için `src/lib/routes.ts` ve `src/components/sidebar.tsx` dosyalarını güncellemek yeterlidir.