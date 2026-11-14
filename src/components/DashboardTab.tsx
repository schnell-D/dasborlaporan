import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  BookPlus,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Coins,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { BookJob, TabType } from '../types';
import {
  AVAILABLE_MONTHS,
  computeDashboardMetrics,
  computeWeeklyComparison,
  computeStatusDistribution,
} from '../utils/analytics';
import { formatRupiah } from '../utils/formatters';
import { TargetGauge, WeeklyBarChart, StatusDonutChart } from './DashboardCharts';

interface DashboardTabProps {
  books: BookJob[];
  selectedMonth: string;
  onMonthChange: (monthKey: string) => void;
  monthlyTarget: number;
  onTabChange: (tab: TabType) => void;
  onOpenSettings: () => void;
  onFilterStatusFromChart?: (status: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  books,
  selectedMonth,
  onMonthChange,
  monthlyTarget,
  onTabChange,
  onOpenSettings,
  onFilterStatusFromChart,
}) => {
  // Hitung metrik dashboard
  const metrics = computeDashboardMetrics(books, selectedMonth);
  const weeklyData = computeWeeklyComparison(books, selectedMonth);
  const statusDistribution = computeStatusDistribution(
    selectedMonth === 'all'
      ? books
      : books.filter((b) => {
          const tm = b.tglTerima?.substring(0, 7);
          const sm = b.tglSelesaiLayout?.substring(0, 7);
          return tm === selectedMonth || sm === selectedMonth;
        })
  );

  // Navigasi bulan
  const currentMonthIndex = AVAILABLE_MONTHS.findIndex((m) => m.key === selectedMonth);
  const isAll = selectedMonth === 'all';
  const currentMonthLabel = isAll
    ? 'Semua Periode'
    : AVAILABLE_MONTHS[currentMonthIndex]?.label || selectedMonth;

  const handlePrevMonth = () => {
    if (isAll) {
      onMonthChange(AVAILABLE_MONTHS[AVAILABLE_MONTHS.length - 1].key);
    } else if (currentMonthIndex > 0) {
      onMonthChange(AVAILABLE_MONTHS[currentMonthIndex - 1].key);
    }
  };

  const handleNextMonth = () => {
    if (isAll) {
      onMonthChange(AVAILABLE_MONTHS[0].key);
    } else if (currentMonthIndex < AVAILABLE_MONTHS.length - 1) {
      onMonthChange(AVAILABLE_MONTHS[currentMonthIndex + 1].key);
    }
  };

  // Helper untuk rendering badge delta persentase
  const renderDelta = (delta: number | null) => {
    if (isAll || delta === null) {
      return (
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {isAll ? 'Total seluruh periode' : 'Data awal'}
        </span>
      );
    }

    if (delta > 0) {
      return (
        <div className="flex items-center gap-1 text-[11px] font-bold text-[#1A9E7A] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
          <TrendingUp className="w-3 h-3" />
          <span>+{delta}%</span>
        </div>
      );
    }
    if (delta < 0) {
      return (
        <div className="flex items-center gap-1 text-[11px] font-bold text-[#E5484D] bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
          <TrendingDown className="w-3 h-3" />
          <span>{delta}%</span>
        </div>
      );
    }
    return (
      <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
        0%
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Bar Navigasi Pemilih Bulan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Periode Laporan
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {currentMonthLabel}
            </span>
          </div>
        </div>

        {/* Kontrol panah bulan dan tombol "Semua" */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              disabled={!isAll && currentMonthIndex === 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Bulan sebelumnya"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap min-w-[100px] text-center">
              {isAll ? 'Semua Bulan' : AVAILABLE_MONTHS[currentMonthIndex]?.label}
            </div>
            <button
              onClick={handleNextMonth}
              disabled={!isAll && currentMonthIndex === AVAILABLE_MONTHS.length - 1}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Bulan berikutnya"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onMonthChange('all')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
              isAll
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* 2. Kartu Ajakan (Jika ada buku selesai belum ditagih) */}
      {metrics.siapDitagihCount > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-blue-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base tracking-tight">
                {metrics.siapDitagihCount} buku selesai siap ditagih!
              </h4>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Total potensi pemasukan <span className="font-bold underline decoration-amber-300 underline-offset-2">{formatRupiah(metrics.siapDitagihNominal)}</span> belum diterbitkan invoice.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => onTabChange('invoice')}
              className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <span>Buat Invoice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onTabChange('keuangan')}
              className="px-3 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Keuangan
            </button>
          </div>
        </div>
      )}

      {/* 3. Grid 6 Kartu Angka Berikon & Persen Naik Turun */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Kartu 1: Buku Masuk */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2F6BDE] flex items-center justify-center">
              <BookPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            {renderDelta(metrics.bukuMasukDelta)}
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Buku Masuk
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                {metrics.bukuMasuk}
              </span>
              <span className="text-xs text-slate-400 font-medium">judul</span>
            </div>
          </div>
        </div>

        {/* Kartu 2: Masih Aktif */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#F59E0B] flex items-center justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            {renderDelta(metrics.masihAktifDelta)}
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Masih Aktif
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                {metrics.masihAktif}
              </span>
              <span className="text-xs text-slate-400 font-medium">dalam proses</span>
            </div>
          </div>
        </div>

        {/* Kartu 3: Ditagih (Rp) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            {renderDelta(metrics.ditagihDelta)}
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Ditagih (Invoice)
            </span>
            <div className="mt-0.5">
              <span className="text-lg sm:text-2xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white block truncate">
                {formatRupiah(metrics.ditagihNominal)}
              </span>
            </div>
          </div>
        </div>

        {/* Kartu 4: Dibayar (Rp) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#1A9E7A] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            {renderDelta(metrics.dibayarDelta)}
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Dibayar (Lunas)
            </span>
            <div className="mt-0.5">
              <span className="text-lg sm:text-2xl font-extrabold tracking-tight tabular-nums text-[#1A9E7A] dark:text-emerald-400 block truncate">
                {formatRupiah(metrics.dibayarNominal)}
              </span>
            </div>
          </div>
        </div>

        {/* Kartu 5: Belum Ditagih (Rp) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#E5484D] flex items-center justify-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            {renderDelta(metrics.belumDitagihDelta)}
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Belum Ditagih
            </span>
            <div className="mt-0.5">
              <span className="text-lg sm:text-2xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white block truncate">
                {formatRupiah(metrics.belumDitagihNominal)}
              </span>
            </div>
          </div>
        </div>

        {/* Kartu 6: Siap Ditagih */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2F6BDE] flex items-center justify-center">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            {renderDelta(metrics.siapDitagihDelta)}
          </div>
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Siap Ditagih
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-blue-600 dark:text-blue-400">
                {metrics.siapDitagihCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">buku selesai</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Baris Grafik: Target Gauge & Aktivitas Mingguan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gauge Setengah Lingkaran */}
        <div className="md:col-span-1">
          <TargetGauge
            completed={metrics.selesaiCount}
            target={monthlyTarget}
            monthLabel={currentMonthLabel}
            onEditTarget={onOpenSettings}
          />
        </div>

        {/* Grafik Batang Mingguan */}
        <div className="md:col-span-2">
          <WeeklyBarChart data={weeklyData} />
        </div>
      </div>

      {/* 5. Donut Komposisi Status Buku */}
      <div>
        <StatusDonutChart
          distribution={statusDistribution}
          totalBooks={
            statusDistribution.reduce((acc, curr) => acc + curr.count, 0)
          }
          onSelectStatus={(status) => {
            onFilterStatusFromChart?.(status);
            onTabChange('buku');
          }}
        />
      </div>
    </div>
  );
};
