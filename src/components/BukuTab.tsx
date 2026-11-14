import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  BookOpen,
  BookPlus,
  Barcode,
  FileCheck,
} from 'lucide-react';
import { BookJob, StatusProgresType, PaketType, KategoriType } from '../types';
import {
  getStatusProgresConfig,
  getPaketBadge,
  getStatusProgressPercent,
} from '../utils/formatters';
import { AddBookModal } from './AddBookModal';

interface BukuTabProps {
  books: BookJob[];
  onSelectBook: (book: BookJob) => void;
  onAddNewBook?: (newBook: Omit<BookJob, 'no'>) => void;
  initialStatusFilter?: string | null;
  onClearInitialStatusFilter?: () => void;
}

export const BukuTab: React.FC<BukuTabProps> = ({
  books,
  onSelectBook,
  onAddNewBook,
  initialStatusFilter,
  onClearInitialStatusFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter || 'Semua');
  const [selectedPaket, setSelectedPaket] = useState<string>('Semua');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [selectedStuck, setSelectedStuck] = useState<'Semua' | 'Hanya Stuck' | 'Tidak Stuck'>('Semua');
  const [sortBy, setSortBy] = useState<'no' | 'halamanDesc' | 'hariDesc' | 'updateDesc'>('no');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Status options - 11 status lengkap
  const statusOptions: string[] = [
    'Semua',
    'Kirim file awal layout',
    'Di Saya',
    'Di Coped',
    'Finishing Saya',
    'Di Penulis',
    'Finishing Korektor',
    'Nunggu ISBN',
    'Nunggu ACC Cetak',
    'Sudah siap cetak',
    'Selesai',
    'Masalah saat Kor penulis',
  ];

  const paketOptions: string[] = ['Semua', 'Basic', 'Standart', 'Premium'];
  const kategoriOptions: string[] = [
    'Semua',
    'Hukum',
    'Ekonomi',
    'Pendidikan',
    'Kesehatan',
    'Sosial & Humaniora',
    'Bisnis',
  ];

  // Filtering & Sorting
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNo = String(book.no).includes(q);
          const matchJudul = book.judul.toLowerCase().includes(q);
          const matchPenulis = book.penulis.toLowerCase().includes(q);
          if (!matchNo && !matchJudul && !matchPenulis) return false;
        }

        // Status filter
        if (selectedStatus !== 'Semua' && book.statusProgres !== selectedStatus) {
          return false;
        }

        // Paket filter
        if (selectedPaket !== 'Semua' && book.paket !== selectedPaket) {
          return false;
        }

        // Kategori filter
        if (selectedKategori !== 'Semua' && book.kategori !== selectedKategori) {
          return false;
        }

        // Stuck filter
        if (selectedStuck === 'Hanya Stuck' && book.stuck !== 'Ya') return false;
        if (selectedStuck === 'Tidak Stuck' && book.stuck === 'Ya') return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'halamanDesc') {
          const aHal = a.halamanFinal || a.halamanAwal;
          const bHal = b.halamanFinal || b.halamanAwal;
          return bHal - aHal;
        }
        if (sortBy === 'hariDesc') return b.hariBerjalan - a.hariBerjalan;
        if (sortBy === 'updateDesc') return (b.updateTerakhir || '').localeCompare(a.updateTerakhir || '');
        return a.no - b.no;
      });
  }, [books, searchQuery, selectedStatus, selectedPaket, selectedKategori, selectedStuck, sortBy]);

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('Semua');
    setSelectedPaket('Semua');
    setSelectedKategori('Semua');
    setSelectedStuck('Semua');
    onClearInitialStatusFilter?.();
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatus !== 'Semua' ||
    selectedPaket !== 'Semua' ||
    selectedKategori !== 'Semua' ||
    selectedStuck !== 'Semua';

  return (
    <div className="space-y-4">
      {/* Search Bar & Quick Toggles */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul buku, penulis, atau no (#1)..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Toggle Filter Tambahan */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors shrink-0 ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/60 dark:border-blue-900 dark:text-blue-400'
                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-transparent focus:outline-none cursor-pointer"
            >
              <option value="no">Urut: No (#1-#44)</option>
              <option value="halamanDesc">Halaman Terbanyak</option>
              <option value="hariDesc">Hari Berjalan Terlama</option>
              <option value="updateDesc">Update Terbaru</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Tombol Tambah Buku Baru */}
          {onAddNewBook && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 sm:px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm shadow-blue-500/20"
              title="Tambah Proyek Buku Baru"
            >
              <BookPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Buku</span>
            </button>
          )}
        </div>

        {/* Filter Tambahan (Status Progres, Paket, Kategori, Stuck) yang Dikelompokkan Rapi */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3.5 animate-fade-in">
            {/* 1. Status Progres Proyek */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Status Progres Naskah:
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {statusOptions.map((st) => {
                  const isSelected = selectedStatus === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setSelectedStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Grid Paket, Kategori, dan Stuck */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
              {/* Paket */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Paket Layout
                </label>
                <div className="flex items-center gap-1">
                  {paketOptions.map((pkt) => (
                    <button
                      key={pkt}
                      onClick={() => setSelectedPaket(pkt)}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                        selectedPaket === pkt
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {pkt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Kategori
                </label>
                <select
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border-none focus:outline-none"
                >
                  {kategoriOptions.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stuck Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Status Kendala (Stuck)
                </label>
                <div className="flex items-center gap-1">
                  {(['Semua', 'Hanya Stuck', 'Tidak Stuck'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedStuck(opt)}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                        selectedStuck === opt
                          ? opt === 'Hanya Stuck'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {opt === 'Hanya Stuck' ? 'Stuck' : opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status ringkasan filter aktif & tombol reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs pt-1 text-slate-500 dark:text-slate-400">
            <span>
              Menampilkan <strong>{filteredBooks.length}</strong> dari {books.length} buku
            </span>
            <button
              onClick={resetFilters}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline text-xs flex items-center gap-1"
            >
              <span>Reset Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Tidak Ada Buku yang Cocok
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ditemukan pekerjaan layout buku dengan kriteria pencarian atau filter yang dipilih.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        /* Daftar Kartu Buku */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredBooks.map((book, idx) => {
            const statusConfig = getStatusProgresConfig(book.statusProgres);
            const isStuck = book.stuck === 'Ya';

            return (
              <div
                key={`book-${book.no}-${idx}`}
                onClick={() => onSelectBook(book)}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-md active:scale-[0.99] flex flex-col justify-between ${
                  isStuck
                    ? 'border-rose-300 dark:border-rose-800/80 ring-1 ring-rose-200 dark:ring-rose-950/40 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 shadow-sm'
                }`}
              >
                <div>
                  {/* Baris Atas: Nomor, Paket, Penanda Stuck, dan Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center">
                        #{book.no}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPaketBadge(book.paket)}`}>
                        {book.paket}
                      </span>
                      {isStuck && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Stuck
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      {book.statusProgres}
                    </span>
                  </div>

                  {/* Judul Buku (Maks 2 Baris) */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {book.judul}
                  </h3>

                  {/* Penulis & Kategori */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {book.penulis} <span className="opacity-40">·</span> {book.kategori}
                  </p>

                  {/* Badge Identitas Produksi & ISBN jika ada */}
                  {(book.kodeProduksi || book.statusIsbn || book.ukuranBuku) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800/80">
                      {book.kodeProduksi && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {book.kodeProduksi}
                        </span>
                      )}
                      {book.statusIsbn && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            book.statusIsbn === 'ISBN Terbit'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : book.statusIsbn === 'Pengajuan ISBN'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {book.statusIsbn}
                        </span>
                      )}
                      {book.ukuranBuku && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {book.ukuranBuku.split('(')[0].trim()}
                        </span>
                      )}
                      {book.halamanWarna && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {book.halamanWarna}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Bar Visual Pengerjaan Naskah */}
                <div className="mt-3 pt-2.5 border-t border-dashed border-slate-100 dark:border-slate-800/80">
                  {(() => {
                    const prog = getStatusProgressPercent(book.statusProgres);
                    const isAllComplete =
                      book.kelengkapanNaskah?.includes('Lengkap') ||
                      (book.kelengkapanNaskah && book.kelengkapanNaskah.length >= 10);

                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${prog.barBg}`} />
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              Progres: <span className="font-bold text-slate-800 dark:text-white">{prog.label}</span>
                            </span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${prog.badgeBg}`}>
                            {prog.percent}%
                          </span>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${prog.barBg}`}
                            style={{ width: `${prog.percent}%` }}
                          />
                        </div>

                        {/* Indikator Kelengkapan Naskah jika tersimpan */}
                        {book.kelengkapanNaskah && book.kelengkapanNaskah.length > 0 && (
                          <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <FileCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Kelengkapan:</span>
                            </span>
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                                isAllComplete
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {isAllComplete ? 'Lengkap (100%)' : `${book.kelengkapanNaskah.length}/10 Item`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Baris Bawah: Total Halaman dan Hari Berjalan (Tanpa Nilai Jasa) */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Halaman
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {book.halamanFinal || book.halamanAwal} hlm.
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Hari Berjalan
                    </span>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 justify-end">
                      <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{book.hariBerjalan} hari</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Buku Baru */}
      {onAddNewBook && (
        <AddBookModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddBook={onAddNewBook}
          nextBookNo={books.length > 0 ? Math.max(...books.map((b) => b.no)) + 1 : 1}
        />
      )}
    </div>
  );
};
