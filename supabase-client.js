// supabase-client.js
// ============================================
// SI-KONCI - Supabase Client
// SMPN 13 Penajam Paser Utara
// ============================================

(function() {
    'use strict';
    
    const SUPABASE_URL = 'https://ngrrgadwmhhuzyhogido.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncnJnYWR3bWhodXp5aG9naWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTY4OTAsImV4cCI6MjA5NzgzMjg5MH0._WyGk3r-AX2XxPqjRFdQmUyMoJj9ERC-EQX_9mB7oyQ';
    
    let supabaseClient = null;
    
    // Cache untuk statistik
    let statisticsCache = null;
    let statisticsCacheTime = 0;
    const CACHE_DURATION = 30000; // 30 detik
    
    function initSupabase() {
        if (typeof supabase === 'undefined') {
            console.error('⚠️ Supabase library not loaded!');
            return null;
        }
        
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase connected successfully!');
            return supabaseClient;
        } catch (error) {
            console.error('❌ Failed to connect to Supabase:', error);
            return null;
        }
    }
    
    function getSupabase() {
        if (!supabaseClient) {
            return initSupabase();
        }
        return supabaseClient;
    }
    
    
    // ============================================
    // CREATE USER RECORD
    // ============================================
    async function createUserRecord(userId, email, role) {
        const client = getSupabase();
        if (!client) return null;
        
        const tableMap = { 
            siswa: 'siswa', 
            guru: 'guru', 
            orangtua: 'orangtua' 
        };
        const table = tableMap[role];
        if (!table) return null;
        
        const userData = {
            user_id: userId,
            email: email,
            created_at: new Date().toISOString()
        };
        
        if (role === 'siswa') {
            userData.nis = 'SIS' + Date.now().toString().slice(-6);
            userData.nama = email.split('@')[0];
            userData.kelas = 'IX-A';
            userData.no_hp = '';
            userData.password = '';
        } else if (role === 'guru') {
            userData.nip = 'GUR' + Date.now().toString().slice(-6);
            userData.nama = email.split('@')[0];
            userData.mata_pelajaran = 'Bimbingan Konseling';
            userData.no_hp = '';
            userData.password = '';
        } else if (role === 'orangtua') {
            userData.id_orangtua = 'ORT' + Date.now().toString().slice(-6);
            userData.nama = email.split('@')[0];
            userData.anak_nis = '';
            userData.anak_nama = '';
            userData.no_hp = '';
            userData.password = '';
        }
        
        try {
            const { data, error } = await client
                .from(table)
                .insert([userData])
                .select()
                .maybeSingle();
                
            if (error) {
                console.error('❌ Create user record error:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.error('❌ Create user record exception:', error);
            return null;
        }
    }
    
   // ============================================
// REGISTER USER - FIXED (Hanya 1 role per email)
// ============================================
async function registerUser(data, role) {
    console.log('📝 Register attempt:', data.email, 'role:', role);
    
    const client = getSupabase();
    if (!client) return null;
    
    try {
        // 1. CEK APAKAH EMAIL SUDAH TERDAFTAR DI TABEL MANAPUN
        const tables = ['siswa', 'guru', 'orangtua'];
        let existingUser = null;
        
        for (const table of tables) {
            const { data: checkData, error: checkError } = await client
                .from(table)
                .select('email')
                .eq('email', data.email)
                .maybeSingle();
                
            if (checkData) {
                existingUser = { table, data: checkData };
                break;
            }
        }
        
        if (existingUser) {
            console.warn(`⚠️ Email sudah terdaftar di tabel ${existingUser.table}`);
            return { error: `Email sudah terdaftar sebagai ${existingUser.table}. Silakan login.` };
        }
        
        // 2. Buat akun Auth
        const { data: authData, error: authError } = await client.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: { 
                    role: role, 
                    name: data.nama 
                }
            }
        });
        
        if (authError) {
            console.error('❌ Auth registration error:', authError.message);
            
            if (authError.message.includes('already registered')) {
                return { error: 'Email sudah terdaftar di sistem. Silakan login.' };
            }
            return null;
        }
        
        console.log('✅ Auth registration success:', authData.user.id);
        
        // 3. Tentukan tabel berdasarkan role
        const tableMap = { 
            siswa: 'siswa', 
            guru: 'guru', 
            orangtua: 'orangtua' 
        };
        const table = tableMap[role];
        if (!table) return null;
        
        // 4. Siapkan data insert
        const insertData = { 
            ...data,
            user_id: authData.user.id,
            created_at: new Date().toISOString()
        };
        
        // Hapus password dari data insert (untuk keamanan)
        delete insertData.password;
        
        console.log('📤 Insert ke tabel:', table, insertData);
        
        // 5. Insert ke tabel yang sesuai
        const { data: userData, error: userError } = await client
            .from(table)
            .insert([insertData])
            .select()
            .single();
        
        if (userError) {
            console.error('❌ Insert error:', userError);
            
            // Jika gagal karena NOT NULL, coba dengan default
            if (userError.code === '23502') {
                // Tambahkan field yang mungkin kosong
                if (role === 'siswa' && !insertData.nis) {
                    insertData.nis = 'SIS' + Date.now().toString().slice(-6);
                }
                if (role === 'guru' && !insertData.nip) {
                    insertData.nip = 'GUR' + Date.now().toString().slice(-6);
                }
                if (role === 'orangtua' && !insertData.id_orangtua) {
                    insertData.id_orangtua = 'ORT' + Date.now().toString().slice(-6);
                }
                
                const { data: retryData, error: retryError } = await client
                    .from(table)
                    .insert([insertData])
                    .select()
                    .single();
                
                if (retryError) {
                    console.error('❌ Retry insert error:', retryError);
                    return null;
                }
                return retryData;
            }
            return null;
        }
        
        console.log('✅ User registered successfully to table:', table);
        return userData;
        
    } catch (error) {
        console.error('❌ Register error:', error);
        return null;
    }
}
// ============================================
// REGISTER ORANG TUA - DENGAN PENDING NIS
// ============================================
async function registerOrangTua(data) {
    console.log('📝 Register Orang Tua:', data.email);
    
    const client = getSupabase();
    if (!client) return null;
    
    try {
        // 1. Cek apakah NIS sudah terdaftar di tabel siswa
        const { data: siswaExist, error: cekError } = await client
            .from('siswa')
            .select('nis, nama')
            .eq('nis', data.anak_nis)
            .maybeSingle();
        
        // 2. Buat akun Auth
        const { data: authData, error: authError } = await client.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: { 
                    role: 'orangtua', 
                    name: data.nama 
                }
            }
        });
        
        if (authError) {
            console.error('❌ Auth error:', authError);
            return null;
        }
        
        // 3. Siapkan data orang tua
        const orangtuaData = {
            id_orangtua: data.id_orangtua || 'ORT' + Date.now().toString().slice(-6),
            nama: data.nama,
            anak_nis: data.anak_nis,
            anak_nama: data.anak_nama,
            no_hp: data.no_hp || '',
            email: data.email,
            password: data.password,
            user_id: authData.user.id,
            anak_terhubung: !!siswaExist, // true jika siswa sudah ada
            status: 'active'
        };
        
        // 4. Simpan ke tabel orangtua
        const { data: orangtuaResult, error: orangtuaError } = await client
            .from('orangtua')
            .insert([orangtuaData])
            .select()
            .single();
        
        if (orangtuaError) {
            console.error('❌ Insert orangtua error:', orangtuaError);
            return null;
        }
        
        // 5. Jika siswa BELUM terdaftar, simpan ke pending_siswa
        if (!siswaExist) {
            console.log('🔄 Siswa belum terdaftar, simpan ke pending...');
            
            const { error: pendingError } = await client
                .from('pending_siswa')
                .insert([{
                    nis: data.anak_nis,
                    nama: data.anak_nama,
                    orangtua_id: orangtuaResult.id_orangtua,
                    orangtua_nama: data.nama,
                    status: 'pending'
                }]);
            
            if (pendingError) {
                console.error('❌ Insert pending error:', pendingError);
                // Tidak perlu throw, karena orang tua sudah terdaftar
            } else {
                console.log('✅ NIS disimpan ke pending_siswa');
            }
        } else {
            console.log('✅ Siswa sudah terdaftar, langsung terhubung');
        }
        
        return orangtuaResult;
        
    } catch (error) {
        console.error('❌ Register error:', error);
        return null;
    }
}
// ============================================
// REGISTER SISWA - VERSION 2 (FIXED)
// ============================================
async function registerSiswa(data) {
    console.log('📝 Register Siswa:', data.email);
    
    const client = getSupabase();
    if (!client) {
        return { 
            success: false, 
            error: 'Koneksi database gagal' 
        };
    }
    
    try {
        // ============================================
        // 1. VALIDASI DATA
        // ============================================
        
        // ✅ Cek NIS wajib diisi
        if (!data.nis || data.nis.trim() === '') {
            return { 
                success: false, 
                error: 'NIS wajib diisi!' 
            };
        }
        
        // ✅ Cek Nama wajib diisi
        if (!data.nama || data.nama.trim() === '') {
            return { 
                success: false, 
                error: 'Nama wajib diisi!' 
            };
        }
        
        // ✅ Cek Email wajib diisi
        if (!data.email || data.email.trim() === '') {
            return { 
                success: false, 
                error: 'Email wajib diisi!' 
            };
        }
        
        // ✅ Cek Password minimal 6 karakter
        if (!data.password || data.password.length < 6) {
            return { 
                success: false, 
                error: 'Password minimal 6 karakter!' 
            };
        }
        
        // ✅ Cek apakah NIS sudah terdaftar
        const { data: existingNIS, error: nisError } = await client
            .from('siswa')
            .select('nis')
            .eq('nis', data.nis)
            .maybeSingle();
        
        if (nisError) {
            console.error('❌ Cek NIS error:', nisError);
        }
        
        if (existingNIS) {
            return { 
                success: false, 
                error: 'NIS sudah terdaftar! Gunakan NIS yang lain.' 
            };
        }
        
        // ✅ Cek apakah email sudah terdaftar di tabel siswa
        const { data: existingEmail, error: emailError } = await client
            .from('siswa')
            .select('email')
            .eq('email', data.email)
            .maybeSingle();
        
        if (emailError) {
            console.error('❌ Cek Email error:', emailError);
        }
        
        if (existingEmail) {
            return { 
                success: false, 
                error: 'Email sudah terdaftar! Gunakan email yang lain.' 
            };
        }

        // ============================================
        // 2. BUAT AKUN AUTH
        // ============================================
        
        const { data: authData, error: authError } = await client.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: { 
                    role: 'siswa', 
                    name: data.nama 
                }
            }
        });
        
        if (authError) {
            console.error('❌ Auth error:', authError);
            
            // ✅ Tangani error auth dengan lebih baik
            if (authError.message.includes('already registered')) {
                return { 
                    success: false, 
                    error: 'Email sudah terdaftar! Silakan login.' 
                };
            }
            
            return { 
                success: false, 
                error: 'Gagal membuat akun: ' + authError.message 
            };
        }
        
        if (!authData || !authData.user) {
            return { 
                success: false, 
                error: 'Gagal membuat akun, silakan coba lagi.' 
            };
        }

        // ============================================
        // 3. SIMPAN DATA SISWA
        // ============================================
        
        const siswaData = {
            nis: data.nis.trim(),
            nama: data.nama.trim(),
            kelas: data.kelas ? data.kelas.trim() : 'Belum ditentukan',
            no_hp: data.no_hp || '',
            email: data.email.trim(),
            password: data.password,
            user_id: authData.user.id,
            created_at: new Date().toISOString()
        };
        
        const { data: siswaResult, error: siswaError } = await client
            .from('siswa')
            .insert([siswaData])
            .select()
            .single();
        
        if (siswaError) {
            console.error('❌ Insert siswa error:', siswaError);
            
            // ✅ Jika insert gagal, hapus akun auth yang sudah dibuat
            // (Opsional: butuh admin rights untuk delete user)
            
            return { 
                success: false, 
                error: 'Gagal menyimpan data siswa: ' + siswaError.message 
            };
        }

        // ============================================
        // 4. CEK PENDING ORANG TUA
        // ============================================
        
        try {
            const { data: pendingData, error: pendingError } = await client
                .from('pending_siswa')
                .select('*')
                .eq('nis', data.nis)
                .eq('status', 'pending')
                .maybeSingle();
            
            if (pendingData) {
                console.log('🔄 Ada orang tua yang menunggu, menghubungkan...');
                
                // Update tabel orangtua
                const { error: updateError } = await client
                    .from('orangtua')
                    .update({
                        anak_nis: data.nis,
                        anak_nama: data.nama,
                        anak_terhubung: true
                    })
                    .eq('id_orangtua', pendingData.orangtua_id);
                
                if (updateError) {
                    console.error('❌ Update orangtua error:', updateError);
                } else {
                    console.log('✅ Orang tua berhasil terhubung dengan siswa');
                }
                
                // Update status pending
                await client
                    .from('pending_siswa')
                    .update({ 
                        status: 'matched',
                        updated_at: new Date().toISOString()
                    })
                    .eq('nis', data.nis);
            }
        } catch (pendingError) {
            // ✅ Error di pending tidak menggagalkan registrasi
            console.warn('⚠️ Error processing pending:', pendingError);
        }

        // ============================================
        // 5. RETURN HASIL
        // ============================================
        
        console.log('✅ Siswa registered successfully:', siswaResult);
        return { 
            success: true, 
            data: siswaResult,
            message: 'Registrasi berhasil! Silakan login.' 
        };
        
    } catch (error) {
        console.error('❌ Register error:', error);
        return { 
            success: false, 
            error: 'Terjadi kesalahan: ' + error.message 
        };
    }
}

// ============================================
// CEK NIS (Untuk Validasi di Form)
// ============================================
async function cekNIS(nis) {
    try {
        const client = getSupabase();
        if (!client) return false;
        
        const { data, error } = await client
            .from('siswa')
            .select('nis')
            .eq('nis', nis)
            .maybeSingle();
        
        if (error) {
            console.error('❌ Error checking NIS:', error);
            return false;
        }
        
        return data !== null;
    } catch (error) {
        console.error('❌ Error in cekNIS:', error);
        return false;
    }
}

// ============================================
// CEK EMAIL (Untuk Validasi di Form)
// ============================================
async function cekEmail(email) {
    try {
        const client = getSupabase();
        if (!client) return false;
        
        const { data, error } = await client
            .from('siswa')
            .select('email')
            .eq('email', email)
            .maybeSingle();
        
        if (error) {
            console.error('❌ Error checking email:', error);
            return false;
        }
        
        return data !== null;
    } catch (error) {
        console.error('❌ Error in cekEmail:', error);
        return false;
    }
}

// ============================================
// CEK NIS SUDAH TERDAFTAR
// ============================================
async function cekNIS(nis) {
    try {
        const client = getSupabase();
        if (!client) {
            console.error('❌ Supabase client not initialized');
            return false;
        }
        
        const { data, error } = await client
            .from('siswa')
            .select('nis')
            .eq('nis', nis)
            .maybeSingle();
        
        if (error) {
            console.error('❌ Error checking NIS:', error);
            return false;
        }
        
        return data !== null;
    } catch (error) {
        console.error('❌ Error in cekNIS:', error);
        return false;
    }
}

// Export untuk digunakan di HTML
window.cekNIS = cekNIS;
// ============================================
// LOGIN FUNCTION - FIXED (Hanya cek 1 tabel)
// ============================================
async function loginUser(email, password, role) {
    console.log('🔐 Login attempt:', email, 'role:', role);
    
    const client = getSupabase();
    if (!client) return null;
    
    try {
        // 1. Login ke Auth
        const { data: authData, error: authError } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (authError) {
            console.error('❌ Auth error:', authError.message);
            return null;
        }
        
        console.log('✅ Auth success:', authData.user.id);
        
        // 2. Tentukan tabel berdasarkan role
        const tableMap = { 
            siswa: 'siswa', 
            guru: 'guru', 
            orangtua: 'orangtua' 
        };
        const table = tableMap[role];
        if (!table) {
            console.error('❌ Invalid role:', role);
            return null;
        }
        
        // 3. Cari user di tabel yang sesuai
        const { data: userData, error: userError } = await client
            .from(table)
            .select('*')
            .eq('email', email)
            .maybeSingle();
        
        if (userError) {
            console.error('❌ Query error:', userError);
        }
        
        // 4. Jika ditemukan → login sukses
        if (userData) {
            console.log('✅ User found in table:', table);
            return { ...userData, role };
        }
        
        // 5. Jika tidak ditemukan → login GAGAL dengan pesan jelas
        console.error(`❌ User not found in ${table} table`);
        return null;
        
    } catch (error) {
        console.error('❌ Login error:', error);
        return null;
    }
}
    
// ============================================
// GET STATISTICS - FIXED (Hanya hitung pesan siswa)
// ============================================
async function getStatistics(forceRefresh = false) {
    console.log('📊 Fetching statistics...');
    
    // Cek cache
    const now = Date.now();
    if (!forceRefresh && statisticsCache && (now - statisticsCacheTime) < CACHE_DURATION) {
        console.log('📦 Using cached statistics');
        return statisticsCache;
    }
    
    const client = getSupabase();
    if (!client) return null;
    
    try {
        // === PERUBAHAN DI SINI ===
        // 1. Total Siswa (dari tabel siswa)
        const { count: totalSiswa, error: errSiswa } = await client
            .from('siswa')
            .select('*', { count: 'exact', head: true });
        
        if (errSiswa) console.error('❌ Error count siswa:', errSiswa);
        
        // 2. KONSELING DIGITAL - HANYA HITUNG PESAN DARI SISWA
        // guru_nip = null atau '' berarti pesan dari siswa
        const { count: totalKonselingSiswa, error: errKonseling } = await client
            .from('konseling')
            .select('*', { count: 'exact', head: true })
            .or('guru_nip.is.null,guru_nip.eq.'); // guru_nip NULL atau kosong
        
        if (errKonseling) {
            console.error('❌ Error count konseling siswa:', errKonseling);
            // Fallback: coba cara lain
            const { data: allData, error: errAll } = await client
                .from('konseling')
                .select('guru_nip');
                
            if (!errAll && allData) {
                const siswaPesan = allData.filter(item => 
                    item.guru_nip === null || item.guru_nip === '' || item.guru_nip === undefined
                );
                var totalKonselingSiswaFinal = siswaPesan.length;
            } else {
                var totalKonselingSiswaFinal = 0;
            }
        } else {
            var totalKonselingSiswaFinal = totalKonselingSiswa || 0;
        }
        
        // 3. Total Rekam Medis (untuk cadangan)
        const { count: totalRekam, error: errRekam } = await client
            .from('rekam_medis')
            .select('*', { count: 'exact', head: true });
        
        if (errRekam) console.error('❌ Error count rekam medis:', errRekam);
        
        // 4. Hitung Kepuasan (dari konseling yang selesai)
        const { data: konselingData, error: errData } = await client
            .from('konseling')
            .select('status, guru_nip');
        
        let kepuasan = 98;
        if (!errData && konselingData && konselingData.length > 0) {
            // Hanya hitung dari pesan siswa (bukan balasan guru)
            const pesanSiswa = konselingData.filter(item => 
                item.guru_nip === null || item.guru_nip === '' || item.guru_nip === undefined
            );
            
            if (pesanSiswa.length > 0) {
                const total = pesanSiswa.length;
                const selesai = pesanSiswa.filter(k => 
                    k.status === 'selesai' || k.status === 'done'
                ).length;
                kepuasan = Math.round((selesai / total) * 100);
            }
        }
        
        const result = {
            total_siswa: totalSiswa || 0,
            total_konseling: totalKonselingSiswaFinal || 0,  // HANYA PESAN SISWA
            total_rekam: totalRekam || 0,
            kepuasan: kepuasan,
            last_updated: new Date().toISOString()
        };
        
        console.log('📊 Statistics (fixed):', result);
        
        // Simpan cache
        statisticsCache = result;
        statisticsCacheTime = now;
        
        return result;
        
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}
    
    // Fallback direct query
    async function getStatisticsDirect(client) {
        try {
            // Query paralel untuk kecepatan
            const [siswaCount, konselingCount, rekamCount, konselingData] = await Promise.all([
                client.from('siswa').select('*', { count: 'exact', head: true }),
                client.from('konseling').select('*', { count: 'exact', head: true }),
                client.from('rekam_medis').select('*', { count: 'exact', head: true }),
                client.from('konseling').select('status')
            ]);
            
            // Hitung kepuasan
            let kepuasan = 98;
            if (!konselingData.error && konselingData.data && konselingData.data.length > 0) {
                const total = konselingData.data.length;
                const selesai = konselingData.data.filter(k => 
                    k.status === 'selesai' || k.status === 'done' || k.status === 'confirmed'
                ).length;
                kepuasan = Math.round((selesai / total) * 100);
            }
            
            const result = {
                total_siswa: siswaCount.count || 0,
                total_konseling: konselingCount.count || 0,
                total_rekam: rekamCount.count || 0,
                kepuasan: kepuasan,
                last_updated: new Date().toISOString()
            };
            
            console.log('✅ Statistics direct:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Direct query error:', error);
            return null;
        }
    }
    
    // ============================================
    // GET DATA
    // ============================================
    async function getData(table, filters = {}) {
        const client = getSupabase();
        if (!client) return [];
        
        try {
            let query = client.from(table).select('*');
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '' && filters[key] !== null) {
                    query = query.eq(key, filters[key]);
                }
            });
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('❌ Get data error:', error);
            return [];
        }
    }
    
    // ============================================
    // INSERT DATA
    // ============================================
    async function insertData(table, data) {
        const client = getSupabase();
        if (!client) return null;
        
        try {
            const { data: result, error } = await client
                .from(table)
                .insert([data])
                .select()
                .single();
                
            if (error) {
                console.error('❌ Insert error:', error);
                return null;
            }
            return result;
        } catch (error) {
            console.error('❌ Error inserting data:', error);
            return null;
        }
    }
    
    // ============================================
    // UPDATE DATA
    // ============================================
    async function updateData(table, id, data) {
        const client = getSupabase();
        if (!client) return null;
        
        try {
            const { data: result, error } = await client
                .from(table)
                .update(data)
                .eq('id', id)
                .select()
                .single();
                
            if (error) {
                console.error('❌ Update error:', error);
                return null;
            }
            return result;
        } catch (error) {
            console.error('❌ Error updating data:', error);
            return null;
        }
    }
    
    // ============================================
    // DELETE DATA
    // ============================================
    async function deleteData(table, id) {
        const client = getSupabase();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from(table)
                .delete()
                .eq('id', id);
                
            if (error) {
                console.error('❌ Delete error:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('❌ Error deleting data:', error);
            return false;
        }
    }
    
    // ============================================
    // TEST CONNECTION
    // ============================================
    async function testSupabaseConnection() {
        console.log('🔍 Testing Supabase connection...');
        
        const client = getSupabase();
        if (!client) {
            console.error('❌ Failed to initialize Supabase client');
            return false;
        }
        
        try {
            const { data, error } = await client
                .from('siswa')
                .select('count');
                
            if (error) {
                console.error('❌ Query error:', error.message);
                return false;
            }
            
            console.log('✅ Supabase connection successful!');
            return true;
        } catch (e) {
            console.error('❌ Connection error:', e);
            return false;
        }
    }
    // ============================================
// GET REKAM MEDIS BY SISWA
// ============================================
async function getRekamMedisBySiswa(nis) {
    const client = getSupabase();
    if (!client) return [];
    
    try {
        const { data, error } = await client
            .from('rekam_medis')
            .select('*')
            .eq('siswa_nis', nis)
            .order('tanggal', { ascending: false });
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error get rekam medis:', error);
        return [];
    }
}

// ============================================
// GET KONSELING BY GURU
// ============================================
async function getKonselingByGuru(nip) {
    const client = getSupabase();
    if (!client) return [];
    
    try {
        const { data, error } = await client
            .from('konseling')
            .select('*')
            .eq('guru_nip', nip)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error get konseling:', error);
        return [];
    }
}
// ============================================
// CEK SISWA BY NIS
// ============================================
async function getSiswaByNis(nis) {
    const client = getSupabase();
    if (!client) return null;
    
    try {
        // Trim untuk menghilangkan spasi
        const cleanNis = nis.toString().trim();
        
        const { data, error } = await client
            .from('siswa')
            .select('*')
            .eq('nis', cleanNis)
            .maybeSingle();
            
        if (error) {
            console.error('❌ Error get siswa:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// ============================================
// CEK ATAU BUAT SISWA - IMPROVED
// ============================================
async function ensureSiswaExists(nis, nama, kelas = 'IX-A') {
    const client = getSupabase();
    if (!client) throw new Error('Koneksi database gagal');
    
    try {
        // Bersihkan NIS
        const cleanNis = nis.toString().trim();
        
        if (!cleanNis) {
            throw new Error('NIS tidak boleh kosong');
        }
        
        console.log('🔍 Mencari siswa dengan NIS:', cleanNis);
        
        // Cek apakah siswa sudah ada
        const { data: existing, error: checkError } = await client
            .from('siswa')
            .select('*')
            .eq('nis', cleanNis)
            .maybeSingle();
        
        if (checkError) {
            console.error('❌ Error cek siswa:', checkError);
        }
        
        if (existing) {
            console.log('✅ Siswa ditemukan:', existing.nis, existing.nama);
            return existing;
        }
        
        // Jika tidak ditemukan, buat siswa baru
        console.log('🔄 Siswa tidak ditemukan, membuat baru...');
        
        const { data: newSiswa, error: insertError } = await client
            .from('siswa')
            .insert([{
                nis: cleanNis,
                nama: nama,
                kelas: kelas,
                email: cleanNis + '@siswa.sch.id',
                password: 'password123',
                no_hp: ''
            }])
            .select()
            .single();
        
        if (insertError) {
            console.error('❌ Error insert siswa:', insertError);
            
            // Jika error karena NIS sudah ada (duplicate)
            if (insertError.code === '23505') {
                // Coba ambil data yang sudah ada
                const { data: existingData, error: retryError } = await client
                    .from('siswa')
                    .select('*')
                    .eq('nis', cleanNis)
                    .maybeSingle();
                    
                if (existingData) {
                    console.log('✅ Siswa ditemukan setelah retry:', existingData.nis);
                    return existingData;
                }
            }
            
            throw new Error('Gagal membuat siswa: ' + insertError.message);
        }
        
        console.log('✅ Siswa berhasil dibuat:', newSiswa.nama);
        return newSiswa;
        
    } catch (error) {
        console.error('❌ Error ensure siswa:', error);
        throw error;
    }
}
// ============================================
// ADMIN LOGIN - FIXED
// ============================================
async function adminLogin(username, password) {
    console.log('🔐 Admin Login attempt:', username);
    console.log('📝 Password yang dimasukkan:', password);
    
    const client = getSupabase();
    if (!client) {
        console.error('❌ Supabase client not initialized');
        return null;
    }
    
    try {
        // Cari admin dengan username dan password
        const { data, error } = await client
            .from('admin')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .maybeSingle();  // Gunakan maybeSingle()
            
        if (error) {
            console.error('❌ Admin query error:', error);
            return null;
        }
        
        if (!data) {
            console.log('❌ Admin not found for username:', username);
            return null;
        }
        
        console.log('✅ Admin found:', data.username);
        console.log('📊 Data admin:', data);
        return { ...data, role: 'admin' };
    } catch (error) {
        console.error('❌ Admin login error:', error);
        return null;
    }
}

// ============================================
// CRUD ARTICLES - LENGKAP DENGAN IMAGE_URL
// ============================================
async function getArticles(filters = {}) {
    const client = getSupabase();
    if (!client) return [];
    
    try {
        let query = client.from('articles').select('*').order('created_at', { ascending: false });
        
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        const { data, error } = await query;
        if (error) {
            console.error('❌ Error get articles:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('❌ Error get articles:', error);
        return [];
    }
}

async function getArticleById(id) {
    const client = getSupabase();
    if (!client) return null;
    
    try {
        const { data, error } = await client
            .from('articles')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) {
            console.error('❌ Error get article by id:', error);
            return null;
        }
        return data;
    } catch (error) {
        console.error('❌ Error get article by id:', error);
        return null;
    }
}

async function saveArticle(data) {
    const client = getSupabase();
    if (!client) {
        console.error('❌ Supabase client not initialized');
        return null;
    }
    
    try {
        console.log('📝 Data yang diterima saveArticle:', data);
        
        // Siapkan data untuk disimpan
        const articleData = {
            title: data.title || '',
            content: data.content || '',
            excerpt: data.excerpt || '',
            category: data.category || 'umum',
            status: data.status || 'published',
            author: data.author || 'Admin',
            image_url: data.image_url || null,
            updated_at: new Date().toISOString()
        };
        
        // Jika insert, tambahkan created_at
        if (!data.id) {
            articleData.created_at = new Date().toISOString();
        }
        
        console.log('📤 Data yang akan disimpan:', articleData);
        
        let result;
        if (data.id) {
            // UPDATE
            console.log('🔄 Update artikel dengan ID:', data.id);
            const { data: updated, error } = await client
                .from('articles')
                .update(articleData)
                .eq('id', data.id)
                .select()
                .single();
                
            if (error) {
                console.error('❌ Update error:', error);
                return null;
            }
            result = updated;
            console.log('✅ Article updated:', result);
        } else {
            // INSERT
            console.log('📝 Insert artikel baru');
            const { data: inserted, error } = await client
                .from('articles')
                .insert([articleData])
                .select()
                .single();
                
            if (error) {
                console.error('❌ Insert error:', error);
                return null;
            }
            result = inserted;
            console.log('✅ Article created:', result);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error saving article:', error);
        return null;
    }
}
// ============================================
// UPLOAD GAMBAR KE SUPABASE STORAGE
// ============================================
async function uploadImage(file, folder = 'articles') {
    const client = getSupabase();
    if (!client) {
        console.error('❌ Supabase client not initialized');
        return null;
    }
    
    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;
        
        console.log('📤 Uploading image:', filePath);
        
        // Upload ke Supabase Storage
        const { data, error } = await client.storage
            .from('article-images') // Nama bucket
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('❌ Upload error:', error);
            return null;
        }
        
        console.log('✅ Upload success:', data);
        
        // Dapatkan public URL
        const { data: urlData } = client.storage
            .from('article-images')
            .getPublicUrl(filePath);
        
        console.log('🔗 Public URL:', urlData.publicUrl);
        return urlData.publicUrl;
        
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        return null;
    }
}

// ============================================
// DELETE GAMBAR DARI SUPABASE STORAGE
// ============================================
async function deleteImage(imageUrl) {
    if (!imageUrl) return true;
    
    const client = getSupabase();
    if (!client) return false;
    
    try {
        // Extract path from URL
        const urlParts = imageUrl.split('/');
        const filePath = urlParts.slice(urlParts.indexOf('article-images') + 1).join('/');
        
        if (!filePath) return true;
        
        console.log('🗑️ Deleting image:', filePath);
        
        const { error } = await client.storage
            .from('article-images')
            .remove([filePath]);
        
        if (error) {
            console.error('❌ Delete image error:', error);
            return false;
        }
        
        console.log('✅ Image deleted');
        return true;
        
    } catch (error) {
        console.error('❌ Error deleting image:', error);
        return false;
    }
}
async function deleteArticle(id) {
    const client = getSupabase();
    if (!client) return false;
    
    try {
        // Get article first to get image_url
        const { data: article, error: getError } = await client
            .from('articles')
            .select('image_url')
            .eq('id', id)
            .single();
        
        if (getError) {
            console.error('❌ Error getting article:', getError);
        }
        
        // Delete image if exists
        if (article && article.image_url) {
            await deleteImage(article.image_url);
        }
        
        // Delete article
        console.log('🗑️ Menghapus artikel dengan ID:', id);
        const { error } = await client
            .from('articles')
            .delete()
            .eq('id', id);
            
        if (error) {
            console.error('❌ Delete error:', error);
            return false;
        }
        console.log('✅ Article deleted');
        return true;
    } catch (error) {
        console.error('❌ Error deleting article:', error);
        return false;
    }
}
// ============================================
// ADMIN - CRUD SISWA
// ============================================
async function adminGetSiswa() {
    const client = getSupabase();
    if (!client) return [];
    try {
        const { data, error } = await client.from('siswa').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error get siswa:', error);
        return [];
    }
}

// ============================================
// ADMIN - CRUD SISWA (DENGAN AUTH)
// ============================================
async function adminAddSiswa(data) {
    const client = getSupabase();
    if (!client) return null;
    try {
        // 1. Buat akun Auth dulu
        const password = data.password || 'smpn13ppu';  // <-- PASTIKAN INI
        console.log('📝 Membuat akun Auth untuk:', data.email, 'dengan password:', password);
        
        const { data: authData, error: authError } = await client.auth.signUp({
            email: data.email,
            password: password,
            options: {
                data: { 
                    role: 'siswa', 
                    name: data.nama,
                    nis: data.nis
                }
            }
        });
        
        if (authError) {
            console.error('❌ Auth error:', authError);
            // Jika email sudah terdaftar, lanjutkan insert
            if (!authError.message.includes('already registered')) {
                return null;
            }
        }
        
        console.log('✅ Auth berhasil:', authData?.user?.id || 'sudah terdaftar');
        
        // 2. Simpan ke tabel siswa dengan user_id
        const siswaData = {
            ...data,
            user_id: authData?.user?.id || null,
            password: password  // <-- PASTIKAN PASSWORD DISIMPAN
        };
        
        const { data: result, error } = await client
            .from('siswa')
            .insert([siswaData])
            .select()
            .single();
            
        if (error) {
            console.error('❌ Insert error:', error);
            throw error;
        }
        
        console.log('✅ Siswa berhasil ditambahkan:', result);
        return result;
    } catch (error) {
        console.error('❌ Error add siswa:', error);
        return null;
    }
}

async function adminUpdateSiswa(id, data) {
    const client = getSupabase();
    if (!client) return null;
    try {
        const { data: result, error } = await client.from('siswa').update(data).eq('id', id).select().single();
        if (error) throw error;
        return result;
    } catch (error) {
        console.error('❌ Error update siswa:', error);
        return null;
    }
}

async function adminDeleteSiswa(id) {
    const client = getSupabase();
    if (!client) return false;
    try {
        const { error } = await client.from('siswa').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error delete siswa:', error);
        return false;
    }
}

// ============================================
// ADMIN - CRUD GURU
// ============================================
async function adminGetGuru() {
    const client = getSupabase();
    if (!client) return [];
    try {
        const { data, error } = await client.from('guru').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error get guru:', error);
        return [];
    }
}

async function adminAddGuru(data) {
    const client = getSupabase();
    if (!client) return null;
    try {
        // 1. Buat akun Auth dulu
        const password = data.password || 'smpn13ppu';
        console.log('📝 Membuat akun Auth untuk guru:', data.email, 'dengan password:', password);
        
        const { data: authData, error: authError } = await client.auth.signUp({
            email: data.email,
            password: password,
            options: {
                data: { 
                    role: 'guru', 
                    name: data.nama,
                    nip: data.nip
                }
            }
        });
        
        if (authError) {
            console.error('❌ Auth error:', authError);
            if (!authError.message.includes('already registered')) {
                return null;
            }
        }
        
        console.log('✅ Auth berhasil:', authData?.user?.id || 'sudah terdaftar');
        
        // 2. Simpan ke tabel guru dengan user_id
        const guruData = {
            ...data,
            user_id: authData?.user?.id || null,
            password: password
        };
        
        const { data: result, error } = await client
            .from('guru')
            .insert([guruData])
            .select()
            .single();
            
        if (error) {
            console.error('❌ Insert error:', error);
            throw error;
        }
        
        console.log('✅ Guru berhasil ditambahkan:', result);
        return result;
    } catch (error) {
        console.error('❌ Error add guru:', error);
        return null;
    }
}

async function adminUpdateGuru(id, data) {
    const client = getSupabase();
    if (!client) return null;
    try {
        const { data: result, error } = await client.from('guru').update(data).eq('id', id).select().single();
        if (error) throw error;
        return result;
    } catch (error) {
        console.error('❌ Error update guru:', error);
        return null;
    }
}

async function adminDeleteGuru(id) {
    const client = getSupabase();
    if (!client) return false;
    try {
        const { error } = await client.from('guru').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error delete guru:', error);
        return false;
    }
}

// ============================================
// ADMIN - CRUD ORANG TUA
// ============================================
async function adminGetOrangTua() {
    const client = getSupabase();
    if (!client) return [];
    try {
        const { data, error } = await client.from('orangtua').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error get orangtua:', error);
        return [];
    }
}

async function adminAddOrangTua(data) {
    const client = getSupabase();
    if (!client) return null;
    try {
        // 1. Buat akun Auth dulu
        const password = data.password || 'smpn13ppu';
        console.log('📝 Membuat akun Auth untuk orang tua:', data.email, 'dengan password:', password);
        
        const { data: authData, error: authError } = await client.auth.signUp({
            email: data.email,
            password: password,
            options: {
                data: { 
                    role: 'orangtua', 
                    name: data.nama,
                    id_orangtua: data.id_orangtua
                }
            }
        });
        
        if (authError) {
            console.error('❌ Auth error:', authError);
            if (!authError.message.includes('already registered')) {
                return null;
            }
        }
        
        console.log('✅ Auth berhasil:', authData?.user?.id || 'sudah terdaftar');
        
        // 2. Simpan ke tabel orangtua dengan user_id
        const ortuData = {
            ...data,
            user_id: authData?.user?.id || null,
            password: password
        };
        
        const { data: result, error } = await client
            .from('orangtua')
            .insert([ortuData])
            .select()
            .single();
            
        if (error) {
            console.error('❌ Insert error:', error);
            throw error;
        }
        
        console.log('✅ Orang tua berhasil ditambahkan:', result);
        return result;
    } catch (error) {
        console.error('❌ Error add orangtua:', error);
        return null;
    }
}

async function adminUpdateOrangTua(id, data) {
    const client = getSupabase();
    if (!client) return null;
    try {
        const { data: result, error } = await client.from('orangtua').update(data).eq('id', id).select().single();
        if (error) throw error;
        return result;
    } catch (error) {
        console.error('❌ Error update orangtua:', error);
        return null;
    }
}

async function adminDeleteOrangTua(id) {
    const client = getSupabase();
    if (!client) return false;
    try {
        const { error } = await client.from('orangtua').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error delete orangtua:', error);
        return false;
    }
}

// ============================================
// ADMIN - CRUD KONSELING
// ============================================
async function adminGetKonseling() {
    const client = getSupabase();
    if (!client) return [];
    try {
        const { data, error } = await client.from('konseling').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error get konseling:', error);
        return [];
    }
}

async function adminDeleteKonseling(id) {
    const client = getSupabase();
    if (!client) return false;
    try {
        const { error } = await client.from('konseling').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error delete konseling:', error);
        return false;
    }
}

// ============================================
// ADMIN - CRUD KONSULTASI
// ============================================
async function adminGetKonsultasi() {
    const client = getSupabase();
    if (!client) return [];
    try {
        const { data, error } = await client.from('konsultasi').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error get konsultasi:', error);
        return [];
    }
}

async function adminDeleteKonsultasi(id) {
    const client = getSupabase();
    if (!client) return false;
    try {
        const { error } = await client.from('konsultasi').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error delete konsultasi:', error);
        return false;
    }
}

// ============================================
// ADMIN - CRUD JADWAL KONSELING
// ============================================
async function adminGetJadwal() {
    const client = getSupabase();
    if (!client) return [];
    try {
        const { data, error } = await client.from('jadwal_konseling').select('*').order('tanggal', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error get jadwal:', error);
        return [];
    }
}

async function adminDeleteJadwal(id) {
    const client = getSupabase();
    if (!client) return false;
    try {
        const { error } = await client.from('jadwal_konseling').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error delete jadwal:', error);
        return false;
    }
}

// ============================================
// ADMIN - CRUD REKAM MEDIS
// ============================================
async function adminGetRekamMedis() {
    const client = getSupabase();
    if (!client) return [];
    try {
        const { data, error } = await client.from('rekam_medis').select('*').order('tanggal', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error get rekam medis:', error);
        return [];
    }
}

async function adminDeleteRekamMedis(id) {
    const client = getSupabase();
    if (!client) return false;
    try {
        const { error } = await client.from('rekam_medis').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error delete rekam medis:', error);
        return false;
    }
}
     // ============================================
    // EXPOSE TO GLOBAL
    // ============================================
    window.getSiswaByNis = getSiswaByNis;
    window.ensureSiswaExists = ensureSiswaExists;
    window.getRekamMedisBySiswa = getRekamMedisBySiswa;
    window.getKonselingByGuru = getKonselingByGuru;
    window.getSupabase = getSupabase;
    window.loginUser = loginUser;
    window.registerUser = registerUser;
    window.registerSiswa = registerSiswa;
    window.registerOrangTua = registerOrangTua;
    window.getData = getData;
    window.insertData = insertData;
    window.updateData = updateData;
    window.deleteData = deleteData;
    window.testSupabaseConnection = testSupabaseConnection;
    window.getStatistics = getStatistics;
    window.adminLogin = adminLogin;
    window.getArticles = getArticles;
    window.getArticleById = getArticleById;
    window.saveArticle = saveArticle;
    window.deleteArticle = deleteArticle;
    window.cekNIS = cekNIS;
    window.cekEmail = cekEmail;
    
    // ADMIN CRUD
    window.adminGetSiswa = adminGetSiswa;
    window.adminAddSiswa = adminAddSiswa;
    window.adminUpdateSiswa = adminUpdateSiswa;
    window.adminDeleteSiswa = adminDeleteSiswa;
    window.adminGetGuru = adminGetGuru;
    window.adminAddGuru = adminAddGuru;
    window.adminUpdateGuru = adminUpdateGuru;
    window.adminDeleteGuru = adminDeleteGuru;
    window.adminGetOrangTua = adminGetOrangTua;
    window.adminAddOrangTua = adminAddOrangTua;
    window.adminUpdateOrangTua = adminUpdateOrangTua;
    window.adminDeleteOrangTua = adminDeleteOrangTua;
    window.adminGetKonseling = adminGetKonseling;
    window.adminDeleteKonseling = adminDeleteKonseling;
    window.adminGetKonsultasi = adminGetKonsultasi;
    window.adminDeleteKonsultasi = adminDeleteKonsultasi;
    window.adminGetJadwal = adminGetJadwal;
    window.adminDeleteJadwal = adminDeleteJadwal;
    window.adminGetRekamMedis = adminGetRekamMedis;
    window.adminDeleteRekamMedis = adminDeleteRekamMedis;
    window.uploadImage = uploadImage;
    window.deleteImage = deleteImage;
    
    
    console.log('✅ supabase-client.js loaded!');
    console.log('📱 Available functions:');
    console.log('   - getSupabase()');
    console.log('   - loginUser(email, password, role)');
    console.log('   - registerUser(data, role)');
    console.log('   - getData(table, filters)');
    console.log('   - insertData(table, data)');
    console.log('   - updateData(table, id, data)');
    console.log('   - deleteData(table, id)');
    console.log('   - testSupabaseConnection()');
    console.log('   - getStatistics(forceRefresh)');
    console.log('   - adminLogin(username, password)');
    console.log('   - admin CRUD functions');
    console.log('adminGetSiswa:', typeof window.adminGetSiswa);
console.log('getSupabase:', typeof window.getSupabase);
    
})();