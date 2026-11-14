import { BookJob } from '../types';
import { extractSpreadsheetId, buildGoogleSheetCsvUrl, parseSheetData, parseSheetValues } from '../utils/sheetHelpers';

export class AuthExpiredError extends Error {
  constructor(message = 'Sesi otorisasi Google Sheets telah berakhir.') {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

export class SheetPermissionError extends Error {
  constructor(
    message = 'Anda tidak memiliki izin akses ke Google Sheet ini, atau Google Sheets API belum diaktifkan di Google Cloud Console.'
  ) {
    super(message);
    this.name = 'SheetPermissionError';
  }
}

/**
 * ============================================================================
 * KONSTANTA URL DATA JSON
 * ============================================================================
 * Ganti URL di bawah ini dengan URL endpoint JSON Anda (misal dari Google Apps Script,
 * GitHub Gist, atau server API Anda).
 * Bila string ini kosong ("") atau pengambilan gagal, aplikasi otomatis memakai
 * 44 baris data contoh realistis di bawah.
 */
export const JSON_DATA_URL: string = "";

/**
 * 44 baris data contoh realistis pekerjaan layout buku non-fiksi
 * (Hukum, Ekonomi, Pendidikan, Kesehatan, Sosial & Humaniora, Bisnis)
 * Rentang waktu: Juli sampai November 2026.
 */
export const MOCK_BOOK_JOBS: BookJob[] = [
  {
    no: 1,
    judul: "Hukum Acara Perdata Kontemporer di Indonesia",
    penulis: "Prof. Dr. Bagas Sudiro, S.H., M.Hum.",
    kategori: "Hukum",
    paket: "Premium",
    statusProgres: "Selesai",
    tglTerima: "2026-07-04",
    tglSelesaiLayout: "2026-07-20",
    updateTerakhir: "2026-08-05",
    hariBerjalan: 16,
    halamanAwal: 240,
    halamanFinal: 284,
    stuck: "Tidak",
    nilaiJasa: 2850000,
    statusBayar: "Lunas",
    tglInvoice: "2026-07-22",
    tglDibayar: "2026-08-05",
    umurPiutang: 0,
    catatanBelumSelesai: "Layout final disetujui tanpa revisi minor.",
    lamaLayoutAwal: 14,
  },
  {
    no: 2,
    judul: "Ekonomi Digital dan Ekosistem UMKM Mandiri",
    penulis: "Dr. Hendra Gunawan, S.E., M.Si.",
    kategori: "Ekonomi",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-07-08",
    tglSelesaiLayout: "2026-07-24",
    updateTerakhir: "2026-08-14",
    hariBerjalan: 16,
    halamanAwal: 185,
    halamanFinal: 210,
    stuck: "Tidak",
    nilaiJasa: 1450000,
    statusBayar: "Lunas",
    tglInvoice: "2026-07-26",
    tglDibayar: "2026-08-14",
    umurPiutang: 0,
    catatanBelumSelesai: "Selesai cetak dummy.",
    lamaLayoutAwal: 12,
  },
  {
    no: 3,
    judul: "Metodologi Pengajaran Berdiferensiasi Kurikulum Merdeka",
    penulis: "Dra. Siti Rahmah, M.Pd.",
    kategori: "Pendidikan",
    paket: "Basic",
    statusProgres: "Selesai",
    tglTerima: "2026-07-12",
    tglSelesaiLayout: "2026-07-25",
    updateTerakhir: "2026-08-18",
    hariBerjalan: 13,
    halamanAwal: 140,
    halamanFinal: 162,
    stuck: "Tidak",
    nilaiJasa: 750000,
    statusBayar: "Lunas",
    tglInvoice: "2026-07-28",
    tglDibayar: "2026-08-18",
    umurPiutang: 0,
    catatanBelumSelesai: "Lunas transfer BCA.",
    lamaLayoutAwal: 10,
  },
  {
    no: 4,
    judul: "Kesehatan Masyarakat & Pencegahan Stunting Pedesaan",
    penulis: "dr. Raden Wahyudi, Sp.A., M.Kes.",
    kategori: "Kesehatan",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-07-16",
    tglSelesaiLayout: "2026-08-01",
    updateTerakhir: "2026-08-20",
    hariBerjalan: 16,
    halamanAwal: 210,
    halamanFinal: 236,
    stuck: "Tidak",
    nilaiJasa: 1650000,
    statusBayar: "Lunas",
    tglInvoice: "2026-08-03",
    tglDibayar: "2026-08-20",
    umurPiutang: 0,
    catatanBelumSelesai: "Pembayaran terverifikasi tepat waktu.",
    lamaLayoutAwal: 12,
  },
  {
    no: 5,
    judul: "Pengantar Hukum Tata Kelola Lingkungan Hidup",
    penulis: "Dr. Farida Aryani, S.H., M.H.",
    kategori: "Hukum",
    paket: "Basic",
    statusProgres: "Selesai",
    tglTerima: "2026-07-22",
    tglSelesaiLayout: "2026-08-04",
    updateTerakhir: "2026-08-25",
    hariBerjalan: 13,
    halamanAwal: 125,
    halamanFinal: 148,
    stuck: "Tidak",
    nilaiJasa: 650000,
    statusBayar: "Lunas",
    tglInvoice: "2026-08-06",
    tglDibayar: "2026-08-25",
    umurPiutang: 0,
    catatanBelumSelesai: "Selesai tuntas.",
    lamaLayoutAwal: 10,
  },
  {
    no: 6,
    judul: "Analisis Laporan Keuangan Perbankan Syariah",
    penulis: "Muhammad Faisal, S.E., M.Ak., Ak.",
    kategori: "Ekonomi",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-07-26",
    tglSelesaiLayout: "2026-08-10",
    updateTerakhir: "2026-08-30",
    hariBerjalan: 15,
    halamanAwal: 195,
    halamanFinal: 220,
    stuck: "Tidak",
    nilaiJasa: 1550000,
    statusBayar: "Lunas",
    tglInvoice: "2026-08-12",
    tglDibayar: "2026-08-30",
    umurPiutang: 0,
    catatanBelumSelesai: "Desain infografis tabel neraca disetujui.",
    lamaLayoutAwal: 11,
  },
  {
    no: 7,
    judul: "Manajemen Mutu Pendidikan Tinggi Vokasi",
    penulis: "Prof. Ir. Joko Susanto, M.T., Ph.D.",
    kategori: "Pendidikan",
    paket: "Premium",
    statusProgres: "Selesai",
    tglTerima: "2026-08-02",
    tglSelesaiLayout: "2026-08-19",
    updateTerakhir: "2026-09-02",
    hariBerjalan: 17,
    halamanAwal: 310,
    halamanFinal: 360,
    stuck: "Tidak",
    nilaiJasa: 2900000,
    statusBayar: "Lunas",
    tglInvoice: "2026-08-21",
    tglDibayar: "2026-09-02",
    umurPiutang: 0,
    catatanBelumSelesai: "Layout buku referensi komplit.",
    lamaLayoutAwal: 15,
  },
  {
    no: 8,
    judul: "Epidemiologi Penyakit Menular & Surveilans Komprehensif",
    penulis: "dr. Nurul Hidayati, M.Epid.",
    kategori: "Kesehatan",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-08-05",
    tglSelesaiLayout: "2026-08-22",
    updateTerakhir: "2026-09-10",
    hariBerjalan: 17,
    halamanAwal: 220,
    halamanFinal: 252,
    stuck: "Tidak",
    nilaiJasa: 1750000,
    statusBayar: "Lunas",
    tglInvoice: "2026-08-24",
    tglDibayar: "2026-09-10",
    umurPiutang: 0,
    catatanBelumSelesai: "Selesai tanpa kendala.",
    lamaLayoutAwal: 14,
  },
  {
    no: 9,
    judul: "Hukum Perlindungan Data Pribadi Era AI",
    penulis: "Ahmad Zaki, S.H., LL.M.",
    kategori: "Hukum",
    paket: "Premium",
    statusProgres: "Selesai",
    tglTerima: "2026-08-10",
    tglSelesaiLayout: "2026-08-27",
    updateTerakhir: "2026-09-15",
    hariBerjalan: 17,
    halamanAwal: 280,
    halamanFinal: 322,
    stuck: "Tidak",
    nilaiJasa: 2600000,
    statusBayar: "Lunas",
    tglInvoice: "2026-08-29",
    tglDibayar: "2026-09-15",
    umurPiutang: 0,
    catatanBelumSelesai: "Sudah diterbitkan penerbit kampus.",
    lamaLayoutAwal: 14,
  },
  {
    no: 10,
    judul: "Strategi Fiskal & Kebijakan Moneter Pasca-Pandemi",
    penulis: "Dr. Budi Santoso, S.E., M.Ec.",
    kategori: "Ekonomi",
    paket: "Basic",
    statusProgres: "Selesai",
    tglTerima: "2026-08-14",
    tglSelesaiLayout: "2026-08-26",
    updateTerakhir: "2026-09-20",
    hariBerjalan: 12,
    halamanAwal: 110,
    halamanFinal: 130,
    stuck: "Tidak",
    nilaiJasa: 550000,
    statusBayar: "Lunas",
    tglInvoice: "2026-08-28",
    tglDibayar: "2026-09-20",
    umurPiutang: 0,
    catatanBelumSelesai: "Lunas.",
    lamaLayoutAwal: 9,
  },
  {
    no: 11,
    judul: "Pedoman Praktis Keperawatan Gawat Darurat",
    penulis: "Ns. Eko Prasetyo, M.Kep., Sp.Kep.MB",
    kategori: "Kesehatan",
    paket: "Basic",
    statusProgres: "Selesai",
    tglTerima: "2026-08-18",
    tglSelesaiLayout: "2026-08-30",
    updateTerakhir: "2026-09-25",
    hariBerjalan: 12,
    halamanAwal: 95,
    halamanFinal: 115,
    stuck: "Tidak",
    nilaiJasa: 450000,
    statusBayar: "Lunas",
    tglInvoice: "2026-09-01",
    tglDibayar: "2026-09-25",
    umurPiutang: 0,
    catatanBelumSelesai: "Buku saku praktikum.",
    lamaLayoutAwal: 8,
  },
  {
    no: 12,
    judul: "Sosiologi Hukum dan Dinamika Kearifan Lokal",
    penulis: "Dr. Rahmat Hidayat, M.Si.",
    kategori: "Hukum",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-08-22",
    tglSelesaiLayout: "2026-09-06",
    updateTerakhir: "2026-09-28",
    hariBerjalan: 15,
    halamanAwal: 175,
    halamanFinal: 202,
    stuck: "Tidak",
    nilaiJasa: 1350000,
    statusBayar: "Lunas",
    tglInvoice: "2026-09-08",
    tglDibayar: "2026-09-28",
    umurPiutang: 0,
    catatanBelumSelesai: "Selesai.",
    lamaLayoutAwal: 11,
  },
  {
    no: 13,
    judul: "Kewirausahaan Berbasis Riset & Inkubasi Bisnis",
    penulis: "Dr. Ir. Taufik Kurniawan, M.M.",
    kategori: "Bisnis",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-08-25",
    tglSelesaiLayout: "2026-09-12",
    updateTerakhir: "2026-10-02",
    hariBerjalan: 18,
    halamanAwal: 200,
    halamanFinal: 228,
    stuck: "Tidak",
    nilaiJasa: 1500000,
    statusBayar: "Lunas",
    tglInvoice: "2026-09-14",
    tglDibayar: "2026-10-02",
    umurPiutang: 0,
    catatanBelumSelesai: "Selesai dan dicetak.",
    lamaLayoutAwal: 12,
  },
  {
    no: 14,
    judul: "Psikologi Perkembangan Anak Usia Dini",
    penulis: "Dewi Lestari, S.Psi., M.Psi., Psikolog",
    kategori: "Pendidikan",
    paket: "Premium",
    statusProgres: "Selesai",
    tglTerima: "2026-08-28",
    tglSelesaiLayout: "2026-09-16",
    updateTerakhir: "2026-10-05",
    hariBerjalan: 19,
    halamanAwal: 260,
    halamanFinal: 305,
    stuck: "Tidak",
    nilaiJasa: 2400000,
    statusBayar: "Lunas",
    tglInvoice: "2026-09-18",
    tglDibayar: "2026-10-05",
    umurPiutang: 0,
    catatanBelumSelesai: "Semua bagan psikologis rapi.",
    lamaLayoutAwal: 14,
  },
  {
    no: 15,
    judul: "Farmakologi Klinis dan Terapi Rasional",
    penulis: "Prof. Dr. apt. Yunita Sari, M.Sc.",
    kategori: "Kesehatan",
    paket: "Premium",
    statusProgres: "Selesai",
    tglTerima: "2026-09-01",
    tglSelesaiLayout: "2026-09-20",
    updateTerakhir: "2026-10-12",
    hariBerjalan: 19,
    halamanAwal: 320,
    halamanFinal: 378,
    stuck: "Tidak",
    nilaiJasa: 3000000,
    statusBayar: "Lunas",
    tglInvoice: "2026-09-22",
    tglDibayar: "2026-10-12",
    umurPiutang: 0,
    catatanBelumSelesai: "Tabel dosis obat dan formula selesai.",
    lamaLayoutAwal: 16,
  },
  {
    no: 16,
    judul: "Hukum Ketenagakerjaan & Hubungan Industrial",
    penulis: "Drs. Hendro Wibowo, S.H., M.H.",
    kategori: "Hukum",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-09-04",
    tglSelesaiLayout: "2026-09-22",
    updateTerakhir: "2026-10-25",
    hariBerjalan: 18,
    halamanAwal: 215,
    halamanFinal: 246,
    stuck: "Tidak",
    nilaiJasa: 1700000,
    statusBayar: "Belum Dibayar",
    tglInvoice: "2026-09-24",
    tglDibayar: null,
    umurPiutang: 39,
    catatanBelumSelesai: "Invoice sudah dikirim 24 Sep. Follow up kedua belum ada respon.",
    lamaLayoutAwal: 13,
  },
  {
    no: 17,
    judul: "Evaluasi Program Pembelajaran Tematik Terpadu",
    penulis: "Dr. Hj. Siti Munawaroh, M.Pd.",
    kategori: "Pendidikan",
    paket: "Basic",
    statusProgres: "Selesai",
    tglTerima: "2026-09-08",
    tglSelesaiLayout: "2026-09-23",
    updateTerakhir: "2026-10-20",
    hariBerjalan: 15,
    halamanAwal: 130,
    halamanFinal: 154,
    stuck: "Tidak",
    nilaiJasa: 700000,
    statusBayar: "Lunas",
    tglInvoice: "2026-09-25",
    tglDibayar: "2026-10-20",
    umurPiutang: 0,
    catatanBelumSelesai: "Lunas via transfer.",
    lamaLayoutAwal: 10,
  },
  {
    no: 18,
    judul: "Ekonomi Sirkular & Transformasi Energi Bersih",
    penulis: "Dr. Aditya Pratama, S.E., M.Env.Econ.",
    kategori: "Ekonomi",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-09-12",
    tglSelesaiLayout: "2026-09-29",
    updateTerakhir: "2026-10-29",
    hariBerjalan: 17,
    halamanAwal: 190,
    halamanFinal: 218,
    stuck: "Tidak",
    nilaiJasa: 1500000,
    statusBayar: "Belum Dibayar",
    tglInvoice: "2026-10-01",
    tglDibayar: null,
    umurPiutang: 32,
    catatanBelumSelesai: "Menunggu pencairan anggaran fakultas.",
    lamaLayoutAwal: 12,
  },
  {
    no: 19,
    judul: "Gizi Seimbang Ibu Hamil dan Imunologi Anak",
    penulis: "dr. Maya Anggraini, Sp.GK.",
    kategori: "Kesehatan",
    paket: "Basic",
    statusProgres: "Selesai",
    tglTerima: "2026-09-15",
    tglSelesaiLayout: "2026-09-27",
    updateTerakhir: "2026-10-28",
    hariBerjalan: 12,
    halamanAwal: 85,
    halamanFinal: 98,
    stuck: "Tidak",
    nilaiJasa: 400000,
    statusBayar: "Lunas",
    tglInvoice: "2026-09-29",
    tglDibayar: "2026-10-28",
    umurPiutang: 0,
    catatanBelumSelesai: "Selesai.",
    lamaLayoutAwal: 8,
  },
  {
    no: 20,
    judul: "Hukum Kepailitan & Penundaan Pembayaran Utang",
    penulis: "Dr. Herman Darmawan, S.H., M.Kn.",
    kategori: "Hukum",
    paket: "Premium",
    statusProgres: "Selesai",
    tglTerima: "2026-09-18",
    tglSelesaiLayout: "2026-10-06",
    updateTerakhir: "2026-10-22",
    hariBerjalan: 18,
    halamanAwal: 270,
    halamanFinal: 312,
    stuck: "Tidak",
    nilaiJasa: 2500000,
    statusBayar: "Lunas",
    tglInvoice: "2026-10-08",
    tglDibayar: "2026-10-22",
    umurPiutang: 0,
    catatanBelumSelesai: "Lunas penuh.",
    lamaLayoutAwal: 13,
  },
  {
    no: 21,
    judul: "Statistika Terapan untuk Penelitian Sosial",
    penulis: "Prof. Dr. Ir. Sugeng Riyadi, M.Stat.",
    kategori: "Sosial & Humaniora",
    paket: "Premium",
    statusProgres: "Selesai",
    tglTerima: "2026-09-22",
    tglSelesaiLayout: "2026-10-10",
    updateTerakhir: "2026-10-30",
    hariBerjalan: 18,
    halamanAwal: 290,
    halamanFinal: 340,
    stuck: "Tidak",
    nilaiJasa: 2750000,
    statusBayar: "Belum Dibayar",
    tglInvoice: "2026-10-12",
    tglDibayar: null,
    umurPiutang: 21,
    catatanBelumSelesai: "Sudah diterbitkan tagihan, janji bayar awal November.",
    lamaLayoutAwal: 14,
  },
  {
    no: 22,
    judul: "Manajemen Risiko Keuangan Korporasi Global",
    penulis: "Aris Munandar, S.E., M.B.A., CFA",
    kategori: "Ekonomi",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-09-26",
    tglSelesaiLayout: "2026-10-14",
    updateTerakhir: "2026-10-26",
    hariBerjalan: 18,
    halamanAwal: 210,
    halamanFinal: 238,
    stuck: "Tidak",
    nilaiJasa: 1600000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "File final siap kirim invoice ke prodi.",
    lamaLayoutAwal: 13,
  },
  {
    no: 23,
    judul: "Pemberdayaan Masyarakat Pesisir & Ketahanan Pangan",
    penulis: "Dr. Sri Handayani, S.Pi., M.Si.",
    kategori: "Sosial & Humaniora",
    paket: "Basic",
    statusProgres: "Selesai",
    tglTerima: "2026-09-28",
    tglSelesaiLayout: "2026-10-11",
    updateTerakhir: "2026-10-27",
    hariBerjalan: 13,
    halamanAwal: 140,
    halamanFinal: 158,
    stuck: "Tidak",
    nilaiJasa: 750000,
    statusBayar: "Lunas",
    tglInvoice: "2026-10-13",
    tglDibayar: "2026-10-27",
    umurPiutang: 0,
    catatanBelumSelesai: "Selesai.",
    lamaLayoutAwal: 9,
  },
  {
    no: 24,
    judul: "Etika Biomedis dalam Praktik Kedokteran Modern",
    penulis: "Prof. drg. Sudarmono, Sp.BM(K), Ph.D.",
    kategori: "Kesehatan",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-10-01",
    tglSelesaiLayout: "2026-10-18",
    updateTerakhir: "2026-10-28",
    hariBerjalan: 17,
    halamanAwal: 180,
    halamanFinal: 206,
    stuck: "Tidak",
    nilaiJasa: 1400000,
    statusBayar: "Belum Dibayar",
    tglInvoice: "2026-10-20",
    tglDibayar: null,
    umurPiutang: 13,
    catatanBelumSelesai: "Invoice telah dikirim ke bendahara institusi.",
    lamaLayoutAwal: 12,
  },
  {
    no: 25,
    judul: "Model Kepemimpinan Visioner Kepala Sekolah Era 5.0",
    penulis: "Drs. Ahmad Mansyur, M.Pd.I.",
    kategori: "Pendidikan",
    paket: "Basic",
    statusProgres: "Selesai",
    tglTerima: "2026-10-04",
    tglSelesaiLayout: "2026-10-16",
    updateTerakhir: "2026-10-29",
    hariBerjalan: 12,
    halamanAwal: 120,
    halamanFinal: 138,
    stuck: "Tidak",
    nilaiJasa: 600000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Layout selesai ACC, menunggu nomor ISBN.",
    lamaLayoutAwal: 8,
  },
  {
    no: 26,
    judul: "Hukum Arbitrase & Penyelesaian Sengketa Bisnis",
    penulis: "Adv. Denny Pratomo, S.H., M.H., Arb.",
    kategori: "Hukum",
    paket: "Premium",
    statusProgres: "Selesai",
    tglTerima: "2026-10-05",
    tglSelesaiLayout: "2026-10-23",
    updateTerakhir: "2026-10-31",
    hariBerjalan: 18,
    halamanAwal: 250,
    halamanFinal: 290,
    stuck: "Tidak",
    nilaiJasa: 2450000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Layout tuntas, siapkan invoice kolektif.",
    lamaLayoutAwal: 14,
  },
  {
    no: 27,
    judul: "Manajemen Pemasaran Hijau & Perilaku Konsumen",
    penulis: "Rini Kusumawati, S.E., M.M.",
    kategori: "Bisnis",
    paket: "Standart",
    statusProgres: "Selesai",
    tglTerima: "2026-10-08",
    tglSelesaiLayout: "2026-10-25",
    updateTerakhir: "2026-10-31",
    hariBerjalan: 17,
    halamanAwal: 170,
    halamanFinal: 196,
    stuck: "Tidak",
    nilaiJasa: 1350000,
    statusBayar: "Belum Dibayar",
    tglInvoice: "2026-10-27",
    tglDibayar: null,
    umurPiutang: 6,
    catatanBelumSelesai: "Invoice baru terbit 27 Okt.",
    lamaLayoutAwal: 11,
  },
  {
    no: 28,
    judul: "Kesehatan Gigi Komunitas & Tindakan Preventif",
    penulis: "drg. Fitri Amalia, Sp.KGA, M.Kes.",
    kategori: "Kesehatan",
    paket: "Basic",
    statusProgres: "Selesai",
    tglTerima: "2026-10-10",
    tglSelesaiLayout: "2026-10-22",
    updateTerakhir: "2026-10-30",
    hariBerjalan: 12,
    halamanAwal: 115,
    halamanFinal: 132,
    stuck: "Tidak",
    nilaiJasa: 550000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Selesai ACC, siap ditagih bersama buku kedua.",
    lamaLayoutAwal: 9,
  },
  {
    no: 29,
    judul: "Hukum Pajak dan Kepatuhan Wajib Pajak Badan",
    penulis: "Drs. Bambang Trihatmojo, Ak., S.H., M.M.",
    kategori: "Hukum",
    paket: "Standart",
    statusProgres: "Nunggu ACC Cetak",
    tglTerima: "2026-10-12",
    tglSelesaiLayout: "2026-10-29",
    updateTerakhir: "2026-11-01",
    hariBerjalan: 21,
    halamanAwal: 205,
    halamanFinal: 232,
    stuck: "Tidak",
    nilaiJasa: 1600000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Mockup sampul sudah siap, menunggu persetujuan akhir redaksi cetak.",
    lamaLayoutAwal: 13,
  },
  {
    no: 30,
    judul: "Inovasi Media Pembelajaran Berbasis Augmented Reality",
    penulis: "Iwan Setiawan, S.Pd., M.T.",
    kategori: "Pendidikan",
    paket: "Standart",
    statusProgres: "Finishing Korektor",
    tglTerima: "2026-10-14",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-01",
    hariBerjalan: 19,
    halamanAwal: 160,
    halamanFinal: 184,
    stuck: "Tidak",
    nilaiJasa: 1300000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Sedang perbaikan tanda baca dan running head oleh korektor.",
    lamaLayoutAwal: 10,
  },
  {
    no: 31,
    judul: "Makroekonomi Terapan untuk Pengambil Kebijakan Publik",
    penulis: "Prof. Dr. Faisal Basri Santoso, M.A.",
    kategori: "Ekonomi",
    paket: "Premium",
    statusProgres: "Di Penulis",
    tglTerima: "2026-10-15",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-10-31",
    hariBerjalan: 18,
    halamanAwal: 300,
    halamanFinal: 345,
    stuck: "Tidak",
    nilaiJasa: 2800000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Proof 1 sudah dikirim, penulis sedang mereviu tabel indeks.",
    lamaLayoutAwal: 15,
  },
  {
    no: 32,
    judul: "Asuhan Kebidanan Komprehensif Kehamilan Risiko Tinggi",
    penulis: "Bdn. Siti Zulaikha, S.ST., M.Keb.",
    kategori: "Kesehatan",
    paket: "Standart",
    statusProgres: "Di Saya",
    tglTerima: "2026-10-18",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-02",
    hariBerjalan: 15,
    halamanAwal: 175,
    halamanFinal: 204,
    stuck: "Tidak",
    nilaiJasa: 1450000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Sedang menata ilustrasi anatomi plasenta di bab 4.",
    lamaLayoutAwal: 11,
  },
  {
    no: 33,
    judul: "Hukum Agraria & Reforma Penguasaan Tanah Adat",
    penulis: "Dr. Maria Magdalena, S.H., M.Hum.",
    kategori: "Hukum",
    paket: "Premium",
    statusProgres: "Masalah saat Kor penulis",
    tglTerima: "2026-10-19",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-10-30",
    hariBerjalan: 14,
    halamanAwal: 245,
    halamanFinal: 288,
    stuck: "Ya",
    nilaiJasa: 2350000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Penulis menambah 3 bab baru saat koreksi proof 1, susunan halaman bergeser total.",
    lamaLayoutAwal: 12,
  },
  {
    no: 34,
    judul: "Teori Akuntansi Forensik dan Pendeteksian Fraud",
    penulis: "Agus Priyono, S.E., M.Si., CFE",
    kategori: "Ekonomi",
    paket: "Standart",
    statusProgres: "Di Coped",
    tglTerima: "2026-10-20",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-01",
    hariBerjalan: 13,
    halamanAwal: 190,
    halamanFinal: 215,
    stuck: "Tidak",
    nilaiJasa: 1500000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Sedang diselaraskan gaya penulisan istilah audit oleh copy editor.",
    lamaLayoutAwal: 11,
  },
  {
    no: 35,
    judul: "Andragogi: Metode Pendidikan Orang Dewasa Efektif",
    penulis: "Drs. Bambang Sutrisno, M.Pd.",
    kategori: "Pendidikan",
    paket: "Basic",
    statusProgres: "Finishing Korektor",
    tglTerima: "2026-10-22",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-02",
    hariBerjalan: 11,
    halamanAwal: 105,
    halamanFinal: 124,
    stuck: "Tidak",
    nilaiJasa: 500000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Koreksi akhir daftar pustaka dan indeks nama.",
    lamaLayoutAwal: 8,
  },
  {
    no: 36,
    judul: "Neuropsikologi Klinis dan Rehabilitasi Kognitif",
    penulis: "dr. Diana Kartika, Sp.N(K), M.Biomed.",
    kategori: "Kesehatan",
    paket: "Premium",
    statusProgres: "Di Saya",
    tglTerima: "2026-10-24",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-02",
    hariBerjalan: 9,
    halamanAwal: 280,
    halamanFinal: 320,
    stuck: "Tidak",
    nilaiJasa: 2700000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Sedang menyusun bagan alur sinapsis & jalur saraf otak.",
    lamaLayoutAwal: 14,
  },
  {
    no: 37,
    judul: "Restorative Justice dalam Sistem Pidana Anak",
    penulis: "Dr. Ilham Saputra, S.H., M.H.",
    kategori: "Hukum",
    paket: "Standart",
    statusProgres: "Di Penulis",
    tglTerima: "2026-10-25",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-10-31",
    hariBerjalan: 8,
    halamanAwal: 165,
    halamanFinal: 188,
    stuck: "Ya",
    nilaiJasa: 1300000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Penulis dinas luar kota, belum merespon revisi tata letak halaman 102-120.",
    lamaLayoutAwal: 10,
  },
  {
    no: 38,
    judul: "Rantai Pasok Agroindustri Berkelanjutan",
    penulis: "Ir. Dwi Cahyono, M.M.A.",
    kategori: "Bisnis",
    paket: "Standart",
    statusProgres: "Di Coped",
    tglTerima: "2026-10-26",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-01",
    hariBerjalan: 7,
    halamanAwal: 185,
    halamanFinal: 210,
    stuck: "Tidak",
    nilaiJasa: 1450000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Copy editor memeriksa tabel perbandingan komoditas kopi dan kelapa sawit.",
    lamaLayoutAwal: 11,
  },
  {
    no: 39,
    judul: "Desain Instruksional Pembelajaran Jarak Jauh",
    penulis: "Dr. Arif Wicaksono, M.Pd.",
    kategori: "Pendidikan",
    paket: "Basic",
    statusProgres: "Di Saya",
    tglTerima: "2026-10-28",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-02",
    hariBerjalan: 5,
    halamanAwal: 110,
    halamanFinal: 128,
    stuck: "Tidak",
    nilaiJasa: 550000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Proses layout master halaman dan penomoran bab.",
    lamaLayoutAwal: 8,
  },
  {
    no: 40,
    judul: "Penyakit Tidak Menular: Skrining & Manajemen Klinis",
    penulis: "dr. Linda Marlina, Sp.PD-KKV",
    kategori: "Kesehatan",
    paket: "Premium",
    statusProgres: "Kirim file awal layout",
    tglTerima: "2026-10-29",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-01",
    hariBerjalan: 4,
    halamanAwal: 250,
    halamanFinal: 290,
    stuck: "Tidak",
    nilaiJasa: 2500000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Draft awal dikirim ke email editor pengampu.",
    lamaLayoutAwal: 12,
  },
  {
    no: 41,
    judul: "Hukum Maritim & Kedaulatan Wilayah Laut Nusantara",
    penulis: "Laksma (Purn) Dr. Yosua Prabowo, S.H., M.Sc.",
    kategori: "Hukum",
    paket: "Standart",
    statusProgres: "Di Saya",
    tglTerima: "2026-10-30",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-02",
    hariBerjalan: 3,
    halamanAwal: 195,
    halamanFinal: 224,
    stuck: "Tidak",
    nilaiJasa: 1550000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Pembersihan spasi dan format naskah Word sebelum masuk InDesign.",
    lamaLayoutAwal: 11,
  },
  {
    no: 42,
    judul: "Keuangan Publik Daerah & Desentralisasi Fiskal",
    penulis: "Dr. Sri Mulyani Wardhani, S.E., M.Si.",
    kategori: "Ekonomi",
    paket: "Standart",
    statusProgres: "Kirim file awal layout",
    tglTerima: "2026-10-31",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-01",
    hariBerjalan: 2,
    halamanAwal: 170,
    halamanFinal: 198,
    stuck: "Tidak",
    nilaiJasa: 1400000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "File bab 1-3 sudah dikonversi ke template buku Schnell.",
    lamaLayoutAwal: 10,
  },
  {
    no: 43,
    judul: "Pendidikan Inklusif Peserta Didik Berkebutuhan Khusus",
    penulis: "Dra. Endang Sulistyowati, M.Pd.",
    kategori: "Pendidikan",
    paket: "Basic",
    statusProgres: "Masalah saat Kor penulis",
    tglTerima: "2026-10-16",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-10-28",
    hariBerjalan: 17,
    halamanAwal: 115,
    halamanFinal: 136,
    stuck: "Ya",
    nilaiJasa: 550000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Format tabel asesmen di bab 5 rusak dari file asli penulis, menunggu file Excel pengganti.",
    lamaLayoutAwal: 8,
  },
  {
    no: 44,
    judul: "Sistem Informasi Kesehatan Terintegrasi Rumah Sakit",
    penulis: "dr. Teguh Wicaksono, M.Kom., Sp.PK.",
    kategori: "Kesehatan",
    paket: "Basic",
    statusProgres: "Di Saya",
    tglTerima: "2026-11-01",
    tglSelesaiLayout: null,
    updateTerakhir: "2026-11-02",
    hariBerjalan: 1,
    halamanAwal: 80,
    halamanFinal: 95,
    stuck: "Tidak",
    nilaiJasa: 350000,
    statusBayar: "Belum Ditagih",
    tglInvoice: null,
    tglDibayar: null,
    umurPiutang: 0,
    catatanBelumSelesai: "Baru masuk antrean pengerjaan bulan November.",
    lamaLayoutAwal: 7,
  },
];

/**
 * Normalisasi data baris dari JSON eksternal jika format kolomnya sedikit bervariasi
 */
function normalizeBookJob(raw: any, index: number): BookJob {
  return {
    no: Number(raw.No ?? raw.no ?? index + 1),
    judul: String(raw.Judul ?? raw.judul ?? 'Tanpa Judul'),
    penulis: String(raw.Penulis ?? raw.penulis ?? 'Tanpa Penulis'),
    kategori: (raw.Kategori ?? raw.kategori ?? 'Lainnya') as any,
    paket: (raw.Paket ?? raw.paket ?? 'Basic') as any,
    statusProgres: (raw['Status Progres'] ?? raw.statusProgres ?? raw.status ?? 'Di Saya') as any,
    tglTerima: String(raw['Tgl Terima'] ?? raw.tglTerima ?? ''),
    tglSelesaiLayout: raw['Tgl Selesai Layout'] ?? raw.tglSelesaiLayout ?? null,
    updateTerakhir: String(raw['Update Terakhir'] ?? raw.updateTerakhir ?? ''),
    hariBerjalan: Number(raw['Hari Berjalan'] ?? raw.hariBerjalan ?? 0),
    halamanAwal: Number(raw['Halaman Awal'] ?? raw.halamanAwal ?? 0),
    halamanFinal: Number(raw['Halaman Final'] ?? raw.halamanFinal ?? 0),
    stuck: (raw.Stuck ?? raw.stuck ?? 'Tidak') === 'Ya' || raw.Stuck === true ? 'Ya' : 'Tidak',
    nilaiJasa: Number(raw['Nilai Jasa'] ?? raw.nilaiJasa ?? 0),
    statusBayar: (raw['Status Bayar'] ?? raw.statusBayar ?? 'Belum Ditagih') as any,
    tglInvoice: raw['Tgl Invoice'] ?? raw.tglInvoice ?? null,
    tglDibayar: raw['Tgl Dibayar'] ?? raw.tglDibayar ?? null,
    umurPiutang: Number(raw['Umur Piutang'] ?? raw.umurPiutang ?? 0),
    catatanBelumSelesai: String(raw['Catatan Belum Selesai'] ?? raw.catatanBelumSelesai ?? ''),
    lamaLayoutAwal: Number(raw['Lama Layout Awal'] ?? raw.lamaLayoutAwal ?? 0),
    ukuranBuku: raw['Ukuran Buku'] ?? raw.ukuranBuku ?? undefined,
    halamanWarna: raw['Halaman Warna'] ?? raw.halamanWarna ?? undefined,
    estimasiHalaman: raw.estimasiHalaman ? Number(raw.estimasiHalaman) : undefined,
    kodeProduksi: raw['Kode Produksi'] ?? raw.kodeProduksi ?? undefined,
    isbn: raw.ISBN ?? raw.isbn ?? undefined,
    statusIsbn: raw['Status ISBN'] ?? raw.statusIsbn ?? undefined,
    kelengkapanNaskah: raw['Kelengkapan Naskah'] ?? raw.kelengkapanNaskah ?? undefined,
  };
}

/**
 * Deteksi apakah teks respons berupa halaman HTML login/redirect Google
 */
function isHtmlLogin(text: string): boolean {
  return (
    text.includes('<!DOCTYPE html') ||
    text.includes('<html') ||
    text.includes('accounts.google.com') ||
    text.includes('Sign in - Google Accounts') ||
    text.includes('google-site-verification')
  );
}

/**
 * Mengambil data Google Sheet lewat Google Sheets API v4 resmi dengan Access Token
 * GET https://sheets.googleapis.com/v4/spreadsheets/{ID}/values/{TAB}!A:T
 */
export async function fetchDataViaGoogleSheetsApi(
  spreadsheetId: string,
  accessToken: string,
  preferredTab: string = 'Data Dasbor'
): Promise<BookJob[]> {
  const encTab = encodeURIComponent(preferredTab);
  const primaryRangeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encTab}!A:T`;

  let response: Response;
  try {
    response = await fetch(primaryRangeUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
  } catch (netErr) {
    throw new Error('Gagal terhubung ke Google Sheets API. Periksa koneksi internet Anda.');
  }

  // 1. Tangani 401: Token kedaluwarsa atau tidak sah
  if (response.status === 401) {
    throw new AuthExpiredError(
      'Sesi otorisasi Google Sheets telah berakhir. Silakan klik "Hubungkan Ulang Google Sheets".'
    );
  }

  // 2. Tangani 403: Izin akses ditolak atau Sheets API belum aktif
  if (response.status === 403) {
    throw new SheetPermissionError(
      'Anda tidak memiliki izin akses ke Google Sheet ini, atau Google Sheets API belum diaktifkan di Google Cloud Console untuk project Anda.'
    );
  }

  // 3. Tangani 404: Sheet tidak ditemukan
  if (response.status === 404) {
    throw new Error(
      'Spreadsheet tidak ditemukan (404). Pastikan Spreadsheet ID atau link yang Anda masukkan sudah benar.'
    );
  }

  // 4. Jika gagal selain itu (misal 400 Bad Request karena tab 'Data Dasbor' tidak ada),
  // Coba ambil judul lembar kerja pertama lewat metadata spreadsheet
  if (!response.ok) {
    let firstSheetTitle: string | null = null;
    try {
      const metaResp = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );
      if (metaResp.ok) {
        const metaJson = await metaResp.json();
        firstSheetTitle = metaJson?.sheets?.[0]?.properties?.title || null;
      } else if (metaResp.status === 401) {
        throw new AuthExpiredError();
      } else if (metaResp.status === 403) {
        throw new SheetPermissionError();
      }
    } catch (metaErr) {
      if (metaErr instanceof AuthExpiredError || metaErr instanceof SheetPermissionError) {
        throw metaErr;
      }
    }

    if (firstSheetTitle && firstSheetTitle !== preferredTab) {
      const fallbackUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        firstSheetTitle
      )}!A:T`;
      const fallbackResp = await fetch(fallbackUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (fallbackResp.ok) {
        const fbJson = await fallbackResp.json();
        const parseRes = parseSheetValues(fbJson?.values || []);
        if (!parseRes.success) {
          throw new Error(
            parseRes.errorMessage ||
              'Format kolom pada lembar kerja pertama tidak sesuai dengan 20 kolom data buku yang diharapkan.'
          );
        }
        if (parseRes.books && parseRes.books.length > 0) {
          return parseRes.books;
        }
        throw new Error(`Lembar kerja "${firstSheetTitle}" tidak memiliki baris data buku.`);
      }
    }

    let detailMsg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) detailMsg = errJson.error.message;
    } catch {
      // ignore
    }

    throw new Error(
      `Gagal memuat data dari Google Sheet: ${detailMsg}. Pastikan sheet memiliki tab "${preferredTab}" atau data pada lembar pertama.`
    );
  }

  const json = await response.json();
  const rawValues = json?.values;

  if (!rawValues || !Array.isArray(rawValues) || rawValues.length === 0) {
    throw new Error(
      `Google Sheet pada tab "${preferredTab}" tidak memiliki data atau baris kosong.`
    );
  }

  const parseRes = parseSheetValues(rawValues);
  if (!parseRes.success) {
    const missingStr = parseRes.missingColumns ? parseRes.missingColumns.join(', ') : '';
    throw new Error(
      parseRes.errorMessage ||
        (missingStr
          ? `Format kolom Google Sheet belum sesuai. Kolom tidak ditemukan: ${missingStr}`
          : 'Format kolom pada Google Sheet tidak sesuai dengan data buku yang diharapkan.')
    );
  }

  if (!parseRes.books || parseRes.books.length === 0) {
    throw new Error('Google Sheet tidak memiliki baris data pekerjaan buku yang valid.');
  }

  return parseRes.books;
}

/**
 * Mengambil data Google Sheet lewat ekspor CSV publik (gviz/pub) sebagai fallback
 * jika pengguna belum mengotorisasi OAuth atau jika sheet dibagikan publik.
 */
export async function fetchGoogleSheetsCsv(
  spreadsheetId: string,
  preferredTab: string = 'Data Dasbor'
): Promise<BookJob[]> {
  const csvUrl = buildGoogleSheetCsvUrl(spreadsheetId, preferredTab);
  let response: Response;
  try {
    response = await fetch(csvUrl);
  } catch (err) {
    throw new Error('Gagal menghubungi Google Sheets. Periksa koneksi internet Anda.');
  }

  if (!response.ok) {
    throw new Error(`Google Sheets mengembalikan status ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  if (isHtmlLogin(text)) {
    throw new Error(
      'Google Sheet ini bersifat privat. Pastikan akses spreadsheet diatur ke "Siapa saja yang memiliki link: Pelihat" atau klik "Hubungkan Google Sheets" untuk otorisasi.'
    );
  }

  const result = parseSheetData(text);
  if (!result.success) {
    // Jika tab 'Data Dasbor' tidak ada, coba ambil sheet pertama
    if (preferredTab === 'Data Dasbor') {
      try {
        const fallbackUrl = spreadsheetId.startsWith('2PACX-')
          ? `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub?output=csv`
          : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
        const fbResp = await fetch(fallbackUrl);
        if (fbResp.ok) {
          const fbText = await fbResp.text();
          if (!isHtmlLogin(fbText)) {
            const fbResult = parseSheetData(fbText);
            if (fbResult.success && fbResult.books && fbResult.books.length > 0) {
              return fbResult.books;
            }
          }
        }
      } catch {
        // ignore
      }
    }
    const missingStr = result.missingColumns ? result.missingColumns.join(', ') : '';
    throw new Error(
      result.errorMessage ||
        (missingStr
          ? `Format kolom Google Sheet belum sesuai. Kolom tidak ditemukan: ${missingStr}`
          : 'Format kolom Google Sheet belum sesuai dengan data buku yang diharapkan.')
    );
  }

  if (!result.books || result.books.length === 0) {
    throw new Error('Google Sheet tidak memiliki baris data pekerjaan buku yang valid.');
  }

  return result.books;
}

/**
 * Fungsi tunggal fetchData():
 * - Mengambil data Google Sheets via Sheets API v4 bila accessToken tersedia.
 * - Bila accessToken belum ada atau otorisasi gagal, mencoba memuat via ekspor CSV publik
 *   sehingga pengguna tidak terblokir bila sheet disetel "Siapa saja yang memiliki link".
 * - Bila sheet privat dan token belum ada, melempar AuthExpiredError yang informatif.
 */
export async function fetchData(
  customUrl?: string,
  accessToken?: string | null
): Promise<BookJob[]> {
  const urlToFetch = customUrl || JSON_DATA_URL;

  if (urlToFetch && urlToFetch.trim() !== '') {
    const trimmed = urlToFetch.trim();

    // 1. Cek apakah ini tautan Google Sheets
    const sheetId = extractSpreadsheetId(trimmed);
    if (
      sheetId &&
      (trimmed.includes('docs.google.com/spreadsheets') || sheetId.startsWith('2PACX-'))
    ) {
      let tabName = 'Data Dasbor';
      try {
        const urlObj = new URL(trimmed);
        const sheetParam = urlObj.searchParams.get('sheet');
        if (sheetParam) tabName = sheetParam;
      } catch {
        // ignore url parse error
      }

      // Prioritas 1: Jika accessToken tersedia, gunakan Google Sheets API v4 (akses privat)
      if (accessToken) {
        try {
          return await fetchDataViaGoogleSheetsApi(sheetId, accessToken, tabName);
        } catch (apiErr: any) {
          console.warn('Google Sheets API v4 gagal, mencoba fallback pembacaan publik:', apiErr?.message);
          // Jika ditolak atau kedaluwarsa, coba baca publik sebelum melempar error
          try {
            return await fetchGoogleSheetsCsv(sheetId, tabName);
          } catch {
            throw apiErr;
          }
        }
      }

      // Prioritas 2: Jika accessToken belum ada, coba muat langsung via akses publik
      try {
        return await fetchGoogleSheetsCsv(sheetId, tabName);
      } catch (csvErr: any) {
        // Jika pembacaan publik gagal (misal karena sheet bersifat privat), beri instruksi jelas
        throw new AuthExpiredError(
          'Akses Google Sheets memerlukan token otorisasi. Silakan klik "Hubungkan Google Sheets", atau atur izin spreadsheet ke: "Siapa saja yang memiliki link: Pelihat".'
        );
      }
    }

    // 2. Jika bukan Google Sheets, ambil sebagai endpoint JSON biasa
    try {
      const response = await fetch(trimmed, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const rawArray = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.rows)
        ? json.rows
        : null;

      if (rawArray && rawArray.length > 0) {
        return rawArray.map(normalizeBookJob);
      }
      throw new Error('Format JSON tidak memiliki array data buku yang valid.');
    } catch (err: any) {
      console.error('Gagal mengambil data dari URL JSON:', err);
      throw err;
    }
  }

  throw new Error('URL Google Sheet belum diatur. Silakan hubungkan Google Sheet Anda.');
}
