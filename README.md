# 🌟 Neptune Developments - Boost Teslimat Sistemi

## 🚀 Gelişmiş Özellikler
- 🔄 Akıllı Token Rotasyonu
- 🛡️ Anti-Spam Sistemi
- 📊 Detaylı İstatistikler
- 🔍 Token Doğrulama
- 💫 Otomatik Yeniden Deneme
- ⚡ Hızlı Teslimat Modu

## ⚙️ Gelişmiş Kurulum

1. `config.js` yapılandırması:
   ```javascript
   {
     "ownerIDs": ["SAHİP_ID_1", "SAHİP_ID_2"],
     "bot": {
       "id": "BOT_ID",
       "token": "BOT_TOKEN",
       "secret": "BOT_SECRET"
     },
     "web": {
       "url": "http://localhost:3001",
       "port": 3001
     }
   }
   ```

2. Gerekli NPM Modülleri:
   ```bash
   npm i
   ```

3. Token Sistemi:
   - `/tokens/online.txt` → Online üye tokenları
   - `/tokens/offline.txt` → Offline üye tokenları
   - Her satıra bir token gelecek şekilde düzenleyin

4. Veritabanı Yapısı:
   - `/db/database.json` → Teslimat kayıtları
   - Otomatik yedekleme sistemi
   - JSON formatında veri saklama

## 🎮 Komut Sistemi

### 🎁 `/olustur` Komutu
- 🎯 **Kullanım**: `/olustur kullanici:@kullanici miktar:100`
- 📝 **Açıklama**: Belirtilen kullanıcı için üye teslimat kodu oluşturur
- ⚠️ **Not**: Sadece bot sahibi kullanabilir

### 🚚 `/teslimat` Komutu
- 🎯 **Kullanım**: `/teslimat kod:XXXX-XXXX-XXXX-XXXX`
- 📝 **Açıklama**: Kodu kullanarak üye teslimatını başlatır
- ✨ **Özellik**: Akıllı teslimat sistemi
  - Token bazlı üye ekleme
  - İlerleme durumu takibi
  - Otomatik hata telafisi

### 📦 `/stok` Komutu
- 🎯 **Kullanım**: `/stok`
- 📝 **Açıklama**: Mevcut token sayısını gösterir
- 🔄 **Özellik**: Anlık token kontrolü

### 📜 `/kodlar` Komutu
- 🎯 **Kullanım**: `/kodlar kullanici:@kullanici`
- 📝 **Açıklama**: Teslimat kodu geçmişini görüntüler
- 🔄 **Özellik**: Yenile butonu ile anlık güncelleme

## 🔐 Güvenlik Önlemleri
1. Kodlar benzersiz ve 20 karakterden oluşur
2. Her kod sadece belirtilen kullanıcı tarafından kullanılabilir
3. Kullanılmış kodlar tekrar kullanılamaz
4. Tüm işlemler kayıt altına alınır
5. Token güvenliği ve kontrolleri

## ⚡ Akıllı Teslimat Sistemi
- Token bazlı otomatik üye ekleme
- Teslimat durumu anlık takip
- Token kontrolü ve doğrulama
- Hata durumunda otomatik telafi

## ⚠️ Önemli Notlar
- Bot token'ınızı kimseyle paylaşmayın
- Token'ları güvenli bir şekilde saklayın
- Sistem sorunlarında logları kontrol edin
- İşlemler sırasında botun çevrimiçi olduğundan emin olun
- Token'ları düzenli olarak kontrol edin

## 🆘 Hata Çözümleri
1. **Kod Kullanılamıyor**
   - Kodun size ait olduğundan emin olun
   - Kodun daha önce kullanılmadığını kontrol edin
   - Bot'un çevrimiçi olduğunu doğrulayın

2. **Teslimat Yapılamıyor**
   - Token sayısını `/stok` ile kontrol edin
   - Yeterli token olduğundan emin olun
   - Sunucu ayarlarını kontrol edin

3. **Stok Görüntülenemiyor**
   - Token'ların geçerli olduğunu kontrol edin
   - `tokens.txt` dosyasını kontrol edin
   - Bot izinlerini kontrol edin