# Çeyiz Defterim

Şevval ve Yusuf'un ürün, kategori, bütçe ve hazırlıklarını iki cihazdan eş zamanlı takip etmesi için hazırlanmış React + TypeScript + Vite PWA uygulaması.

## Yerel çalışma

```bash
npm install
npm run dev
```

Kalite kontrolleri:

```bash
npm run lint
npm run test
npm run build
```

## Veri ve kimlik doğrulama

- Firebase Authentication arka planda anonim oturum açar; kullanıcıdan e-posta veya şifre istenmez.
- Firestore `products`, `categories` ve `settings/main` yolları gerçek zamanlı dinlenir.
- Firestore kalıcı yerel önbelleği çevrimdışı kullanım ve yeniden bağlanma desteği sağlar.
- Görseller Firebase Storage altında `products/{uid}/...` yoluna yüklenir.
- JSON yedekleme/geri yükleme ve CSV dışa aktarma bulunur.

Firebase istemci yapılandırması gizli değildir; gerçek güvenlik Firestore ve Storage kurallarına bağlıdır. Bu depodaki `firestore.rules` yalnızca Firebase tarafından oluşturulmuş oturumları kabul eder. Giriş ekranı bulunmadığı için canlı uygulamanın adresini bilen bir kişi anonim oturum oluşturabilir; uygulama bağlantısı yalnızca Şevval ve Yusuf ile paylaşılmalıdır.

## Dağıtım

Vercel proje ayarları `vercel.json` içindedir. Üretim dağıtımından önce:

1. `.env.example` içindeki Firebase değerlerini Vercel ortam değişkenleri olarak tanımlayın veya mevcut varsayılan projeyi kullanın.
2. Firebase Console'da yetkili alan adının canlı Vercel alan adı olduğunu doğrulayın.
3. `firebase deploy --only firestore:rules,storage` ile kuralları yetkili bir Firebase hesabından yayınlayın.
4. Lint, test ve build başarılı olduktan sonra üretim dağıtımını yayınlayın.

## Kurtarma notu

GitHub deposundaki eski statik uygulama `2/` klasöründe korunmuştur. Bu kök proje, Vercel'deki V2 üretim dağıtımından 6 Kasım 2026 tarihinde kurtarılan ve yeniden derlenebilir hâle getirilen sürümdür.
