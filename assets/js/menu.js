/**
 * Logika halaman menu.html:
 * - memuat menu yang sudah ada untuk dapur + tanggal terpilih
 * - pratinjau poster langsung
 * - menyimpan poster, data menu, dan foto ke GitHub dalam satu commit
 */
(function () {
  'use strict';

  var L = window.OmprengLib;
  var GH = window.GH;

  var UKURAN_POSTER = { width: 1080, height: 1440 };
  var UKURAN_FOTO_MAKS = 1600;

  var KATEGORI = {
    makanan_pokok: 'Makanan Pokok',
    lauk_hewani: 'Lauk Hewani',
    lauk_nabati: 'Lauk Nabati',
    sayur: 'Sayur',
    buah: 'Buah',
    susu: 'Susu / Minuman',
    lain: 'Tambahan'
  };

  var elForm = document.getElementById('form-menu');
  var elKotakItem = document.getElementById('items');
  var elKanvas = document.getElementById('pratinjau');
  var elTombol = document.getElementById('tombol-simpan');
  var elPesan = document.getElementById('pesan');
  var elInfoFoto = document.getElementById('info-foto');
  var elJudulHalaman = document.getElementById('judul-halaman');
  var elTautanGambar = document.getElementById('tautan-gambar');

  var pilihDapur = document.getElementById('dapur_id');
  var inputTanggal = document.getElementById('tanggal');
  var inputFoto = document.getElementById('foto');

  var daftarDapur = [];
  var petaDapur = {};
  var fotoGambar = null;      // HTMLImageElement yang sedang dipakai
  var fotoBaru = null;        // { base64, ekstensi } hasil pilihan admin
  var fotoLama = null;        // path foto yang tersimpan di repo
  var hapusFoto = false;
  var timerPratinjau = null;
  var kotor = false;

  var infoSitus = L.deteksiRepo(location.hostname, location.pathname);
  var alamatSitus = infoSitus
    ? L.alamatSitus(infoSitus.owner, infoSitus.repo)
    : location.origin + location.pathname.replace(/[^/]*$/, '').replace(/\/$/, '');

  var param = new URLSearchParams(location.search);

  /* ---------------------------------------------------------------- *
   * Pesan
   * ---------------------------------------------------------------- */

  function pesan(teks, tipe) {
    elPesan.className = 'alert alert-' + (tipe || 'info');
    elPesan.innerHTML = teks;
    elPesan.style.display = 'block';
  }

  function gagal(err) {
    pesan('<strong>Gagal menyimpan:</strong> ' + L.escHtml(err && err.message ? err.message : String(err)), 'err');
  }

  /* ---------------------------------------------------------------- *
   * Komponen menu
   * ---------------------------------------------------------------- */

  function opsiKategori(terpilih) {
    return Object.keys(KATEGORI).map(function (k) {
      return '<option value="' + k + '"' + (k === terpilih ? ' selected' : '') + '>' +
        L.escHtml(KATEGORI[k]) + '</option>';
    }).join('');
  }

  function tambahBaris(item) {
    item = item || { kategori: 'makanan_pokok', nama: '', berat_gram: '' };

    var baris = document.createElement('div');
    baris.className = 'baris-item';
    baris.innerHTML =
      '<select name="kategori" aria-label="Kategori">' + opsiKategori(item.kategori) + '</select>' +
      '<input type="text" name="nama" placeholder="Contoh: Nasi putih" value="' + L.escHtml(item.nama || '') + '">' +
      '<input type="number" name="berat_gram" min="0" max="5000" placeholder="gram" value="' +
        L.escHtml(item.berat_gram === null || item.berat_gram === undefined ? '' : item.berat_gram) + '">' +
      '<button type="button" class="btn btn-kecil btn-bahaya" title="Hapus komponen">&times;</button>';

    baris.querySelector('button').addEventListener('click', function () {
      baris.remove();
      kotor = true;
      jadwalkanPratinjau();
    });

    elKotakItem.appendChild(baris);
  }

  function kumpulkanItem() {
    return Array.prototype.map.call(elKotakItem.querySelectorAll('.baris-item'), function (b) {
      return {
        kategori: b.querySelector('[name=kategori]').value,
        nama: b.querySelector('[name=nama]').value,
        berat_gram: b.querySelector('[name=berat_gram]').value
      };
    });
  }

  document.getElementById('tambah-komponen').addEventListener('click', function () {
    tambahBaris();
    kotor = true;
    jadwalkanPratinjau();
  });

  /* ---------------------------------------------------------------- *
   * Pratinjau
   * ---------------------------------------------------------------- */

  function nilai(nama) {
    var el = elForm.elements[nama];
    return el ? String(el.value || '').trim() : '';
  }

  function kodeDapurTerpilih() {
    return L.kodeAman(pilihDapur.value);
  }

  function kumpulkanData() {
    var kode = kodeDapurTerpilih();
    var d = petaDapur[kode] || {};

    return {
      kode: kode,
      nama_dapur: d.nama || '',
      tanggal: nilai('tanggal'),
      judul: nilai('judul'),
      kalori: nilai('kalori'),
      protein: nilai('protein'),
      karbohidrat: nilai('karbohidrat'),
      lemak: nilai('lemak'),
      berat_porsi: nilai('berat_porsi'),
      batch: nilai('batch'),
      jam_produksi: nilai('jam_produksi'),
      pengawas: nilai('pengawas'),
      ahli_gizi: nilai('ahli_gizi'),
      catatan: nilai('catatan'),
      items: kumpulkanItem(),
      foto: fotoGambar
    };
  }

  function gambarPratinjau() {
    try {
      var data = kumpulkanData();
      window.PosterMenu.render(elKanvas, {
        nama_dapur: data.nama_dapur,
        kode_dapur: data.kode,
        tanggal: data.tanggal,
        judul: data.judul,
        kalori: data.kalori,
        protein: data.protein,
        karbohidrat: data.karbohidrat,
        lemak: data.lemak,
        berat_porsi: data.berat_porsi,
        batch: data.batch,
        jam_produksi: data.jam_produksi,
        pengawas: data.pengawas,
        ahli_gizi: data.ahli_gizi,
        catatan: data.catatan,
        items: data.items,
        foto: data.foto
      }, UKURAN_POSTER);
    } catch (err) {
      console.error('Gagal menggambar pratinjau', err);
    }
  }

  function jadwalkanPratinjau() {
    clearTimeout(timerPratinjau);
    timerPratinjau = setTimeout(gambarPratinjau, 120);
  }

  elForm.addEventListener('input', function () {
    kotor = true;
    jadwalkanPratinjau();
  });
  elForm.addEventListener('change', function () {
    kotor = true;
    jadwalkanPratinjau();
  });

  /* ---------------------------------------------------------------- *
   * Foto
   * ---------------------------------------------------------------- */

  /**
   * Kecilkan foto lewat canvas supaya repo tidak cepat membesar.
   * Mengembalikan { base64, ekstensi }.
   */
  function siapkanFoto(file) {
    return new Promise(function (selesai, tolak) {
      var url = URL.createObjectURL(file);
      var img = new Image();

      img.onload = function () {
        URL.revokeObjectURL(url);

        var lebar = img.width;
        var tinggi = img.height;
        var skala = Math.min(1, UKURAN_FOTO_MAKS / Math.max(lebar, tinggi));

        var kanvas = document.createElement('canvas');
        kanvas.width = Math.round(lebar * skala);
        kanvas.height = Math.round(tinggi * skala);

        var ctx = kanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, kanvas.width, kanvas.height);
        ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);

        var dataUrl = kanvas.toDataURL('image/jpeg', 0.86);

        selesai({
          base64: dataUrl.replace(/^data:image\/jpeg;base64,/, ''),
          ekstensi: 'jpg',
          gambar: img
        });
      };

      img.onerror = function () {
        URL.revokeObjectURL(url);
        tolak(new Error('Foto tidak bisa dibaca. Coba file lain.'));
      };

      img.src = url;
    });
  }

  inputFoto.addEventListener('change', function () {
    var file = inputFoto.files && inputFoto.files[0];
    if (!file) { return; }

    if (file.size > 12 * 1024 * 1024) {
      pesan('Foto terlalu besar (maksimal 12 MB). Kecilkan dulu.', 'err');
      inputFoto.value = '';
      return;
    }

    siapkanFoto(file).then(function (hasil) {
      fotoBaru = { base64: hasil.base64, ekstensi: hasil.ekstensi };
      fotoGambar = hasil.gambar;
      hapusFoto = false;
      elInfoFoto.textContent = 'Foto baru dipilih: ' + file.name;
      gambarPratinjau();
    }).catch(gagal);
  });

  document.getElementById('hapus-foto').addEventListener('click', function () {
    fotoGambar = null;
    fotoBaru = null;
    fotoLama = null;
    hapusFoto = true;
    inputFoto.value = '';
    elInfoFoto.textContent = 'Foto akan dihapus saat disimpan.';
    gambarPratinjau();
  });

  function muatFotoDariRepo(jalur) {
    if (!jalur) { return Promise.resolve(null); }
    return window.PosterMenu.muatGambar(jalur + '?t=' + Date.now());
  }

  /* ---------------------------------------------------------------- *
   * Memuat data yang sudah ada
   * ---------------------------------------------------------------- */

  function isiFormDari(menu) {
    elKotakItem.innerHTML = '';

    var items = menu && menu.items && menu.items.length
      ? menu.items
      : [{ kategori: 'makanan_pokok', nama: '', berat_gram: '' }];

    items.forEach(tambahBaris);

    ['judul', 'kalori', 'protein', 'karbohidrat', 'lemak', 'berat_porsi',
      'batch', 'jam_produksi', 'pengawas', 'ahli_gizi', 'catatan'].forEach(function (kunci) {
      var el = elForm.elements[kunci];
      if (el) { el.value = menu && menu[kunci] !== null && menu[kunci] !== undefined ? menu[kunci] : ''; }
    });

    fotoLama = menu && menu.foto ? menu.foto : null;
    fotoBaru = null;
    hapusFoto = false;
    inputFoto.value = '';

    return muatFotoDariRepo(fotoLama).then(function (img) {
      fotoGambar = img;
      elInfoFoto.textContent = img ? 'Memakai foto yang sudah tersimpan.' : '';
      gambarPratinjau();
    });
  }

  function perbaruiTautanGambar() {
    var kode = kodeDapurTerpilih();
    var tanggal = nilai('tanggal');

    if (!kode || !L.tanggalValid(tanggal)) {
      elTautanGambar.style.display = 'none';
      return;
    }

    elTautanGambar.href = alamatSitus + '/' + L.pathPosterTerbaru(kode) + '?t=' + Date.now();
    elTautanGambar.style.display = '';
  }

  function muatMenu() {
    var kode = kodeDapurTerpilih();
    var tanggal = nilai('tanggal');

    if (!kode || !L.tanggalValid(tanggal)) { return; }

    pesan('Memuat menu…', 'info');

    return window.DataOmpreng.bacaMenu(kode, tanggal).then(function (menu) {
      if (menu) {
        pesan('Menu tanggal ini sudah ada. Perubahan akan menimpa yang lama.', 'info');
      } else {
        pesan('Menu untuk tanggal ini belum ada. Silakan diisi.', 'info');
      }

      elJudulHalaman.textContent = menu ? 'Ubah Menu' : 'Isi Menu Harian';
      kotor = false;

      return isiFormDari(menu).then(function () {
        perbaruiTautanGambar();
      });
    });
  }

  /* ---------------------------------------------------------------- *
   * Ganti dapur / tanggal
   * ---------------------------------------------------------------- */

  function bolehGanti() {
    return !kotor || confirm('Isian yang belum disimpan akan hilang. Lanjutkan?');
  }

  pilihDapur.addEventListener('change', function () {
    if (!bolehGanti()) {
      pilihDapur.value = kodeTerakhir;
      return;
    }
    kodeTerakhir = pilihDapur.value;
    kotor = false;
    muatMenu();
  });
  var kodeTerakhir = '';

  inputTanggal.addEventListener('change', function () {
    if (!bolehGanti()) {
      inputTanggal.value = tanggalTerakhir;
      return;
    }
    tanggalTerakhir = inputTanggal.value;
    kotor = false;
    muatMenu();
  });
  var tanggalTerakhir = '';

  /* ---------------------------------------------------------------- *
   * Simpan ke GitHub
   * ---------------------------------------------------------------- */

  elForm.addEventListener('submit', function (ev) {
    ev.preventDefault();

    if (!GH.siap()) {
      pesan('Isi dan simpan <strong>Setelan GitHub</strong> dulu di <a href="admin.html">halaman admin</a>.', 'err');
      return;
    }

    var data = kumpulkanData();
    var salah = L.validasiMenu(data);

    if (salah.length) {
      pesan('<strong>Belum bisa disimpan:</strong><br>&bull; ' + salah.map(L.escHtml).join('<br>&bull; '), 'err');
      return;
    }

    elTombol.disabled = true;
    elTombol.textContent = 'Menyimpan…';

    // Pastikan pratinjau memakai isian terbaru sebelum diambil gambarnya.
    gambarPratinjau();

    var rapi = L.rapikanMenu(data);
    var berkas = [];
    var pathFotoBaru = null;

    if (hapusFoto) {
      rapi.foto = null;
    } else if (fotoBaru) {
      pathFotoBaru = L.pathFoto(rapi.kode, rapi.tanggal, fotoBaru.ekstensi);
      rapi.foto = pathFotoBaru;
      berkas.push({ path: pathFotoBaru, base64: fotoBaru.base64 });
    } else {
      rapi.foto = fotoLama;
    }

    var posterBase64 = L.dataUrlKeBase64(elKanvas.toDataURL('image/png'));

    if (!posterBase64) {
      pesan('Gambar poster gagal dibuat. Coba muat ulang halaman.', 'err');
      aktifkanTombol();
      return;
    }

    rapi.diperbarui = new Date().toISOString();

    // Tiga berkas sekaligus:
    //  1. data menu (untuk dibaca lagi nanti)
    //  2. poster terbaru  -> alamat inilah yang ada di dalam QR stiker
    //  3. arsip poster bertanggal
    berkas.push({
      path: L.pathDataMenu(rapi.kode, rapi.tanggal),
      base64: L.teksKeBase64(JSON.stringify(rapi, null, 2) + '\n')
    });
    berkas.push({ path: L.pathPosterTerbaru(rapi.kode), base64: posterBase64 });
    berkas.push({ path: L.pathArsipPoster(rapi.kode, rapi.tanggal), base64: posterBase64 });

    var judul = 'Menu ' + rapi.kode + ' ' + rapi.tanggal + ' — Menu Ompreng SPPG';

    pesan('Mengirim ke GitHub…', 'info');

    GH.commitBanyak(berkas, judul)
      .then(function (hasil) {
        kotor = false;
        fotoBaru = null;
        elInfoFoto.textContent = fotoLama || pathFotoBaru
          ? 'Memakai foto yang sudah tersimpan.'
          : '';

        var alamat = alamatSitus + '/' + L.pathPosterTerbaru(rapi.kode);

        pesan(
          '<strong>Tersimpan.</strong> Data masuk ke GitHub pada cabang <code>' + L.escHtml(hasil.cabang) + '</code>.<br><br>' +
          'Alamat yang ada di QR stiker:<br>' +
          '<a href="' + L.escHtml(alamat) + '" target="_blank" rel="noopener"><code style="word-break:break-all">' +
          L.escHtml(alamat) + '</code></a><br><br>' +
          '<strong>Tunggu 1&ndash;10 menit</strong> sebelum gambarnya berubah di HP yang men-scan. ' +
          'GitHub perlu waktu membangun ulang situs, lalu menyimpan cache sekitar 10 menit.' +
          '<br><br>Untuk memeriksa sekarang tanpa menunggu cache: ' +
          '<a href="' + L.escHtml(alamat) + '?t=' + Date.now() + '" target="_blank" rel="noopener">buka dengan penanda waktu</a> ' +
          '(belum tentu sudah jadi, tapi paling cepat kelihatan).',
          'ok'
        );

        fotoLama = rapi.foto;
        perbaruiTautanGambar();
        elJudulHalaman.textContent = 'Ubah Menu';
      })
      .catch(gagal)
      .then(aktifkanTombol);
  });

  function aktifkanTombol() {
    elTombol.disabled = false;
    elTombol.textContent = 'Simpan Menu';
  }

  /* ---------------------------------------------------------------- *
   * Mulai
   * ---------------------------------------------------------------- */

  function mulai() {
    window.DataOmpreng.bacaDaftarDapur().then(function (hasil) {
      daftarDapur = hasil.dapur || [];

      if (!daftarDapur.length) {
        pesan('Belum ada dapur terdaftar. Tambahkan dulu di <a href="admin.html">halaman admin</a>.', 'err');
        pilihDapur.innerHTML = '<option value="">(belum ada dapur)</option>';
        return;
      }

      daftarDapur.forEach(function (d) {
        var kode = L.kodeAman(d.kode);
        petaDapur[kode] = d;
      });

      pilihDapur.innerHTML = daftarDapur.map(function (d) {
        var kode = L.kodeAman(d.kode);
        return '<option value="' + L.escHtml(kode) + '">' + L.escHtml(d.nama) + ' (' + L.escHtml(kode) + ')</option>';
      }).join('');

      var kodeDiminta = L.kodeAman(param.get('kode') || '');
      if (kodeDiminta && petaDapur[kodeDiminta]) {
        pilihDapur.value = kodeDiminta;
      }

      inputTanggal.value = L.tanggalValid(param.get('tanggal') || '')
        ? param.get('tanggal')
        : L.tanggalHariIni();

      kodeTerakhir = pilihDapur.value;
      tanggalTerakhir = inputTanggal.value;

      muatMenu();
    });
  }

  mulai();
})();
