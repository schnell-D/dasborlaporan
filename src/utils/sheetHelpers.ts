import { BookJob, KategoriType, PaketType, StatusProgresType, StatusBayarType } from '../types';

/**
 * 20 Kolom Standar Google Sheets sesuai spesifikasi:
 * No, Judul, Penulis, Kategori, Paket, Status Progres, Tgl Terima, Tgl Selesai Layout,
 * Update Terakhir, Hari Berjalan, Halaman Awal, Halaman Final, Stuck, Nilai Jasa,
 * Status Bayar, Tgl Invoice, Tgl Dibayar, Umur Piutang, Catatan Belum Selesai, Lama Layout Awal
 */
export const EXPECTED_SHEET_COLUMNS: readonly string[] = [
  'No',
  'Judul',
  'Penulis',
  'Kategori',
  'Paket',
  'Status Progres',
  'Tgl Terima',
  'Tgl Selesai Layout',
  'Update Terakhir',
  'Hari Berjalan',
  'Halaman Awal',
  'Halaman Final',
  'Stuck',
  'Nilai Jasa',
  'Status Bayar',
  'Tgl Invoice',
  'Tgl Dibayar',
  'Umur Piutang',
  'Catatan Belum Selesai',
  'Lama Layout Awal',
] as const;

/**
 * Ekstrak Spreadsheet ID dari link Google Sheets secara aman dan tepat
 */
export function extractSpreadsheetId(inputUrl: string): string | null {
  const trimmed = inputUrl.trim();
  if (!trimmed) return null;

  // Format 1: Published sheets https://docs.google.com/spreadsheets/d/e/{PUBLISHED_ID}/...
  const matchPublished = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (matchPublished && matchPublished[1]) {
    return matchPublished[1];
  }

  // Format 2: Standard sheets https://docs.google.com/spreadsheets/d/{ID}/... (pastikan ID bukan 'e')
  const matchStandard = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (matchStandard && matchStandard[1] && matchStandard[1] !== 'e') {
    return matchStandard[1];
  }

  // Format 3: Raw ID (alphanumeric with hyphens/underscores, >= 20 chars)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Bangun URL ekspor CSV publik Google Sheets untuk nama tab tertentu
 */
export function buildGoogleSheetCsvUrl(spreadsheetId: string, sheetTabName: string = 'Data Dasbor'): string {
  const encodedTab = encodeURIComponent(sheetTabName.trim() || 'Data Dasbor');
  if (spreadsheetId.startsWith('2PACX-')) {
    return `https://docs.google.com/spreadsheets/d/e/${spreadsheetId}/pub?output=csv&sheet=${encodedTab}`;
  }
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodedTab}`;
}

/**
 * Parse teks CSV sederhana namun tangguh mengikuti RFC 4180
 * Menangani quotes yang mengandung koma atau baris baru
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuote = false;

  const cleaned = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const nextChar = cleaned[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentCell += '"';
        i++; // lewati quote ganda
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !insideQuote) {
      currentRow.push(currentCell.trim());
      // Hanya simpan baris yang tidak sepenuhnya kosong
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export interface ParseResult {
  success: boolean;
  books?: BookJob[];
  missingColumns?: string[];
  foundColumns?: string[];
  errorMessage?: string;
}

/**
 * Normalisasi nama header kolom: hapus semua spasi, underscore, strip, tanda kurung, dan titik
 */
function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_\-()./#]+/g, '');
}

/**
 * Sinonim & alias untuk setiap kolom yang diharapkan agar parsing toleran terhadap variasi penamaan
 */
export const COLUMN_SYNONYMS: Record<string, string[]> = {
  'No': ['no', 'nomor', 'num', 'number', 'id', 'nomer', 'angka', 'kode'],
  'Judul': ['judul', 'judulbuku', 'title', 'namabuku', 'buku', 'judulnaskah', 'naskah'],
  'Penulis': ['penulis', 'author', 'namapenulis', 'pengarang', 'namaauthor', 'writer'],
  'Kategori': ['kategori', 'category', 'genre', 'tipekategori', 'jenis', 'bidang', 'jenisliteratur'],
  'Paket': ['paket', 'package', 'tipepaket', 'namapaket', 'layanan', 'jenispaket'],
  'Status Progres': [
    'statusprogres',
    'statusprogress',
    'status',
    'progres',
    'progress',
    'statusproyek',
    'statuspekerjaan',
    'posisiterakhir',
    'posisi',
  ],
  'Tgl Terima': [
    'tglterima',
    'tanggalterima',
    'tglmasuk',
    'tanggalmasuk',
    'receiveddate',
    'tglterimanaskah',
    'terima',
    'tglorder',
    'tanggalorder',
    'tglmasuknaskah',
  ],
  'Tgl Selesai Layout': [
    'tglselesailayout',
    'tglselesai',
    'tanggalselesai',
    'selesailayout',
    'layoutselesai',
    'enddate',
    'tglkeluar',
    'tanggallayoutselesai',
    'tglfinishing',
  ],
  'Update Terakhir': [
    'updateterakhir',
    'terakhirupdate',
    'lastupdate',
    'tglupdate',
    'tanggalupdate',
    'update',
    'modified',
    'perubahanterakhir',
  ],
  'Hari Berjalan': [
    'hariberjalan',
    'hari',
    'haripengerjaan',
    'lamahari',
    'days',
    'harikerja',
    'hariproses',
    'totalhari',
    'durasi',
  ],
  'Halaman Awal': [
    'halamanawal',
    'halawal',
    'estimasihalaman',
    'halamanestimasi',
    'halest',
    'estimasi',
    'awal',
    'halmula',
    'estimasihal',
    'halamandraft',
  ],
  'Halaman Final': [
    'halamanfinal',
    'halfinal',
    'halamantotal',
    'totalhalaman',
    'halaman',
    'final',
    'hal',
    'haljadi',
    'totalhal',
    'halamancetak',
  ],
  'Stuck': [
    'stuck',
    'terkendala',
    'macet',
    'is_stuck',
    'kendala',
    'pending',
    'hambatan',
    'trouble',
    'statusstuck',
  ],
  'Nilai Jasa': [
    'nilaijasa',
    'jasa',
    'biayajasa',
    'biaya',
    'tarif',
    'harga',
    'nominal',
    'totalbiaya',
    'fee',
    'nilaitransaksi',
    'tagihan',
    'hargajasa',
  ],
  'Status Bayar': [
    'statusbayar',
    'statuspembayaran',
    'bayar',
    'pembayaran',
    'paymentstatus',
    'statusinvoice',
    'statustagihan',
    'kondisibayar',
  ],
  'Tgl Invoice': [
    'tglinvoice',
    'tanggalinvoice',
    'tglfaktur',
    'invoicedate',
    'tgl_tagihan',
    'tanggaltagihan',
    'invoice',
  ],
  'Tgl Dibayar': [
    'tgldibayar',
    'tanggaldibayar',
    'tglbayar',
    'tgllunas',
    'paiddate',
    'tanggallunas',
    'lunas',
    'tglpelunasan',
    'waktubayar',
  ],
  'Umur Piutang': [
    'umurpiutang',
    'piutang',
    'lamapiutang',
    'hariinvoice',
    'aging',
    'durasipiutang',
    'umurtagihan',
  ],
  'Catatan Belum Selesai': [
    'catatanbelumselesai',
    'catatan',
    'keterangan',
    'notes',
    'catatanpengerjaan',
    'catatanrevisi',
    'revisi',
    'catatankelengkapan',
    'memo',
    'keteranganprogres',
  ],
  'Lama Layout Awal': [
    'lamalayoutawal',
    'lamalayout',
    'durasi_layout',
    'layoutawal',
    'waktulayout',
    'durasilayoutawal',
    'lamapengerjaanawal',
    'durasi',
    'harilayoutawal',
    'waktuawal',
  ],
};

/**
 * Validasi dan petakan data baris matriks ke BookJob[] dengan pencocokan fleksibel 20 kolom
 */
export function parseSheetRows(rawRows: string[][]): ParseResult {
  if (rawRows.length === 0) {
    return {
      success: false,
      errorMessage: 'Sheet atau tabel kosong, tidak ada data ditemukan.',
    };
  }

  const headerRow = rawRows[0];
  const headerMap: Record<string, number> = {};

  headerRow.forEach((col, index) => {
    headerMap[normalizeHeaderName(col)] = index;
  });

  // Pencocokan kolom dengan sinonim
  const missingColumns: string[] = [];
  const columnIndexMap: Record<string, number> = {};

  for (const expectedCol of EXPECTED_SHEET_COLUMNS) {
    const norm = normalizeHeaderName(expectedCol);
    if (headerMap[norm] !== undefined) {
      columnIndexMap[expectedCol] = headerMap[norm];
    } else {
      // Cek sinonim
      const synonyms = COLUMN_SYNONYMS[expectedCol] || [];
      const foundSynonym = synonyms.find((s) => headerMap[normalizeHeaderName(s)] !== undefined);
      if (foundSynonym) {
        columnIndexMap[expectedCol] = headerMap[normalizeHeaderName(foundSynonym)];
      } else {
        missingColumns.push(expectedCol);
      }
    }
  }

  // Kolom opsional tambahan jika ada di sheet
  const optIsbnKey = ['isbn', 'nomorisbn', 'kodeisbn'].find((k) => headerMap[k] !== undefined);
  const optStatusIsbnKey = ['statusisbn', 'kondisiisbn'].find((k) => headerMap[k] !== undefined);
  const optKodeProdKey = ['kodeproduksi', 'kodeprod', 'kodenas'].find((k) => headerMap[k] !== undefined);
  const optKelengkapanKey = ['kelengkapannaskah', 'kelengkapan'].find((k) => headerMap[k] !== undefined);

  const matchedCount = EXPECTED_SHEET_COLUMNS.length - missingColumns.length;

  // Syarat minimal: minimal 2 kolom relevan atau memiliki kolom Judul / Penulis
  const hasBasicBookColumns =
    columnIndexMap['Judul'] !== undefined ||
    columnIndexMap['Penulis'] !== undefined ||
    matchedCount >= 2;

  if (!hasBasicBookColumns) {
    return {
      success: false,
      missingColumns,
      foundColumns: headerRow,
      errorMessage: `Format kolom tidak sesuai. Ditemukan ${headerRow.length} kolom, namun tidak ada kolom Judul / Penulis / data buku yang cocok. Pastikan baris pertama berisi 20 kolom standar atau unduh template di Pengaturan Dasbor.`,
    };
  }

  // Petakan setiap baris data
  const dataRows = rawRows.slice(1);
  const parsedBooks: BookJob[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  for (let idx = 0; idx < dataRows.length; idx++) {
    const row = dataRows[idx];
    if (row.length === 0 || !row.some((c) => c !== '')) continue;

    const getVal = (colName: string): string => {
      const colIdx = columnIndexMap[colName];
      return colIdx !== undefined && row[colIdx] !== undefined ? row[colIdx].trim() : '';
    };

    const parseNum = (val: string, fallback = 0): number => {
      const cleaned = val.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? fallback : parsed;
    };

    const noVal = parseNum(getVal('No'), idx + 1);
    const judul = getVal('Judul') || `Buku #${idx + 1}`;
    const penulis = getVal('Penulis') || 'Tanpa Penulis';
    const kategori = (getVal('Kategori') || 'Lainnya') as KategoriType;

    // Normalisasi Paket
    const rawPaket = getVal('Paket').toLowerCase();
    let paket: PaketType = 'Basic';
    if (rawPaket.includes('prem')) paket = 'Premium';
    else if (rawPaket.includes('stand')) paket = 'Standart';

    // Normalisasi Status Progres
    const rawStatus = getVal('Status Progres');
    let statusProgres: StatusProgresType = 'Di Saya';
    if (rawStatus) {
      const lower = rawStatus.toLowerCase();
      if (lower.includes('coped')) statusProgres = 'Di Coped';
      else if (lower.includes('penulis') && lower.includes('masalah')) statusProgres = 'Masalah saat Kor penulis';
      else if (lower.includes('penulis')) statusProgres = 'Di Penulis';
      else if (lower.includes('finishing') && lower.includes('saya')) statusProgres = 'Finishing Saya';
      else if (lower.includes('finishing') && lower.includes('korektor')) statusProgres = 'Finishing Korektor';
      else if (lower.includes('awal') || lower.includes('kirim')) statusProgres = 'Kirim file awal layout';
      else if (lower.includes('nunggu isbn') || lower.includes('isbn')) statusProgres = 'Nunggu ISBN';
      else if (lower.includes('acc')) statusProgres = 'Nunggu ACC Cetak';
      else if (lower.includes('siap cetak')) statusProgres = 'Sudah siap cetak';
      else if (lower.includes('selesai')) statusProgres = 'Selesai';
      else if (lower.includes('saya')) statusProgres = 'Di Saya';
      else statusProgres = rawStatus as StatusProgresType;
    }

    const tglTerima = getVal('Tgl Terima') || todayStr;
    const tglSelesaiLayout = getVal('Tgl Selesai Layout') || null;
    const updateTerakhir = getVal('Update Terakhir') || todayStr;
    const hariBerjalan = parseNum(getVal('Hari Berjalan'), 0);
    const halamanAwal = parseNum(getVal('Halaman Awal'), 0);
    const halamanFinal = parseNum(getVal('Halaman Final'), halamanAwal);
    const rawStuck = getVal('Stuck').toLowerCase();
    const stuck = rawStuck === 'ya' || rawStuck === 'true' || rawStuck === 'y' ? 'Ya' : 'Tidak';
    const nilaiJasa = parseNum(getVal('Nilai Jasa'), 0);

    // Normalisasi Status Bayar ('Belum Ditagih' | 'Belum Dibayar' | 'Lunas')
    const rawBayar = getVal('Status Bayar').toLowerCase();
    let statusBayar: StatusBayarType = 'Belum Ditagih';
    if (rawBayar.includes('lunas') || rawBayar.includes('paid') || rawBayar.includes('sudah')) {
      statusBayar = 'Lunas';
    } else if (
      rawBayar.includes('belum dibayar') ||
      rawBayar.includes('belum bayar') ||
      rawBayar.includes('menunggu') ||
      rawBayar.includes('pending') ||
      rawBayar.includes('tagih')
    ) {
      statusBayar = 'Belum Dibayar';
    }

    const tglInvoice = getVal('Tgl Invoice') || null;
    const tglDibayar = getVal('Tgl Dibayar') || null;
    const umurPiutang = parseNum(getVal('Umur Piutang'), 0);
    const catatanBelumSelesai = getVal('Catatan Belum Selesai');
    const lamaLayoutAwal = parseNum(getVal('Lama Layout Awal'), 0);

    // Baca kolom opsional jika tersedia
    const isbn = optIsbnKey !== undefined && row[headerMap[optIsbnKey]] ? row[headerMap[optIsbnKey]].trim() : undefined;
    const statusIsbn = optStatusIsbnKey !== undefined && row[headerMap[optStatusIsbnKey]] ? row[headerMap[optStatusIsbnKey]].trim() as any : undefined;
    const kodeProduksi = optKodeProdKey !== undefined && row[headerMap[optKodeProdKey]] ? row[headerMap[optKodeProdKey]].trim() : undefined;
    const rawKelengkapan = optKelengkapanKey !== undefined && row[headerMap[optKelengkapanKey]] ? row[headerMap[optKelengkapanKey]].trim() : undefined;
    const kelengkapanNaskah = rawKelengkapan ? rawKelengkapan.split(/[,;|]/).map((k) => k.trim()).filter(Boolean) : undefined;

    parsedBooks.push({
      no: noVal,
      judul,
      penulis,
      kategori,
      paket,
      statusProgres,
      tglTerima,
      tglSelesaiLayout,
      updateTerakhir,
      hariBerjalan,
      halamanAwal,
      halamanFinal,
      stuck,
      nilaiJasa,
      statusBayar,
      tglInvoice,
      tglDibayar,
      umurPiutang,
      catatanBelumSelesai,
      lamaLayoutAwal,
      isbn,
      statusIsbn,
      kodeProduksi,
      kelengkapanNaskah,
    });
  }

  return {
    success: true,
    books: parsedBooks,
    missingColumns: missingColumns.length > 0 ? missingColumns : undefined,
    foundColumns: headerRow,
  };
}

/**
 * Parsing teks CSV dan petakan ke BookJob[]
 */
export function parseSheetData(csvText: string): ParseResult {
  const rawRows = parseCsvRows(csvText);
  return parseSheetRows(rawRows);
}

/**
 * Parsing array 2D values (dari Google Sheets API v4) dan petakan ke BookJob[]
 */
export function parseSheetValues(values: any[][]): ParseResult {
  if (!values || !Array.isArray(values) || values.length === 0) {
    return {
      success: false,
      errorMessage: 'Google Sheet tidak mengembalikan baris data apa pun.',
    };
  }

  const rawRows: string[][] = values.map((row) =>
    Array.isArray(row)
      ? row.map((cell) => (cell === null || cell === undefined ? '' : String(cell)))
      : []
  );

  return parseSheetRows(rawRows);
}

/**
 * Escapes nilai cell untuk format CSV sesuai standar RFC 4180
 */
function escapeCsvCell(cell: string | number | null | undefined): string {
  if (cell === null || cell === undefined) return '';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Buat template CSV kosong berformat standar 20 kolom dengan 1 baris contoh
 */
export function generateTemplateCsv(): string {
  const headerLine = EXPECTED_SHEET_COLUMNS.join(',');
  const exampleRow = [
    '1',
    'Pengantar Hukum Tata Negara Modern',
    'Prof. Dr. Hendra Wijaya, S.H.',
    'Hukum',
    'Standart',
    'Di Saya',
    '2026-11-01',
    '',
    '2026-11-03',
    '3',
    '180',
    '210',
    'Tidak',
    '1500000',
    'Belum Ditagih',
    '',
    '',
    '0',
    'Sedang tata letak bab pendahuluan',
    '10',
  ].map(escapeCsvCell).join(',');

  return `${headerLine}\n${exampleRow}\n`;
}

/**
 * Ekspor array BookJob[] menjadi CSV berformat 20 kolom
 */
export function exportBooksToCsv(books: BookJob[]): string {
  const headerLine = EXPECTED_SHEET_COLUMNS.join(',');
  const rows = books.map((b) => {
    return [
      b.no,
      b.judul,
      b.penulis,
      b.kategori,
      b.paket,
      b.statusProgres,
      b.tglTerima,
      b.tglSelesaiLayout ?? '',
      b.updateTerakhir,
      b.hariBerjalan,
      b.halamanAwal,
      b.halamanFinal,
      b.stuck,
      b.nilaiJasa,
      b.statusBayar,
      b.tglInvoice ?? '',
      b.tglDibayar ?? '',
      b.umurPiutang,
      b.catatanBelumSelesai,
      b.lamaLayoutAwal,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return [headerLine, ...rows].join('\n');
}

/**
 * Trigger download file di browser
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
