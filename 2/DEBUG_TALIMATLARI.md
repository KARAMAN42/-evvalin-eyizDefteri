# 🔍 KARANLIK MOD DEBUG TALİMATLARI

## ADIM 1: Test Dosyasını Aç
`ULTRA_DEBUG.html` dosyasını tarayıcıda açın.

### Yapılacaklar:
1. TEST 1 butonuna bas → Ekran rengi değişmeli
2. TEST 2 butonuna bas → Ekran rengi değişmeli + kaydedilmeli
3. Sayfayı yenile → Önceki tercihin yüklenmeli

**Sonuç:**
- ✅ Çalışıyorsa: CSS doğru, JavaScript mantığı doğru
- ❌ Çalışmıyorsa: Tarayıcınız CSS variables desteklemiyor (eski tarayıcı)

---

## ADIM 2: Ana Uygulamayı Test Et
`index.html` dosyasını tarayıcıda açın.

### Yapılacaklar:
1. Splash ekranını geç (yukarı kaydır)
2. **F12** tuşuna bas → Console (Konsol) sekmesini aç
3. Sol üstteki Ay/Güneş ikonuna BAS

### Konsolda Aranacak Mesajlar:

#### BAŞARIYLI DURUMDA GÖRECEĞİNİZ:
```
🎨 setupThemeListeners() BAŞLADI
✅ btn-dark-mode-toggle BULUNDU!
✅ Header button click listener eklendi
🌓 HEADER BUTON TIKLANDI!
⚡ setDarkMode() ÇAĞRILDI
✅ body.classList.add('dark-mode') yapıldı
✅ setDarkMode() BİTTİ
```

#### HATA DURUMUNDA GÖRECEĞİNİZ:
```
❌❌❌ BTN-DARK-MODE-TOGGLE BULUNAMADI! ❌❌❌
```

---

## ADIM 3: Sonucu Raporla

### Senaryo A: "ULTRA_DEBUG.html çalışıyor ama index.html çalışmıyor"
→ HTML'de buton ID'si yanlış veya buton yok
→ Bana şunu söyleyin: "Test çalıştı ama asıl uygulama çalışmıyor"

### Senaryo B: "Her ikisi de çalışmıyor"
→ Tarayıcı sorunu veya CSS desteklenmiyor
→ Bana şunu söyleyin: "Test bile çalışmıyor" + Tarayıcı adı (Chrome/Firefox/Edge)

### Senaryo C: "index.html konsolda BTN BULUNAMADI hatası"
→ HTML'de buton ID'si farklı
→ Bana şunu söyleyin: "Buton bulunamadı hatası var"

### Senaryo D: "Konsol boş, hiçbir mesaj yok"
→ JavaScript çalışmıyor veya hata var
→ F12 → Console sekmesinde KIRMIZI hata mesajları var mı?
→ Bana şunu söyleyin: "Konsol boş" + varsa hata mesajını

---

## NOTLAR
- Konsolda çok fazla debug mesajı göreceksiniz, bu NORMAL
- Mesajlar renkli değilse, Console Filter'ı kontrol edin (All/Verbose olmalı)
- Eğer hiçbir şey göremiyorsanız, sayfayı yenileyip tekrar deneyin
