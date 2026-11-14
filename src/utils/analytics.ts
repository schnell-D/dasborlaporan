import { BookJob, StatusProgresType, PaketType } from '../types';

export interface MonthOption {
  key: string; // e.g. "2026-10" or "all"
  label: string; // e.g. "Oktober 2026" or "Semua Bulan"
  year: number;
  month: number; // 1-12
}

/**
 * Daftar bulan yang ada pada data pekerjaan (Juli - November 2026)
 */
export const AVAILABLE_MONTHS: MonthOption[] = [
  { key: '2026-07', label: 'Juli 2026', year: 2026, month: 7 },
  { key: '2026-08', label: 'Agustus 2026', year: 2026, month: 8 },
  { key: '2026-09', label: 'September 2026', year: 2026, month: 9 },
  { key: '2026-10', label: 'Oktober 2026', year: 2026, month: 10 },
  { key: '2026-11', label: 'November 2026', year: 2026, month: 11 },
];

/**
 * Mengambil buku yang relevan dengan bulan yang dipilih.
 * Jika 'all', semua buku dikembalikan.
 * Jika bulan spesifik, buku yang diterima pada bulan tersebut atau diselesaikan pada bulan tersebut.
 */
export function filterBooksByMonth(books: BookJob[], monthKey: string): BookJob[] {
  if (monthKey === 'all') return books;
  return books.filter((b) => {
    const terimaMonth = b.tglTerima?.substring(0, 7);
    const selesaiMonth = b.tglSelesaiLayout ? b.tglSelesaiLayout.substring(0, 7) : null;
    return terimaMonth === monthKey || selesaiMonth === monthKey;
  });
}

export interface DashboardMetrics {
  bukuMasuk: number;
  bukuMasukDelta: number | null; // % perubahan dibanding bulan lalu
  masihAktif: number;
  masihAktifDelta: number | null;
  ditagihNominal: number;
  ditagihDelta: number | null;
  dibayarNominal: number;
  dibayarDelta: number | null;
  belumDitagihNominal: number;
  belumDitagihDelta: number | null;
  siapDitagihCount: number;
  siapDitagihNominal: number;
  siapDitagihDelta: number | null;
  selesaiCount: number;
}

/**
 * Menghitung selisih persentase antara dua nilai
 */
function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Menghitung 6 metrik utama untuk bulan yang dipilih dan membandingkannya dengan bulan sebelumnya
 */
export function computeDashboardMetrics(allBooks: BookJob[], currentMonthKey: string): DashboardMetrics {
  const isAll = currentMonthKey === 'all';
  
  // Hitung metrik periode saat ini
  let currentIncoming: BookJob[];
  let currentFinished: BookJob[];
  let currentActive: BookJob[];
  let relevantBooks: BookJob[];

  if (isAll) {
    relevantBooks = allBooks;
    currentIncoming = allBooks;
    currentFinished = allBooks.filter((b) => b.statusProgres === 'Selesai');
    currentActive = allBooks.filter((b) => b.statusProgres !== 'Selesai');
  } else {
    relevantBooks = allBooks.filter((b) => {
      const tMonth = b.tglTerima?.substring(0, 7);
      const sMonth = b.tglSelesaiLayout?.substring(0, 7);
      const iMonth = b.tglInvoice?.substring(0, 7);
      return tMonth === currentMonthKey || sMonth === currentMonthKey || iMonth === currentMonthKey;
    });

    currentIncoming = allBooks.filter((b) => b.tglTerima?.substring(0, 7) === currentMonthKey);
    currentFinished = allBooks.filter((b) => b.tglSelesaiLayout?.substring(0, 7) === currentMonthKey);
    currentActive = allBooks.filter((b) => {
      // Masih aktif di bulan ini (diterima sebelum atau pada bulan ini, dan belum selesai sebelum bulan ini)
      const tMonth = b.tglTerima?.substring(0, 7);
      if (tMonth > currentMonthKey) return false;
      if (b.statusProgres === 'Selesai') {
        const sMonth = b.tglSelesaiLayout?.substring(0, 7) || '';
        return sMonth >= currentMonthKey;
      }
      return true;
    });
  }

  // Buku Masuk
  const bukuMasuk = isAll ? allBooks.length : currentIncoming.length;

  // Masih Aktif
  const masihAktif = isAll 
    ? allBooks.filter((b) => b.statusProgres !== 'Selesai').length 
    : allBooks.filter((b) => b.statusProgres !== 'Selesai' && b.tglTerima?.substring(0, 7) <= currentMonthKey).length;

  // Ditagih (Status 'Belum Dibayar' atau 'Lunas')
  const ditagihNominal = relevantBooks
    .filter((b) => b.statusBayar === 'Belum Dibayar' || b.statusBayar === 'Lunas')
    .reduce((sum, b) => sum + b.nilaiJasa, 0);

  // Dibayar (Status 'Lunas')
  const dibayarNominal = isAll
    ? allBooks.filter((b) => b.statusBayar === 'Lunas').reduce((sum, b) => sum + b.nilaiJasa, 0)
    : allBooks
        .filter((b) => b.statusBayar === 'Lunas' && b.tglDibayar?.substring(0, 7) === currentMonthKey)
        .reduce((sum, b) => sum + b.nilaiJasa, 0);

  // Belum Ditagih (Status 'Belum Ditagih')
  const belumDitagihNominal = relevantBooks
    .filter((b) => b.statusBayar === 'Belum Ditagih')
    .reduce((sum, b) => sum + b.nilaiJasa, 0);

  // Siap Ditagih (Status Progres = 'Selesai', Status Bayar = 'Belum Ditagih')
  const siapDitagihBooks = (isAll ? allBooks : relevantBooks).filter(
    (b) => b.statusProgres === 'Selesai' && b.statusBayar === 'Belum Ditagih'
  );
  const siapDitagihCount = siapDitagihBooks.length;
  const siapDitagihNominal = siapDitagihBooks.reduce((sum, b) => sum + b.nilaiJasa, 0);

  // Jumlah selesai
  const selesaiCount = isAll
    ? allBooks.filter((b) => b.statusProgres === 'Selesai').length
    : currentFinished.length;

  // Hitung perbandingan dengan bulan lalu jika memilih bulan spesifik
  let bukuMasukDelta: number | null = null;
  let masihAktifDelta: number | null = null;
  let ditagihDelta: number | null = null;
  let dibayarDelta: number | null = null;
  let belumDitagihDelta: number | null = null;
  let siapDitagihDelta: number | null = null;

  if (!isAll) {
    const curIdx = AVAILABLE_MONTHS.findIndex((m) => m.key === currentMonthKey);
    if (curIdx > 0) {
      const prevKey = AVAILABLE_MONTHS[curIdx - 1].key;
      const prevIncoming = allBooks.filter((b) => b.tglTerima?.substring(0, 7) === prevKey).length;
      const prevActive = allBooks.filter((b) => {
        const tMonth = b.tglTerima?.substring(0, 7);
        if (tMonth > prevKey) return false;
        if (b.statusProgres === 'Selesai') {
          const sMonth = b.tglSelesaiLayout?.substring(0, 7) || '';
          return sMonth >= prevKey;
        }
        return true;
      }).length;

      const prevRelevant = allBooks.filter((b) => {
        const tMonth = b.tglTerima?.substring(0, 7);
        const sMonth = b.tglSelesaiLayout?.substring(0, 7);
        const iMonth = b.tglInvoice?.substring(0, 7);
        return tMonth === prevKey || sMonth === prevKey || iMonth === prevKey;
      });

      const prevDitagih = prevRelevant
        .filter((b) => b.statusBayar === 'Belum Dibayar' || b.statusBayar === 'Lunas')
        .reduce((sum, b) => sum + b.nilaiJasa, 0);

      const prevDibayar = allBooks
        .filter((b) => b.statusBayar === 'Lunas' && b.tglDibayar?.substring(0, 7) === prevKey)
        .reduce((sum, b) => sum + b.nilaiJasa, 0);

      const prevBelumDitagih = prevRelevant
        .filter((b) => b.statusBayar === 'Belum Ditagih')
        .reduce((sum, b) => sum + b.nilaiJasa, 0);

      const prevSiap = prevRelevant.filter(
        (b) => b.statusProgres === 'Selesai' && b.statusBayar === 'Belum Ditagih'
      ).length;

      bukuMasukDelta = calcDelta(bukuMasuk, prevIncoming);
      masihAktifDelta = calcDelta(masihAktif, prevActive);
      ditagihDelta = calcDelta(ditagihNominal, prevDitagih);
      dibayarDelta = calcDelta(dibayarNominal, prevDibayar);
      belumDitagihDelta = calcDelta(belumDitagihNominal, prevBelumDitagih);
      siapDitagihDelta = calcDelta(siapDitagihCount, prevSiap);
    }
  }

  return {
    bukuMasuk,
    bukuMasukDelta,
    masihAktif,
    masihAktifDelta,
    ditagihNominal,
    ditagihDelta,
    dibayarNominal,
    dibayarDelta,
    belumDitagihNominal,
    belumDitagihDelta,
    siapDitagihCount,
    siapDitagihNominal,
    siapDitagihDelta,
    selesaiCount,
  };
}

/**
 * Data per minggu untuk grafik batang: Buku Masuk vs Buku Selesai Layout
 */
export interface WeeklyDataPoint {
  label: string; // e.g. "Minggu 1", "Minggu 2"
  masuk: number;
  selesai: number;
}

export function computeWeeklyComparison(books: BookJob[], monthKey: string): WeeklyDataPoint[] {
  const weeks: WeeklyDataPoint[] = [
    { label: 'Minggu 1 (1-7)', masuk: 0, selesai: 0 },
    { label: 'Minggu 2 (8-14)', masuk: 0, selesai: 0 },
    { label: 'Minggu 3 (15-21)', masuk: 0, selesai: 0 },
    { label: 'Minggu 4+ (22+)', masuk: 0, selesai: 0 },
  ];

  books.forEach((b) => {
    // Buku Masuk
    if (b.tglTerima) {
      const mStr = b.tglTerima.substring(0, 7);
      if (monthKey === 'all' || mStr === monthKey) {
        const day = parseInt(b.tglTerima.substring(8, 10), 10);
        if (day <= 7) weeks[0].masuk++;
        else if (day <= 14) weeks[1].masuk++;
        else if (day <= 21) weeks[2].masuk++;
        else weeks[3].masuk++;
      }
    }

    // Buku Selesai
    if (b.tglSelesaiLayout) {
      const mStr = b.tglSelesaiLayout.substring(0, 7);
      if (monthKey === 'all' || mStr === monthKey) {
        const day = parseInt(b.tglSelesaiLayout.substring(8, 10), 10);
        if (day <= 7) weeks[0].selesai++;
        else if (day <= 14) weeks[1].selesai++;
        else if (day <= 21) weeks[2].selesai++;
        else weeks[3].selesai++;
      }
    }
  });

  return weeks;
}

/**
 * Komposisi status progres buku untuk donat chart
 */
export interface StatusDistribution {
  status: StatusProgresType;
  count: number;
  percentage: number;
  color: string;
}

const STATUS_COLORS: Record<StatusProgresType, string> = {
  'Selesai': '#1A9E7A',
  'Sudah siap cetak': '#059669',
  'Nunggu ACC Cetak': '#A855F7',
  'Nunggu ISBN': '#D97706',
  'Finishing Korektor': '#6366F1',
  'Di Penulis': '#F97316',
  'Finishing Saya': '#0D9488',
  'Di Coped': '#F59E0B',
  'Di Saya': '#2F6BDE',
  'Kirim file awal layout': '#0EA5E9',
  'Masalah saat Kor penulis': '#E5484D',
};

export function computeStatusDistribution(books: BookJob[]): StatusDistribution[] {
  const counts: Partial<Record<StatusProgresType, number>> = {};
  books.forEach((b) => {
    counts[b.statusProgres] = (counts[b.statusProgres] || 0) + 1;
  });

  const total = books.length || 1;
  const result: StatusDistribution[] = [];

  const orderedStatuses: StatusProgresType[] = [
    'Selesai',
    'Sudah siap cetak',
    'Nunggu ACC Cetak',
    'Nunggu ISBN',
    'Finishing Korektor',
    'Di Penulis',
    'Finishing Saya',
    'Di Coped',
    'Di Saya',
    'Kirim file awal layout',
    'Masalah saat Kor penulis',
  ];

  orderedStatuses.forEach((st) => {
    const c = counts[st] || 0;
    if (c > 0) {
      result.push({
        status: st,
        count: c,
        percentage: Math.round((c / total) * 100),
        color: STATUS_COLORS[st] || '#94A3B8',
      });
    }
  });

  return result;
}

/**
 * Tabel Keuangan per Paket
 */
export interface PaketSummary {
  paket: PaketType;
  jumlahBuku: number;
  totalHalaman: number;
  rataRataHari: number;
  nilaiTotal: number;
  persenNilai: number;
}

export function computePaketSummary(books: BookJob[]): PaketSummary[] {
  const pakets: PaketType[] = ['Basic', 'Standart', 'Premium'];
  const grandTotal = books.reduce((s, b) => s + b.nilaiJasa, 0) || 1;

  return pakets.map((pkt) => {
    const filtered = books.filter((b) => b.paket === pkt);
    const count = filtered.length;
    const totalHalaman = filtered.reduce((s, b) => s + (b.halamanFinal || b.halamanAwal || 0), 0);
    const totalHari = filtered.reduce((s, b) => s + (b.hariBerjalan || 0), 0);
    const rataRataHari = count > 0 ? Math.round((totalHari / count) * 10) / 10 : 0;
    const nilaiTotal = filtered.reduce((s, b) => s + b.nilaiJasa, 0);
    const persenNilai = Math.round((nilaiTotal / grandTotal) * 1000) / 10;

    return {
      paket: pkt,
      jumlahBuku: count,
      totalHalaman,
      rataRataHari,
      nilaiTotal,
      persenNilai,
    };
  });
}

/**
 * Pendapatan pembayaran masuk per bulan
 */
export interface MonthlyIncome {
  monthKey: string;
  label: string;
  totalDibayar: number;
  count: number;
}

export function computeMonthlyIncome(books: BookJob[]): MonthlyIncome[] {
  return AVAILABLE_MONTHS.map((m) => {
    const matched = books.filter(
      (b) => b.statusBayar === 'Lunas' && b.tglDibayar?.substring(0, 7) === m.key
    );
    const totalDibayar = matched.reduce((s, b) => s + b.nilaiJasa, 0);
    return {
      monthKey: m.key,
      label: m.label.replace(' 2026', ''),
      totalDibayar,
      count: matched.length,
    };
  });
}
