/**
 * Konfigurasi Autentikasi Google Identity Services (GIS)
 * 
 * PENTING: Masukkan Web Client ID dari Google Cloud Console Anda di bawah ini.
 * Client ID berformat: [ANGKA]-[STRING].apps.googleusercontent.com
 * Client ID adalah kunci publik (bukan rahasia) dan aman digunakan di sisi klien.
 */
export const GOOGLE_CLIENT_ID = "721817220049-t3gkhdmj2143olhp6gk2fht7b5hmmhkv.apps.googleusercontent.com";

/**
 * Link Google Sheet Default
 * Bila diisi, setiap pengguna yang login di perangkat apa pun otomatis membaca sheet ini
 * tanpa harus memasukkan link lagi dari awal saat ganti perangkat/browser.
 */
export const DEFAULT_GOOGLE_SHEET_URL = "";

const CUSTOM_CLIENT_ID_KEY = "schnell_custom_client_id";

/**
 * Mendapatkan Client ID Google yang aktif:
 * 1. Prioritas utama: Nilai di GOOGLE_CLIENT_ID (bila bukan placeholder)
 * 2. Cadangan: Nilai yang diinput pengguna di antarmuka (tersimpan di localStorage)
 */
export function getGoogleClientId(): string {
  const constantId = (GOOGLE_CLIENT_ID || "").trim();
  if (
    constantId !== "" &&
    !constantId.includes("ISI_CLIENT_ID_DI_SINI") &&
    constantId.includes(".apps.googleusercontent.com")
  ) {
    return constantId;
  }

  try {
    const saved = localStorage.getItem(CUSTOM_CLIENT_ID_KEY);
    if (saved && saved.trim().includes(".apps.googleusercontent.com")) {
      return saved.trim();
    }
  } catch {
    // ignore
  }

  return constantId;
}

/**
 * Menyimpan Client ID kustom yang diinput oleh pengguna di antarmuka
 */
export function saveCustomGoogleClientId(clientId: string): void {
  try {
    localStorage.setItem(CUSTOM_CLIENT_ID_KEY, clientId.trim());
  } catch (err) {
    console.warn("Gagal menyimpan Client ID kustom:", err);
  }
}

/**
 * Memeriksa apakah Client ID Google telah dikonfigurasi dengan nilai riil
 */
export function isGoogleClientIdConfigured(): boolean {
  const id = getGoogleClientId();
  return (
    id !== "" &&
    !id.includes("ISI_CLIENT_ID_DI_SINI") &&
    id.includes(".apps.googleusercontent.com")
  );
}
