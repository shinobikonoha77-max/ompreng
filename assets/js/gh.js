/**
 * Pembungkus GitHub API untuk halaman admin.
 *
 * Membaca data: bisa lewat alamat situs biasa (semua berkas di repo publik).
 * Menyimpan data: lewat GitHub API memakai token, dan dilakukan sebagai
 * SATU commit untuk semua berkas supaya situs tidak dibangun berulang kali.
 */
(function (root) {
  'use strict';

  var KUNCI_SIMPAN = 'ompreng.github';
  var API = 'https://api.github.com';

  var state = {
    token: '',
    owner: '',
    repo: '',
    branch: ''
  };

  var infoRepoCache = null;

  /* ---------------------------------------------------------------- *
   * Setelan
   * ---------------------------------------------------------------- */

  function muatSimpanan() {
    try {
      var isi = JSON.parse(localStorage.getItem(KUNCI_SIMPAN) || '{}');
      state.token = isi.token || '';
      state.owner = isi.owner || '';
      state.repo = isi.repo || '';
      state.branch = isi.branch || '';
    } catch (err) {
      // Setelan rusak, abaikan saja dan mulai dari kosong.
    }
    infoRepoCache = null;
    return state;
  }

  function simpanSetelan(baru) {
    state.token = baru.token !== undefined ? baru.token : state.token;
    state.owner = baru.owner !== undefined ? baru.owner : state.owner;
    state.repo = baru.repo !== undefined ? baru.repo : state.repo;
    state.branch = baru.branch !== undefined ? baru.branch : state.branch;

    localStorage.setItem(KUNCI_SIMPAN, JSON.stringify({
      token: state.token,
      owner: state.owner,
      repo: state.repo,
      branch: state.branch
    }));

    infoRepoCache = null;
  }

  function lupakan() {
    localStorage.removeItem(KUNCI_SIMPAN);
    state.token = '';
    state.branch = '';
    infoRepoCache = null;
  }

  function siap() {
    return Boolean(state.token && state.owner && state.repo);
  }

  function alamatRepo() {
    return state.owner + '/' + state.repo;
  }

  /* ---------------------------------------------------------------- *
   * Panggilan API
   * ---------------------------------------------------------------- */

  function pesanError(status, teks) {
    var detail = '';
    try {
      detail = (JSON.parse(teks) || {}).message || '';
    } catch (err) {
      detail = '';
    }

    var dasar;
    switch (status) {
      case 401:
        dasar = 'Token ditolak. Pastikan token masih berlaku dan tidak salah salin.';
        break;
      case 403:
        dasar = 'Token tidak punya izin yang cukup, atau kuota permintaan sedang habis.';
        break;
      case 404:
        dasar = 'Repo tidak ditemukan. Cek nama pemilik dan nama repo, dan pastikan token diberi akses ke repo ini.';
        break;
      case 409:
        dasar = 'Isi repo berubah saat menyimpan. Coba klik simpan sekali lagi.';
        break;
      case 422:
        dasar = 'Data ditolak GitHub. Biasanya karena nama cabang (branch) salah.';
        break;
      default:
        dasar = 'GitHub mengembalikan kode ' + status + '.';
    }

    return dasar + (detail ? ' (' + detail + ')' : '');
  }

  function api(jalur, opsi) {
    opsi = opsi || {};

    if (!state.token) {
      return Promise.reject(new Error('Token GitHub belum diisi. Buka bagian Setelan di halaman admin.'));
    }

    var header = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Authorization': 'Bearer ' + state.token
    };

    return fetch(API + jalur, {
      method: opsi.method || 'GET',
      headers: header,
      body: opsi.body ? JSON.stringify(opsi.body) : undefined,
      cache: 'no-store'
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (teks) {
          throw new Error(pesanError(res.status, teks));
        });
      }
      if (res.status === 204) { return null; }
      return res.json();
    });
  }

  /** Ambil berkas publik dari situs ini sendiri (tanpa token, selalu terbaru). */
  function ambilPublik(jalur) {
    return fetch(jalur + '?t=' + Date.now(), { cache: 'no-store' }).then(function (res) {
      if (!res.ok) {
        throw new Error('Berkas ' + jalur + ' tidak ditemukan (HTTP ' + res.status + ').');
      }
      return res.text();
    });
  }

  function ambilJsonPublik(jalur) {
    return ambilPublik(jalur).then(function (teks) {
      return JSON.parse(teks);
    });
  }

  /* ---------------------------------------------------------------- *
   * Info repo
   * ---------------------------------------------------------------- */

  function infoRepo() {
    if (infoRepoCache) { return Promise.resolve(infoRepoCache); }

    return api('/repos/' + alamatRepo()).then(function (data) {
      infoRepoCache = {
        nama: data.full_name,
        privat: Boolean(data.private),
        cabangUtama: data.default_branch || 'main'
      };
      return infoRepoCache;
    });
  }

  function cabang() {
    return state.branch || infoRepo().then(function (info) { return info.cabangUtama; });
  }

  /** Cek token + repo sekaligus; dipakai tombol "Cek Koneksi". */
  function cekKoneksi() {
    return infoRepo().then(function (info) {
      return {
        repo: info.nama,
        privat: info.privat,
        cabang: state.branch || info.cabangUtama
      };
    });
  }

  /* ---------------------------------------------------------------- *
   * Membaca berkas
   * ---------------------------------------------------------------- */

  /** Isi sebuah berkas lewat API. Mengembalikan null kalau belum ada. */
  function ambilBerkas(jalur) {
    return api('/repos/' + alamatRepo() + '/contents/' + jalur + '?t=' + Date.now())
      .then(function (data) {
        if (!data || data.type !== 'file') { return null; }
        return {
          path: data.path,
          isi: OmprengLib.base64KeTeks(data.content),
          sha: data.sha
        };
      })
      .catch(function (err) {
        if (/kode 404/.test(err.message)) { return null; }
        throw err;
      });
  }

  function ambilJson(jalur) {
    return ambilBerkas(jalur).then(function (berkas) {
      if (!berkas) { return null; }
      try {
        return JSON.parse(berkas.isi);
      } catch (err) {
        throw new Error('Berkas ' + jalur + ' isinya rusak dan tidak bisa dibaca.');
      }
    });
  }

  /** Daftar berkas di dalam satu folder repo. */
  function daftarFolder(jalur) {
    var bersih = String(jalur).replace(/\/+$/, '');

    return api('/repos/' + alamatRepo() + '/contents/' + bersih + '?t=' + Date.now())
      .then(function (data) {
        return Array.isArray(data) ? data : [];
      })
      .catch(function (err) {
        if (/kode 404/.test(err.message)) { return []; }
        throw err;
      });
  }

  /* ---------------------------------------------------------------- *
   * Menyimpan berkas (satu commit untuk semuanya)
   * ---------------------------------------------------------------- */

  /**
   * berkas: [{ path: 'data/x.json', base64: '...' }]
   */
  function commitBanyak(berkas, pesan) {
    if (!berkas.length) {
      return Promise.reject(new Error('Tidak ada berkas yang mau disimpan.'));
    }

    var repo = alamatRepo();

    return cabang().then(function (namaCabang) {
      return api('/repos/' + repo + '/git/ref/heads/' + namaCabang).then(function (ref) {
        var indukSha = ref.object.sha;

        return api('/repos/' + repo + '/git/commits/' + indukSha).then(function (komitInduk) {
          // Buat blob untuk tiap berkas, satu per satu.
          var urutan = Promise.resolve([]);
          berkas.forEach(function (f) {
            urutan = urutan.then(function (hasil) {
              return api('/repos/' + repo + '/git/blobs', {
                method: 'POST',
                body: { content: f.base64, encoding: 'base64' }
              }).then(function (blob) {
                hasil.push({
                  path: f.path,
                  mode: '100644',
                  type: 'blob',
                  sha: blob.sha
                });
                return hasil;
              });
            });
          });

          return urutan.then(function (daftarBlob) {
            return api('/repos/' + repo + '/git/trees', {
              method: 'POST',
              body: { base_tree: komitInduk.tree.sha, tree: daftarBlob }
            });
          }).then(function (tree) {
            return api('/repos/' + repo + '/git/commits', {
              method: 'POST',
              body: {
                message: pesan,
                tree: tree.sha,
                parents: [indukSha]
              }
            });
          }).then(function (komitBaru) {
            return api('/repos/' + repo + '/git/refs/heads/' + namaCabang, {
              method: 'PATCH',
              body: { sha: komitBaru.sha }
            }).then(function () {
              return { sha: komitBaru.sha, cabang: namaCabang };
            });
          });
        });
      });
    });
  }

  /** Simpan satu berkas JSON sebagai teks. */
  function commitJson(jalur, objek, pesan) {
    return commitBanyak([{
      path: jalur,
      base64: OmprengLib.teksKeBase64(JSON.stringify(objek, null, 2) + '\n')
    }], pesan);
  }

  root.GH = {
    state: state,
    muatSimpanan: muatSimpanan,
    simpanSetelan: simpanSetelan,
    lupakan: lupakan,
    siap: siap,
    alamatRepo: alamatRepo,
    cekKoneksi: cekKoneksi,
    infoRepo: infoRepo,
    cabang: cabang,
    ambilBerkas: ambilBerkas,
    ambilJson: ambilJson,
    ambilJsonPublik: ambilJsonPublik,
    daftarFolder: daftarFolder,
    commitBanyak: commitBanyak,
    commitJson: commitJson
  };
})(window);
