# ACİL DURUM - Tüm Dosyaları Sil ve Sıfırdan Başla Planı

## Durum
- Backup bile çalışmıyor
- Çok fazla değişiklik yapıldı
- Uygulama tamamen bozuldu

## Acil Seçenekler

### Seçenek 1: Yeni Eklenen Dosyaları Kaldır
1. splash-fix.js'i index.html'den kaldır
2. splash-infinity-animation.css'i index.html'den kaldır  
3. Sadece orijinal dosyalarla test et

### Seçenek 2: Git Kullan (Eğer varsa)
1. `git status` - değişiklikleri gör
2. `git reset --hard HEAD` - tüm değişiklikleri geri al
3. Temiz başlangıç

### Seçenek 3: Manuel Temizlik
1. app.js → app_backup.js'ten geri yükle ✅ YAPILDI
- [NEW] `currentItemPhotos` dizisi: O an düzenlenen ürünün fotoğraflarını geçici olarak tutacak.
- [NEW] `setupPhotoListeners()`: Sürükle-bırak ve dosya seçimi dinleyicilerini kuracak.
- [NEW] `handlePhotoUpload(files)`: Dosyaları okuyup Base64'e çevirecek ve boyutu optimize edecek.
- [NEW] `renderPhotoGrid()`: Yüklenen fotoğrafları önizleme alanında gösterecek.
- [MODIFY] `openQuickAddModal`: Düzenleme modunda mevcut fotoğrafları yükleyecek.
- [MODIFY] Kaydetme mantığı: `currentItemPhotos` dizisini ürün objesine kaydedecek.
- [FIX] `btn-save-editor` içindeki `activeListRenderFunction` ReferenceError hatası giderilecek.
- [NEW] **Fotoğraf Görüntüleyici (Lightbox)**: Tıklanan fotoğrafları tam ekran gösterme.
- [NEW] **Pinch-to-Zoom**: Parmakla yakınlaştırma/uzaklaştırma desteği.
- [DELETE] Zoom butonlarının kaldırılması.
- [MODIFY] **Görsel İyileştirme**: Görüntüleyicideki siyah barların kaldırılması, tam ekran (edge-to-edge) görünüm ve buzlu cam efekti.
- [NEW] **Swipe Navigation**: Birden fazla fotoğraf arasında parmakla kaydırarak geçiş yapma desteği.
- [NEW] **Image Indicators**: Kaçıncı fotoğrafta olduğunu gösteren şık noktalar.
- [FIX] `btn-save-editor` içindeki `activeListRenderFunction` ReferenceError hatası giderilecek (Satır 876).
- [MODIFY] Kayıt sonrası `renderApp()` çağrılarak UI güncellenecek.
2. index.html'den yeni script'leri kaldır
3. Tek tek test et

## Şu An Yapılacak
1. MINIMAL_TEST.html'i aç
2. Konsol hatalarına bak
3. Hangi dosya soruna neden oluyor bul
