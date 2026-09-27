/**
 * Uji statis tanpa browser.
 *
 * Menangkap dua kesalahan yang paling sering terjadi di halaman statis:
 *  1. Halaman merujuk berkas yang tidak ada (salah nama atau salah folder)
 *  2. JavaScript mencari elemen yang tidak ada di halamannya (salah id)
 *
 * Jalankan: node tests/tautan.test.js
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const AKAR = path.join(__dirname, '..');

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

function baca(relatif) {
  return fs.readFileSync(path.join(AKAR, relatif), 'utf8');
}

function ada(relatif) {
  return fs.existsSync(path.join(AKAR, relatif));
}

/** Semua rujukan berkas lokal di dalam sebuah HTML. */
function rujukanLokal(html) {
  const hasil = [];
  const pola = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let cocok;

  while ((cocok = pola.exec(html)) !== null) {
    const nilai = cocok[1];

    // Lewati tautan keluar, tautan dalam halaman, dan data URL.
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(nilai)) { continue; }
    // Lewati query string dan penanda waktu.
    hasil.push(nilai.split('?')[0].split('#')[0]);
  }

  return hasil;
}

const HALAMAN = ['index.html', 'admin.html', 'menu.html', 'cetak.html', 'tests/verify.html'];

/* ---------------------------------------------------------------- *
 * 1. Semua berkas yang dirujuk harus ada
 * ---------------------------------------------------------------- */
HALAMAN.forEach(function (halaman) {
  uji('berkas yang dirujuk ' + halaman + ' semuanya ada', function () {
    const html = baca(halaman);
    const folder = path.dirname(halaman);

    const hilang = rujukanLokal(html).filter(function (r) {
      const relatif = path.posix.normalize(path.posix.join(folder === '.' ? '' : folder, r));
      return !ada(relatif);
    });

    if (hilang.length) {
      throw new Error('tidak ditemukan: ' + hilang.join(', '));
    }
  });
});

/* ---------------------------------------------------------------- *
 * 2. Setiap halaman memuat lib.js
 * ---------------------------------------------------------------- */
const PAKAI_LIB = ['index.html', 'admin.html', 'menu.html', 'cetak.html'];

PAKAI_LIB.forEach(function (halaman) {
  uji(halaman + ' memuat lib.js sebelum skrip lainnya', function () {
    const html = baca(halaman);
    const posisi = html.indexOf('assets/js/lib.js');

    if (posisi === -1) { throw new Error('lib.js tidak dimuat'); }

    ['gh.js', 'data.js', 'admin.js', 'menu.js', 'poster.js', 'stiker.js'].forEach(function (lain) {
      const posisiLain = html.indexOf('assets/js/' + lain);
      if (posisiLain !== -1 && posisiLain < posisi) {
        throw new Error(lain + ' dimuat sebelum lib.js');
      }
    });
  });
});

/* ---------------------------------------------------------------- *
 * 3. Setiap id yang dicari JavaScript harus ada di halaman yang memakainya
 * ---------------------------------------------------------------- */
const PASANGAN = [
  ['admin.html', 'assets/js/admin.js'],
  ['menu.html', 'assets/js/menu.js']
];

function idDipakai(kode) {
  const hasil = new Set();
  const pola = /getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
  let cocok;

  while ((cocok = pola.exec(kode)) !== null) {
    hasil.add(cocok[1]);
  }

  return Array.from(hasil);
}

PASANGAN.forEach(function ([halaman, skrip]) {
  uji(skrip + ' hanya mencari id yang ada di ' + halaman, function () {
    const html = baca(halaman);
    const kode = baca(skrip);

    const hilang = idDipakai(kode).filter(function (id) {
      return html.indexOf('id="' + id + '"') === -1;
    });

    if (hilang.length) {
      throw new Error('id tidak ada di ' + halaman + ': ' + hilang.join(', '));
    }
  });
});

// Skrip di dalam halaman juga diperiksa.
['index.html', 'cetak.html'].forEach(function (halaman) {
  uji('skrip di dalam ' + halaman + ' hanya mencari id yang ada', function () {
    const html = baca(halaman);
    const skrip = html.split('<script>').slice(1).join('<script>');

    const hilang = idDipakai(skrip).filter(function (id) {
      return html.indexOf('id="' + id + '"') === -1;
    });

    if (hilang.length) {
      throw new Error('id tidak ada: ' + hilang.join(', '));
    }
  });
});

/* ---------------------------------------------------------------- *
 * 4. Kelengkapan berkas yang wajib ada di repo
 * ---------------------------------------------------------------- */
uji('berkas wajib untuk GitHub Pages ada semua', function () {
  const wajib = [
    '.nojekyll',
    'index.html',
    'admin.html',
    'menu.html',
    'cetak.html',
    'data/dapur.json',
    'assets/css/app.css',
    'assets/js/lib.js',
    'assets/js/gh.js',
    'assets/js/data.js',
    'assets/js/poster.js',
    'assets/js/stiker.js',
    'assets/js/qrcode.js'
  ];

  const hilang = wajib.filter(function (f) { return !ada(f); });

  if (hilang.length) { throw new Error('hilang: ' + hilang.join(', ')); }
});

uji('data/dapur.json isinya JSON yang sah dan berbentuk daftar', function () {
  const data = JSON.parse(baca('data/dapur.json'));

  if (!data || !Array.isArray(data.dapur)) {
    throw new Error('harus berbentuk { "dapur": [...] }');
  }
});

/* ---------------------------------------------------------------- *
 * 5. Halaman tidak boleh menyebut alamat http untuk dirinya sendiri
 *    (kalau nanti pindah alamat, ini yang sering jadi sumber masalah)
 * ---------------------------------------------------------------- */
uji('tidak ada alamat github.io yang ditulis tetap di dalam kode', function () {
  const berkas = [
    'index.html', 'admin.html', 'menu.html', 'cetak.html',
    'assets/js/admin.js', 'assets/js/menu.js', 'assets/js/data.js', 'assets/js/lib.js'
  ];

  const adaAlamatTetap = berkas.filter(function (f) {
    return /https?:\/\/[a-z0-9-]+\.github\.io/i.test(baca(f));
  });

  if (adaAlamatTetap.length) {
    throw new Error('alamat situs seharusnya dihitung otomatis, tapi ditemukan di: ' +
      adaAlamatTetap.join(', '));
  }
});

/* ---------------------------------------------------------------- */
console.log('Lulus: ' + lulus);
if (gagal.length) {
  console.log('GAGAL: ' + gagal.length);
  gagal.forEach(function (g) { console.log('  - ' + g); });
  process.exit(1);
}
console.log('SEMUA UJI TAUTAN LULUS');
