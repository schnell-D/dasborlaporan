import React, { useState } from 'react';
import { WeeklyDataPoint, StatusDistribution } from '../utils/analytics';
import { getStatusProgresConfig } from '../utils/formatters';

/**
 * 1. Gauge Setengah Lingkaran "Target Bulan Ini"
 */
interface TargetGaugeProps {
  completed: number;
  target: number;
  monthLabel: string;
  onEditTarget?: () => void;
}

export const TargetGauge: React.FC<TargetGaugeProps> = ({
  completed,
  target,
  monthLabel,
  onEditTarget,
}) => {
  const percentage = target > 0 ? Math.round((completed / target) * 100) : 0;
  // Semicircle parameters
  const radius = 64;
  const strokeWidth = 12;
  const arcLength = Math.PI * radius; // Keliling setengah lingkaran
  const cappedPercent = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = arcLength - (arcLength * cappedPercent) / 100;

  // Tentukan warna busur berdasarkan capaian
  const getGaugeColor = (pct: number) => {
    if (pct >= 100) return '#1A9E7A'; // emerald/green
    if (pct >= 70) return '#2F6BDE'; // blue
    if (pct >= 40) return '#F59E0B'; // orange/amber
    return '#E5484D'; // rose/red
  };

  const gaugeColor = getGaugeColor(percentage);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Target Bulan Ini</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Buku selesai ({monthLabel})
          </p>
        </div>
        {onEditTarget && (
          <button
            onClick={onEditTarget}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Ubah
          </button>
        )}
      </div>

      <div className="relative flex flex-col items-center justify-center my-2">
        <svg
          viewBox="0 0 160 90"
          className="w-48 h-28 overflow-visible"
        >
          {/* Latar busur abu-abu */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Busur progres berwarna */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Teks nilai di tengah gauge */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
              {percentage}%
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {completed} dari target {target} buku
          </span>
        </div>
      </div>

      {/* Status keterangan pencapaian */}
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Status Capaian:</span>
        <span
          className="font-bold px-2 py-0.5 rounded-full text-[11px]"
          style={{
            backgroundColor: `${gaugeColor}15`,
            color: gaugeColor,
          }}
        >
          {percentage >= 100
            ? '🎉 Target Terlampaui'
            : percentage >= 70
            ? '👍 Sesuai Jalur'
            : percentage >= 40
            ? '⚡ Perlu Dikejar'
            : '⚠️ Di Bawah Target'}
        </span>
      </div>
    </div>
  );
};

/**
 * 2. Grafik Batang Mingguan: Buku Masuk vs Buku Selesai Layout
 */
interface WeeklyBarChartProps {
  data: WeeklyDataPoint[];
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.masuk, d.selesai)),
    4 // minimum skala y agar grafik tidak gepeng
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Aktivitas Mingguan</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Buku Masuk vs Buku Selesai Layout
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#2F6BDE]" />
            <span className="text-slate-600 dark:text-slate-300">Buku Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#1A9E7A]" />
            <span className="text-slate-600 dark:text-slate-300">Selesai Layout</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart Canvas */}
      <div className="w-full h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1 border-b border-slate-100 dark:border-slate-800">
        {data.map((week, idx) => {
          const masukHeightPct = Math.round((week.masuk / maxValue) * 100);
          const selesaiHeightPct = Math.round((week.selesai / maxValue) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-full relative">
                {/* Tooltip hover */}
                {isHovered && (
                  <div className="absolute -top-10 bg-slate-900 dark:bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md shadow-md whitespace-nowrap z-20 pointer-events-none">
                    Masuk: {week.masuk} · Selesai: {week.selesai}
                  </div>
                )}

                {/* Batang Masuk (Biru #2F6BDE) */}
                <div className="w-3.5 sm:w-5 bg-blue-100 dark:bg-blue-950/40 rounded-t-md relative flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-[#2F6BDE] rounded-t-md transition-all duration-500 relative flex items-center justify-center"
                    style={{ height: `${Math.max(masukHeightPct, 6)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white absolute -top-4 tabular-nums">
                      {week.masuk}
                    </span>
                  </div>
                </div>

                {/* Batang Selesai (Hijau #1A9E7A) */}
                <div className="w-3.5 sm:w-5 bg-emerald-100 dark:bg-emerald-950/40 rounded-t-md relative flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-[#1A9E7A] rounded-t-md transition-all duration-500 relative flex items-center justify-center"
                    style={{ height: `${Math.max(selesaiHeightPct, 6)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white absolute -top-4 tabular-nums">
                      {week.selesai}
                    </span>
                  </div>
                </div>
              </div>

              {/* Label Minggu */}
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2 text-center truncate w-full">
                {week.label.split(' ')[0]} {week.label.split(' ')[1]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2">
        <span>Rentang minggu berdasarkan tanggal terima & selesai</span>
        <span className="tabular-nums font-mono">Maks: {maxValue} buku</span>
      </div>
    </div>
  );
};

/**
 * 3. Donut Chart Komposisi Status Buku dengan Legenda Berwarna
 */
interface StatusDonutChartProps {
  distribution: StatusDistribution[];
  totalBooks: number;
  onSelectStatus?: (status: string) => void;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  distribution,
  totalBooks,
  onSelectStatus,
}) => {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  // Parameter geometri donat
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Hitung stroke offset kumulatif
  let accumulatedOffset = 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Komposisi Status Progres</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Distribusi {totalBooks} buku dalam alur pengerjaan
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
        {/* SVG Donut */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Lingkaran latar */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth={strokeWidth}
            />

            {/* Segmen donat */}
            {distribution.map((item) => {
              const strokeDasharray = (item.percentage / 100) * circumference;
              const currentOffset = accumulatedOffset;
              accumulatedOffset += strokeDasharray;
              const isSelected = activeStatus === item.status;

              return (
                <circle
                  key={item.status}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${strokeDasharray} ${circumference}`}
                  strokeDashoffset={-currentOffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveStatus(item.status)}
                  onMouseLeave={() => setActiveStatus(null)}
                  onClick={() => onSelectStatus?.(item.status)}
                />
              );
            })}
          </svg>

          {/* Teks di tengah Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {activeStatus
                ? distribution.find((d) => d.status === activeStatus)?.count || totalBooks
                : totalBooks}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 -mt-0.5">
              {activeStatus ? 'Buku' : 'Total Buku'}
            </span>
          </div>
        </div>

        {/* Legenda warna */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {distribution.map((item) => {
            const isHovered = activeStatus === item.status;
            return (
              <div
                key={item.status}
                onMouseEnter={() => setActiveStatus(item.status)}
                onMouseLeave={() => setActiveStatus(null)}
                onClick={() => onSelectStatus?.(item.status)}
                className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 truncate font-medium text-[11px]">
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 tabular-nums text-slate-500 dark:text-slate-400 font-mono text-[11px] shrink-0">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
                  <span className="text-[10px]">({item.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
