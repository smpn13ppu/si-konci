// supabase-client.js
// PASTIKAN INI BENAR:
const SUPABASE_URL = 'https://huqswtchblugmpjbrkai.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oeC_VDEatcw3J6J-xhDtzQ_x6bVaC_k'; // KEY ANDA

// PASTIKAN INI JUGA ADA:
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.warn('Supabase library not loaded. Using mock mode.');
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

// ============================================
// CRUD OPERATIONS
// ============================================

// GET - Read data
async function getData(table, filters = {}, options = {}) {
    const client = getSupabase();
    if (!client) {
        console.warn('Supabase not available, using mock data');
        return getMockData(table);
    }
    
    try {
        let query = client.from(table).select('*');
        
        // Apply filters
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                query = query.eq(key, filters[key]);
            }
        });
        
        // Apply order
        if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending !== false });
        }
        
        // Apply limit
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

// INSERT - Create data
async function insertData(table, data) {
    const client = getSupabase();
    if (!client) {
        console.warn('Supabase not available, using mock insert');
        return mockInsert(table, data);
    }
    
    try {
        const { data: result, error } = await client
            .from(table)
            .insert([data])
            .select();
            
        if (error) throw error;
        return result;
    } catch (error) {
        console.error('Error inserting data:', error);
        return null;
    }
}

// UPDATE - Update data
async function updateData(table, id, data, idColumn = 'id') {
    const client = getSupabase();
    if (!client) {
        console.warn('Supabase not available, using mock update');
        return mockUpdate(table, id, data);
    }
    
    try {
        const { data: result, error } = await client
            .from(table)
            .update(data)
            .eq(idColumn, id)
            .select();
            
        if (error) throw error;
        return result;
    } catch (error) {
        console.error('Error updating data:', error);
        return null;
    }
}

// DELETE - Delete data
async function deleteData(table, id, idColumn = 'id') {
    const client = getSupabase();
    if (!client) {
        console.warn('Supabase not available, using mock delete');
        return mockDelete(table, id);
    }
    
    try {
        const { data, error } = await client
            .from(table)
            .delete()
            .eq(idColumn, id)
            .select();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error deleting data:', error);
        return null;
    }
}

// ============================================
// MOCK DATA (untuk development tanpa Supabase)
// ============================================

let mockData = {
    siswa: [
        { nis: '001', nama: 'Andi Prasetyo', kelas: 'IX-A', no_hp: '08123456789', email: 'andi@email.com', password: 'password123', created_at: new Date().toISOString() },
        { nis: '002', nama: 'Budi Santoso', kelas: 'IX-B', no_hp: '08123456780', email: 'budi@email.com', password: 'password123', created_at: new Date().toISOString() },
        { nis: '003', nama: 'Citra Dewi', kelas: 'VIII-A', no_hp: '08123456781', email: 'citra@email.com', password: 'password123', created_at: new Date().toISOString() }
    ],
    rekam_medis: [
        { id: 1, siswa_nis: '001', siswa_nama: 'Andi Prasetyo', guru_nip: 'BK001', kategori: 'Bullying', catatan: 'Melaporkan kasus perundungan di kelas. Tindakan: Mediasi dan pemantauan.', tindakan: 'Mediasi', tanggal: '2026-06-15' },
        { id: 2, siswa_nis: '002', siswa_nama: 'Budi Santoso', guru_nip: 'BK001', kategori: 'Stres', catatan: 'Keluhan stres menghadapi ujian. Tindakan: Teknik relaksasi dan manajemen waktu.', tindakan: 'Relaksasi', tanggal: '2026-06-12' }
    ]
};

function getMockData(table) {
    return mockData[table] || [];
}

function mockInsert(table, data) {
    const tableData = mockData[table] || [];
    data.id = tableData.length + 1;
    tableData.push(data);
    return [data];
}

function mockUpdate(table, id, data) {
    const tableData = mockData[table] || [];
    const index = tableData.findIndex(item => item.id === id);
    if (index !== -1) {
        tableData[index] = { ...tableData[index], ...data };
        return [tableData[index]];
    }
    return null;
}

function mockDelete(table, id) {
    const tableData = mockData[table] || [];
    const index = tableData.findIndex(item => item.id === id);
    if (index !== -1) {
        const deleted = tableData.splice(index, 1);
        return deleted;
    }
    return null;
}

// ============================================
// AUTH FUNCTIONS
// ============================================

// supabase-client.js - Perbaiki fungsi login

// LOGIN FUNCTION - VERSI PERBAIKAN
async function loginUser(email, password, role) {
    console.log('🔐 Attempting login:', email, role);
    
    const client = getSupabase();
    if (!client) {
        console.warn('⚠️ Supabase not available, using mock login');
        return mockLogin(email, password, role);
    }
    
    try {
        // Step 1: Authenticate with Supabase Auth
        const { data: authData, error: authError } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (authError) {
            console.error('❌ Auth error:', authError);
            return null;
        }
        
        console.log('✅ Auth successful:', authData.user.id);
        
        // Step 2: Get user profile from respective table
        const table = {
            siswa: 'siswa',
            guru: 'guru',
            orangtua: 'orangtua'
        }[role];
        
        if (!table) {
            console.error('❌ Invalid role:', role);
            return null;
        }
        
        // Coba cari user berdasarkan email
        const { data: userData, error: userError } = await client
            .from(table)
            .select('*')
            .eq('email', email)
            .maybeSingle(); // Gunakan maybeSingle() bukan single()
            
        if (userError) {
            console.error('❌ Error fetching user data:', userError);
            // Coba cari berdasarkan user_id
            const { data: userByUid, error: uidError } = await client
                .from(table)
                .select('*')
                .eq('user_id', authData.user.id)
                .maybeSingle();
                
            if (uidError || !userByUid) {
                console.error('❌ User not found in table:', table);
                return null;
            }
            
            return { ...userByUid, role };
        }
        
        if (!userData) {
            console.error('❌ User not found in table:', table);
            return null;
        }
        
        return { ...userData, role };
        
    } catch (error) {
        console.error('❌ Login error:', error);
        return null;
    }
}

// MOCK LOGIN untuk development
function mockLogin(email, password, role) {
    console.log('📱 Mock login:', email, password, role);
    const mockUsers = {
        siswa: [
            { nis: '001', nama: 'Andi Prasetyo', kelas: 'IX-A', email: 'andi@email.com', password: 'password123' },
            { nis: '002', nama: 'Budi Santoso', kelas: 'IX-B', email: 'budi@email.com', password: 'password123' }
        ],
        guru: [
            { nip: 'BK001', nama: 'Ibu Siti', email: 'guru@email.com', password: 'password123' }
        ],
        orangtua: [
            { id_orangtua: 'ORTU001', nama: 'Bapak Ahmad', email: 'ortu@email.com', password: 'password123' }
        ]
    };
    
    const users = mockUsers[role] || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        console.log('✅ Mock login successful:', user.nama);
        return { ...user, role };
    }
    
    console.error('❌ Mock login failed');
    return null;
}
// supabase-client.js - Perbaiki fungsi register

async function registerUser(data, role) {
    console.log('📝 Attempting registration:', data.email, role);
    
    const client = getSupabase();
    if (!client) {
        console.warn('⚠️ Supabase not available, using mock register');
        return mockRegister(data, role);
    }
    
    try {
        // Step 1: Register with Supabase Auth
        const { data: authData, error: authError } = await client.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    role: role,
                    name: data.nama || data.name
                }
            }
        });
        
        if (authError) {
            console.error('❌ Auth registration error:', authError);
            return null;
        }
        
        if (!authData.user) {
            console.error('❌ No user returned from auth');
            return null;
        }
        
        console.log('✅ Auth registration successful:', authData.user.id);
        
        // Step 2: Save user profile
        const table = {
            siswa: 'siswa',
            guru: 'guru',
            orangtua: 'orangtua'
        }[role];
        
        if (!table) {
            console.error('❌ Invalid role:', role);
            return null;
        }
        
        // Prepare data for insert
        const insertData = {
            ...data,
            user_id: authData.user.id,
            created_at: new Date().toISOString()
        };
        
        // Remove password from insert (we already have it in auth)
        delete insertData.password;
        
        console.log('📤 Inserting user data:', insertData);
        
        const { data: userData, error: userError } = await client
            .from(table)
            .insert([insertData])
            .select()
            .maybeSingle();
            
        if (userError) {
            console.error('❌ Error inserting user data:', userError);
            // If insert fails, try update
            const { data: updateData, error: updateError } = await client
                .from(table)
                .update(insertData)
                .eq('user_id', authData.user.id)
                .select()
                .maybeSingle();
                
            if (updateError) {
                console.error('❌ Error updating user data:', updateError);
                return null;
            }
            
            return updateData;
        }
        
        console.log('✅ Registration complete:', userData);
        return userData;
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        return null;
    }
}

// ============================================
// EXPORTS
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSupabase,
        getData,
        insertData,
        updateData,
        deleteData,
        loginUser,
        registerUser,
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    };
}
