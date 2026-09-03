# BAY-DER Facebook Günlük Paylaşım Botu

Ankara Doğubayazıtlılar Derneği'nin (BAY-DER) Facebook sayfasına **her gün 09:00'da**
Ağrı/Doğubayazıt + Ankara temalı bir paylaşım yapar.

- Metin: **DeepSeek AI** ile üretilir (`DEEPSEEK_API_KEY` varsa). Yoksa hazır Türkçe
  metin havuzundan sırayla seçilir.
- Görsel: `pool/` klasöründeki görseller **en az kullanılandan** başlanarak sırayla
  eklenir. Klasör boşsa ya da `--text-only` verilirse salt metin paylaşılır.
- Görsel dosya adındaki anahtar kelimeye göre (örn. `ararat`, `ishak`, `anitkabir`)
  konu belirlenir; uygun düşmezse genel bir konu seçilir.

## Kurulum (bu Mac'te tamamlandı)

```bash
cd fb-bot
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
.venv/bin/python3 scripts/copy_deepseek_key.py   # opencode anahtarını .env'e kopyalar
chmod +x scripts/*.sh
```

> `fb-bot/.env` ve `fb-bot/data/state.json` `.gitignore` içindedir; GitHub'a
> **yüklenmez**. Token sızarsa Meta'dan iptal edip yenileyin.

## Facebook token alma (tek seferlik)

1. Yönettiğiniz sayfanın admini olduğunuzdan emin olun.
2. [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App**
   → *Business* tipinde bir uygulama oluşturun.
3. [Graph API Explorer](https://developers.facebook.com/tools/explorer/)'ı açın,
   uygulamanızı seçin ve **Add a permission** ile şu izinleri ekleyin:
   `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`,
   `pages_manage_engagement`.
4. **Get Token** butonundan *User Access Token* alın, istediğiniz sayfayı onaylayın.
5. Sorgu alanına `GET /me/accounts` yazıp **Submit** edin. Yanıttaki sayfanın
   `access_token` (Page Access Token) ve `id` (sayfa kimliği) değerlerini kopyalayın.
6. Bu token 60 gün sonra dolar. Kalıcı (expiresiz) yapmak için explorer'da:
   `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=KULLANICI_TOKEN`
   ile uzun ömürlü kullanıcı tokenı alın; bu tokenla `GET /me/accounts` yaparsanız
   dönen **Page Access Token** genellikle süresizdir.
7. Değerleri `fb-bot/.env` içine yazın:

```
FB_ACCESS_TOKEN=<page access token>
FB_PAGE_ID=<sayfa kimliği>   # boş bırakırsan bot /me/accounts'tan otomatik bulur
```

Test: `.venv/bin/python3 post.py --dry-run` → mesajı ve görseli gösterir (göndermez).

## Test komutları

```bash
cd fb-bot
.venv/bin/python3 post.py --dry-run           # AI + görsel, gerçek gönderim YOK
.venv/bin/python3 post.py --dry-run --no-ai   # hazır havuz dener
.venv/bin/python3 post.py --dry-run --text-only
```

Gerçek gönderimi denemek (ilk kez tek post atmak isterseniz):
`.venv/bin/python3 post.py` — sonra durum `data/state.json`'da ilerler.

## Otomatik çalıştırma (günde bir 09:00)

```bash
fb-bot/scripts/install_launchd.sh     # kuruldu (komutu yeniden çalıştırmak günceller)
fb-bot/scripts/uninstall_launchd.sh   # kaldırmak için
launchctl list | grep bayder          # durum kontrolü
```

Saati değiştirmek için plist'teki `StartCalendarInterval > Hour` değerini düzenleyip
scripti yeniden çalıştırın. Loglar: `fb-bot/logs/`.

## Görsel / metin ekleme

- Yeni görsel → `fb-bot/pool/` klasörüne atın. Otomatik olarak döngüye girer.
- Metin havuzu ve tema eşleşmeleri → `fb-bot/content.py`.
- AI davranışı/konu listesi → `fb-bot/ai.py`.
- Dosya adına anahtar kelime (örn. `murat` bir kalıba uymuyorsa `content.py` içine
  `THEMES`/`THEME_LABELS`'a yeni tema ekleyin).
