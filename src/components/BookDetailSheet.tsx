import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  AlertTriangle,
  User,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Check,
  Send,
  Printer,
  History,
  Tag,
  Barcode,
  Layers,
  ArrowRightCircle,
  FileCheck2,
  CheckSquare,
  Save,
  BookOpen,
} from 'lucide-react';
import {
  BookJob,
  RevisionNote,
  StatusProgresType,
  StatusIsbnType,
  HalamanWarnaType,
  PaketType,
} from '../types';
import {
  formatDateIndo,
  getStatusProgresConfig,
} from '../utils/formatters';
import {
  getUserDummyStatus,
  setUserDummyStatus,
  getUserBookNotes,
  setUserBookNotes,
} from '../utils/userStorage';

interface BookDetailSheetProps {
  book: BookJob | null;
  onClose: () => void;
  onUpdateBook?: (bookNo: number, updates: Partial<BookJob>) => void;
  currentUid?: string;
}

const CATEGORY_OPTIONS: Array<RevisionNote['category']> = [
  'Revisi Penulis',
  'Korektor / Coped',
  'Finishing',
  'Cetak Dummy',
  'ACC Cetak',
  'Kendala',
  'Catatan Umum',
];

// 1. Daftar 11 Status Progres Proyek Lengkap sesuai alur aktual
const STATUS_PROGRES_LIST: StatusProgresType[] = [
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

// 2. Daftar 10 Kelengkapan Naskah Pokok (+ Lengkap)
const KELENGKAPAN_ITEMS = [
  'Prakata',
  'Kata Sambutan',
  'Prolog',
  'Epilog',
  'Isi Naskah',
  'Daftar Pustaka',
  'Biodata Penulis',
  'Foto Penulis',
  'Sinopsis',
  'Indeks',
];

const UKURAN_LIST = [
  'UNESCO (15,5 x 23 cm)',
  'A5 (14,8 x 21 cm)',
  'B5 (17,6 x 25 cm)',
  'Novel (13 x 19 cm)',
  'UNESCO Mini (14 x 20 cm)',
  'A4 (21 x 29,7 cm)',
];

const PAKET_LIST: PaketType[] = ['Basic', 'Standart', 'Premium'];

export const BookDetailSheet: React.FC<BookDetailSheetProps> = ({
  book,
  onClose,
  onUpdateBook,
  currentUid = '',
}) => {
  if (!book) return null;

  // ==========================================
  // DRAFT STATE (Untuk Fitur "Simpan & Tutup")
  // Semua perubahan ditampung secara lokal di sini.
  // Jika user menutup tanpa klik "Simpan & Tutup",
  // perubahan tidak akan disimpan.
  // ==========================================
  const [draftJudul, setDraftJudul] = useState<string>(book.judul);
  const [draftPenulis, setDraftPenulis] = useState<string>(book.penulis);
  const [draftStatusProgres, setDraftStatusProgres] = useState<StatusProgresType>(book.statusProgres);
  const [draftPaket, setDraftPaket] = useState<PaketType>(book.paket);
  const [draftHalamanFinal, setDraftHalamanFinal] = useState<number>(book.halamanFinal || book.halamanAwal);
  const [draftKodeProduksi, setDraftKodeProduksi] = useState<string>(
    book.kodeProduksi || `PRD-2026-${String(book.no).padStart(3, '0')}`
  );
  const [draftIsbn, setDraftIsbn] = useState<string>(book.isbn || '');
  const [draftStatusIsbn, setDraftStatusIsbn] = useState<StatusIsbnType>(
    book.statusIsbn || 'Belum ada ISBN'
  );
  const [draftUkuranBuku, setDraftUkuranBuku] = useState<string>(
    book.ukuranBuku || 'UNESCO (15,5 x 23 cm)'
  );
  const [draftHalamanWarna, setDraftHalamanWarna] = useState<HalamanWarnaType>(
    book.halamanWarna || 'BW'
  );
  const [draftKelengkapan, setDraftKelengkapan] = useState<string[]>(
    book.kelengkapanNaskah || []
  );

  // Status Dummy Fisik Cetak
  const [draftDummyStatus, setDraftDummyStatus] = useState<'tidak_ada' | 'proses' | 'selesai'>(() => {
    const saved = getUserDummyStatus(currentUid, book.no);
    if (saved) return saved as any;
    return 'tidak_ada';
  });

  // Track Record Notes
  const [notes, setNotes] = useState<RevisionNote[]>(() => {
    const saved = getUserBookNotes(currentUid, book.no);
    if (saved && saved.length > 0) return saved;
    if (book.catatanBelumSelesai && book.catatanBelumSelesai.trim()) {
      return [
        {
          id: `seed-${book.no}`,
          timestamp: book.updateTerakhir
            ? `${formatDateIndo(book.updateTerakhir)}`
            : 'Catatan Awal',
          category: book.stuck === 'Ya' ? 'Kendala' : 'Catatan Umum',
          text: book.catatanBelumSelesai,
        },
      ];
    }
    return [];
  });

  const [initialNotesStr, setInitialNotesStr] = useState<string>(() => JSON.stringify(notes));

  // Sync draft state saat buku berubah (berganti id buku)
  useEffect(() => {
    setDraftJudul(book.judul);
    setDraftPenulis(book.penulis);
    setDraftStatusProgres(book.statusProgres);
    setDraftPaket(book.paket);
    setDraftHalamanFinal(book.halamanFinal || book.halamanAwal);
    setDraftKodeProduksi(book.kodeProduksi || `PRD-2026-${String(book.no).padStart(3, '0')}`);
    setDraftIsbn(book.isbn || '');
    setDraftStatusIsbn(book.statusIsbn || 'Belum ada ISBN');
    setDraftUkuranBuku(book.ukuranBuku || 'UNESCO (15,5 x 23 cm)');
    setDraftHalamanWarna(book.halamanWarna || 'BW');
    setDraftKelengkapan(book.kelengkapanNaskah || []);

    const savedDummy = getUserDummyStatus(currentUid, book.no);
    setDraftDummyStatus((savedDummy as any) || 'tidak_ada');

    const savedNotes = getUserBookNotes(currentUid, book.no);
    if (savedNotes && savedNotes.length > 0) {
      setNotes(savedNotes);
      setInitialNotesStr(JSON.stringify(savedNotes));
    } else if (book.catatanBelumSelesai && book.catatanBelumSelesai.trim()) {
      const initial = [
        {
          id: `seed-${book.no}`,
          timestamp: book.updateTerakhir
            ? `${formatDateIndo(book.updateTerakhir)}`
            : 'Catatan Awal',
          category: (book.stuck === 'Ya' ? 'Kendala' : 'Catatan Umum') as RevisionNote['category'],
          text: book.catatanBelumSelesai,
        },
      ];
      setNotes(initial);
      setInitialNotesStr(JSON.stringify(initial));
    } else {
      setNotes([]);
      setInitialNotesStr(JSON.stringify([]));
    }
  }, [book.no, book.judul, book.penulis, currentUid]);

  // Deteksi Perubahan Belum Disimpan (Unsaved Changes)
  const hasChanges = useMemo(() => {
    const origKel = (book.kelengkapanNaskah || []).slice().sort().join(',');
    const currKel = draftKelengkapan.slice().sort().join(',');
    const origDummy = localStorage.getItem(`schnell_dummy_status_${book.no}`) || 'tidak_ada';
    const notesChanged = JSON.stringify(notes) !== initialNotesStr;

    return (
      draftJudul.trim() !== book.judul.trim() ||
      draftPenulis.trim() !== book.penulis.trim() ||
      draftStatusProgres !== book.statusProgres ||
      draftPaket !== book.paket ||
      draftHalamanFinal !== (book.halamanFinal || book.halamanAwal) ||
      draftKodeProduksi.trim() !== (book.kodeProduksi || `PRD-2026-${String(book.no).padStart(3, '0')}`).trim() ||
      draftIsbn.trim() !== (book.isbn || '').trim() ||
      draftStatusIsbn !== (book.statusIsbn || 'Belum ada ISBN') ||
      draftUkuranBuku !== (book.ukuranBuku || 'UNESCO (15,5 x 23 cm)') ||
      draftHalamanWarna !== (book.halamanWarna || 'BW') ||
      currKel !== origKel ||
      draftDummyStatus !== origDummy ||
      notesChanged
    );
  }, [
    book,
    draftJudul,
    draftPenulis,
    draftStatusProgres,
    draftPaket,
    draftHalamanFinal,
    draftKodeProduksi,
    draftIsbn,
    draftStatusIsbn,
    draftUkuranBuku,
    draftHalamanWarna,
    draftKelengkapan,
    draftDummyStatus,
    notes,
    initialNotesStr,
  ]);

  // Configuration warna sesuai status progres draft
  const statusConfig = getStatusProgresConfig(draftStatusProgres);

  // Lama Waktu Status Progres (Hari Saja, Realtime)
  const daysInStatus = useMemo(() => {
    if (!book.updateTerakhir) return Math.max(1, book.hariBerjalan);
    try {
      const updateTime = new Date(book.updateTerakhir).getTime();
      if (isNaN(updateTime)) return Math.max(1, book.hariBerjalan);
      const nowTime = new Date().getTime();
      const refTime = nowTime > updateTime ? nowTime : new Date('2026-11-02').getTime();
      const diffMs = refTime - updateTime;
      return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return Math.max(1, book.hariBerjalan);
    }
  }, [book.updateTerakhir, book.hariBerjalan]);

  // 1. Handler Edit Halaman Final
  const [isEditingHalaman, setIsEditingHalaman] = useState(false);
  const [halamanInput, setHalamanInput] = useState<string>(String(draftHalamanFinal));

  useEffect(() => {
    setHalamanInput(String(draftHalamanFinal));
  }, [draftHalamanFinal]);

  const handleApplyHalaman = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(halamanInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDraftHalamanFinal(parsed);
      setIsEditingHalaman(false);
    }
  };

  // 2. Handler Edit Data Produksi
  const [isEditingProduction, setIsEditingProduction] = useState(false);

  // 3. Handler Kelengkapan Naskah
  const isAllKelengkapanChecked = useMemo(() => {
    if (draftKelengkapan.includes('Lengkap')) return true;
    return KELENGKAPAN_ITEMS.every((item) => draftKelengkapan.includes(item));
  }, [draftKelengkapan]);

  const handleToggleKelengkapan = (item: string) => {
    if (draftKelengkapan.includes(item)) {
      setDraftKelengkapan(draftKelengkapan.filter((i) => i !== item && i !== 'Lengkap'));
    } else {
      const next = [...draftKelengkapan.filter((i) => i !== 'Lengkap'), item];
      if (KELENGKAPAN_ITEMS.every((k) => next.includes(k))) {
        setDraftKelengkapan([...next, 'Lengkap']);
      } else {
        setDraftKelengkapan(next);
      }
    }
  };

  const handleToggleAllKelengkapan = () => {
    if (isAllKelengkapanChecked) {
      setDraftKelengkapan([]);
    } else {
      setDraftKelengkapan([...KELENGKAPAN_ITEMS, 'Lengkap']);
    }
  };

  // 4. Handler Catatan Revisi Baru
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedNoteCategory, setSelectedNoteCategory] = useState<RevisionNote['category']>('Revisi Penulis');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const now = new Date();
    const timeStr = `${formatDateIndo(now.toISOString().substring(0, 10))}, ${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;

    const newNote: RevisionNote = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr,
      category: selectedNoteCategory,
      text: newNoteText.trim(),
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  // 5. Dummy Cetak Toggle
  const toggleDummyStatus = () => {
    const next =
      draftDummyStatus === 'tidak_ada'
        ? 'proses'
        : draftDummyStatus === 'proses'
        ? 'selesai'
        : 'tidak_ada';
    setDraftDummyStatus(next);
  };

  // 6. Garis Waktu Proyek
  const timelineStages = useMemo(() => {
    const isSelesai = draftStatusProgres === 'Selesai';
    const isReadyPrint = draftStatusProgres === 'Sudah siap cetak' || isSelesai;
    const isACC = draftStatusProgres === 'Nunggu ACC Cetak' || isReadyPrint;
    const isIsbn = draftStatusProgres === 'Nunggu ISBN' || isACC;
    const isFinishingKorektor = draftStatusProgres === 'Finishing Korektor' || isIsbn;
    const isPenulis = draftStatusProgres === 'Di Penulis' || draftStatusProgres === 'Masalah saat Kor penulis';
    const isFinishingSaya = draftStatusProgres === 'Finishing Saya';
    const isCoped = draftStatusProgres === 'Di Coped';
    const isSaya = draftStatusProgres === 'Di Saya';
    const isLayoutAwalDone = draftStatusProgres !== 'Kirim file awal layout';

    return [
      {
        id: 'terima',
        title: 'Terima Naskah',
        sub: formatDateIndo(book.tglTerima) || 'Naskah Masuk',
        status: 'done' as const,
      },
      {
        id: 'layout_awal',
        title: 'Layout Awal',
        sub: isLayoutAwalDone ? `${book.lamaLayoutAwal} hari selesai` : 'Kirim File Awal',
        status: isLayoutAwalDone ? ('done' as const) : ('current' as const),
      },
      {
        id: 'review_koreksi',
        title: 'Penulis & Koreksi',
        sub: isPenulis
          ? 'Sedang di Penulis'
          : isCoped
          ? 'Di Coped'
          : isFinishingSaya
          ? 'Finishing Saya'
          : isFinishingKorektor || isIsbn || isACC || isReadyPrint || isSelesai
          ? 'Koreksi Selesai'
          : isSaya
          ? 'Pengerjaan di Saya'
          : 'Menunggu',
        status:
          isFinishingKorektor || isIsbn || isACC || isReadyPrint || isSelesai
            ? ('done' as const)
            : isPenulis || isCoped || isFinishingSaya || isSaya
            ? ('current' as const)
            : ('upcoming' as const),
      },
      {
        id: 'dummy',
        title: 'Cetak Dummy',
        sub:
          draftDummyStatus === 'selesai'
            ? 'Dummy Fisik ACC'
            : draftDummyStatus === 'proses'
            ? 'Sedang Cetak'
            : 'Opsional (Atur)',
        status:
          draftDummyStatus === 'selesai'
            ? ('done' as const)
            : draftDummyStatus === 'proses'
            ? ('current' as const)
            : ('optional' as const),
      },
      {
        id: 'finishing',
        title: 'Finishing Korektor',
        sub:
          isIsbn || isACC || isReadyPrint || isSelesai
            ? 'Finishing Siap'
            : draftStatusProgres === 'Finishing Korektor'
            ? 'Korektor Finishing'
            : 'Belum Finishing',
        status:
          isIsbn || isACC || isReadyPrint || isSelesai
            ? ('done' as const)
            : draftStatusProgres === 'Finishing Korektor'
            ? ('current' as const)
            : ('upcoming' as const),
      },
      {
        id: 'isbn_stage',
        title: 'ISBN',
        sub:
          draftStatusIsbn === 'ISBN Terbit'
            ? 'ISBN Terbit'
            : draftStatusProgres === 'Nunggu ISBN' || draftStatusIsbn === 'Pengajuan ISBN'
            ? 'Proses Pengajuan'
            : 'Belum ISBN',
        status:
          draftStatusIsbn === 'ISBN Terbit' || isReadyPrint || isSelesai
            ? ('done' as const)
            : draftStatusProgres === 'Nunggu ISBN'
            ? ('current' as const)
            : ('upcoming' as const),
      },
      {
        id: 'acc_cetak',
        title: 'ACC Cetak',
        sub:
          isReadyPrint || isSelesai
            ? 'Siap Cetak'
            : draftStatusProgres === 'Nunggu ACC Cetak'
            ? 'Menunggu ACC'
            : 'Belum ACC',
        status:
          isReadyPrint || isSelesai
            ? ('done' as const)
            : draftStatusProgres === 'Nunggu ACC Cetak'
            ? ('current' as const)
            : ('upcoming' as const),
      },
    ];
  }, [book, draftStatusProgres, draftDummyStatus, draftStatusIsbn]);

  // ==========================================
  // SIMPAN & TUTUP (Save & Close)
  // Menjamin jika user tidak klik tombol ini,
  // perubahan tidak akan disimpan (keamanan salah input)
  // ==========================================
  const handleSaveAndClose = () => {
    const today = new Date().toISOString().substring(0, 10);
    const updates: Partial<BookJob> = {
      judul: draftJudul.trim() || book.judul,
      penulis: draftPenulis.trim() || book.penulis,
      statusProgres: draftStatusProgres,
      paket: draftPaket,
      halamanFinal: draftHalamanFinal,
      kodeProduksi: draftKodeProduksi.trim() || undefined,
      isbn: draftIsbn.trim() || undefined,
      statusIsbn: draftStatusIsbn,
      ukuranBuku: draftUkuranBuku,
      halamanWarna: draftHalamanWarna,
      kelengkapanNaskah: draftKelengkapan,
    };

    if (hasChanges) {
      updates.updateTerakhir = today;
    }

    if (draftStatusProgres === 'Selesai' && !book.tglSelesaiLayout) {
      updates.tglSelesaiLayout = today;
    }

    // Simpan riwayat catatan & dummy cetak ke storage privat user
    setUserBookNotes(currentUid, book.no, notes);
    setUserDummyStatus(currentUid, book.no, draftDummyStatus);

    onUpdateBook?.(book.no, updates);
    onClose();
  };

  // Tutup tanpa simpan
  const handleCancelAndClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop Klik untuk Tutup Tanpa Simpan */}
      <div className="absolute inset-0" onClick={handleCancelAndClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden z-10 transition-transform">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 md:hidden shrink-0" />

        {/* 1. Header Sheet: Info Buku Lengkap + Edit Paket */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
              #{book.no}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {/* Fitur Ubah Paket di dalam Card */}
                <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Paket:
                  </span>
                  {PAKET_LIST.map((pkt) => {
                    const isSelected = draftPaket === pkt;
                    return (
                      <button
                        key={pkt}
                        type="button"
                        onClick={() => setDraftPaket(pkt)}
                        title={`Ubah paket ke ${pkt}`}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                          isSelected
                            ? pkt === 'Premium'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : pkt === 'Standart'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {pkt}
                      </button>
                    );
                  })}
                </div>

                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {book.kategori}
                </span>

                {book.stuck === 'Ya' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center gap-1 border border-rose-200 dark:border-rose-900">
                    <AlertTriangle className="w-3 h-3" />
                    Stuck
                  </span>
                )}

                {/* Badge ISBN Live Draft */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    draftStatusIsbn === 'ISBN Terbit'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : draftStatusIsbn === 'Pengajuan ISBN'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {draftStatusIsbn}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                {draftJudul || book.judul}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium truncate">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{draftPenulis || book.penulis}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleCancelAndClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Tutup"
            title="Tutup (Tanpa Simpan)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Peringatan Perubahan Belum Disimpan */}
        {hasChanges && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200/80 dark:border-amber-900/60 px-5 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Ada perubahan belum disimpan. Klik <strong>Simpan & Tutup</strong> di bawah untuk menerapkan.
            </span>
          </div>
        )}

        {/* Scrollable Sheet Body */}
        <div className="px-5 sm:px-6 py-5 overflow-y-auto space-y-5">
          {/* 2. Status Row: Status Progres + Lama Waktu Status Progres (Realtime Hari Saja) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status Progres Card */}
            <div className={`p-4 rounded-2xl border ${statusConfig.bg} ${statusConfig.border}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status Progres Saat Ini
                </span>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              </div>
              <span className={`text-base font-extrabold ${statusConfig.text} mt-1 block`}>
                {draftStatusProgres}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Update: {formatDateIndo(book.updateTerakhir)}
              </span>
            </div>

            {/* Lama Waktu Status Progres (Hari Saja, Realtime) */}
            <div className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Lama di Status Ini
                </span>
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-0.5 block tabular-nums">
                {daysInStatus} Hari
              </span>
              <span className="text-[11px] text-blue-600/80 dark:text-blue-300/80 mt-1 block">
                Di {draftStatusProgres} (Realtime)
              </span>
            </div>
          </div>

          {/* 3. Garis Waktu Proyek & Update Status Progres Proyek (11 Status) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Garis Waktu Proyek</span>
              </h4>
              <button
                type="button"
                onClick={toggleDummyStatus}
                title="Klik untuk mengubah status cetak dummy fisik"
                className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1 transition-colors"
              >
                <Printer className="w-3 h-3 text-slate-400" />
                <span>
                  Dummy: {draftDummyStatus === 'selesai' ? 'ACC' : draftDummyStatus === 'proses' ? 'Proses' : 'Off'}
                </span>
              </button>
            </div>

            {/* Stepper Scrollable */}
            <div className="overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
              <div className="flex items-start min-w-[620px] relative">
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />

                {timelineStages.map((st, idx) => {
                  const isDone = st.status === 'done';
                  const isCurrent = st.status === 'current';
                  const isOptional = st.status === 'optional';

                  return (
                    <div key={st.id} className="flex-1 flex flex-col items-center text-center px-1 relative z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                            : isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/60 shadow-md shadow-blue-500/30 animate-pulse'
                            : isOptional
                            ? 'bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold block whitespace-nowrap leading-tight ${
                          isCurrent
                            ? 'text-blue-600 dark:text-blue-400'
                            : isDone
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {st.title}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block leading-tight max-w-[90px] truncate">
                        {st.sub}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Poin 1 & 2a: Update Status Progres Proyek Lengkap (11 Status) */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <ArrowRightCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span>Update Status Progres Proyek:</span>
                </span>

                <select
                  value={draftStatusProgres}
                  onChange={(e) => setDraftStatusProgres(e.target.value as StatusProgresType)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 font-extrabold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  {STATUS_PROGRES_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Pills untuk 11 Status Progres */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-[11px] no-scrollbar">
                {STATUS_PROGRES_LIST.map((st) => {
                  const isCurrent = draftStatusProgres === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDraftStatusProgres(st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all shrink-0 border ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Catatan Keterangan Kelengkapan Naskah (Checklist 11 Item Lengkap) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Kelengkapan Naskah
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {isAllKelengkapanChecked ? '100% Lengkap' : `${draftKelengkapan.filter((k) => k !== 'Lengkap').length}/10 Bagian`}
                </span>

                <button
                  type="button"
                  onClick={handleToggleAllKelengkapan}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    isAllKelengkapanChecked
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{isAllKelengkapanChecked ? 'Batal Lengkap' : 'Tandai Lengkap'}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Centang bagian naskah yang sudah diterima dari penulis / penerbit:
            </p>

            {/* Checklist Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {KELENGKAPAN_ITEMS.map((item) => {
                const isChecked = draftKelengkapan.includes(item) || isAllKelengkapanChecked;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleKelengkapan(item)}
                    className={`p-2 rounded-xl text-left text-xs font-semibold border flex items-center justify-between gap-1.5 transition-all ${
                      isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    {isChecked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* Item Ke-11: 'Lengkap' Button */}
              <button
                type="button"
                onClick={handleToggleAllKelengkapan}
                className={`p-2 rounded-xl text-left text-xs font-bold border flex items-center justify-between gap-1.5 transition-all sm:col-span-2 md:col-span-1 ${
                  isAllKelengkapanChecked
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                }`}
              >
                <span>Lengkap (Semua Bagian)</span>
                <Check className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* 5. Identitas Produksi, ISBN & Spesifikasi */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Barcode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Identitas Produksi & ISBN
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingProduction(!isEditingProduction)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingProduction ? 'Tutup Form' : 'Ubah Data'}</span>
              </button>
            </div>

            {isEditingProduction ? (
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-blue-300 dark:border-blue-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Kode Produksi
                    </label>
                    <input
                      type="text"
                      value={draftKodeProduksi}
                      onChange={(e) => setDraftKodeProduksi(e.target.value)}
                      placeholder="PRD-2026-045"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Nomor ISBN
                    </label>
                    <input
                      type="text"
                      value={draftIsbn}
                      onChange={(e) => setDraftIsbn(e.target.value)}
                      placeholder="978-623-xxx-xxx-x"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Status ISBN Select */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Status ISBN
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Belum ada ISBN', 'Pengajuan ISBN', 'ISBN Terbit'] as StatusIsbnType[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setDraftStatusIsbn(st)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                          draftStatusIsbn === st
                            ? st === 'ISBN Terbit'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : st === 'Pengajuan ISBN'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ukuran Buku & Halaman Warna */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Ukuran Buku
                    </label>
                    <select
                      value={draftUkuranBuku}
                      onChange={(e) => setDraftUkuranBuku(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      {UKURAN_LIST.map((uk) => (
                        <option key={uk} value={uk}>
                          {uk}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Halaman Warna
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['BW', 'Half BW', 'Full Color'] as HalamanWarnaType[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setDraftHalamanWarna(mode)}
                          className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold border text-center ${
                            draftHalamanWarna === mode
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Kode Produksi */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Kode Produksi
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {draftKodeProduksi}
                  </span>
                </div>

                {/* Nomor ISBN */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Nomor ISBN
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5 block truncate">
                    {draftIsbn || 'Belum ada ISBN'}
                  </span>
                </div>

                {/* Status ISBN Quick Buttons */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Status ISBN
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    {(['Belum ada ISBN', 'Pengajuan ISBN', 'ISBN Terbit'] as StatusIsbnType[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setDraftStatusIsbn(st)}
                        title={`Ubah status ke ${st}`}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border transition-all ${
                          draftStatusIsbn === st
                            ? st === 'ISBN Terbit'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : st === 'Pengajuan ISBN'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {st === 'Belum ada ISBN' ? 'Belum' : st === 'Pengajuan ISBN' ? 'Pengajuan' : 'Terbit'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Bar Spesifikasi */}
                <div className="sm:col-span-3 px-3 py-2 bg-slate-100/70 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>
                    Ukuran: <strong>{draftUkuranBuku}</strong>
                  </span>
                  <span>
                    Warna: <strong>{draftHalamanWarna}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 6. Rincian Metrik: HALAMAN & HARI BERJALAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* TOTAL HALAMAN (Bisa Diupdate) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800 relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  TOTAL HALAMAN
                </span>
                {!isEditingHalaman && (
                  <button
                    onClick={() => setIsEditingHalaman(true)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Ubah Halaman</span>
                  </button>
                )}
              </div>

              {isEditingHalaman ? (
                <form onSubmit={handleApplyHalaman} className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(1, (parseInt(halamanInput, 10) || 1) - 2);
                        setHalamanInput(String(val));
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={halamanInput}
                      onChange={(e) => setHalamanInput(e.target.value)}
                      className="w-24 text-center py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-500 font-extrabold text-base text-slate-900 dark:text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = (parseInt(halamanInput, 10) || 1) + 2;
                        setHalamanInput(String(val));
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-300"
                    >
                      +
                    </button>
                    <span className="text-xs text-slate-500 font-medium">hlm.</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setHalamanInput(String(draftHalamanFinal));
                        setIsEditingHalaman(false);
                      }}
                      className="px-2.5 py-1 text-xs rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white font-bold flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Terapkan
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                      {draftHalamanFinal}
                    </span>
                    <span className="text-sm font-medium text-slate-400">hlm.</span>
                    {draftHalamanFinal !== book.halamanAwal && (
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        ({draftHalamanFinal - book.halamanAwal > 0 ? `+${draftHalamanFinal - book.halamanAwal}` : draftHalamanFinal - book.halamanAwal} hlm.)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                    Estimasi awal naskah: <strong>{book.halamanAwal} hlm.</strong>
                  </span>
                </>
              )}
            </div>

            {/* HARI BERJALAN */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                HARI BERJALAN
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-1 block">
                {book.hariBerjalan} <span className="text-sm font-medium text-slate-400">hari</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                Layout awal: <strong>{book.lamaLayoutAwal} hari</strong> · Diterima: {formatDateIndo(book.tglTerima)}
              </span>
            </div>
          </div>

          {/* 7. Ubah Judul Buku & Nama Penulis (di atas Catatan Pengerjaan & Track Record Revisi) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Ubah Judul Buku & Nama Penulis
                </h4>
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Identitas Naskah
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Judul Buku
                </label>
                <input
                  type="text"
                  value={draftJudul}
                  onChange={(e) => setDraftJudul(e.target.value)}
                  placeholder="Masukkan judul buku lengkap..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Nama Penulis
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={draftPenulis}
                    onChange={(e) => setDraftPenulis(e.target.value)}
                    placeholder="Nama penulis / penyusun..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xs"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Perubahan judul dan nama penulis akan otomatis diperbarui di seluruh kartu buku, faktur, dan catatan setelah Anda menekan tombol <strong>Simpan & Tutup</strong> di bawah.
            </p>
          </div>

          {/* 8. Catatan Pengerjaan & Track Record Revisi */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Catatan Pengerjaan & Track Record Revisi
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                {notes.length} Catatan
              </span>
            </div>

            {/* Form Input Catatan Baru di Atas */}
            <form onSubmit={handleAddNote} className="space-y-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                <span className="text-slate-400 font-semibold mr-1 shrink-0 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Tag:
                </span>
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedNoteCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      selectedNoteCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Tulis riwayat catatan revisi baru (misal: Revisi bab 3 dari penulis via WA, bukti pengiriman dummy fisik, ACC cetak)..."
                rows={2}
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Track record revisi buku & kelengkapan proses
                </span>
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Tambah Catatan</span>
                </button>
              </div>
            </form>

            {/* Riwayat Catatan di Bawahnya */}
            <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  Belum ada riwayat catatan revisi untuk buku ini. Silakan tambahkan di form atas.
                </div>
              ) : (
                notes.map((note) => {
                  let badgeBg = 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                  if (note.category === 'Kendala') {
                    badgeBg = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
                  } else if (note.category === 'ACC Cetak') {
                    badgeBg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                  } else if (note.category === 'Cetak Dummy') {
                    badgeBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                  }

                  return (
                    <div
                      key={note.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeBg}`}>
                            {note.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {note.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                          {note.text}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                        title="Hapus catatan"
                        aria-label="Hapus catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Metadata Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Update Terakhir: {formatDateIndo(book.updateTerakhir)}</span>
            <span>Tgl Terima Naskah: {formatDateIndo(book.tglTerima)}</span>
          </div>
        </div>

        {/* 8. Action Footer: Tombol Save & Tutup (Simpan & Tutup) dan Batal */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            {hasChanges ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Ada perubahan draft
              </span>
            ) : (
              <span>Data tersinkronisasi</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCancelAndClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors text-center"
            >
              Tutup (Batal)
            </button>

            <button
              type="button"
              onClick={handleSaveAndClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all text-center shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Tutup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
