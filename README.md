# Menu Ompreng SPPG — versi GitHub Pages (gratis, tanpa beli domain)

Sistem stiker QR untuk ompreng. Satu stiker ditempel di ompreng, **dicetak sekali
dan tidak pernah diganti**. Saat di-scan pakai kamera HP, yang muncul **hanya file
gambarnya** — poster menu hari itu, lengkap dengan komponen menu, gizi makro, berat
porsi, dan asal dapurnya.

Versi ini tidak butuh server, tidak butuh database, tidak butuh beli domain, dan
tidak butuh kartu kredit. Semuanya jalan di **GitHub Pages** dengan alamat gratis
seperti `https://namaakun.github.io/ompreng/`.

---

## Yang perlu kamu tahu dulu

### 1. QR itu isinya link, bukan gambar

QR code selalu berisi link. Jadi yang dicapai adalah begini: QR berisi link ke
**file gambar** (`.png`), bukan ke halaman web.

| | Hasil |
|---|---|
| Yang kamu mau | Scan → langsung tampil gambar menu |
| Cara kerjanya | QR menunjuk ke `https://namaakun.github.io/ompreng/m/SPPG-MLG-01.png` |
| Di HP terlihat | Hanya posternya, memenuhi layar |
| Tetap terlihat sekilas | Notifikasi kecil berisi alamat saat kamera mendeteksi QR. Ini bawaan iOS/Android dan tidak bisa dimatikan |

### 2. Perubahan butuh 1–10 menit sampai terlihat

GitHub perlu waktu membangun ulang situs (sekitar 1 menit), lalu menyimpan
cache sekitar 10 menit. Jadi setelah menekan **Simpan Menu**:

- Segera: data sudah masuk ke GitHub
- ±1 menit: situs selesai dibangun ulang
- Sampai 10 menit: HP yang men-scan baru melihat gambar barunya

Kalau menu diisi pagi hari, tidak masalah sama sekali. Untuk memeriksa lebih
cepat, di halaman menu ada tautan **"buka dengan penanda waktu"** yang menembus
cache browser.

### 3. Repo harus publik

GitHub Pages gratis hanya jalan di repo publik. Wajar — gambarnya memang untuk
dilihat banyak orang. Tapi jangan taruh hal rahasia di repo ini.

### 4. Alamat di QR tercetak permanen

Karena itu **jangan ganti nama repo setelah stiker dicetak**, dan jangan ganti
kode dapur. Kalau salah satunya berubah, semua stiker lama tidak berlaku dan
harus dicetak ulang.

---

## Cara memasang (sekali saja, kira-kira 15 menit)

### Langkah 1 — Buat akun GitHub

Buka <https://github.com/signup>. Gratis, tidak perlu kartu kredit.
Catat **username** kamu, nanti dipakai di alamat situs.

### Langkah 2 — Buat repo baru

1. Buka <https://github.com/new>
2. **Repository name**: `ompreng` (harus tanpa spasi, huruf kecil lebih aman)
3. Pilih **Public**
4. Klik **Create repository**

### Langkah 3 — Unggah semua berkas

Cara paling gampang, tanpa aplikasi tambahan:

1. Buka halaman repo yang baru dibuat
2. Klik **uploading an existing file** (atau menu **Add file → Upload files**)
3. Buka folder `ompreng-github` di komputermu, **pilih semua isinya**
   (termasuk folder `assets`, `data`, `m`, dan berkas `.nojekyll`)
4. Seret semuanya ke jendela GitHub
5. Tunggu sampai selesai, lalu klik **Commit changes**

> Pastikan berkas `.nojekyll` ikut terunggah. Berkas itu yang membuat GitHub
> menyajikan gambar apa adanya tanpa diproses dulu.

### Langkah 4 — Nyalakan GitHub Pages

1. Di halaman repo, klik **Settings**
2. Di menu kiri, klik **Pages**
3. Bagian **Source**, pilih **Deploy from a branch**
4. **Branch**: pilih `main`, folder pilih **/ (root)**
5. Klik **Save**
6. Tunggu 1–2 menit, lalu muat ulang halaman itu

Alamat situsmu akan muncul di atas, bentuknya:

```
https://NAMAKUN.github.io/ompreng/
```

Buka alamat itu. Kalau halaman beranda sudah tampil, berarti sudah berhasil.

### Langkah 5 — Buat token untuk admin

Token ini yang membuat halaman admin bisa menyimpan data ke repo.

1. Buka <https://github.com/settings/personal-access-tokens/new>
2. **Token name**: `menu ompreng`
3. **Expiration**: pilih **No expiration** (biar tidak perlu diperbarui terus)
4. **Repository access**: pilih **Only select repositories** → pilih repo `ompreng`
5. **Permissions** → **Repository permissions**:
   - Cari **Contents**, ubah menjadi **Read and write**
   - (Biarkan yang lain apa adanya)
6. Klik **Generate token** di bawah
7. **Salin tokennya sekarang** (hanya muncul sekali), bentuknya `github_pat_...`

### Langkah 6 — Hubungkan halaman admin

1. Buka `https://NAMAKUN.github.io/ompreng/admin.html`
2. Isi **Token GitHub** dengan token tadi. Pemilik repo dan nama repo biasanya
   sudah terisi sendiri dari alamat situs
3. Klik **Simpan & Cek Koneksi**
4. Kalau muncul **"Tersambung ke ..."** berarti sudah beres

> Token disimpan hanya di browser yang kamu pakai (localStorage), tidak pernah
> dikirim ke mana pun selain GitHub. Kalau nanti mengisi dari HP atau komputer
> lain, tempel ulang tokennya di sana.

### Langkah 7 — Tambah dapur dan cetak stiker

1. Di halaman admin, isi form **Tambah Dapur**:
   - **Kode dapur**: `SPPG-MLG-01` (huruf besar, angka, tanda minus) — ini yang masuk ke QR
   - **Nama dapur**: `SPPG Municmlg 01`
2. Klik **Simpan Dapur**, tunggu sampai muncul pesan berhasil
3. Buka menu **Cetak Stiker**, atur jumlah stiker dan nomor ompreng awalnya
4. Klik **Cetak / Simpan PDF**

### Langkah 8 — Isi menu setiap hari

1. Buka menu **Menu Harian**, pilih tanggal, klik **+ Isi Menu**
2. Isi komponen menu, gizi, dan unggah foto masakan
3. Klik **Simpan Menu**
4. Tunggu 1–10 menit. Stiker tidak perlu disentuh lagi

---

## Kalau ada masalah

| Gejala | Sebab dan solusinya |
|---|---|
| Halaman situs belum muncul | GitHub Pages butuh 1–2 menit setelah diaktifkan. Cek juga di **Settings → Pages** apakah sudah ada tanda centang hijau |
| "Token ditolak" | Token salah salin atau sudah kedaluwarsa. Buat token baru di langkah 5 |
| "Repo tidak ditemukan" | Nama pemilik atau nama repo salah, atau token belum diberi akses ke repo itu |
| "Token tidak punya izin yang cukup" | Ulangi langkah 5, pastikan **Contents** disetel **Read and write** |
| Data tersimpan tapi gambar belum berubah | Tunggu 10 menit. Ini cache GitHub Pages, bukan kesalahan |
| Scan QR tapi gambar tidak muncul | Cek alamatnya di browser HP. Kalau 404, berarti menu untuk dapur itu belum pernah disimpan |
| Halaman admin minta token terus | Token hanya tersimpan di browser yang dipakai saat mengisinya. Kalau ganti browser/HP, tempel ulang tokennya di **Setelan GitHub** |
| Foto tidak muncul di poster | Coba simpan ulang menu. Kalau tetap gagal, perkecil dulu fotonya (maksimal 12 MB) |

---

## Isi folder ini

```
index.html              beranda publik (daftar dapur)
admin.html              halaman admin: setelan token, kelola dapur, daftar menu
menu.html               form isi menu harian + pratinjau poster
cetak.html              cetak stiker QR
.nojekyll               diminta GitHub supaya berkas disajikan apa adanya
assets/
  css/app.css           tampilan
  js/lib.js             logika murni: alamat, path, tanggal, validasi
  js/gh.js              pembungkus GitHub API
  js/data.js            cara membaca data
  js/admin.js           logika halaman admin
  js/menu.js            logika form menu
  js/poster.js          penggambar poster (canvas)
  js/stiker.js          pembuat QR untuk stiker
  js/qrcode.js          pustaka QR (MIT, Kazuhiko Arase)
data/
  dapur.json            daftar dapur
  <KODE>/<tanggal>.json data menu per tanggal
m/
  <KODE>.png            gambar menu terbaru  <-- INI YANG DIMASUKKAN KE QR
  <KODE>/<tanggal>.png  arsip gambar per tanggal
  <KODE>/foto-*.jpg     foto menu yang diunggah
tests/
  lib.test.js           uji logika murni (Node, tanpa browser)
  tautan.test.js        uji statis: rujukan berkas dan id elemen
  verify.html           pemeriksa gambar QR dan poster, dibuka manual
```

## Menjalankan uji

**Logika murni** (alamat, path berkas, tanggal, validasi) — tidak butuh browser:

```bash
node tests/lib.test.js
```

**Uji statis** — memastikan tiap halaman hanya merujuk berkas yang benar-benar
ada, dan JavaScript hanya mencari elemen yang benar-benar ada di halamannya.
Uji ini menangkap salah ketik nama berkas atau salah `id` tanpa perlu browser:

```bash
node tests/tautan.test.js
```

**Gambar QR dan poster** — buka `tests/verify.html` di browser biasa kamu:
klik dua kali berkasnya, atau lewat server lokal lalu buka
`http://127.0.0.1:8200/tests/verify.html`.

Hasilnya tampil di layar, contohnya `Lulus 5 dari 5`. Yang diperiksa:

- QR digambar tepat satu modul per kotak, dibandingkan satu per satu dengan
data QR yang seharusnya
- Zona kosong di pinggir QR tetap putih (syarat utama QR bisa dibaca HP)
- Poster tergambar penuh, warna kepala dan kotak gizinya benar
- Poster tanpa komponen tidak membuat halaman error

> **Jangan pakai Chrome headless atau otomatisasi browser untuk ini.**
> Chrome headless yang dijalankan dengan profil baru akan meminta password
> Keychain macOS ("Chrome Safe Storage") setiap kali, dan itu sangat
> mengganggu. Bukanya manual saja sekali, hasilnya sama.

## Menjaga ukuran repo

Repo GitHub gratis disarankan tetap di bawah 1 GB. Tiap hari aplikasi ini
menambah sekitar 300–500 KB (gambar poster + foto). Artinya sekitar 5–10 tahun
pemakaian. Kalau nanti terasa besar, folder `m/<KODE>/` (arsip) boleh dihapus
sebagian — yang wajib ada hanya `m/<KODE>.png`.

## Beda dengan versi PHP

Folder `Projek/ompreng` berisi versi PHP + database. Versi itu dipakai kalau
nanti kamu mau memasangnya di hosting sendiri (misalnya subdomain `municmlg.com`).
Bedanya:

| | Versi PHP | Versi GitHub Pages |
|---|---|---|
| Biaya | Rp0 kalau sudah punya hosting | Rp0, tanpa hosting sama sekali |
| Alamat | `menu.namadomainmu.com` | `namaakun.github.io/ompreng` |
| Ganti menu terlihat | langsung | 1–10 menit |
| Menyimpan data | database | commit ke repo GitHub |
| Bisa pindah alamat | ya, tinggal arahkan domain | tidak, alamat ikut nama akun dan repo |

Bagian tampilan, penggambar poster, dan pembuat QR-nya sama, tapi berkasnya
memang dua salinan terpisah karena dua tempat ini tidak bisa saling meminjam
berkas.
