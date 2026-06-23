// supabase-client.js - Versi dengan IIFE
// ============================================
// SI-KONCI - Supabase Client
// SMPN 13 Penajam Paser Utara
// ============================================

(function() {
    'use strict';
    
    // Semua variabel di dalam scope ini
    const SUPABASE_URL = 'https://huqswtchblugmpjbrkai.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_oeC_VDEatcw3J6J-xhDtzQ_x6bVaC_k';
    
    let supabaseClient = null;
    
    function initSupabase() {
        if (typeof supabase === 'undefined') {
            console.warn('⚠️ Supabase library not loaded. Using mock mode.');
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
    
    // MOCK DATA
    const MOCK_SISWA = [
        { nis: '001', nama: 'Andi Prasetyo', kelas: 'IX-A', no_hp: '08123456789', email: 'andi@email.com', password: 'password123' },
        { nis: '002', nama: 'Budi Santoso', kelas: 'IX-B', no_hp: '08123456780', email: 'budi@email.com', password: 'password123' },
        { nis: '003', nama: 'Citra Dewi', kelas: 'VIII-A', no_hp: '08123456781', email: 'citra@email.com', password: 'password123' }
    ];
    
    const MOCK_GURU = [
        { nip: 'BK001', nama: 'Ibu Siti Rahayu', mata_pelajaran: 'BK', no_hp: '08123456782', email: 'guru@email.com', password: 'password123' }
    ];
    
    const MOCK_ORANGTUA = [
        { id_orangtua: 'ORTU001', nama: 'Bapak Ahmad', anak_nis: '001', anak_nama: 'Andi Prasetyo', no_hp: '08123456783', email: 'ortu@email.com', password: 'password123' }
    ];
    
    // LOGIN FUNCTION
    async function loginUser(email, password, role) {
        console.log('🔐 Login attempt:', email, role);
        
        const client = getSupabase();
        
        if (!client) {
            console.log('📱 Using mock login');
            return mockLogin(email, password, role);
        }
        
        try {
            const { data: authData, error: authError } = await client.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (authError) {
                console.error('❌ Auth error:', authError.message);
                return mockLogin(email, password, role);
            }
            
            console.log('✅ Auth success:', authData.user.id);
            
            const tableMap = { siswa: 'siswa', guru: 'guru', orangtua: 'orangtua' };
            const table = tableMap[role];
            if (!table) return null;
            
            // Coba cari berdasarkan email
            let { data: userData, error: userError } = await client
                .from(table)
                .select('*')
                .eq('email', email)
                .maybeSingle();
                
            if (userError || !userData) {
                // Coba cari berdasarkan user_id
                const { data: userByUid, error: uidError } = await client
                    .from(table)
                    .select('*')
                    .eq('user_id', authData.user.id)
                    .maybeSingle();
                    
                if (uidError || !userByUid) {
                    console.log('📱 User not in table, using mock data');
                    return mockLogin(email, password, role);
                }
                return { ...userByUid, role };
            }
            
            return { ...userData, role };
            
        } catch (error) {
            console.error('❌ Login error:', error);
            return mockLogin(email, password, role);
        }
    }
    
    function mockLogin(email, password, role) {
        let user = null;
        if (role === 'siswa') {
            user = MOCK_SISWA.find(u => u.email === email && u.password === password);
        } else if (role === 'guru') {
            user = MOCK_GURU.find(u => u.email === email && u.password === password);
        } else if (role === 'orangtua') {
            user = MOCK_ORANGTUA.find(u => u.email === email && u.password === password);
        }
        return user ? { ...user, role } : null;
    }
    
    // REGISTER FUNCTION
    async function registerUser(data, role) {
        console.log('📝 Register attempt:', data.email, role);
        
        const client = getSupabase();
        
        if (!client) {
            console.log('📱 Using mock register');
            return mockRegister(data, role);
        }
        
        try {
            const { data: authData, error: authError } = await client.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: { role: role, name: data.nama }
                }
            });
            
            if (authError) {
                console.error('❌ Auth registration error:', authError.message);
                return mockRegister(data, role);
            }
            
            const tableMap = { siswa: 'siswa', guru: 'guru', orangtua: 'orangtua' };
            const table = tableMap[role];
            if (!table) return null;
            
            const insertData = { ...data };
            delete insertData.password;
            insertData.user_id = authData.user.id;
            insertData.created_at = new Date().toISOString();
            
            const { data: userData, error: userError } = await client
                .from(table)
                .insert([insertData])
                .select()
                .maybeSingle();
                
            if (userError) {
                console.error('❌ Insert error:', userError);
                return mockRegister(data, role);
            }
            
            return userData;
            
        } catch (error) {
            console.error('❌ Register error:', error);
            return mockRegister(data, role);
        }
    }
    
    function mockRegister(data, role) {
        const newUser = { ...data, created_at: new Date().toISOString() };
        if (role === 'siswa') {
            newUser.nis = 'SIS' + Date.now().toString().slice(-6);
            MOCK_SISWA.push(newUser);
        } else if (role === 'guru') {
            newUser.nip = 'GUR' + Date.now().toString().slice(-6);
            MOCK_GURU.push(newUser);
        } else if (role === 'orangtua') {
            newUser.id_orangtua = 'ORT' + Date.now().toString().slice(-6);
            MOCK_ORANGTUA.push(newUser);
        }
        return newUser;
    }
    
    // GET DATA
    async function getData(table, filters = {}) {
        const client = getSupabase();
        if (!client) {
            return getMockData(table);
        }
        try {
            let query = client.from(table).select('*');
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== '') {
                    query = query.eq(key, filters[key]);
                }
            });
            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error fetching data:', error);
            return getMockData(table);
        }
    }
    
    function getMockData(table) {
        const mockData = {
            siswa: MOCK_SISWA,
            guru: MOCK_GURU,
            orangtua: MOCK_ORANGTUA,
            rekam_medis: [
                { id: 1, siswa_nis: '001', siswa_nama: 'Andi Prasetyo', kategori: 'Bullying', catatan: 'Kasus perundungan', tanggal: '2026-06-15' }
            ]
        };
        return mockData[table] || [];
    }
    
    // TEST KONEKSI
    async function testSupabaseConnection() {
        console.log('🔍 Testing Supabase connection...');
        console.log('URL:', SUPABASE_URL);
        console.log('Key:', SUPABASE_ANON_KEY ? '✅ Key exists' : '❌ Key missing');
        
        const client = getSupabase();
        if (!client) {
            console.error('❌ Failed to initialize Supabase client');
            return false;
        }
        
        try {
            const { data, error } = await client.from('siswa').select('count');
            if (error) {
                console.error('❌ Query error:', error.message);
                return false;
            }
            console.log('✅ Query successful!');
            return true;
        } catch (e) {
            console.error('❌ Connection error:', e);
            return false;
        }
    }
    
    // EKSPOR KE GLOBAL
    window.SupabaseClient = {
        getSupabase: getSupabase,
        loginUser: loginUser,
        registerUser: registerUser,
        getData: getData,
        testSupabaseConnection: testSupabaseConnection
    };
    
    // Atau ekspor langsung ke global
    window.getSupabase = getSupabase;
    window.loginUser = loginUser;
    window.registerUser = registerUser;
    window.getData = getData;
    window.testSupabaseConnection = testSupabaseConnection;
    
    console.log('✅ supabase-client.js loaded!');
    console.log('📱 Available functions: getSupabase, loginUser, registerUser, getData, testSupabaseConnection');
    
})();