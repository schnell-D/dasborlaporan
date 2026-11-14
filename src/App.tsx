/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TabType, BookJob, AuthUser, KeuanganSubTab } from './types';
import { fetchData, MOCK_BOOK_JOBS } from './services/api';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardTab } from './components/DashboardTab';
import { BukuTab } from './components/BukuTab';
import { KeuanganTab } from './components/KeuanganTab';
import { AkunTab } from './components/AkunTab';
import { BookDetailSheet } from './components/BookDetailSheet';
import { LoginScreen } from './components/LoginScreen';
import {
  getSavedAuthUser,
  setSavedAuthUser,
  clearSavedAuthUser,
  getUserSheetUrl,
  setUserSheetUrl,
  getUserMonthlyTarget,
  setUserMonthlyTarget,
  getUserDemoMode,
  setUserDemoMode,
  getUserCustomBooks,
  setUserCustomBooks,
  getUserBookOverrides,
  setUserBookOverrides,
  getSavedTheme,
  setSavedTheme,
  applyCloudUserData,
  migrateLocalUserData,
} from './utils/userStorage';
import {
  fetchUserCloudData,
  subscribeUserCloudData,
  testFirestoreConnection,
  subscribeAuthState,
  signOutFirebase,
  getCachedSheetsAccessToken,
} from './services/firebase';
import {
  requestSheetsAccessToken,
  revokeGoogleAccessToken,
} from './utils/googleAuth';
import {
  EXPECTED_SHEET_COLUMNS,
  generateTemplateCsv,
  downloadFile,
} from './utils/sheetHelpers';
import {
  AlertTriangle,
  RefreshCw,
  X,
  FileSpreadsheet,
  Link as LinkIcon,
  Download,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  // 1. Sesi Pengguna dikelola langsung oleh Firebase Auth (agar Firestore aman & sinkron)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // 2. Access Token Google Sheets API (HANYA DI MEMORI, tidak pernah ke localStorage)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  accessTokenRef.current = accessToken;

  const [isConnectingSheets, setIsConnectingSheets] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [keuanganSubTab, setKeuanganSubTab] = useState<KeuanganSubTab>('ringkasan');
  const [books, setBooks] = useState<BookJob[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filter bulan di Dashboard
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Mode Demo per Pengguna
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Target bulanan per Pengguna
  const [monthlyTarget, setMonthlyTarget] = useState<number>(10);

  // URL Google Sheets Kustom per Pengguna
  const [customDataUrl, setCustomDataUrl] = useState<string>('');

  // Dark Mode Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    return getSavedTheme();
  });

  // Modal & Sheet States
  const [selectedBook, setSelectedBook] = useState<BookJob | null>(null);
  const [initialStatusFilter, setInitialStatusFilter] = useState<string | null>(null);
  const [selectedInvoiceBookId, setSelectedInvoiceBookId] = useState<number | null>(null);

  // Onboarding input state
  const [onboardingUrlInput, setOnboardingUrlInput] = useState<string>('');

  // Efek Sinkronisasi Dark Mode ke DOM
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      setSavedTheme(isDark);
    } catch (e) {
      console.warn('Gagal mengubah tema tampilan:', e);
    }
  }, [isDark]);

  // 0. Uji koneksi awal ke Firestore dan pantau sesi Firebase Auth
  useEffect(() => {
    testFirestoreConnection().catch((err) =>
      console.warn('Uji koneksi Firestore awal:', err)
    );

    const unsubscribeAuth = subscribeAuthState((fbUser) => {
      if (fbUser) {
        // Migrasi data lokal lama jika user sebelumnya login dengan GIS sebelum Firebase Auth
        const prevSaved = getSavedAuthUser();
        if (prevSaved && prevSaved.email === fbUser.email && prevSaved.uid !== fbUser.uid) {
          migrateLocalUserData(prevSaved.uid, fbUser.uid);
        }
        const cached = getCachedSheetsAccessToken();
        if (cached) {
          setAccessToken(cached);
          accessTokenRef.current = cached;
        }
        setSavedAuthUser(fbUser);
        setCurrentUser(fbUser);
      } else {
        clearSavedAuthUser();
        setCurrentUser(null);
        setBooks([]);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // Efek reload preferensi lokal dan sinkronisasi Cloud Firestore lintas perangkat (hanya jika auth siap)
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    // A. Muat preferensi lokal yang sudah ada
    const localSheet = getUserSheetUrl(currentUser.uid);
    setCustomDataUrl(localSheet);
    setMonthlyTarget(getUserMonthlyTarget(currentUser.uid, 10));
    setIsDemoMode(getUserDemoMode(currentUser.uid));

    // B. Ambil data cloud Firestore (agar otomatis terisi saat login di device baru)
    let isMounted = true;
    fetchUserCloudData(currentUser.uid)
      .then((cloudData) => {
        if (!isMounted || !cloudData) return;
        applyCloudUserData(currentUser.uid, cloudData);

        if (cloudData.sheetUrl && cloudData.sheetUrl.trim() !== '') {
          setCustomDataUrl(cloudData.sheetUrl);
        }
        if (cloudData.monthlyTarget !== undefined) {
          setMonthlyTarget(cloudData.monthlyTarget);
        }
        if (cloudData.demoMode !== undefined) {
          setIsDemoMode(cloudData.demoMode);
        }
      })
      .catch((err) => {
        console.warn('Gagal membaca sinkronisasi Firestore:', err);
      });

    // C. Berlangganan pembaruan data real-time antar perangkat
    const unsubscribe = subscribeUserCloudData(currentUser.uid, (cloudData) => {
      if (!isMounted || !cloudData) return;
      applyCloudUserData(currentUser.uid, cloudData);
      if (cloudData.sheetUrl && cloudData.sheetUrl.trim() !== '') {
        setCustomDataUrl((prev) => (prev !== cloudData.sheetUrl ? cloudData.sheetUrl! : prev));
      }
      if (cloudData.monthlyTarget !== undefined) {
        setMonthlyTarget(cloudData.monthlyTarget);
      }
      if (cloudData.demoMode !== undefined) {
        setIsDemoMode(cloudData.demoMode);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isAuthReady, currentUser?.uid]);

  /**
   * Meminta Access Token Google Sheets secara interaktif via Firebase Auth popup (harus dipicu klik pengguna)
   */
  const handleRequestConnectSheets = useCallback(
    async (targetUrlToSave?: string) => {
      if (targetUrlToSave && currentUser) {
        setCustomDataUrl(targetUrlToSave);
        setUserSheetUrl(currentUser.uid, targetUrlToSave);
        setIsDemoMode(false);
        setUserDemoMode(currentUser.uid, false);
      }

      setIsConnectingSheets(true);
      setError(null);
      try {
        const { accessToken: token } = await requestSheetsAccessToken();
        setAccessToken(token);
        accessTokenRef.current = token;
        return token;
      } catch (err: any) {
        console.warn('Otorisasi Google Sheets belum berhasil:', err?.message || err);
        setError(
          err?.message ||
            'Otorisasi Google Sheets dibatalkan. Silakan klik "Hubungkan Google Sheets" untuk mencoba lagi.'
        );
        return null;
      } finally {
        setIsConnectingSheets(false);
      }
    },
    [currentUser]
  );

  /**
   * Memuat data buku dari Google Sheet pribadi via Sheets API v4 atau Data Contoh (Mode Demo)
   */
  const loadData = useCallback(
    async (
      isManualRefresh = false,
      overrideUrl?: string,
      providedToken?: string | null
    ) => {
      if (!currentUser) return;

      const targetUrl = overrideUrl !== undefined ? overrideUrl : customDataUrl;
      const currentToken = providedToken !== undefined ? providedToken : accessTokenRef.current;

      // 1. Jika dalam mode demo eksplisit
      if (isDemoMode && (!targetUrl || targetUrl.trim() === '')) {
        if (isManualRefresh) setIsRefreshing(true);
        else setLoading(true);
        setError(null);

        const customAdded = getUserCustomBooks(currentUser.uid);
        const combined = [...customAdded, ...MOCK_BOOK_JOBS];
        const overrides = getUserBookOverrides(currentUser.uid);
        const merged = combined.map((b) => (overrides[b.no] ? { ...b, ...overrides[b.no] } : b));

        setBooks(merged);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      // 2. Jika belum ada Sheet URL dan bukan mode demo: jangan fallback diam-diam
      if (!targetUrl || targetUrl.trim() === '') {
        setBooks([]);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      // 3. Muat data riil dari Google Sheets
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const rawData = await fetchData(targetUrl, currentToken);

        // Terapkan buku kustom dan overrides milik pengguna saat ini
        const customAdded = getUserCustomBooks(currentUser.uid);
        const combined = [...customAdded, ...rawData];
        const overrides = getUserBookOverrides(currentUser.uid);
        const merged = combined.map((b) => (overrides[b.no] ? { ...b, ...overrides[b.no] } : b));

        setBooks(merged);
      } catch (err: any) {
        console.warn('Gagal memuat data dari sumber:', err?.message || err);
        const errorMsg =
          err?.message ||
          'Gagal memuat data dari Google Sheet. Pastikan akun Google Anda memiliki akses ke file tersebut.';
        setError(errorMsg);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentUser, customDataUrl, isDemoMode]
  );

  // Muat data saat user/url/demo mode berubah
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, customDataUrl, isDemoMode, loadData]);

  // Handler Login
  const handleLogin = (user: AuthUser, token?: string | null) => {
    const prevSaved = getSavedAuthUser();
    if (prevSaved && prevSaved.email === user.email && prevSaved.uid !== user.uid) {
      migrateLocalUserData(prevSaved.uid, user.uid);
    }
    if (token) {
      setAccessToken(token);
      accessTokenRef.current = token;
    }
    setCurrentUser(user);
    setSavedAuthUser(user);
    // Muat data untuk user baru
    const userUrl = getUserSheetUrl(user.uid);
    const userDemo = getUserDemoMode(user.uid);
    setCustomDataUrl(userUrl);
    setIsDemoMode(userDemo);
    setMonthlyTarget(getUserMonthlyTarget(user.uid, 10));
  };

  // Handler Logout
  const handleLogout = async () => {
    if (accessTokenRef.current) {
      await revokeGoogleAccessToken(accessTokenRef.current);
    }
    try {
      await signOutFirebase();
    } catch (err) {
      console.warn('Gagal logout Firebase:', err);
    }
    // Kosongkan state di memori tanpa menghapus data tersimpan milik uid
    setAccessToken(null);
    accessTokenRef.current = null;
    setCurrentUser(null);
    setBooks([]);
    setSelectedBook(null);
    setError(null);
    setIsDemoMode(false);
    clearSavedAuthUser();
  };

  // Handler update atribut buku secara persisten terisolasi ke userStorage
  const handleUpdateBook = (bookNo: number, updates: Partial<BookJob>) => {
    if (!currentUser) return;
    setBooks((prev) => prev.map((b) => (b.no === bookNo ? { ...b, ...updates } : b)));
    setSelectedBook((prev) => (prev && prev.no === bookNo ? { ...prev, ...updates } : prev));

    const overrides = getUserBookOverrides(currentUser.uid);
    overrides[bookNo] = { ...(overrides[bookNo] || {}), ...updates };
    setUserBookOverrides(currentUser.uid, overrides);

    const customAdded = getUserCustomBooks(currentUser.uid);
    if (customAdded.some((b) => b.no === bookNo)) {
      const updatedAdded = customAdded.map((b) => (b.no === bookNo ? { ...b, ...updates } : b));
      setUserCustomBooks(currentUser.uid, updatedAdded);
    }
  };

  // Handler tambah buku baru terisolasi
  const handleAddNewBook = (newBookData: Omit<BookJob, 'no'>) => {
    if (!currentUser) return;
    const nextNo = books.length > 0 ? Math.max(...books.map((b) => b.no)) + 1 : 1;
    const completeBook: BookJob = {
      ...newBookData,
      no: nextNo,
    };

    setBooks((prev) => [completeBook, ...prev]);
    const customAdded = getUserCustomBooks(currentUser.uid);
    customAdded.unshift(completeBook);
    setUserCustomBooks(currentUser.uid, customAdded);
    setSelectedBook(completeBook);
  };

  // Simpan Target Bulanan
  const handleSaveMonthlyTarget = (target: number) => {
    if (!currentUser) return;
    setMonthlyTarget(target);
    setUserMonthlyTarget(currentUser.uid, target);
  };

  // Simpan URL Data Kustom
  const handleSaveCustomDataUrl = (url: string) => {
    if (!currentUser) return;
    const trimmed = url.trim();
    setCustomDataUrl(trimmed);
    setUserSheetUrl(currentUser.uid, trimmed);
    setIsDemoMode(false);
    setUserDemoMode(currentUser.uid, false);
    loadData(false, trimmed);
  };

  // Reset ke Data Contoh (Mode Demo)
  const handleEnableDemoMode = () => {
    if (!currentUser) return;
    setIsDemoMode(true);
    setUserDemoMode(currentUser.uid, true);
    setError(null);
    loadData(false, '');
  };

  // Reset Link Google Sheet
  const handleResetToDefaultData = () => {
    if (!currentUser) return;
    setCustomDataUrl('');
    setUserSheetUrl(currentUser.uid, '');
    setError(null);
    setBooks([]);
  };

  // Unduh Template CSV
  const handleDownloadTemplate = () => {
    const csvContent = generateTemplateCsv();
    downloadFile(csvContent, 'Template_Google_Sheets_Format_20_Kolom.csv');
  };

  // Navigasi ke invoice untuk buku tertentu
  const handleGoToInvoice = (bookId: number) => {
    setSelectedInvoiceBookId(bookId);
    setKeuanganSubTab('invoice');
    setActiveTab('keuangan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hitung buku Stuck
  const stuckCount = books.filter((b) => b.stuck === 'Ya').length;

  // 0. Tampilkan layar muat singkat saat memeriksa sesi Firebase Auth
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Menyiapkan sesi akun Google...</span>
        </div>
      </div>
    );
  }

  // 1. TAMPILKAN HANYA LOGIN SCREEN BILA BELUM LOGIN
  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
      />
    );
  }

  // Cek apakah pengguna memerlukan onboarding link Google Sheet
  const needsOnboarding = !customDataUrl && !isDemoMode && books.length === 0 && !loading;

  return (
    <div className="min-h-screen bg-[#F2F5FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors pb-20 md:pb-8">
      {/* 1. Header Aplikasi */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        stuckCount={stuckCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        isDemoMode={isDemoMode}
      />

      {/* 2. Konten Utama */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-6">
        {/* Banner Otorisasi / Peringatan Error */}
        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Perhatian Akses Google Sheets
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={async () => {
                  const token = await handleRequestConnectSheets();
                  if (token) loadData(true, customDataUrl, token);
                }}
                disabled={isConnectingSheets}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConnectingSheets ? 'animate-spin' : ''}`} />
                <span>Hubungkan Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={handleEnableDemoMode}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Lihat Data Contoh
              </button>

              <button
                type="button"
                onClick={() => setError(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                title="Tutup pesan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ONBOARDING SCREEN jika pengguna baru login dan belum memasukkan link Sheet */}
        {needsOnboarding ? (
          <div className="max-w-3xl mx-auto my-6 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Hubungkan Google Sheet Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                Halo, <strong>{currentUser.name}</strong> ({currentUser.email}). Masukkan link Google Sheet yang berisi data naskah buku Anda untuk mulai memantau alur pengerjaan dan tagihan.
              </p>
            </div>

            {/* Input Link Sheet */}
            <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>Link / URL Google Sheet:</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Google Sheets API v4
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={onboardingUrlInput}
                  onChange={(e) => setOnboardingUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={async () => {
                    const trimmed = onboardingUrlInput.trim();
                    if (!trimmed) return;
                    const token = await handleRequestConnectSheets(trimmed);
                    if (token) {
                      loadData(false, trimmed, token);
                    }
                  }}
                  disabled={!onboardingUrlInput.trim() || isConnectingSheets}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isConnectingSheets ? 'animate-spin' : ''}`} />
                  <span>Hubungkan &amp; Muat</span>
                </button>
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Akses Privat:</strong> Tidak perlu membuat sheet Anda terbuka untuk publik. Cukup akun Google <strong>{currentUser.email}</strong> memiliki izin melihat sheet tersebut.
                </span>
              </div>
            </div>

            {/* Alternatif Opsi: Template atau Mode Demo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Download Template Spreadsheet</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Gunakan template resmi 20 kolom (Rentang A:T) untuk diimpor ke Google Sheets baru Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Form Template (CSV)</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Eksplorasi Data Contoh (Mode Demo)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Lihat dasbor penuh dengan 44 data buku realistis sebelum menghubungkan spreadsheet Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleEnableDemoMode}
                  className="w-full py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Lihat Data Contoh (Mode Demo)</span>
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          /* SKELETON LOADING STATE */
          <div className="space-y-6 animate-pulse">
            <div className="h-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={`skeleton-card-${i}`}
                  className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800" />
              <div className="md:col-span-2 h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800" />
            </div>
          </div>
        ) : (
          /* TAB CONTENT */
          <div>
            {activeTab === 'dashboard' && (
              <DashboardTab
                books={books}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                monthlyTarget={monthlyTarget}
                onTabChange={setActiveTab}
                onOpenSettings={() => setActiveTab('akun')}
                onFilterStatusFromChart={(status) => {
                  setInitialStatusFilter(status);
                }}
              />
            )}

            {activeTab === 'buku' && (
              <BukuTab
                books={books}
                onSelectBook={(book) => setSelectedBook(book)}
                onAddNewBook={handleAddNewBook}
                initialStatusFilter={initialStatusFilter}
                onClearInitialStatusFilter={() => setInitialStatusFilter(null)}
              />
            )}

            {(activeTab === 'keuangan' || activeTab === 'invoice' || activeTab === 'riwayat') && (
              <KeuanganTab
                books={books}
                onSelectBook={(book) => setSelectedBook(book)}
                selectedInvoiceBookId={selectedInvoiceBookId}
                activeSubTab={
                  activeTab === 'invoice'
                    ? 'invoice'
                    : activeTab === 'riwayat'
                    ? 'riwayat'
                    : keuanganSubTab
                }
                onSubTabChange={(sub) => {
                  setKeuanganSubTab(sub);
                  if (activeTab !== 'keuangan') setActiveTab('keuangan');
                }}
                onSelectInvoiceBookId={(id) => setSelectedInvoiceBookId(id)}
                currentUid={currentUser.uid}
              />
            )}

            {activeTab === 'akun' && (
              <AkunTab
                currentUser={currentUser}
                onLogout={handleLogout}
                isDark={isDark}
                onToggleDark={() => setIsDark(!isDark)}
                monthlyTarget={monthlyTarget}
                onSaveMonthlyTarget={handleSaveMonthlyTarget}
                customDataUrl={customDataUrl}
                onSaveCustomDataUrl={handleSaveCustomDataUrl}
                onResetToDefaultData={handleResetToDefaultData}
                books={books}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                accessToken={accessToken}
                onRequestConnectSheets={() => handleRequestConnectSheets(customDataUrl)}
                isConnectingSheets={isConnectingSheets}
                isDemoMode={isDemoMode}
                onEnableDemoMode={handleEnableDemoMode}
              />
            )}
          </div>
        )}
      </main>

      {/* 3. Bottom Sheet / Dialog Detail Buku */}
      <BookDetailSheet
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onUpdateBook={handleUpdateBook}
        currentUid={currentUser?.uid}
      />

      {/* 4. Navigasi Bawah (Mobile Bottom Tabs) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        stuckCount={stuckCount}
      />
    </div>
  );
}
