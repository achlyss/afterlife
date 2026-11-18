# ENTRY — Kiroween 2026: Afterlife (Digital Legacy Planner)

**Status: APLIKASI SELESAI DIBANGUN + TERUJI. Belum daftar, belum submit —
langkah yang butuh akun Mas ada di checklist bawah.**

## 1. Aturan resmi yang dibaca (18 Nov 2026, kiroween.devpost.com/rules)

- **Hadiah:** 1st $30.000, 2nd $20.000, 3rd $10.000; Best Resurrection /
  Frankenstein / Skeleton Crew / Costume Contest masing-masing $5.000;
  Best Startup $10.000; Best Ghost of Kiroween Past $2.000; Best Kiro Crew
  App $1.000; Best Student per kategori $1.500 + 1 tahun Kiro Pro Max;
  Best Demo $1.000; Bonus Blog (100 pemenang, 2.000 kredit Kiro); Social
  Blitz (5 pemenang, 3 bulan Kiro Pro+). Satu proyek hanya bisa menang 1
  Overall ATAU 1 Category, tapi boleh menang Bonus Prize berapapun.
- **Deadline submit: 5 Des 2026, 05:00 WIB** (4 Des 2:00 PM PT). Tanpa
  perpanjangan. Penjurian 16 Des 2026–29 Jan 2027; pemenang ~3 Feb 2027.
- **Kriteria penjurian (5, tanpa bobot tertulis):**
  1. *Potential Impact* — memecahkan masalah nyata untuk audiens nyata;
     berguna, intuitif, mudah diakses; apakah orang sungguh mau memakai?
  2. *Technological Implementation* — seberapa dalam dan terampil Kiro
     dipakai; strategi AI development yang thoughtful; variasi tool Kiro
     yang berdampak; pemahaman fitur Kiro; eksperimen.
  3. *Design* — produk lengkap dan koheren, bukan proof-of-concept;
     intuitif, polished, intentional.
  4. *Innovation/Idea* — kreatif dan novel; berbeda dari konsep yang ada;
     teknologi/sumber daya publik yang tidak biasa digabung dengan unik.
  5. *Presentation* — video menunjukkan proyek jalan end-to-end; pitch
     menjelaskan masalah, audiens, dan kenapa penting; mudah diikuti;
     kreatif dan memorable.
- **Syarat submit:** repo GitHub PUBLIK (bukan GitLab/BitBucket) + lisensi
  open source yang terdeteksi; **direktori `.kiro` WAJIB ada di root repo**
  (jangan masuk .gitignore); URL aplikasi yang jalan; deskripsi teks; video
  demo < 3 menit di YouTube (publik); write-up cara Kiro dipakai.
- **Proyek BARU saja** (dibuat 30 Okt–4 Des 2026). Boleh pakai framework /
  library / starter template standar, tapi harus disclose kode lama yang
  dipakai. **Indonesia BOLEH ikut** — tidak ada di daftar negara yang
  dikecualikan (Quebec, Argentina, Brazil, Italia, Filipina, Rusia, Kuba,
  Iran, Korut, Suriah, Belarus, Crimea, DNR, LNR, UAE, + negara sanksi AS).
  Tim maks 3 orang. Solo boleh.
- **Kredit Kiro gratis:** satu kali 4.000 kredit — harus diminta lewat form
  SEBELUM **2 Des 2026 03:00 WIB** (1 Des 12:00 PM PT); review butuh 48 jam
  kerja; harus di-redeem sebelum 4 Des; kredit yang di-redeem kedaluwarsa
  31 Des 2026.
- **Bonus yang TIDAK bisa kita ambil:** Best Student (Mas bukan mahasiswa),
  Best Ghost of Kiroween Past (butuh terdaftar di Kiroween 2025 — Mas tidak
  ikut), Best Startup (butuh startup + LinkedIn founder — tidak ada).
  **Bonus yang BISA diambil:** Best Demo ($1.000, otomatis dipertimbangkan)
  + Bonus Blog (100 pemenang) + Social Blitz (5 pemenang) — ketiganya hanya
  butuh posting/blog saat submit.

## 2. Ide + kategori yang dipilih

**Aplikasi: Afterlife — Digital Legacy Planner** (perencana warisan digital).
Masalah nyata: kebanyakan orang akan meninggal dengan puluhan akun online
tanpa rencana — foto, uang, langganan terkunci di balik password yang tak
diketahui siapa pun, atau menghantui keluarga selamanya. Afterlife membantu
menjawab dalam satu malam yang tenang: akun apa saja yang saya punya, apa
yang harus terjadi pada masing-masing, dan siapa yang melaksanakannya.

Fitur (semua jalan, bukan mockup):
1. **🪦 The Graveyard** — inventaris akun; tiap akun adalah batu nisan
   (service, username, kategori, pentingnya 1–5, wish: delete /
   memorialize / transfer / keep, heir, catatan). Akun tanpa wish/heir =
   "ghost" (👻) yang harus "ditenangkan".
2. **🕯️ Heirs & The Will** — ahli waris + surat warisan digital yang bisa
   dicetak (print/PDF), lengkap dengan disclaimer "bukan legal will".
3. **🌕 The Séance** — check-in dead-man's switch (ritme 7/14/30/90 hari;
   status `ok → due → overdue → released` + layar rilis). **Simulasi saja:**
   tidak pernah mengirim apa pun — tampilkan persis apa yang *akan*
   dibagikan, supaya bisa diverifikasi selagi hidup.
4. **📊 Haunting Score** — skor kesiapan 0–100 + langkah konkret berikutnya.
5. **🔐 The Vault** — backup terenkripsi AES-GCM (PBKDF2 100.000 iterasi)
   + export/import JSON biasa + data demo + hapus semua.
6. **Privasi by design:** semua data di localStorage; **zero network
   request** (terverifikasi grep — tanpa fetch/XHR/CDN/font eksternal);
   aplikasi menolak menyimpan password (catatan berisi pola password
   ditolak dengan peringatan).

**Kategori: Costume Contest.** Alasannya:
- Aturannya "Build any app" — bebas memilih aplikasi yang paling berguna,
  tidak dipaksa memakai teknologi mati (Resurrection) atau merangkai
  teknologi yang tidak nyambung (Frankenstein) atau membangun DUA aplikasi
  (Skeleton Crew — kerja ganda, berisiko di 16 hari).
- Tema Halloween di sini BUKAN hiasan: metafora kuburan/hantu/séance
  ADALAH arsitektur informasinya — batu nisan = akun, hantu = akun tanpa
  rencana, séance = check-in. Aturan kategori mensyaratkan "spooky design
  elements that enhance your app's function" — persis yang dilakukan
  Afterlife. Topik kematian yang biasanya menakutkan jadi approachable.
- Kaitan dengan kriteria penjurian: Impact (masalah nyata, audiens =
  semua orang dewasa); Implementation (spec-driven Kiro lengkap +
  property-based testing — lihat §4); Design (produk lengkap, bukan PoC;
  tema gelap yang konsisten + aksesibel); Innovation (perencana warisan
  digital yang local-first + tanpa server adalah diferensiator nyata vs
  layanan cloud); Presentation (demo 2 menit yang sudah ditulis naskahnya,
  alur end-to-end yang jelas).

## 3. Cara menjalankan + hasil uji

```sh
cd ~/workspace/hackathons/kiroween-2026
python3 -m http.server 8321
# buka http://localhost:8321/  (atau http://localhost:8321/#demo untuk
# langsung memuat kuburan demo fiktif: 8 akun, 2 ahli waris)
```

Juga bisa dengan double-click `index.html` (jalan dari `file://`).

**Hasil uji (18 Nov 2026, semua di VM ini):**
- `node tests/test.js` — **25/25 lolos** (unit + property-based: skor selalu
  0–100 dan monoton terhadap coverage; state machine check-in tidak pernah
  lompat stage di 300 timeline acak; round-trip enkripsi 20 payload acak).
- `tests/smoke-dom.js` (jsdom, aplikasi asli via HTTP) — **21/21 lolos**:
  seed 8 nisan + 4 hantu, skor 71, status Séance "due", filter ghosts-only,
  tambah akun via dialog, penolakan catatan berisi password, generate surat
  wasiat, check-in, simulasi 40 hari tanpa check-in → layar rilis,
  fallback export terenkripsi saat Web Crypto tak tersedia, persistensi
  localStorage. Tanpa JS error saat load.
- PBT sempat menemukan 1 bug nyata (window "due" tanpa batas bawah untuk
  interval 7 hari) — sudah diperbaiki dengan clamp `dueWindowDays`.
- `node --check` lolos untuk semua file JS.
- Zero network requests terverifikasi (grep: tanpa fetch/XHR/WebSocket dan
  tanpa URL eksternal di index.html/css/js).
- **Yang BELUM bisa diuji di VM ini (jujur):** tampilan visual di browser
  sungguhan. Chrome terkelola di VM menolak start headless ("Hatch WebGL
  domain policy is required"), dan unduhan chrome-headless-shell lewat
  npm timeout 170 detik. Struktur DOM + CSS sudah terverifikasi lewat
  smoke test, tapi **Mas tolong buka sekali di browser sendiri sebelum
  merekam video demo** — cek tampilan nisan, dial skor, dan tema gelapnya.

## 4. Status pemakaian Kiro (jujur)

- **Kiro CLI 3.4.0 TERINSTAL dan jalan** di VM ini (installer resmi
  `curl -fsSL https://cli.kiro.dev/install | bash`; terverifikasi
  `kiro-cli --version` + `kiro-cli diagnostic`). Lokasi:
  `~/.local/bin/kiro-cli`.
- **TAPI: CLI belum login (Not logged in).** Login butuh akun Mas sendiri
  (browser/device flow: GitHub/Google/AWS Builder ID) — saya tidak bisa
  dan tidak boleh melakukannya. Artinya: agen Kiro belum pernah
  menjalankan perintah di proyek ini; implementasi dikerjakan agen Muse
  dengan mengikuti metodologi spec-driven Kiro secara ketat.
- **Yang sudah dibuat mengikuti Kiro (dan ada di repo, siap dipakai begitu
  Mas login):** steering docs (`.kiro/steering/`), spec lengkap
  (`.kiro/specs/afterlife/` — requirements EARS, design, tasks yang sudah
  dicentang), hook on-save-run-tests (`.kiro/hooks/`), konfigurasi MCP
  filesystem+fetch (`.kiro/settings/mcp.json`), custom agent reviewer
  "Graveyard-Keeper" (`.kiro/agents/`). Semua ini dimuat langsung oleh
  Kiro CLI/IDE saat Mas membukanya.
- **Write-up jujur untuk Devpost** sudah disiapkan di `KIRO-USAGE.md`
  (Inggris) — menjelaskan apa yang dipakai, apa yang tidak (Kiro Crew,
  Kiro IDE, Kiro powers), dan status login CLI. Jangan klaim lebih dari
  itu di formulir submit.
- Satu catatan PBT yang dicatat di KIRO-USAGE.md: property test menemukan
  bug window "due" yang lolos dari unit test — bukti nyata pemakaian PBT.

## 5. Isi proyek (`~/workspace/hackathons/kiroween-2026/`, 22 file, 1.926 baris)

| File | Isi |
|---|---|
| `index.html` | Shell aplikasi satu halaman |
| `css/styles.css` | Tema graveyard (gelap, kabut, batu nisan) + print CSS |
| `js/logic.js` | Logika murni (UMD: browser + Node) — semua aturan |
| `js/app.js` | UI wiring (DOM saja) |
| `js/seed.js` | Data demo fiktif (8 akun, 2 ahli waris) |
| `tests/test.js` | 25 unit + property test |
| `tests/smoke-dom.js` | 21 cek DOM via jsdom |
| `tests/run-tests.sh` | Pelari test |
| `.kiro/steering/` | product.md, tech.md, structure.md |
| `.kiro/specs/afterlife/` | requirements.md, design.md, tasks.md |
| `.kiro/hooks/`, `.kiro/settings/`, `.kiro/agents/` | Hook test, MCP, custom agent |
| `README.md` | Dokumen repo (Inggris, untuk juri) |
| `DEMO-SCRIPT.md` | Naskah video demo 2 menit (Inggris) |
| `KIRO-USAGE.md` | Write-up pemakaian Kiro (Inggris, untuk Devpost) |
| `LICENSE` (MIT), `.gitignore` | Lisensi + ignore (tidak meng-ignore `.kiro/`) |

## 6. CHECKLIST — langkah yang HANYA bisa dilakukan Mas

| # | Langkah | Deadline | Cara |
|---|---|---|---|
| (a) | **Minta 4.000 kredit Kiro gratis** — ✅ **TERKIRIM 18 Nov 2026 ~22:15 WIB** ("Your response has been recorded"); review sampai 48 jam kerja; redeem sebelum 4 Des | **SEBELUM 2 Des 2026 03:00 WIB** (1 Des 12:00 PM PT; review 48 jam kerja; redeem sebelum 4 Des) | Daftar dulu di Devpost (b), lalu isi Credit Request Form di tab Resources kiroween.devpost.com — sertakan Kiro user ID / AWS account ID + detail proyek. Tanpa ini, iterasi lanjutan pakai Kiro CLI harus bayar sendiri. |
| (b) | **Daftar di Devpost** (klik "Join Hackathon") — ✅ **SELESAI 18 Nov 2026 ~22:09 WIB** ("Thanks for registering!"; kategori Costume Contest) | Sebelum submit; lakukan SEKARANG supaya bisa minta kredit | https://kiroween.devpost.com/ — butuh akun Devpost gratis (atau login). Pilih kategori **Costume Contest**. |
| (c) | **Buat repo GitHub publik `achlyss/afterlife`** dan push kode | Sebelum submit (lakukan sesudah (b)) | Buat repo publik di github.com/achlyss (nama saran: `afterlife`), tambahkan file LICENSE (sudah ada) supaya terdeteksi open source, lalu push isi folder `~/workspace/hackathons/kiroween-2026/` apa adanya (jangan ubah struktur; `.kiro/` WAJIB ikut — sudah dijamin `.gitignore` tidak meng-ignore-nya). Jangan push dari sebelum 30 Okt — semua file ini baru dibuat 18 Nov, aman. |
| (d) | **Submit di Devpost** | **SEBELUM 5 Des 2026 05:00 WIB** (4 Des 2:00 PM PT) | Isi form "Enter a Submission": kategori Costume Contest, URL repo GitHub, URL aplikasi yang jalan (hosting statis gratis — GitHub Pages/Netlify/Vercel; aplikasi ini file statis, tanpa backend), deskripsi, **video demo YouTube publik (< 3 menit, pakai `DEMO-SCRIPT.md`)**, write-up Kiro (salin dari `KIRO-USAGE.md`). Centang juga Bonus Blog + Social Blitz bila Mas posting blog/sosial dengan hashtag `#KiroweenHackathon26` di awal post. |

**Urutan yang disarankan:** (b) daftar hari ini → (a) minta kredit sebelum 2 Des 03:00 WIB → (c) buat repo + push → rekam video demo (pakai `DEMO-SCRIPT.md`, ~2 menit) + upload ke YouTube publik → (d) submit sebelum 5 Des 05:00 WIB. Bila sempat, login Kiro CLI (`kiro-cli login`) sesudah (a) dan biarkan Kiro membaca `.kiro/` untuk iterasi polish sebelum submit.
