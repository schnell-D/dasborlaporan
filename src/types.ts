/**
 * Tipe data untuk aplikasi Laporan Pekerjaan Layout Buku non-fiksi RGP Layout
 */

export type PaketType = 'Basic' | 'Standart' | 'Premium';

export type StatusProgresType =
  | 'Kirim file awal layout'
  | 'Di Saya'
  | 'Di Coped'
  | 'Finishing Saya'
  | 'Di Penulis'
  | 'Finishing Korektor'
  | 'Nunggu ISBN'
  | 'Nunggu ACC Cetak'
  | 'Sudah siap cetak'
  | 'Selesai'
  | 'Masalah saat Kor penulis';

export type StatusBayarType = 'Belum Ditagih' | 'Belum Dibayar' | 'Lunas';

export type KategoriType =
  | 'Hukum'
  | 'Ekonomi'
  | 'Pendidikan'
  | 'Kesehatan'
  | 'Sosial & Humaniora'
  | 'Bisnis'
  | 'Lainnya';

export type HalamanWarnaType = 'BW' | 'Half BW' | 'Full Color';
export type StatusIsbnType = 'ISBN Terbit' | 'Pengajuan ISBN' | 'Belum ada ISBN';

export interface BookJob {
  no: number;
  judul: string;
  penulis: string;
  kategori: KategoriType;
  paket: PaketType;
  statusProgres: StatusProgresType;
  tglTerima: string; // YYYY-MM-DD
  tglSelesaiLayout: string | null; // YYYY-MM-DD atau null
  updateTerakhir: string; // YYYY-MM-DD
  hariBerjalan: number;
  halamanAwal: number;
  halamanFinal: number;
  stuck: 'Ya' | 'Tidak';
  nilaiJasa: number; // Rupiah
  statusBayar: StatusBayarType;
  tglInvoice: string | null; // YYYY-MM-DD atau null
  tglDibayar: string | null; // YYYY-MM-DD atau null
  umurPiutang: number; // Hari sejak invoice jika belum dibayar, 0 jika lunas/belum ditagih
  catatanBelumSelesai: string;
  lamaLayoutAwal: number; // Hari
  // Spesifikasi Teknis & Metadata Produksi
  ukuranBuku?: string;
  halamanWarna?: HalamanWarnaType;
  estimasiHalaman?: number;
  kodeProduksi?: string;
  isbn?: string;
  statusIsbn?: StatusIsbnType;
  kelengkapanNaskah?: string[];
}

export interface RevisionNote {
  id: string;
  timestamp: string; // ISO string atau format tanggal
  category:
    | 'Revisi Penulis'
    | 'Korektor / Coped'
    | 'Finishing'
    | 'Cetak Dummy'
    | 'ACC Cetak'
    | 'Kendala'
    | 'Catatan Umum';
  text: string;
}

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
}

export type KeuanganSubTab = 'ringkasan' | 'invoice' | 'riwayat';

export type TabType = 'dashboard' | 'buku' | 'keuangan' | 'akun' | 'invoice' | 'riwayat';
