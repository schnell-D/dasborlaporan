import React, { useState } from 'react';
import {
  X,
  Target,
  Link,
  RotateCcw,
  Check,
  FileSpreadsheet,
  Download,
  Info,
} from 'lucide-react';
import { BookJob } from '../types';
import {
  EXPECTED_SHEET_COLUMNS,
  generateTemplateCsv,
  exportBooksToCsv,
  downloadFile,
} from '../utils/sheetHelpers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyTarget: number;
  onSaveMonthlyTarget: (target: number) => void;
  customDataUrl: string;
  onSaveCustomDataUrl: (url: string) => void;
  onResetToDefaultData: () => void;
  books?: BookJob[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  monthlyTarget,
  onSaveMonthlyTarget,
  customDataUrl,
  onSaveCustomDataUrl,
  onResetToDefaultData,
  books = [],
}) => {
  if (!isOpen) return null;

  const [targetInput, setTargetInput] = useState(monthlyTarget.toString());
  const [urlInput, setUrlInput] = useState(customDataUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseInt(targetInput, 10);
    if (!isNaN(parsedTarget) && parsedTarget > 0) {
      onSaveMonthlyTarget(parsedTarget);
    }
    onSaveCustomDataUrl(urlInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const handleReset = () => {
    setUrlInput('');
    onResetToDefaultData();
    onClose();
  };

  // Unduh Form Template Google Sheets (CSV)
  const handleDownloadTemplate = () => {
    const csvContent = generateTemplateCsv();
    downloadFile(csvContent, 'Template_Google_Sheets_Format_20_Kolom.csv');
  };

  // Unduh Contoh Sheet Data Realtime
  const handleDownloadExample = () => {
    const csvContent = exportBooksToCsv(books);
    downloadFile(csvContent, 'Contoh_Data_Google_Sheets_Schnell.csv');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 z-10 space-y-5 my-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Pengaturan Dasbor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sesuaikan target bulanan dan sumber data Google Sheets / API
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

        <form onSubmit={handleSave} className="space-y-5">
          {/* 1. Target Buku Selesai */}
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-1.5">
              <span>Target Buku Selesai Per Bulan:</span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                Bawaan: 10 buku
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">
                judul / bln
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Angka ini menentukan indikator performa pada gauge di Tab Dashboard.
            </p>
          </div>

          {/* 2. Sumber Data Google Sheets / API */}
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-blue-500" />
                <span>URL Data JSON Kustom (Opsional):</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                Google Sheets / API (di sini)
              </span>
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit atau URL JSON API"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent placeholder:text-slate-400"
            />
            <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p>
                <strong>Tautan Google Sheets:</strong> Cukup salin dan tempel link spreadsheet Anda di atas. Pastikan akses Google Sheet disetel ke: <span className="text-slate-800 dark:text-slate-200 font-semibold">"Siapa saja yang memiliki link (Pelihat / Viewer)"</span> dan tab bernama <span className="text-slate-800 dark:text-slate-200 font-semibold">"Data Dasbor"</span>.
              </p>
              <p className="text-slate-400">
                Bila dikosongkan, aplikasi otomatis memakai 44 baris data contoh realistis.
              </p>
            </div>
          </div>

          {/* 3. Format Kolom Google Sheets & Tombol Download Template */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Format Kolom Google Sheets (20 Kolom):</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Rentang A:T
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Pastikan baris pertama (header) di Google Sheet Anda menggunakan urutan 20 nama kolom berikut:
            </p>

            {/* List 20 Kolom */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-[10.5px] font-mono text-slate-700 dark:text-slate-300 leading-relaxed break-words select-all">
              {EXPECTED_SHEET_COLUMNS.join(', ')}
            </div>

            {/* Tombol Unduh Form Template & Contoh Sheet */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                title="Download template kosong 20 kolom untuk dimasukkan ke Google Sheets"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Form Template (CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadExample}
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-colors"
                title="Download contoh data buku saat ini berformat 20 kolom"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Download Contoh Data</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Contoh</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
