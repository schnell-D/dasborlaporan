import React, { useState } from 'react';
import {
  X,
  BookPlus,
  BookOpen,
  User,
  Layers,
  Palette,
  Hash,
  Barcode,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  BookJob,
  HalamanWarnaType,
  StatusIsbnType,
  PaketType,
  KategoriType,
  StatusProgresType,
} from '../types';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (newBook: Omit<BookJob, 'no'>) => void;
  nextBookNo: number;
}

const UKURAN_PRESETS = [
  'UNESCO (15,5 x 23 cm)',
  'A5 (14,8 x 21 cm)',
  'B5 (17,6 x 25 cm)',
  'Novel (13 x 19 cm)',
  'UNESCO Mini (14 x 20 cm)',
  'A4 (21 x 29,7 cm)',
  'Custom',
];

const KATEGORI_OPTIONS: KategoriType[] = [
  'Hukum',
  'Ekonomi',
  'Pendidikan',
  'Kesehatan',
  'Sosial & Humaniora',
  'Bisnis',
  'Lainnya',
];

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  onAddBook,
  nextBookNo,
}) => {
  const [judul, setJudul] = useState('');
  const [penulis, setPenulis] = useState('');
  const [ukuranBuku, setUkuranBuku] = useState('UNESCO (15,5 x 23 cm)');
  const [customUkuran, setCustomUkuran] = useState('');
  const [halamanWarna, setHalamanWarna] = useState<HalamanWarnaType>('BW');
  const [estimasiHalaman, setEstimasiHalaman] = useState<string>('200');

  // Opsi Tambahan
  const [paket, setPaket] = useState<PaketType>('Standart');
  const [kategori, setKategori] = useState<KategoriType>('Pendidikan');
  const [kodeProduksi, setKodeProduksi] = useState(`PRD-2026-${String(nextBookNo).padStart(3, '0')}`);
  const [isbn, setIsbn] = useState('');
  const [statusIsbn, setStatusIsbn] = useState<StatusIsbnType>('Belum ada ISBN');
  const [statusProgres, setStatusProgres] = useState<StatusProgresType>('Di Saya');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !penulis.trim()) return;

    const finalUkuran = ukuranBuku === 'Custom' ? customUkuran.trim() || 'Custom' : ukuranBuku;
    const hal = parseInt(estimasiHalaman, 10) || 150;
    const today = new Date().toISOString().substring(0, 10);

    // Estimasi nilai jasa berdasarkan paket & halaman
    const ratePerHlm = paket === 'Premium' ? 7500 : paket === 'Standart' ? 5000 : 3500;
    const estNilai = hal * ratePerHlm;

    const newBookData: Omit<BookJob, 'no'> = {
      judul: judul.trim(),
      penulis: penulis.trim(),
      kategori,
      paket,
      statusProgres,
      tglTerima: today,
      tglSelesaiLayout: null,
      updateTerakhir: today,
      hariBerjalan: 1,
      halamanAwal: hal,
      halamanFinal: hal,
      stuck: 'Tidak',
      nilaiJasa: estNilai,
      statusBayar: 'Belum Ditagih',
      tglInvoice: null,
      tglDibayar: null,
      umurPiutang: 0,
      catatanBelumSelesai: '',
      lamaLayoutAwal: 0,
      ukuranBuku: finalUkuran,
      halamanWarna,
      estimasiHalaman: hal,
      kodeProduksi: kodeProduksi.trim() || undefined,
      isbn: isbn.trim() || undefined,
      statusIsbn,
    };

    onAddBook(newBookData);
    onClose();

    // Reset form
    setJudul('');
    setPenulis('');
    setIsbn('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden z-10 animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Tambah Buku Baru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registrasi proyek buku non-fiksi baru (#{nextBookNo})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto space-y-4">
          {/* Judul Buku */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
              Judul Buku <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Hukum Perdata Internasional & Bisnis Modern"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Nama Penulis */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
              Nama Penulis <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={penulis}
              onChange={(e) => setPenulis(e.target.value)}
              placeholder="Contoh: Prof. Dr. Hendra Wijaya, S.H., M.H."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Grid: Ukuran Buku & Estimasi Halaman */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ukuran Buku */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Ukuran Buku
              </label>
              <select
                value={ukuranBuku}
                onChange={(e) => setUkuranBuku(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {UKURAN_PRESETS.map((uk) => (
                  <option key={uk} value={uk}>
                    {uk}
                  </option>
                ))}
              </select>

              {ukuranBuku === 'Custom' && (
                <input
                  type="text"
                  value={customUkuran}
                  onChange={(e) => setCustomUkuran(e.target.value)}
                  placeholder="Ketik ukuran kustom (cth: 16 x 24 cm)"
                  className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Estimasi Halaman */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Estimasi Halaman
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={10}
                  max={2000}
                  value={estimasiHalaman}
                  onChange={(e) => setEstimasiHalaman(e.target.value)}
                  placeholder="200"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums pr-12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
                  hlm.
                </span>
              </div>
            </div>
          </div>

          {/* Halaman Warna (BW / Half BW / Full Color) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-blue-500" />
              <span>Halaman Warna</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['BW', 'Half BW', 'Full Color'] as HalamanWarnaType[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setHalamanWarna(mode)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    halamanWarna === mode
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori & Paket */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as KategoriType)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {KATEGORI_OPTIONS.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                Paket Layanan
              </label>
              <select
                value={paket}
                onChange={(e) => setPaket(e.target.value as PaketType)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Basic">Basic</option>
                <option value="Standart">Standart</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
          </div>

          {/* Section: Identitas Produksi & ISBN */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block flex items-center gap-1.5">
              <Barcode className="w-3.5 h-3.5 text-blue-500" />
              <span>Kode Produksi & Status ISBN</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Kode Produksi
                </label>
                <input
                  type="text"
                  value={kodeProduksi}
                  onChange={(e) => setKodeProduksi(e.target.value)}
                  placeholder="PRD-2026-045"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Nomor ISBN (Jika Ada)
                </label>
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-623-xxx-xxx-x"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Status ISBN
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Belum ada ISBN', 'Pengajuan ISBN', 'ISBN Terbit'] as StatusIsbnType[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusIsbn(st)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                      statusIsbn === st
                        ? st === 'ISBN Terbit'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : st === 'Pengajuan ISBN'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status Progres Awal */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
              Status Progres Awal
            </label>
            <select
              value={statusProgres}
              onChange={(e) => setStatusProgres(e.target.value as StatusProgresType)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Kirim file awal layout">Kirim file awal layout</option>
              <option value="Di Saya">Di Saya</option>
              <option value="Di Coped">Di Coped</option>
              <option value="Finishing Saya">Finishing Saya</option>
              <option value="Di Penulis">Di Penulis</option>
              <option value="Finishing Korektor">Finishing Korektor</option>
              <option value="Nunggu ISBN">Nunggu ISBN</option>
              <option value="Nunggu ACC Cetak">Nunggu ACC Cetak</option>
              <option value="Sudah siap cetak">Sudah siap cetak</option>
              <option value="Selesai">Selesai</option>
              <option value="Masalah saat Kor penulis">Masalah saat Kor penulis</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Buku Baru</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
