import React, { useState } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Target,
  FileSpreadsheet,
  Settings,
  BookOpen,
  Wallet,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Download,
  Check,
  Link,
  RotateCcw,
} from 'lucide-react';
import { AuthUser, BookJob, TabType } from '../types';
import { formatRupiah } from '../utils/formatters';
import {
  EXPECTED_SHEET_COLUMNS,
  generateTemplateCsv,
  exportBooksToCsv,
  downloadFile,
} from '../utils/sheetHelpers';

interface AkunTabProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  monthlyTarget: number;
  onSaveMonthlyTarget: (target: number) => void;
  customDataUrl: string;
  onSaveCustomDataUrl?: (url: string) => void;
  onResetToDefaultData?: () => void;
  onOpenSettings?: () => void;
  books: BookJob[];
  onTabChange: (tab: TabType) => void;
  accessToken?: string | null;
  onRequestConnectSheets?: () => void;
  isConnectingSheets?: boolean;
  isDemoMode?: boolean;
  onEnableDemoMode?: () => void;
}

export const AkunTab: React.FC<AkunTabProps> = ({
  currentUser,
  onLogout,
  isDark,
  onToggleDark,
  monthlyTarget,
  onSaveMonthlyTarget,
  customDataUrl,
  onSaveCustomDataUrl,
  onResetToDefaultData,
  onOpenSettings,
  books,
  onTabChange,
  accessToken,
  onRequestConnectSheets,
  isConnectingSheets = false,
  isDemoMode = false,
  onEnableDemoMode,
}) => {
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState<number>(monthlyTarget);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState<string>(customDataUrl || '');
  const [urlSavedFeedback, setUrlSavedFeedback] = useState(false);

  React.useEffect(() => {
    setSheetUrlInput(customDataUrl || '');
  }, [customDataUrl]);

  // Statistik Ringkas Akun
  const totalJudul = books.length;
  const selesaiJudul = books.filter((b) => b.statusProgres === 'Selesai').length;
  const lunasNominal = books
    .filter((b) => b.statusBayar === 'Lunas')
    .reduce((sum, b) => sum + b.nilaiJasa, 0);
  const totalNominal = books.reduce((sum, b) => sum + b.nilaiJasa, 0);
  const stuckCount = books.filter((b) => b.stuck === 'Ya').length;

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput > 0) {
      onSaveMonthlyTarget(targetInput);
      setIsEditingTarget(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* 1. Kartu Profil Utama Akun */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Dekorasi Aksen Latar */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
          {/* Avatar Google Profile */}
          <div className="relative shrink-0">
            {currentUser?.photoUrl ? (
              <img
                src={currentUser.photoUrl}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-blue-500/20 shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
                {currentUser?.name?.charAt(0) || 'S'}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center"
              title="Sesi Aktif"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </span>
          </div>

          {/* Info Detail Akun */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentUser?.name || 'Schnell Desain'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Google Verified</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{currentUser?.email || 'schnell.desain@gmail.com'}</span>
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Peran: <strong>Desainer Utama & Admin Billing</strong>
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                Status: <strong>Online &amp; Terotorisasi</strong>
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>Cloud Sync: <strong>Firestore Aktif</strong></span>
              </span>
            </div>
          </div>

          {/* Tombol Logout Cepat */}
          <div className="shrink-0 self-center sm:self-start">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>

        {/* Statistik Ringkas Akun */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL BUKU
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
              {totalJudul} Judul
            </span>
            <span className="text-[10px] text-slate-500">{selesaiJudul} selesai dikerjakan</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL NILAI JASA
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 block">
              {formatRupiah(totalNominal)}
            </span>
            <span className="text-[10px] text-slate-500">Nilai proyek tercatat</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              PENDAPATAN LUNAS
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {formatRupiah(lunasNominal)}
            </span>
            <span className="text-[10px] text-slate-500">Dana sudah diterima</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              BUKU KENDALA (STUCK)
            </span>
            <span className={`text-lg sm:text-xl font-extrabold mt-0.5 block ${stuckCount > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
              {stuckCount} Buku
            </span>
            <span className="text-[10px] text-slate-500">{stuckCount > 0 ? 'Perlu follow-up' : 'Semua lancar'}</span>
          </div>
        </div>
      </div>

      {/* 2. Preferensi Akun & Tampilan */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Preferensi & Personalisasi Akun</span>
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* Mode Tampilan Gelap / Terang */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Tema Tampilan Dasbor
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih tampilan {isDark ? 'Mode Gelap (Dark Mode)' : 'Mode Terang (Light Mode)'} sesuai kenyamanan Anda
              </div>
            </div>

            <button
              onClick={onToggleDark}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                isDark
                  ? 'bg-slate-800 text-amber-400 border-slate-700 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Mode Gelap Aktif</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span>Mode Terang Aktif</span>
                </>
              )}
            </button>
          </div>

          {/* Target Produksi Bulanan */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Target Produksi Buku Bulanan</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Acuan indikator pencapaian di kartu Target Bulanan pada Dashboard
              </div>
            </div>

            {isEditingTarget ? (
              <form onSubmit={handleSaveTarget} className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={targetInput}
                  onChange={(e) => setTargetInput(parseInt(e.target.value, 10) || 1)}
                  className="w-20 px-3 py-1.5 rounded-xl border border-blue-500 bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-900 dark:text-white text-center focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTarget(false)}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                  {monthlyTarget} Buku / Bulan
                </span>
                <button
                  onClick={() => {
                    setTargetInput(monthlyTarget);
                    setIsEditingTarget(true);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Ubah
                </button>
              </div>
            )}
          </div>

          {/* Integrasi Sumber Data Google Sheets Langsung di Akun */}
          <div className="py-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Integrasi Data Google Sheets Pribadi</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Akses data spreadsheet langsung dari akun Google Anda via Google Sheets API v4
                </div>
              </div>

              {/* Status Otorisasi Token GIS */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {accessToken ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Otorisasi Sheets Aktif</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <span>Otorisasi Belum Aktif</span>
                  </span>
                )}

                {onRequestConnectSheets && (
                  <button
                    type="button"
                    onClick={onRequestConnectSheets}
                    disabled={isConnectingSheets}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isConnectingSheets ? 'animate-spin' : ''}`} />
                    <span>{accessToken ? 'Perbarui Izin' : 'Hubungkan Google Sheets'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Input URL Spreadsheet */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-blue-500" />
                  <span>Link / URL Google Sheet Anda:</span>
                </span>
                <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  Google Sheets / API
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    onSaveCustomDataUrl?.(sheetUrlInput.trim());
                    setUrlSavedFeedback(true);
                    setTimeout(() => setUrlSavedFeedback(false), 2000);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                >
                  {urlSavedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersimpan!</span>
                    </>
                  ) : (
                    <span>Simpan &amp; Muat</span>
                  )}
                </button>
              </div>

              {/* Teks Bantuan Privasi Google Sheets */}
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <p>
                  <strong>Akses Aman &amp; Privat:</strong> Anda <em>tidak perlu</em> lagi mengatur berbagi spreadsheet ke publik (&quot;Siapa saja yang memiliki link&quot;). Cukup akun Google Anda yang sedang login (<strong>{currentUser?.email || 'akun Anda'}</strong>) memiliki akses ke sheet tersebut.
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Tab utama bernama <strong className="text-slate-700 dark:text-slate-300">&quot;Data Dasbor&quot;</strong> (atau sheet lembar pertama).
                </p>
              </div>
            </div>

            {/* Format 20 Kolom & Unduh Template */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Format Kolom Google Sheets (20 Kolom):</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Rentang A:T
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-[10.5px] font-mono text-slate-700 dark:text-slate-300 leading-relaxed break-words select-all">
                {EXPECTED_SHEET_COLUMNS.join(', ')}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const csvContent = generateTemplateCsv();
                    downloadFile(csvContent, 'Template_Google_Sheets_Format_20_Kolom.csv');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Form Template (CSV)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const csvContent = exportBooksToCsv(books);
                    downloadFile(csvContent, 'Contoh_Data_Google_Sheets_Schnell.csv');
                  }}
                  className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download Contoh Data</span>
                </button>

                {onResetToDefaultData && (
                  <button
                    type="button"
                    onClick={() => {
                      setSheetUrlInput('');
                      onResetToDefaultData();
                    }}
                    className="py-2 px-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    title="Kosongkan link dan muat ulang"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Link</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tombol Beralih Mode Demo Bila Diperlukan */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Status Data Saat Ini:{' '}
                <strong className={isDemoMode ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}>
                  {isDemoMode ? 'Mode Demo (Data Contoh)' : customDataUrl ? 'Google Sheets Pribadi' : 'Menunggu Google Sheet'}
                </strong>
              </span>

              {onEnableDemoMode && !isDemoMode && (
                <button
                  type="button"
                  onClick={onEnableDemoMode}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors self-start sm:self-auto"
                >
                  Lihat Data Contoh (Mode Demo)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pintasan Navigasi Cepat Akun */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onTabChange('dashboard')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-left hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
        >
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-sm text-slate-900 dark:text-white">Buka Dashboard</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Lihat grafik produksi & status 11 tahap
          </div>
        </button>

        <button
          onClick={() => onTabChange('buku')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-left hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-sm text-slate-900 dark:text-white">Katalog & Naskah Buku</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola judul, penulis, ISBN & revisi
          </div>
        </button>

        <button
          onClick={() => onTabChange('keuangan')}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-left hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
        >
          <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-sm text-slate-900 dark:text-white">Keuangan & Invoice</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Faktur cetak & pemantauan piutang
          </div>
        </button>
      </div>

      {/* 4. Keamanan & Kebijakan Privasi Sesi */}
      <div className="bg-slate-100/70 dark:bg-slate-800/40 rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Keamanan Sesi & Perlindungan Data</span>
        </div>
        <p className="leading-relaxed">
          Akun Anda diautentikasi langsung melalui <strong>Google Identity Services</strong>. Data laporan buku, nomor ISBN, tarif naskah, dan invoice disimpan secara privat dan hanya dapat diakses saat sesi akun ini aktif.
        </p>
      </div>

      {/* Dialog Konfirmasi Keluar */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Keluar Akun
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apakah Anda yakin ingin keluar dari akun <strong>{currentUser?.email}</strong>? Seluruh data sesi di memori akan dibersihkan.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
