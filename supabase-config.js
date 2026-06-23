// supabase-config.js
// ============================================
// SI-KONCI - Supabase Configuration
// SMPN 13 Penajam Paser Utara
// ============================================

const SUPABASE_CONFIG = {
    url: 'https://huqswtchblugmpjbrkai.supabase.co',
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE', // Ganti dengan anon key dari Supabase
    tables: {
        siswa: 'siswa',
        guru: 'guru',
        orangtua: 'orangtua',
        konseling: 'konseling',
        konsultasi: 'konsultasi',
        rekamMedis: 'rekam_medis',
        jadwal: 'jadwal_konseling'
    }
};

// Ekspor untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG };
}