/**
 * Generator poster menu ompreng.
 *
 * Digambar di browser memakai canvas, lalu hasilnya dikirim ke server
 * sebagai file PNG. Inilah gambar yang muncul saat QR diompreng di-scan.
 */
(function (global) {
  'use strict';

  var WARNA = {
    hijau: '#167a4c',
    hijauTua: '#0f5c39',
    hijauMuda: '#e8f5ee',
    hijauGaris: '#c9e6d6',
    teks: '#1f2a25',
    teksLembut: '#6b7a73',
    garis: '#dde5e1',
    putih: '#ffffff'
  };

  var FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  var LABEL_KATEGORI = {
    makanan_pokok: 'Makanan Pokok',
    lauk_hewani: 'Lauk Hewani',
    lauk_nabati: 'Lauk Nabati',
    sayur: 'Sayur',
    buah: 'Buah',
    susu: 'Susu / Minuman',
    lain: 'Tambahan'
  };

  var URUTAN_KATEGORI = ['makanan_pokok', 'lauk_hewani', 'lauk_nabati', 'sayur', 'buah', 'susu', 'lain'];

  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  function font(weight, size) {
    return weight + ' ' + size + 'px ' + FONT;
  }

  function parseTanggal(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) { return null; }
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function tanggalIndonesia(iso) {
    var d = parseTanggal(iso);
    if (!d) { return ''; }
    return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  }

  function hariIndonesia(iso) {
    var d = parseTanggal(iso);
    return d ? HARI[d.getDay()] : '';
  }

  function angkaGizi(nilai) {
    if (nilai === null || nilai === undefined || String(nilai).trim() === '') { return '-'; }
    var n = Number(String(nilai).replace(',', '.'));
    if (isNaN(n)) { return String(nilai); }
    return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
  }

  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /** Gambar dengan mode "cover" supaya tidak gepeng. */
  function gambarCover(ctx, img, x, y, w, h) {
    var rasioImg = img.width / img.height;
    var rasioKotak = w / h;
    var sw, sh, sx, sy;

    if (rasioImg > rasioKotak) {
      sh = img.height;
      sw = sh * rasioKotak;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / rasioKotak;
      sx = 0;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  /** Tulis teks, kecilkan ukuran font otomatis kalau kepanjangan. */
  function teksPas(ctx, text, opsi) {
    var size = opsi.size;
    var min = opsi.minSize || Math.round(size * 0.6);

    ctx.font = font(opsi.weight || '400', size);
    while (size > min && ctx.measureText(text).width > opsi.maxWidth) {
      size -= 1;
      ctx.font = font(opsi.weight || '400', size);
    }

    ctx.fillStyle = opsi.color || WARNA.teks;
    ctx.textAlign = opsi.align || 'left';
    ctx.textBaseline = opsi.baseline || 'alphabetic';
    ctx.fillText(text, opsi.x, opsi.y);

    return size;
  }

  function potongTeks(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) { return text; }
    var hasil = text;
    while (hasil.length > 1 && ctx.measureText(hasil + '…').width > maxWidth) {
      hasil = hasil.slice(0, -1);
    }
    return hasil + '…';
  }

  /**
   * Susun baris-baris komponen menu: judul kategori + itemnya.
   */
  function susunBaris(items) {
    var grup = {};
    items.forEach(function (it) {
      var nama = String(it.nama || '').trim();
      if (!nama) { return; }
      var kat = LABEL_KATEGORI[it.kategori] ? it.kategori : 'lain';
      (grup[kat] = grup[kat] || []).push({
        nama: nama,
        gram: it.berat_gram === '' || it.berat_gram === null || it.berat_gram === undefined ? null : Number(it.berat_gram)
      });
    });

    var baris = [];
    URUTAN_KATEGORI.forEach(function (kat) {
      if (!grup[kat]) { return; }
      baris.push({ tipe: 'kategori', label: LABEL_KATEGORI[kat] });
      grup[kat].forEach(function (item) {
        baris.push({ tipe: 'item', nama: item.nama, gram: item.gram });
      });
    });

    return baris;
  }

  function gambarGizi(ctx, data, x, y, w, h) {
    var kotak = [
      { label: 'Kalori', nilai: angkaGizi(data.kalori), satuan: 'kkal' },
      { label: 'Protein', nilai: angkaGizi(data.protein), satuan: 'g' },
      { label: 'Karbohidrat', nilai: angkaGizi(data.karbohidrat), satuan: 'g' },
      { label: 'Lemak', nilai: angkaGizi(data.lemak), satuan: 'g' }
    ];

    var gap = 16;
    var lebar = (w - gap * 3) / 4;

    kotak.forEach(function (k, i) {
      var kx = x + i * (lebar + gap);

      ctx.save();
      roundRect(ctx, kx, y, lebar, h, 18);
      ctx.fillStyle = WARNA.hijauMuda;
      ctx.fill();
      ctx.strokeStyle = WARNA.hijauGaris;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.font = font('700', 19);
      ctx.fillStyle = WARNA.teksLembut;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(k.label.toUpperCase(), kx + lebar / 2, y + 40);

      var ukuranNilai = teksPas(ctx, k.nilai, {
        x: kx + lebar / 2, y: y + 100, size: 46, minSize: 28, weight: '700',
        color: WARNA.hijauTua, align: 'center', maxWidth: lebar - 30
      });

      ctx.font = font('600', 21);
      ctx.fillStyle = WARNA.teksLembut;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(k.satuan, kx + lebar / 2 + ctx.measureText(k.nilai).width / 2 + 6, y + 100);
      void ukuranNilai;
    });
  }

  /**
   * Gambar poster lengkap ke canvas.
   * data: { nama_dapur, kode_dapur, tanggal, judul, kalori, protein,
   *         karbohidrat, lemak, berat_porsi, batch, jam_produksi,
   *         pengawas, ahli_gizi, catatan, items[], foto (Image|null) }
   */
  function render(canvas, data, opts) {
    opts = opts || {};
    var W = opts.width || 1080;
    var H = opts.height || 1440;
    var M = 70;
    var CW = W - M * 2;

    canvas.width = W;
    canvas.height = H;

    var ctx = canvas.getContext('2d');

    // --- Latar -----------------------------------------------------
    ctx.fillStyle = WARNA.putih;
    ctx.fillRect(0, 0, W, H);

    // --- Kepala ----------------------------------------------------
    var grad = ctx.createLinearGradient(0, 0, W, 200);
    grad.addColorStop(0, WARNA.hijauTua);
    grad.addColorStop(1, '#2f9a67');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 200);

    ctx.font = font('700', 22);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('MENU HARI INI', M, 62);

    teksPas(ctx, String(data.nama_dapur || 'Dapur'), {
      x: M, y: 132, size: 46, minSize: 24, weight: '700',
      color: WARNA.putih, maxWidth: CW * 0.62
    });

    var kode = String(data.kode_dapur || '');
    if (kode) {
      ctx.font = font('600', 20);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillText(kode, M, 172);
    }

    ctx.textAlign = 'right';
    ctx.font = font('700', 30);
    ctx.fillStyle = WARNA.putih;
    ctx.fillText(hariIndonesia(data.tanggal), W - M, 100);

    ctx.font = font('400', 24);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText(tanggalIndonesia(data.tanggal), W - M, 142);

    // --- Foto menu -------------------------------------------------
    var fotoY = 236;
    var fotoH = 420;

    ctx.save();
    roundRect(ctx, M, fotoY, CW, fotoH, 22);
    ctx.clip();

    if (data.foto) {
      gambarCover(ctx, data.foto, M, fotoY, CW, fotoH);
    } else {
      ctx.fillStyle = '#f1f4f2';
      ctx.fillRect(M, fotoY, CW, fotoH);
      ctx.font = font('600', 30);
      ctx.fillStyle = WARNA.teksLembut;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Foto menu belum diunggah', M + CW / 2, fotoY + fotoH / 2);
    }
    ctx.restore();

    ctx.save();
    roundRect(ctx, M, fotoY, CW, fotoH, 22);
    ctx.strokeStyle = WARNA.garis;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // --- Judul -----------------------------------------------------
    var y = fotoY + fotoH + 66;

    if (data.judul) {
      teksPas(ctx, String(data.judul), {
        x: M, y: y, size: 40, minSize: 24, weight: '700',
        color: WARNA.teks, maxWidth: CW
      });
      y += 16;
    }

    // --- Komponen menu ---------------------------------------------
    var baris = susunBaris(data.items || []);
    var areaAtas = y + 22;
    var areaBawah = 1145;
    var areaTinggi = areaBawah - areaAtas;

    if (baris.length) {
      var tengah = Math.ceil(baris.length / 2);
      var kolom = [baris.slice(0, tengah), baris.slice(tengah)].filter(function (k) { return k.length; });
      var lebarKolom = kolom.length === 2 ? (CW - 40) / 2 : CW;

      // Tinggi tiap baris menyesuaikan isi kolom supaya tidak melewati area.
      var tinggiTotal = 0;
      kolom.forEach(function (k) {
        var t = 0;
        k.forEach(function (b) { t += b.tipe === 'kategori' ? 42 : 48; });
        tinggiTotal = Math.max(tinggiTotal, t);
      });

      var skala = tinggiTotal > areaTinggi ? Math.max(0.62, areaTinggi / tinggiTotal) : 1;

      kolom.forEach(function (k, ki) {
        var kx = M + ki * (lebarKolom + 40);
        var ky = areaAtas;

        k.forEach(function (b) {
          if (b.tipe === 'kategori') {
            ctx.font = font('700', Math.round(21 * skala));
            ctx.fillStyle = WARNA.hijau;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(b.label.toUpperCase(), kx, ky + 22 * skala);
            ky += 42 * skala;
            return;
          }

          var ukuran = Math.round(29 * skala);
          ctx.font = font('600', ukuran);
          ctx.fillStyle = WARNA.teks;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';

          // Bulatan kecil sebagai penanda
          ctx.save();
          ctx.beginPath();
          ctx.arc(kx + 6, ky + 22 * skala - ukuran * 0.3, 4 * skala, 0, Math.PI * 2);
          ctx.fillStyle = WARNA.hijau;
          ctx.fill();
          ctx.restore();

          var teksGram = b.gram ? b.gram + ' g' : '';
          var lebarGram = 0;
          if (teksGram) {
            ctx.font = font('500', Math.round(21 * skala));
            lebarGram = ctx.measureText(teksGram).width + 12;
          }

          ctx.font = font('600', ukuran);
          var maxNama = lebarKolom - 26 - lebarGram;
          var nama = potongTeks(ctx, b.nama, maxNama);
          ctx.fillStyle = WARNA.teks;
          ctx.fillText(nama, kx + 26, ky + 22 * skala);

          if (teksGram) {
            ctx.font = font('500', Math.round(21 * skala));
            ctx.fillStyle = WARNA.teksLembut;
            ctx.textAlign = 'right';
            ctx.fillText(teksGram, kx + lebarKolom, ky + 22 * skala);
            ctx.textAlign = 'left';
          }

          ky += 48 * skala;
        });
      });
    } else {
      ctx.font = font('500', 28);
      ctx.fillStyle = WARNA.teksLembut;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Komponen menu belum diisi.', M, areaAtas + 30);
    }

    // --- Gizi makro ------------------------------------------------
    gambarGizi(ctx, data, M, 1166, CW, 150);

    // --- Kaki ------------------------------------------------------
    ctx.strokeStyle = WARNA.garis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(M, 1352);
    ctx.lineTo(W - M, 1352);
    ctx.stroke();

    var info = [];
    if (data.berat_porsi) { info.push('Berat porsi ' + data.berat_porsi + ' g'); }
    if (data.batch) { info.push('Batch ' + data.batch); }
    if (data.jam_produksi) { info.push('Produksi ' + data.jam_produksi); }
    if (data.pengawas) { info.push('Pengawas ' + data.pengawas); }
    if (data.ahli_gizi) { info.push('Ahli gizi ' + data.ahli_gizi); }

    ctx.font = font('500', 21);
    ctx.fillStyle = WARNA.teksLembut;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    var barisKaki = potongTeks(ctx, info.join('  ·  '), CW);
    ctx.fillText(barisKaki, M, 1392);

    if (data.catatan) {
      ctx.font = font('500', 19);
      ctx.fillStyle = WARNA.teksLembut;
      ctx.textAlign = 'left';
      ctx.fillText(potongTeks(ctx, String(data.catatan), CW), M, 1418);
    }

    return canvas;
  }

  /** Muat gambar dari URL, kembalikan null kalau gagal. */
  function muatGambar(src) {
    return new Promise(function (resolve) {
      if (!src) { return resolve(null); }
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  global.PosterMenu = {
    render: render,
    muatGambar: muatGambar,
    tanggalIndonesia: tanggalIndonesia,
    hariIndonesia: hariIndonesia,
    angkaGizi: angkaGizi,
    LABEL_KATEGORI: LABEL_KATEGORI
  };
})(window);
