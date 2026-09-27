/**
 * Logika murni aplikasi Menu Ompreng versi GitHub Pages.
 *
 * Semua fungsi di sini tidak menyentuh jaringan atau DOM, jadi bisa diuji
 * langsung dengan Node (lihat tests/lib.test.js) sekaligus dipakai di browser.
 */
(function (root, buat) {
  var api = buat();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.OmprengLib = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  /* ---------------------------------------------------------------- *
   * Alamat & lokasi berkas
   * ---------------------------------------------------------------- */

  /**
   * Tebak pemilik dan nama repo dari alamat GitHub Pages.
   *
   *   dwi.github.io/ompreng/admin.html -> { owner: 'dwi', repo: 'ompreng' }
   *   dwi.github.io/admin.html         -> { owner: 'dwi', repo: '' }   (situs user)
   *
   * Segmen pertama dianggap nama repo hanya kalau tidak mengandung titik.
   * Kalau isinya "admin.html" atau "index.html", berarti ini situs user.
   */
  function deteksiRepo(hostname, pathname) {
    var host = String(hostname || '');
    var jalur = String(pathname || '');

    if (!/\.github\.io$/i.test(host)) {
      return null;
    }

    var owner = host.split('.')[0];
    var bagian = jalur.split('/').filter(function (s) { return s !== ''; });
    var pertama = bagian.length ? bagian[0] : '';

    if (!owner) { return null; }

    // Segmen berisi titik berarti nama berkas, bukan nama repo.
    var repo = pertama.indexOf('.') === -1 ? pertama : '';

    return { owner: owner, repo: repo };
  }

  /** Alamat dasar situs, tanpa garis miring di akhir. */
  function alamatSitus(owner, repo) {
    var dasar = 'https://' + owner + '.github.io';
    return repo ? dasar + '/' + repo : dasar;
  }

  /** Alamat yang dimasukkan ke QR stiker: menunjuk langsung ke FILE GAMBAR. */
  function alamatStiker(owner, repo, kode) {
    return alamatSitus(owner, repo) + '/' + pathPosterTerbaru(kode);
  }

  /** Poster terbaru sebuah dapur. Berkas ini ditimpa setiap hari. */
  function pathPosterTerbaru(kode) {
    return 'm/' + kode + '.png';
  }

  /** Salinan poster untuk tanggal tertentu, sebagai arsip. */
  function pathArsipPoster(kode, tanggal) {
    return 'm/' + kode + '/' + tanggal + '.png';
  }

  function pathFoto(kode, tanggal, ekstensi) {
    return 'm/' + kode + '/foto-' + tanggal + '.' + (ekstensi || 'jpg');
  }

  function pathDataMenu(kode, tanggal) {
    return 'data/' + kode + '/' + tanggal + '.json';
  }

  function pathDaftarDapur() {
    return 'data/dapur.json';
  }

  /** Bersihkan kode dapur supaya aman jadi nama berkas dan bagian alamat. */
  function kodeAman(teks) {
    return String(teks || '')
      .toUpperCase()
      .replace(/[^A-Z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  /* ---------------------------------------------------------------- *
   * Tanggal
   * ---------------------------------------------------------------- */

  function tanggalValid(iso) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(iso || '')) &&
      !isNaN(Date.parse(String(iso) + 'T00:00:00'));
  }

  function tanggalHariIni(sekarang) {
    var d = sekarang ? new Date(sekarang) : new Date();
    var bulan = String(d.getMonth() + 1).padStart(2, '0');
    var tanggal = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + bulan + '-' + tanggal;
  }

  function pecahTanggal(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) { return null; }
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function tanggalIndonesia(iso) {
    var d = pecahTanggal(iso);
    return d ? d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear() : '';
  }

  function hariIndonesia(iso) {
    var d = pecahTanggal(iso);
    return d ? HARI[d.getDay()] : '';
  }

  /* ---------------------------------------------------------------- *
   * Base64 (untuk GitHub API dan data URL canvas)
   * ---------------------------------------------------------------- */

  function teksKeBase64(teks) {
    var bytes = new TextEncoder().encode(String(teks));
    var biner = '';
    for (var i = 0; i < bytes.length; i++) { biner += String.fromCharCode(bytes[i]); }
    return btoa(biner);
  }

  function base64KeTeks(b64) {
    var biner = atob(String(b64).replace(/\s/g, ''));
    var bytes = new Uint8Array(biner.length);
    for (var i = 0; i < biner.length; i++) { bytes[i] = biner.charCodeAt(i); }
    return new TextDecoder().decode(bytes);
  }

  /** Ambil bagian base64 dari data URL canvas ("data:image/png;base64,...."). */
  function dataUrlKeBase64(dataUrl) {
    var cocok = /^data:image\/png;base64,(.+)$/s.exec(String(dataUrl || ''));
    return cocok ? cocok[1] : null;
  }

  /** Perkiraan ukuran berkas (byte) dari panjang base64. */
  function ukuranBase64(b64) {
    var panjang = String(b64 || '').replace(/\s/g, '').length;
    var padding = (String(b64 || '').match(/=+$/) || [''])[0].length;
    return Math.max(0, Math.floor(panjang * 3 / 4) - padding);
  }

  /* ---------------------------------------------------------------- *
   * Validasi
   * ---------------------------------------------------------------- */

  var KATEGORI = ['makanan_pokok', 'lauk_hewani', 'lauk_nabati', 'sayur', 'buah', 'susu', 'lain'];

  /**
   * Periksa kelengkapan data menu sebelum dikirim ke GitHub.
   * Mengembalikan daftar pesan kesalahan; kosong berarti valid.
   */
  function validasiMenu(data) {
    var salah = [];
    data = data || {};

    if (!String(data.kode || '').trim()) {
      salah.push('Pilih dapur dulu.');
    }
    if (!tanggalValid(data.tanggal)) {
      salah.push('Tanggal menu belum benar.');
    }

    var items = Array.isArray(data.items) ? data.items : [];
    var terisi = items.filter(function (it) { return String((it && it.nama) || '').trim() !== ''; });

    if (terisi.length === 0) {
      salah.push('Isi minimal satu komponen menu.');
    }

    items.forEach(function (it) {
      var nama = String((it && it.nama) || '').trim();
      if (!nama) { return; }
      if (KATEGORI.indexOf(it.kategori) === -1) {
        salah.push('Kategori "' + it.kategori + '" untuk "' + nama + '" tidak dikenal.');
      }
      if (it.berat_gram !== '' && it.berat_gram !== null && it.berat_gram !== undefined) {
        var gram = Number(it.berat_gram);
        if (isNaN(gram) || gram < 0 || gram > 5000) {
          salah.push('Berat "' + nama + '" harus angka antara 0 sampai 5000 gram.');
        }
      }
    });

    ['kalori', 'protein', 'karbohidrat', 'lemak', 'berat_porsi'].forEach(function (kunci) {
      var nilai = data[kunci];
      if (nilai === '' || nilai === null || nilai === undefined) { return; }
      var angka = Number(String(nilai).replace(',', '.'));
      if (isNaN(angka) || angka < 0) {
        salah.push('Nilai ' + kunci + ' harus berupa angka yang tidak negatif.');
      }
    });

    return salah;
  }

  /** Rapikan data menu menjadi bentuk yang disimpan ke berkas JSON. */
  function rapikanMenu(data) {
    return {
      kode: kodeAman(data.kode),
      tanggal: data.tanggal,
      judul: String(data.judul || '').trim(),
      kalori: angkaAtauNull(data.kalori),
      protein: angkaAtauNull(data.protein),
      karbohidrat: angkaAtauNull(data.karbohidrat),
      lemak: angkaAtauNull(data.lemak),
      berat_porsi: angkaAtauNull(data.berat_porsi),
      batch: String(data.batch || '').trim(),
      jam_produksi: String(data.jam_produksi || '').trim(),
      pengawas: String(data.pengawas || '').trim(),
      ahli_gizi: String(data.ahli_gizi || '').trim(),
      catatan: String(data.catatan || '').trim(),
      items: (data.items || [])
        .filter(function (it) { return String((it && it.nama) || '').trim() !== ''; })
        .map(function (it) {
          return {
            kategori: it.kategori,
            nama: String(it.nama).trim(),
            berat_gram: angkaAtauNull(it.berat_gram)
          };
        }),
      foto: data.foto || null
    };
  }

  function angkaAtauNull(nilai) {
    if (nilai === '' || nilai === null || nilai === undefined) { return null; }
    var angka = Number(String(nilai).replace(',', '.'));
    return isNaN(angka) ? null : angka;
  }

  /** Amankan teks sebelum dimasukkan ke HTML. */
  function escHtml(teks) {
    return String(teks === null || teks === undefined ? '' : teks)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function angkaGizi(nilai) {
    if (nilai === null || nilai === undefined || String(nilai).trim() === '') { return '-'; }
    var n = Number(String(nilai).replace(',', '.'));
    if (isNaN(n)) { return String(nilai); }
    return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
  }

  return {
    deteksiRepo: deteksiRepo,
    alamatSitus: alamatSitus,
    alamatStiker: alamatStiker,
    pathPosterTerbaru: pathPosterTerbaru,
    pathArsipPoster: pathArsipPoster,
    pathFoto: pathFoto,
    pathDataMenu: pathDataMenu,
    pathDaftarDapur: pathDaftarDapur,
    kodeAman: kodeAman,
    tanggalValid: tanggalValid,
    tanggalHariIni: tanggalHariIni,
    tanggalIndonesia: tanggalIndonesia,
    hariIndonesia: hariIndonesia,
    teksKeBase64: teksKeBase64,
    base64KeTeks: base64KeTeks,
    dataUrlKeBase64: dataUrlKeBase64,
    ukuranBase64: ukuranBase64,
    validasiMenu: validasiMenu,
    rapikanMenu: rapikanMenu,
    escHtml: escHtml,
    angkaGizi: angkaGizi,
    KATEGORI: KATEGORI
  };
});
