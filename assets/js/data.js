/**
 * Cara membaca data.
 *
 * - Kalau token sudah diisi, data dibaca lewat GitHub API supaya selalu
 *   yang terbaru (GitHub Pages menyimpan cache sampai 10 menit).
 * - Kalau belum, data dibaca langsung dari berkas publik situs ini.
 */
(function (root) {
  'use strict';

  var LIB = root.OmprengLib;

  function bacaPublik(jalur) {
    return fetch(jalur + '?t=' + Date.now(), { cache: 'no-store' }).then(function (res) {
      if (!res.ok) {
        throw new Error('Berkas ' + jalur + ' belum ada di repo (HTTP ' + res.status + ').');
      }
      return res.json();
    });
  }

  /** Coba lewat API dulu (kalau ada token), lalu jatuh ke berkas publik. */
  function baca(jalur, bawaan) {
    return Promise.resolve()
      .then(function () {
        if (root.GH && root.GH.siap()) {
          return root.GH.ambilJson(jalur).then(function (data) {
            return data === null ? undefined : data;
          });
        }
        return undefined;
      })
      .then(function (data) {
        if (data !== undefined) { return data; }
        return bacaPublik(jalur);
      })
      .catch(function () {
        return bawaan;
      });
  }

  /** Daftar dapur/SPPG. Selalu mengembalikan objek, tidak pernah gagal. */
  function bacaDaftarDapur() {
    return baca(LIB.pathDaftarDapur(), { dapur: [] }).then(function (data) {
      if (Array.isArray(data)) { return { dapur: data }; }
      if (!data || !Array.isArray(data.dapur)) { return { dapur: [] }; }
      return data;
    });
  }

  /** Data menu satu tanggal. Mengembalikan null kalau belum diisi. */
  function bacaMenu(kode, tanggal) {
    return baca(LIB.pathDataMenu(kode, tanggal), null);
  }

  /**
   * Semua menu yang tercatat untuk satu dapur, terbaru di atas.
   * Perlu token karena butuh membaca daftar isi folder.
   */
  function daftarMenu(kode) {
    if (!root.GH || !root.GH.siap()) {
      return Promise.resolve([]);
    }

    return root.GH.daftarFolder('data/' + kode).then(function (berkas) {
      var tanggal = berkas
        .filter(function (b) { return b.type === 'file' && /^\d{4}-\d{2}-\d{2}\.json$/.test(b.name); })
        .map(function (b) { return b.name.replace(/\.json$/, ''); })
        .sort()
        .reverse();

      // Dibaca berurutan supaya tidak menabrak batas permintaan GitHub.
      return tanggal.reduce(function (rantai, tgl) {
        return rantai.then(function (hasil) {
          return bacaMenu(kode, tgl).then(function (menu) {
            if (menu) { hasil.push(menu); }
            return hasil;
          });
        });
      }, Promise.resolve([]));
    });
  }

  root.DataOmpreng = {
    bacaDaftarDapur: bacaDaftarDapur,
    bacaMenu: bacaMenu,
    daftarMenu: daftarMenu,
    bacaPublik: bacaPublik
  };
})(window);
