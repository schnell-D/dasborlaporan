/**
 * Helper penyimpanan data lokal yang terisolasi per akun pengguna (u:${uid}:${key})
 * Dilengkapi try/catch menyeluruh agar aplikasi tahan jika storage diblokir oleh browser.
 */

import { AuthUser, BookJob, RevisionNote } from '../types';
import { DEFAULT_GOOGLE_SHEET_URL } from '../config';
import { saveUserCloudData, SyncedUserData } from '../services/firebase';

/**
 * Membaca nilai dari localStorage secara aman dengan try/catch
 */
export function safeGetStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`Gagal membaca storage untuk key "${key}":`, err);
    return null;
  }
}

/**
 * Menyimpan nilai ke localStorage secara aman dengan try/catch
 */
export function safeSetStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`Gagal menulis storage untuk key "${key}":`, err);
  }
}

/**
 * Menghapus nilai dari localStorage secara aman dengan try/catch
 */
export function safeRemoveStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Gagal menghapus storage untuk key "${key}":`, err);
  }
}

/**
 * Membaca item spesifik untuk UID pengguna tertentu
 */
export function getUserItem<T>(uid: string, key: string, defaultValue: T): T {
  if (!uid) return defaultValue;
  const storageKey = `u:${uid}:${key}`;
  const raw = safeGetStorage(storageKey);
  if (raw === null || raw === undefined) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return (raw as unknown) as T;
  }
}

/**
 * Menyimpan item spesifik untuk UID pengguna tertentu
 */
export function setUserItem<T>(uid: string, key: string, value: T): void {
  if (!uid) return;
  const storageKey = `u:${uid}:${key}`;
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    safeSetStorage(storageKey, serialized);
  } catch (err) {
    console.warn(`Gagal menyimpan user item ${storageKey}:`, err);
  }
}

/**
 * Menghapus item spesifik untuk UID pengguna tertentu
 */
export function removeUserItem(uid: string, key: string): void {
  if (!uid) return;
  const storageKey = `u:${uid}:${key}`;
  safeRemoveStorage(storageKey);
}

// ============================================================================
// Helper Fungsi Spesifik untuk Tiap Domain Data
// ============================================================================

const SESSION_USER_KEY = 'schnell_auth_user';

/**
 * Sesi Pengguna Tersimpan (Profil saja, BUKAN token akses)
 */
export function getSavedAuthUser(): AuthUser | null {
  const raw = safeGetStorage(SESSION_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSavedAuthUser(user: AuthUser): void {
  try {
    safeSetStorage(SESSION_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('Gagal menyimpan sesi auth user:', err);
  }
}

export function clearSavedAuthUser(): void {
  safeRemoveStorage(SESSION_USER_KEY);
}

/**
 * URL Google Sheets Kustom per Pengguna
 */
export function getUserSheetUrl(uid: string): string {
  const saved = getUserItem<string>(uid, 'rgp_custom_data_url', '');
  if (saved && saved.trim() !== '') return saved.trim();
  return (DEFAULT_GOOGLE_SHEET_URL || '').trim();
}

export function setUserSheetUrl(uid: string, url: string): void {
  setUserItem<string>(uid, 'rgp_custom_data_url', url);
  if (uid) {
    saveUserCloudData(uid, { sheetUrl: url }).catch((err) =>
      console.warn('Gagal sinkron sheetUrl ke Firestore:', err)
    );
  }
}

/**
 * Target Buku Bulanan per Pengguna
 */
export function getUserMonthlyTarget(uid: string, defaultTarget = 10): number {
  const val = getUserItem<number>(uid, 'rgp_monthly_target', defaultTarget);
  return typeof val === 'number' && !isNaN(val) && val > 0 ? val : defaultTarget;
}

export function setUserMonthlyTarget(uid: string, target: number): void {
  setUserItem<number>(uid, 'rgp_monthly_target', target);
  if (uid) {
    saveUserCloudData(uid, { monthlyTarget: target }).catch((err) =>
      console.warn('Gagal sinkron monthlyTarget ke Firestore:', err)
    );
  }
}

/**
 * Mode Demo per Pengguna (bila pengguna secara sadar memilih 'Lihat data contoh')
 */
export function getUserDemoMode(uid: string): boolean {
  return getUserItem<boolean>(uid, 'schnell_demo_mode', false);
}

export function setUserDemoMode(uid: string, isDemo: boolean): void {
  setUserItem<boolean>(uid, 'schnell_demo_mode', isDemo);
  if (uid) {
    saveUserCloudData(uid, { demoMode: isDemo }).catch((err) =>
      console.warn('Gagal sinkron demoMode ke Firestore:', err)
    );
  }
}

/**
 * Buku Kustom Tambahan per Pengguna
 */
export function getUserCustomBooks(uid: string): BookJob[] {
  return getUserItem<BookJob[]>(uid, 'schnell_custom_added_books', []);
}

export function setUserCustomBooks(uid: string, books: BookJob[]): void {
  setUserItem<BookJob[]>(uid, 'schnell_custom_added_books', books);
}

/**
 * Perubahan Atribut Buku (Overrides) per Pengguna
 */
export function getUserBookOverrides(uid: string): Record<number, Partial<BookJob>> {
  return getUserItem<Record<number, Partial<BookJob>>>(uid, 'schnell_book_overrides', {});
}

export function setUserBookOverrides(uid: string, overrides: Record<number, Partial<BookJob>>): void {
  setUserItem<Record<number, Partial<BookJob>>>(uid, 'schnell_book_overrides', overrides);
  if (uid) {
    saveUserCloudData(uid, { bookOverrides: overrides }).catch((err) =>
      console.warn('Gagal sinkron bookOverrides ke Firestore:', err)
    );
  }
}

/**
 * Status Dummy Cetak Buku per Pengguna
 */
export function getUserDummyStatus(uid: string, bookNo: number): string {
  return getUserItem<string>(uid, `schnell_dummy_status_${bookNo}`, 'tidak_ada');
}

export function setUserDummyStatus(uid: string, bookNo: number, status: string): void {
  setUserItem<string>(uid, `schnell_dummy_status_${bookNo}`, status);
  if (uid) {
    const current = getUserItem<Record<number, string>>(uid, 'schnell_all_dummy_statuses', {});
    current[bookNo] = status;
    setUserItem<Record<number, string>>(uid, 'schnell_all_dummy_statuses', current);
    saveUserCloudData(uid, { dummyStatuses: current }).catch((err) =>
      console.warn('Gagal sinkron dummyStatuses ke Firestore:', err)
    );
  }
}

/**
 * Catatan Track Record Buku per Pengguna
 */
export function getUserBookNotes(uid: string, bookNo: number): RevisionNote[] {
  return getUserItem<RevisionNote[]>(uid, `schnell_book_notes_${bookNo}`, []);
}

export function setUserBookNotes(uid: string, bookNo: number, notes: RevisionNote[]): void {
  setUserItem<RevisionNote[]>(uid, `schnell_book_notes_${bookNo}`, notes);
  if (uid) {
    const current = getUserItem<Record<number, RevisionNote[]>>(uid, 'schnell_all_book_notes', {});
    current[bookNo] = notes;
    setUserItem<Record<number, RevisionNote[]>>(uid, 'schnell_all_book_notes', current);
    saveUserCloudData(uid, { bookNotes: current }).catch((err) =>
      console.warn('Gagal sinkron bookNotes ke Firestore:', err)
    );
  }
}

/**
 * Preferensi Tema Tampilan Global (Light / Dark)
 */
export function getSavedTheme(): boolean {
  const saved = safeGetStorage('rgp_theme');
  if (saved) return saved === 'dark';
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function setSavedTheme(isDark: boolean): void {
  safeSetStorage('rgp_theme', isDark ? 'dark' : 'light');
}

/**
 * Tarif Paket Layout per Halaman (untuk fitur Estimasi Biaya Layout Buku)
 */
export interface PackageRates {
  Basic: number;
  Standart: number;
  Premium: number;
}

export const DEFAULT_PACKAGE_RATES: PackageRates = {
  Basic: 5000,
  Standart: 7500,
  Premium: 10000,
};

export function getUserPackageRates(uid: string): PackageRates {
  return getUserItem<PackageRates>(uid, 'schnell_package_rates', DEFAULT_PACKAGE_RATES);
}

export function setUserPackageRates(uid: string, rates: PackageRates): void {
  setUserItem<PackageRates>(uid, 'schnell_package_rates', rates);
  if (uid) {
    saveUserCloudData(uid, { packageRates: rates }).catch((err) =>
      console.warn('Gagal sinkron packageRates ke Firestore:', err)
    );
  }
}

/**
 * Menerapkan data cloud Firestore ke penyimpanan lokal
 */
export function applyCloudUserData(uid: string, data: SyncedUserData): void {
  if (!uid || !data) return;
  if (data.sheetUrl !== undefined && data.sheetUrl !== null) {
    setUserItem<string>(uid, 'rgp_custom_data_url', data.sheetUrl);
  }
  if (data.monthlyTarget !== undefined && data.monthlyTarget !== null) {
    setUserItem<number>(uid, 'rgp_monthly_target', data.monthlyTarget);
  }
  if (data.demoMode !== undefined && data.demoMode !== null) {
    setUserItem<boolean>(uid, 'schnell_demo_mode', data.demoMode);
  }
  if (data.packageRates !== undefined && data.packageRates !== null) {
    setUserItem<PackageRates>(uid, 'schnell_package_rates', data.packageRates);
  }
  if (data.bookOverrides !== undefined && data.bookOverrides !== null) {
    setUserItem<Record<number, Partial<BookJob>>>(uid, 'schnell_book_overrides', data.bookOverrides);
  }
  if (data.dummyStatuses) {
    setUserItem<Record<number, string>>(uid, 'schnell_all_dummy_statuses', data.dummyStatuses);
    Object.entries(data.dummyStatuses).forEach(([k, v]) => {
      setUserItem<string>(uid, `schnell_dummy_status_${k}`, String(v));
    });
  }
  if (data.bookNotes) {
    setUserItem<Record<number, RevisionNote[]>>(uid, 'schnell_all_book_notes', data.bookNotes);
    Object.entries(data.bookNotes).forEach(([k, v]) => {
      setUserItem<RevisionNote[]>(uid, `schnell_book_notes_${k}`, v as RevisionNote[]);
    });
  }
}

/**
 * Migrasi data lokal dari UID lama (sebelum Firebase Auth) ke UID Firebase Auth baru
 */
export function migrateLocalUserData(oldUid: string, newUid: string): void {
  if (!oldUid || !newUid || oldUid === newUid) return;

  const oldUrl = getUserItem<string>(oldUid, 'rgp_custom_data_url', '');
  const newUrl = getUserItem<string>(newUid, 'rgp_custom_data_url', '');
  if (oldUrl && !newUrl) {
    setUserSheetUrl(newUid, oldUrl);
  }

  const oldTarget = getUserItem<number>(oldUid, 'rgp_monthly_target', 0);
  const newTarget = getUserItem<number>(newUid, 'rgp_monthly_target', 0);
  if (oldTarget > 0 && !newTarget) {
    setUserMonthlyTarget(newUid, oldTarget);
  }

  const oldOverrides = getUserItem<Record<number, Partial<BookJob>>>(oldUid, 'schnell_book_overrides', {});
  const newOverrides = getUserItem<Record<number, Partial<BookJob>>>(newUid, 'schnell_book_overrides', {});
  if (Object.keys(oldOverrides).length > 0 && Object.keys(newOverrides).length === 0) {
    setUserBookOverrides(newUid, oldOverrides);
  }

  const oldRates = getUserItem<PackageRates | null>(oldUid, 'schnell_package_rates', null);
  const newRates = getUserItem<PackageRates | null>(newUid, 'schnell_package_rates', null);
  if (oldRates && !newRates) {
    setUserPackageRates(newUid, oldRates);
  }

  const oldDummy = getUserItem<Record<number, string>>(oldUid, 'schnell_all_dummy_statuses', {});
  if (Object.keys(oldDummy).length > 0) {
    Object.entries(oldDummy).forEach(([bookNo, status]) => {
      setUserDummyStatus(newUid, Number(bookNo), String(status));
    });
  }

  const oldNotes = getUserItem<Record<number, RevisionNote[]>>(oldUid, 'schnell_all_book_notes', {});
  if (Object.keys(oldNotes).length > 0) {
    Object.entries(oldNotes).forEach(([bookNo, notes]) => {
      setUserBookNotes(newUid, Number(bookNo), notes as RevisionNote[]);
    });
  }
}
