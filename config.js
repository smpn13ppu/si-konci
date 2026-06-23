// config.js
// ============================================
// SI-KONCI - Configuration
// SMPN 13 Penajam Paser Utara
// ============================================

// PENTING: Ganti dengan data Supabase Anda
const SUPABASE_CONFIG = {
    url: 'https://huqswtchblugmpjbrkai.supabase.co',
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE', // Ganti dengan anon key dari Supabase
};

// Konfigurasi tabel
const TABLES = {
    siswa: 'siswa',
    guru: 'guru',
    orangtua: 'orangtua',
    konseling: 'konseling',
    konsultasi: 'konsultasi',
    rekamMedis: 'rekam_medis',
    jadwal: 'jadwal_konseling'
};

// Kolom untuk setiap tabel
const COLUMNS = {
    siswa: ['nis', 'nama', 'kelas', 'no_hp', 'email', 'password', 'created_at'],
    guru: ['nip', 'nama', 'mata_pelajaran', 'no_hp', 'email', 'password', 'created_at'],
    orangtua: ['id_orangtua', 'nama', 'anak_nis', 'anak_nama', 'no_hp', 'email', 'password', 'created_at'],
    konseling: ['id', 'siswa_nis', 'siswa_nama', 'guru_nip', 'jenis', 'pesan', 'mode', 'tanggal', 'status'],
    konsultasi: ['id', 'orangtua_id', 'orangtua_nama', 'anak_nis', 'anak_nama', 'guru_nip', 'topik', 'tanggal', 'status'],
    rekamMedis: ['id', 'siswa_nis', 'siswa_nama', 'guru_nip', 'kategori', 'catatan', 'tindakan', 'tanggal'],
    jadwal: ['id', 'siswa_nis', 'siswa_nama', 'guru_nip', 'tanggal', 'jam', 'keterangan', 'status']
};

// Ekspor untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, TABLES, COLUMNS };
}