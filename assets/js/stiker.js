/**
 * Pembuat stiker QR ompreng.
 *
 * Semua stiker memakai QR yang sama (alamat gambar menu dapur tersebut);
 * nomor ompreng hanya penanda visual supaya gampang dibedakan.
 *
 * Dipakai halaman cetak.html, dan juga halaman uji tests/preview-qr.html.
 */
(function (root) {
  'use strict';

  var SKALA = 10;   // piksel per modul QR
  var MARGIN = 4;   // modul kosong di sekeliling QR

  /** Gambar QR dari teks ke sebuah canvas. */
  function gambarQR(canvas, teks) {
    var qr = qrcode(0, 'M');   // 0 = ukuran otomatis
    qr.addData(teks);
    qr.make();

    var jumlah = qr.getModuleCount();
    var total = (jumlah + MARGIN * 2) * SKALA;

    canvas.width = total;
    canvas.height = total;

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, total, total);

    ctx.fillStyle = '#000000';
    for (var r = 0; r < jumlah; r++) {
      for (var c = 0; c < jumlah; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + MARGIN) * SKALA, (r + MARGIN) * SKALA, SKALA, SKALA);
        }
      }
    }
  }

  function pad(nomor, panjang) {
    var s = String(nomor);
    while (s.length < panjang) { s = '0' + s; }
    return s;
  }

  /**
   * Susun sekumpulan stiker.
   * cfg: { scanUrl, nama, kode, mulai, jumlah }
   */
  function buatStiker(cfg) {
    var fragmen = document.createDocumentFragment();

    for (var i = 0; i < cfg.jumlah; i++) {
      var nomor = cfg.mulai + i;

      var kartu = document.createElement('div');
      kartu.className = 'stiker';

      var judul = document.createElement('div');
      judul.className = 'stiker-nama';
      judul.textContent = cfg.nama;

      var kanvas = document.createElement('canvas');
      gambarQR(kanvas, cfg.scanUrl);

      var kodeEl = document.createElement('div');
      kodeEl.className = 'stiker-kode';
      kodeEl.textContent = cfg.kode;

      var nomorEl = document.createElement('div');
      nomorEl.className = 'stiker-ompreng';
      nomorEl.textContent = 'OMP-' + pad(nomor, 3);

      kartu.appendChild(judul);
      kartu.appendChild(kanvas);
      kartu.appendChild(kodeEl);
      kartu.appendChild(nomorEl);
      fragmen.appendChild(kartu);
    }

    return fragmen;
  }

  /** Gambar ulang seluruh stiker ke dalam sebuah wadah. */
  function gambarKe(wadah, cfg) {
    wadah.innerHTML = '';
    wadah.appendChild(buatStiker(cfg));
    return wadah;
  }

  root.StikerOmpreng = {
    gambarQR: gambarQR,
    buatStiker: buatStiker,
    gambarKe: gambarKe,
    SKALA: SKALA,
    MARGIN: MARGIN
  };
})(window);
