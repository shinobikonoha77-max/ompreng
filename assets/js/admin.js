/**
 * Logika halaman admin.html:
 * - setelan token GitHub
 * - kelola daftar dapur
 * - daftar menu harian per dapur
 */
(function () {
  'use strict';

  var L = window.OmprengLib;
  var GH = window.GH;

  var elPesan = document.getElementById('pesan');
  var elSetelan = document.getElementById('form-setelan');
  var elLencana = document.getElementById('lencana-setelan');
  var elKoneksi = document.getElementById('status-koneksi');
  var elIsiDapur = document.getElementById('isi-dapur');
  var elIsiMenu = document.getElementById('isi-menu');
  var elFormDapur = document.getElementById('form-dapur');
  var elJudulFormDapur = document.getElementById('judul-form-dapur');
  var elBatalDapur = document.getElementById('tombol-batal-dapur');
  var elPilihDapurMenu = document.getElementById('pilih-dapur-menu');
  var elTombolMenuBaru = document.getElementById('tombol-menu-baru');

  var daftarDapur = [];
  var dapurSedangDiubah = null;

  var infoSitus = L.deteksiRepo(location.hostname, location.pathname);
  var alamatSitus = infoSitus
    ? L.alamatSitus(infoSitus.owner, infoSitus.repo)
    : location.origin + location.pathname.replace(/[^/]*$/, '').replace(/\/$/, '');

  /* ---------------------------------------------------------------- *
   * Pesan
   * ---------------------------------------------------------------- */

  function pesan(teks, tipe) {
    elPesan.className = 'alert alert-' + (tipe || 'info');
    elPesan.innerHTML = teks;
    elPesan.style.display = 'block';
    elPesan.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function sembunyikanPesan() {
    elPesan.style.display = 'none';
  }

  function gagal(err) {
    pesan('<strong>Gagal:</strong> ' + L.escHtml(err && err.message ? err.message : String(err)), 'err');
  }

  /* ---------------------------------------------------------------- *
   * Setelan
   * ---------------------------------------------------------------- */

  function muatSetelan() {
    var s = GH.muatSimpanan();

    document.getElementById('s-owner').value = s.owner || '';
    document.getElementById('s-repo').value = s.repo || '';
    document.getElementById('s-branch').value = s.branch || '';
    document.getElementById('s-token').value = s.token || '';

    perbaruiLencana(s.siap ? 'Siap' : 'Belum diatur', s.siap ? '' : 'chip-abu');
  }

  function perbaruiLencana(teks, kelas) {
    elLencana.textContent = teks;
    elLencana.className = 'chip ' + (kelas || '');
  }

  function tampilKoneksi(teks, tipe) {
    elKoneksi.className = 'alert alert-' + tipe;
    elKoneksi.innerHTML = teks;
    elKoneksi.style.display = 'block';
  }

  elSetelan.addEventListener('submit', function (ev) {
    ev.preventDefault();
    sembunyikanPesan();

    var owner = document.getElementById('s-owner').value.trim();
    var repo = document.getElementById('s-repo').value.trim();

    // Kalau pemilik atau repo kosong, coba tebak dari alamat GitHub Pages.
    if ((!owner || !repo) && infoSitus) {
      owner = owner || infoSitus.owner;
      repo = repo || infoSitus.repo;
      document.getElementById('s-owner').value = owner;
      document.getElementById('s-repo').value = repo;
    }

    GH.simpanSetelan({
      owner: owner,
      repo: repo,
      branch: document.getElementById('s-branch').value.trim(),
      token: document.getElementById('s-token').value.trim()
    });

    if (!owner || !repo) {
      perbaruiLencana('Belum lengkap', 'chip-abu');
      tampilKoneksi('Pemilik repo dan nama repo wajib diisi.', 'err');
      return;
    }

    perbaruiLencana('Menguji…', 'chip-abu');
    tampilKoneksi('Sedang menghubungi GitHub…', 'info');

    GH.cekKoneksi()
      .then(function (info) {
        perbaruiLencana('Tersambung', '');
        tampilKoneksi(
          'Tersambung ke <strong>' + L.escHtml(info.repo) + '</strong> ' +
          '(cabang <code>' + L.escHtml(info.cabang) + '</code>)' +
          (info.privat ? '<br><strong>Repo ini privat.</strong> GitHub Pages gratis hanya jalan di repo publik, jadi gambar menu tidak akan bisa dibuka lewat QR.' : ''),
          info.privat ? 'err' : 'ok'
        );
        muatDaftarDapur();
      })
      .catch(function (err) {
        perbaruiLencana('Gagal', 'chip-abu');
        tampilKoneksi(L.escHtml(err.message), 'err');
      });
  });

  document.getElementById('tombol-lupakan').addEventListener('click', function () {
    if (!confirm('Hapus setelan token dari browser ini?')) { return; }
    GH.lupakan();
    muatSetelan();
    tampilKoneksi('Setelan dihapus.', 'info');
  });

  /* ---------------------------------------------------------------- *
   * Daftar dapur
   * ---------------------------------------------------------------- */

  function muatDaftarDapur() {
    elIsiDapur.innerHTML = '<tr><td colspan="5" class="kosong">Memuat…</td></tr>';

    return window.DataOmpreng.bacaDaftarDapur().then(function (hasil) {
      daftarDapur = (hasil.dapur || []).slice();
      renderDapur();
      renderPilihanDapur();
    });
  }

  function renderDapur() {
    if (!daftarDapur.length) {
      elIsiDapur.innerHTML = '<tr><td colspan="5" class="kosong">' +
        'Belum ada dapur. Tambahkan lewat form di bawah.</td></tr>';
      return;
    }

    elIsiDapur.innerHTML = daftarDapur.map(function (d, i) {
      var kode = L.kodeAman(d.kode);
      var alamat = alamatSitus + '/' + L.pathPosterTerbaru(kode);

      return '<tr>' +
        '<td><span class="chip chip-abu">' + L.escHtml(kode) + '</span></td>' +
        '<td>' + L.escHtml(d.nama) + '</td>' +
        '<td>' + L.escHtml(d.penanggung_jawab || '-') + '</td>' +
        '<td><a href="' + L.escHtml(alamat) + '" target="_blank" rel="noopener" style="word-break:break-all"><code>' +
          L.escHtml(kode) + '.png</code></a></td>' +
        '<td><div class="btn-baris">' +
          '<button class="btn btn-kecil btn-abu" data-ubah="' + i + '">Ubah</button>' +
          '<button class="btn btn-kecil btn-bahaya" data-hapus="' + i + '">Hapus</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    elIsiDapur.querySelectorAll('[data-ubah]').forEach(function (tombol) {
      tombol.addEventListener('click', function () {
        isiFormDapur(daftarDapur[Number(tombol.dataset.ubah)]);
      });
    });

    elIsiDapur.querySelectorAll('[data-hapus]').forEach(function (tombol) {
      tombol.addEventListener('click', function () {
        hapusDapur(daftarDapur[Number(tombol.dataset.hapus)]);
      });
    });
  }

  function renderPilihanDapur() {
    if (!daftarDapur.length) {
      elPilihDapurMenu.innerHTML = '';
      elIsiMenu.innerHTML = '<tr><td colspan="6" class="kosong">Belum ada dapur.</td></tr>';
      return;
    }

    elPilihDapurMenu.innerHTML = daftarDapur.map(function (d) {
      return '<option value="' + L.escHtml(L.kodeAman(d.kode)) + '">' + L.escHtml(d.nama) + '</option>';
    }).join('');

    muatDaftarMenu();
  }

  /* ---------------------------------------------------------------- *
   * Form dapur
   * ---------------------------------------------------------------- */

  function isiFormDapur(d) {
    dapurSedangDiubah = d;
    document.getElementById('d-kode').value = d ? L.kodeAman(d.kode) : '';
    document.getElementById('d-nama').value = d ? d.nama : '';
    document.getElementById('d-pj').value = d ? (d.penanggung_jawab || '') : '';
    document.getElementById('d-alamat').value = d ? (d.alamat || '') : '';
    elJudulFormDapur.textContent = d ? 'Ubah Dapur' : 'Tambah Dapur';
    elBatalDapur.style.display = d ? '' : 'none';
    document.getElementById('d-kode').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  elBatalDapur.addEventListener('click', function () { isiFormDapur(null); });

  elFormDapur.addEventListener('submit', function (ev) {
    ev.preventDefault();
    sembunyikanPesan();

    if (!GH.siap()) {
      pesan('Isi dan simpan <strong>Setelan GitHub</strong> dulu di bagian atas halaman.', 'err');
      return;
    }

    var nama = document.getElementById('d-nama').value.trim();
    var kode = L.kodeAman(document.getElementById('d-kode').value || nama);

    if (!nama || !kode) {
      pesan('Nama dan kode dapur wajib diisi.', 'err');
      return;
    }

    var kodeLama = dapurSedangDiubah ? L.kodeAman(dapurSedangDiubah.kode) : null;

    if (kodeLama && kode !== kodeLama) {
      if (!confirm(
        'Kode dapur berubah dari ' + kodeLama + ' menjadi ' + kode + '.\n\n' +
        'Semua stiker yang sudah dicetak dengan kode lama akan berhenti bekerja dan harus dicetak ulang.\n\n' +
        'Lanjutkan?'
      )) {
        return;
      }
    }

    var bentrok = daftarDapur.some(function (d) {
      return L.kodeAman(d.kode) === kode && d !== dapurSedangDiubah;
    });

    if (bentrok) {
      pesan('Kode <strong>' + L.escHtml(kode) + '</strong> sudah dipakai dapur lain. Pakai kode lain.', 'err');
      return;
    }

    var dataBaru = {
      kode: kode,
      nama: nama,
      penanggung_jawab: document.getElementById('d-pj').value.trim(),
      alamat: document.getElementById('d-alamat').value.trim()
    };

    var baru = daftarDapur.filter(function (d) { return d !== dapurSedangDiubah; });
    baru.push(dataBaru);
    baru.sort(function (a, b) { return a.nama.localeCompare(b.nama); });

    simpanDaftarDapur(baru, (dapurSedangDiubah ? 'Ubah dapur ' : 'Tambah dapur ') + dataBaru.nama)
      .then(function () {
        isiFormDapur(null);
        pesan('Dapur <strong>' + L.escHtml(dataBaru.nama) + '</strong> tersimpan.', 'ok');
        return muatDaftarDapur();
      })
      .catch(gagal);
  });

  function hapusDapur(d) {
    var kode = L.kodeAman(d.kode);

    if (!confirm(
      'Hapus dapur "' + d.nama + '"?\n\n' +
      'Data menu harian yang sudah tersimpan tidak ikut terhapus, ' +
      'tapi tidak akan tampil lagi di daftar.\n\n' +
      'Stiker yang sudah dicetak juga akan berhenti bekerja.'
    )) {
      return;
    }

    var baru = daftarDapur.filter(function (x) { return x !== d; });

    simpanDaftarDapur(baru, 'Hapus dapur ' + kode)
      .then(function () {
        pesan('Dapur <strong>' + L.escHtml(d.nama) + '</strong> dihapus.', 'ok');
        return muatDaftarDapur();
      })
      .catch(gagal);
  }

  function simpanDaftarDapur(daftar, judulCommit) {
    return GH.commitJson(
      L.pathDaftarDapur(),
      { dapur: daftar },
      judulCommit + ' — Menu Ompreng SPPG'
    ).then(function () {
      // Tunggu sebentar supaya GitHub selesai menyimpan.
      return new Promise(function (selesai) { setTimeout(selesai, 800); });
    });
  }

  /* ---------------------------------------------------------------- *
   * Daftar menu
   * ---------------------------------------------------------------- */

  elPilihDapurMenu.addEventListener('change', muatDaftarMenu);

  function muatDaftarMenu() {
    var kode = elPilihDapurMenu.value;

    if (!kode) {
      elIsiMenu.innerHTML = '<tr><td colspan="6" class="kosong">Belum ada dapur.</td></tr>';
      return;
    }

    elTombolMenuBaru.href = 'menu.html?kode=' + encodeURIComponent(kode);

    if (!GH.siap()) {
      elIsiMenu.innerHTML = '<tr><td colspan="6" class="kosong">' +
        'Isi <strong>Setelan GitHub</strong> dulu untuk melihat daftar menu.</td></tr>';
      return;
    }

    elIsiMenu.innerHTML = '<tr><td colspan="6" class="kosong">Memuat…</td></tr>';

    window.DataOmpreng.daftarMenu(kode)
      .then(renderMenu)
      .catch(function (err) {
        elIsiMenu.innerHTML = '<tr><td colspan="6" class="kosong">Gagal memuat: ' +
          L.escHtml(err.message) + '</td></tr>';
      });
  }

  function renderMenu(daftar) {
    if (!daftar.length) {
      elIsiMenu.innerHTML = '<tr><td colspan="6" class="kosong">' +
        'Belum ada menu untuk dapur ini.</td></tr>';
      return;
    }

    var kode = elPilihDapurMenu.value;

    elIsiMenu.innerHTML = daftar.map(function (m) {
      var komponen = (m.items || []).map(function (it) {
        return '&bull; ' + L.escHtml(it.nama) +
          (it.berat_gram ? ' <span class="hint">(' + L.escHtml(it.berat_gram) + ' g)</span>' : '');
      }).join('<br>') || '<span class="hint">Belum ada komponen.</span>';

      var tautan = alamatSitus + '/' + L.pathPosterTerbaru(kode) + '?v=' + L.escHtml(m.tanggal);

      return '<tr>' +
        '<td><strong>' + L.escHtml(L.tanggalIndonesia(m.tanggal)) + '</strong><br>' +
          '<span class="hint">' + L.escHtml(L.hariIndonesia(m.tanggal)) + '</span></td>' +
        '<td>' + L.escHtml(m.judul || '-') + '</td>' +
        '<td>' + komponen + '</td>' +
        '<td><span class="chip chip-kuning">' + L.escHtml(L.angkaGizi(m.kalori)) + ' kkal</span><br>' +
          '<span class="hint">P ' + L.escHtml(L.angkaGizi(m.protein)) + ' g &middot; ' +
          'K ' + L.escHtml(L.angkaGizi(m.karbohidrat)) + ' g &middot; ' +
          'L ' + L.escHtml(L.angkaGizi(m.lemak)) + ' g</span></td>' +
        '<td><a href="' + tautan + '" target="_blank" rel="noopener" class="hint">buka gambar</a></td>' +
        '<td><a class="btn btn-kecil btn-abu" href="menu.html?kode=' + encodeURIComponent(kode) +
          '&tanggal=' + encodeURIComponent(m.tanggal) + '">Ubah</a></td>' +
      '</tr>';
    }).join('');
  }

  /* ---------------------------------------------------------------- *
   * Mulai
   * ---------------------------------------------------------------- */

  muatSetelan();
  muatDaftarDapur();
})();
