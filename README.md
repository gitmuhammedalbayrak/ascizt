# 🕋 99 TESBİH: SEFÎNE-İ NÛR (Tasavvuf Fantazisi ASCII RPG)

> *"Men arefe nefsehû fekad arefe rabbehû"*  
> *(Nefsini bilen, Rabbini bilir.)*

**99 Tesbih: Sefîne-i Nûr**, tasavvuf fantazisi, İslam mistisizmi ve felsefi iç monologları bir araya getiren, baştan sona **saf ASCII / Box-Drawing** karakterleriyle tasarlanmış, **2.5D Selçuklu derinlik mimarisine** sahip bir retro RPG deneyimidir.

Oyun, tarayıcıda doğrudan **WebAssembly (AssemblyScript)** motoru ile çalışmakta olup, test süreçlerinin ardından masaüstü (`.exe`) olarak Steam üzerinde yayınlanacak şekilde kurgulanmıştır.

---

## 🌟 Ana Özellikler & Mimari

- **99 Sekans / 3 Büyük Çapraz & 3 Sinematik:**
  - **1 - 33. Bölümler (1. Çapraz - Suret ve Sıfat):** Karakterin temel statları, libası (Derviş Hırkası), silahı (Yol Asâsı), nefsani terbiyeler. *Bölüm 33 sonunda 1. Sinematik.*
  - **34 - 66. Bölümler (2. Çapraz - Gayb ve Kudret):** Manevi haritalar, defterler, metafizik keşifler ve sırlar. *Bölüm 66 sonunda 2. Sinematik.*
  - **67 - 99. Bölümler (3. Çapraz - Cem ve Birlik):** Binit (at), cemiyet, sosyal ilişkiler, nihai vuslat. *Bölüm 99 sonunda 3. ve Nihai Sinematik.*
- **Disco Elysium Tarzı İç Monolog & Diyalog Sistemi:**
  - Sağ panelde dikey diyalog akışı.
  - Dinamik **ASCII Kafa Portreleri** (Nefs-i Emmare, Akıl-ı Me'âş, Kalp-i Selîm, Ruh-ı Latîf, Pîr-i Şeyh Burhâneddin, Sâlik).
  - Statları ve manevi rotayı etkileyen felsefi seçimler.
- **2.5D Düz Selçuklu Derinlik Mimarisi:**
  - Tamamen düz ve mimari derinliğe sahip Selçuklu taş kemerleri, mihrap, sır kapısı, ceviz rahle, sedir sandığı ve zemin halısı.
  - Sakin ve meditatif 750ms nefes ritmi (göz yormayan, vakur atmosfer).
- **8-Bit ASCII Dönemi Müziği (Web Audio API):**
  - Kare ve üçgen dalgalarla bestelenmiş Hicaz makamında mistik 8-bit chiptune arka plan ezgisi ve retro daktilo sesleri.
- **WebAssembly (WASM):**
  - AssemblyScript ile derlenen yüksek performanslı stat ve durum yönetim motoru (`build/release.wasm`).

---

## 🕹️ Kontroller

| Tuş | Eylem |
| :--- | :--- |
| **W, A, S, D / Yön Tuşları** | 2.5D Odada serbestçe hareket etme |
| **SPACE / E** | Nesneleri inceleme & Pîr ile hasbihal etme |
| **1 - 9** | Diyalog seçeneklerini doğrudan seçme |
| **M** | 8-Bit mistik müziği açma / kapatma |
| **ESC** | Terminal Ana Menüsüne dönme |

---

## 🚀 Yerel Olarak Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için:

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **WebAssembly modülünü derleyin (İsteğe bağlı, `release.wasm` repoda mevcuttur):**
   ```bash
   npm run asbuild
   ```

3. **Yerel sunucuyu başlatın:**
   ```bash
   npx http-server -p 8080
   ```

4. Tarayıcınızda açın:  
   👉 **`http://127.0.0.1:8080`**

---

## 📁 Proje Dizin Yapısı

```text
├── assembly/               # WebAssembly (AssemblyScript) kaynak kodları
│   └── index.ts            # Stat ve oda durum yönetimi
├── build/                  # Derlenmiş WebAssembly çıktıları (release.wasm)
├── src/
│   ├── ascii/              # Saf ASCII varlık ve tasarım modülleri (PNG içermez)
│   │   ├── characters.js   # Karakter modelleri ve animasyonlar
│   │   ├── iso_renderer.js # 2.5D Selçuklu derinlik motoru
│   │   ├── logos.js        # Başlık ve açılış ASCII logoları
│   │   ├── portraits.js    # Disco Elysium tarzı ASCII kafa portreleri
│   │   ├── rooms.js        # Makam ve oda grid tanımları
│   │   └── tui.js          # ASCII Box-Drawing çerçeve yardımcıları
│   └── audio.js            # 8-bit Web Audio chiptune synth motoru
├── index.html              # Terminal CRT UI ve ana arayüz
├── game.js                 # Ana oyun döngüsü ve diyalog motoru
└── package.json            # Proje konfigürasyonu
```

---

*Haza min fazlı Rabbi.*
