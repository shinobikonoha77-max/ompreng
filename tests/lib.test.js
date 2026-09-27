/**
 * Uji unit untuk assets/js/lib.js.
 *
 * Jalankan: node tests/lib.test.js
 */
'use strict';

const assert = require('node:assert/strict');
const lib = require('../assets/js/lib.js');

let lulus = 0;
const gagal = [];

function uji(nama, fn) {
  try {
    fn();
    lulus++;
  } catch (err) {
    gagal.push(nama + ' -> ' + err.message);
  }
}

/* ---------------------------------------------------------------- *
 * Deteksi pemilik & repo dari alamat GitHub Pages
 * ---------------------------------------------------------------- */
uji('deteksiRepo membaca owner dan repo', () => {
  assert.deepEqual(
    lib.deteksiRepo('dwi.github.io', '/ompreng/admin.html'),
    { owner: 'dwi', repo: 'ompreng' }
  );
});

uji('deteksiRepo bekerja untuk situs user (tanpa repo)', () => {
  assert.deepEqual(lib.deteksiRepo('dwi.github.io', '/index.html'), { owner: 'dwi', repo: '' });
  assert.deepEqual(lib.deteksiRepo('dwi.github.io', '/admin.html'), { owner: 'dwi', repo: '' });
  assert.deepEqual(lib.deteksiRepo('dwi.github.io', '/'), { owner: 'dwi', repo: '' });
});

uji('deteksiRepo menolak domain yang bukan github.io', () => {
  assert.equal(lib.deteksiRepo('localhost', '/ompreng/admin.html'), null);
  assert.equal(lib.deteksiRepo('menu.municmlg.com', '/'), null);
  assert.equal(lib.deteksiRepo('127.0.0.1', '/'), null);
});

/* ---------------------------------------------------------------- *
 * Alamat stiker
 * ---------------------------------------------------------------- */
uji('alamatStiker menunjuk langsung ke berkas gambar', () => {
  assert.equal(
    lib.alamatStiker('dwi', 'ompreng', 'SPPG-MLG-01'),
    'https://dwi.github.io/ompreng/m/SPPG-MLG-01.png'
  );
});

uji('alamatStiker tanpa nama repo', () => {
  assert.equal(
    lib.alamatStiker('dwi', '', 'SPPG-MLG-01'),
    'https://dwi.github.io/m/SPPG-MLG-01.png'
  );
});

uji('alamatStiker berakhiran .png supaya browser menampilkannya sebagai gambar', () => {
  assert.match(lib.alamatStiker('a', 'b', 'X'), /\.png$/);
});

/* ---------------------------------------------------------------- *
 * Path berkas
 * ---------------------------------------------------------------- */
uji('path poster, arsip, foto, dan data', () => {
  assert.equal(lib.pathPosterTerbaru('SPPG-MLG-01'), 'm/SPPG-MLG-01.png');
  assert.equal(lib.pathArsipPoster('SPPG-MLG-01', '2026-09-25'), 'm/SPPG-MLG-01/2026-09-25.png');
  assert.equal(lib.pathFoto('SPPG-MLG-01', '2026-09-25'), 'm/SPPG-MLG-01/foto-2026-09-25.jpg');
  assert.equal(lib.pathDataMenu('SPPG-MLG-01', '2026-09-25'), 'data/SPPG-MLG-01/2026-09-25.json');
  assert.equal(lib.pathDaftarDapur(), 'data/dapur.json');
});

/* ---------------------------------------------------------------- *
 * Kebersihan kode dapur
 * ---------------------------------------------------------------- */
uji('kodeAman membersihkan kode berbahaya', () => {
  assert.equal(lib.kodeAman('sppg mlg 01'), 'SPPG-MLG-01');
  assert.equal(lib.kodeAman('  SPPG-MLG-01  '), 'SPPG-MLG-01');
  assert.equal(lib.kodeAman('SPPG--MLG--01'), 'SPPG-MLG-01');
});

uji('kodeAman membuang karakter yang bisa keluar dari folder', () => {
  assert.equal(lib.kodeAman('../../etc/passwd'), 'ETC-PASSWD');
  assert.equal(lib.kodeAman('a/b\\c'), 'A-B-C');
  assert.equal(lib.kodeAman('SPPG?x=1'), 'SPPG-X-1');
});

uji('kodeAman mengubah karakter beraksen dan spasi jadi tanda minus', () => {
  assert.equal(lib.kodeAman('Dapur Cimahi #1'), 'DAPUR-CIMAHI-1');
});

/* ---------------------------------------------------------------- *
 * Tanggal
 * ---------------------------------------------------------------- */
uji('tanggalValid menerima format yang benar dan menolak yang salah', () => {
  assert.equal(lib.tanggalValid('2026-09-25'), true);
  assert.equal(lib.tanggalValid('2026-13-01'), false);
  assert.equal(lib.tanggalValid('25-09-2026'), false);
  assert.equal(lib.tanggalValid(''), false);
  assert.equal(lib.tanggalValid(null), false);
});

uji('tanggalHariIni memakai waktu setempat, bukan UTC', () => {
  // 1 Januari 2026 pukul 07:00 waktu lokal harus tetap 1 Januari,
  // bukan mundur sehari seperti kalau memakai toISOString().
  assert.equal(lib.tanggalHariIni(new Date(2026, 0, 1, 7, 0, 0)), '2026-01-01');
  assert.equal(lib.tanggalHariIni(new Date(2026, 11, 31, 23, 30, 0)), '2026-12-31');
});

uji('tanggal dan hari dalam bahasa Indonesia', () => {
  assert.equal(lib.tanggalIndonesia('2026-09-25'), '25 September 2026');
  assert.equal(lib.hariIndonesia('2026-09-25'), 'Jumat');
  assert.equal(lib.tanggalIndonesia('bukan-tanggal'), '');
});

/* ---------------------------------------------------------------- *
 * Base64
 * ---------------------------------------------------------------- */
uji('teksKeBase64 dan base64KeTeks bolak-balik tetap sama', () => {
  const contoh = 'Menu: nasi putih, ayam bakar, sayur sop — 25 September 2026 ✓';
  assert.equal(lib.base64KeTeks(lib.teksKeBase64(contoh)), contoh);
});

uji('teksKeBase64 menghasilkan base64 yang benar untuk aksen dan emoji', () => {
  assert.equal(lib.teksKeBase64('é'), Buffer.from('é', 'utf8').toString('base64'));
  assert.equal(lib.teksKeBase64('😀'), Buffer.from('😀', 'utf8').toString('base64'));
});

uji('dataUrlKeBase64 mengambil isi PNG dan menolak tipe lain', () => {
  assert.equal(lib.dataUrlKeBase64('data:image/png;base64,AAAB'), 'AAAB');
  assert.equal(lib.dataUrlKeBase64('data:image/jpeg;base64,AAAB'), null);
  assert.equal(lib.dataUrlKeBase64(''), null);
});

uji('ukuranBase64 menghitung ukuran berkas dengan benar', () => {
  const isi = 'contoh isi berkas';
  const b64 = lib.teksKeBase64(isi);
  assert.equal(lib.ukuranBase64(b64), Buffer.byteLength(isi, 'utf8'));
});

/* ---------------------------------------------------------------- *
 * Validasi menu
 * ---------------------------------------------------------------- */
const menuValid = {
  kode: 'SPPG-MLG-01',
  tanggal: '2026-09-25',
  kalori: 620,
  protein: 28.5,
  items: [
    { kategori: 'makanan_pokok', nama: 'Nasi putih', berat_gram: 150 },
    { kategori: 'lauk_hewani', nama: 'Ayam bakar', berat_gram: 70 }
  ]
};

uji('validasiMenu meloloskan data yang lengkap', () => {
  assert.deepEqual(lib.validasiMenu(menuValid), []);
});

uji('validasiMenu menangkap dapur, tanggal, dan komponen yang kosong', () => {
  const salah = lib.validasiMenu({ items: [] });
  assert.equal(salah.length, 3);
});

uji('validasiMenu menolak berat yang bukan angka atau di luar batas', () => {
  const salah = lib.validasiMenu(Object.assign({}, menuValid, {
    items: [{ kategori: 'sayur', nama: 'Sop', berat_gram: 'banyak' }]
  }));
  assert.equal(salah.length, 1);
  assert.match(salah[0], /Berat/);

  const terlaluBesar = lib.validasiMenu(Object.assign({}, menuValid, {
    items: [{ kategori: 'sayur', nama: 'Sop', berat_gram: 99999 }]
  }));
  assert.equal(terlaluBesar.length, 1);
});

uji('validasiMenu menolak kategori yang tidak dikenal', () => {
  const salah = lib.validasiMenu(Object.assign({}, menuValid, {
    items: [{ kategori: 'makanan_terbang', nama: 'Entah', berat_gram: 10 }]
  }));
  assert.equal(salah.length, 1);
  assert.match(salah[0], /Kategori/);
});

uji('validasiMenu menolak gizi negatif', () => {
  const salah = lib.validasiMenu(Object.assign({}, menuValid, { kalori: -5 }));
  assert.equal(salah.length, 1);
  assert.match(salah[0], /kalori/);
});

/* ---------------------------------------------------------------- *
 * Rapikan data
 * ---------------------------------------------------------------- */
uji('rapikanMenu membuang komponen kosong dan mengubah angka', () => {
  const hasil = lib.rapikanMenu({
    kode: 'sppg mlg 01',
    tanggal: '2026-09-25',
    kalori: '620,5',
    items: [
      { kategori: 'makanan_pokok', nama: '  Nasi putih  ', berat_gram: '150' },
      { kategori: 'sayur', nama: '   ', berat_gram: 100 },
      { kategori: 'buah', nama: 'Pisang', berat_gram: '' }
    ]
  });

  assert.equal(hasil.kode, 'SPPG-MLG-01');
  assert.equal(hasil.kalori, 620.5);
  assert.equal(hasil.items.length, 2);
  assert.equal(hasil.items[0].nama, 'Nasi putih');
  assert.equal(hasil.items[0].berat_gram, 150);
  assert.equal(hasil.items[1].berat_gram, null);
});

uji('escHtml menutup karakter berbahaya', () => {
  assert.equal(lib.escHtml('<b>Nasi</b> & "ayam"'), '&lt;b&gt;Nasi&lt;/b&gt; &amp; &quot;ayam&quot;');
  assert.equal(lib.escHtml("'or 1=1"), '&#39;or 1=1');
  assert.equal(lib.escHtml(null), '');
  assert.equal(lib.escHtml(0), '0');
});

uji('angkaGizi menampilkan angka dengan koma desimal', () => {
  assert.equal(lib.angkaGizi(620), '620');
  assert.equal(lib.angkaGizi(28.5), '28,5');
  assert.equal(lib.angkaGizi(null), '-');
});

/* ---------------------------------------------------------------- */
console.log('Lulus: ' + lulus);
if (gagal.length) {
  console.log('GAGAL: ' + gagal.length);
  gagal.forEach(function (g) { console.log('  - ' + g); });
  process.exit(1);
}
console.log('SEMUA UJI LIB LULUS');
