// supabase-config.js
// ============================================
// SI-KONCI - Supabase Configuration
// SMPN 13 Penajam Paser Utara
// ============================================

const SUPABASE_CONFIG = {
    url: 'https://ngrrgadwmhhuzyhogido.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncnJnYWR3bWhodXp5aG9naWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTY4OTAsImV4cCI6MjA5NzgzMjg5MH0._WyGk3r-AX2XxPqjRFdQmUyMoJj9ERC-EQX_9mB7oyQ', // Ganti dengan anon key dari Supabase
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