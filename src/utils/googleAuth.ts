import {
  requestSheetsTokenViaFirebase,
  clearCachedSheetsAccessToken,
} from '../services/firebase';

/**
 * Meminta token akses Google Sheets API melalui Firebase Auth OAuth
 * sehingga tidak bergantung pada origin GIS manual dan tidak memicu origin_mismatch saat publish.
 */
export async function requestSheetsAccessToken(): Promise<{
  accessToken: string;
}> {
  try {
    const accessToken = await requestSheetsTokenViaFirebase();
    return { accessToken };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-blocked') {
      throw new Error(
        'Popup otorisasi Google diblokir oleh browser. Mohon izinkan pop-up untuk situs ini lalu klik "Hubungkan Google Sheets" lagi.'
      );
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error('Jendela otorisasi Google ditutup sebelum selesai.');
    }
    throw new Error(err?.message || 'Gagal menghubungkan ke Google Sheets. Silakan coba lagi.');
  }
}

/**
 * Membersihkan access token Google Sheets dari memori saat pengguna keluar
 */
export async function revokeGoogleAccessToken(_accessToken?: string): Promise<void> {
  clearCachedSheetsAccessToken();
}
