const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/aprv3',
});

async function runSeeder() {
    const client = await pool.connect();

    try {
        console.log('🚀 Memulai Database Seeder APR V3...');
        await client.query('BEGIN'); // Start Transaction

        // ------------------------------------------------------------------------
        // 1. Seed MASTER_JF
        // ------------------------------------------------------------------------
        console.log('📦 Seeding MASTER_JF...');
        
        // Aturan DB kita: complexity adalah VARCHAR ('LOW', 'MEDIUM', 'HIGH')
        // JC 1.25 -> LOW | JC 2.75 -> MEDIUM
        // cross_policy adalah BOOLEAN
        const jfs = [
            { jf: 'IDP', position: 'System Dev', bobot: 0.10, complexity: 'LOW', cross_policy: true },
            { jf: 'PERDIN', position: 'Administration', bobot: 0.10, complexity: 'LOW', cross_policy: true },
            { jf: 'IR', position: 'Legal & Contract', bobot: 0.10, complexity: 'MEDIUM', cross_policy: true }
        ];

        for (const j of jfs) {
            await client.query(
                `INSERT INTO MASTER_JF (jf, position, bobot, complexity, cross_policy) 
                 VALUES ($1, $2, $3, $4, $5) 
                 ON CONFLICT (jf) DO NOTHING`,
                [j.jf, j.position, j.bobot, j.complexity, j.cross_policy]
            );
        }

        // ------------------------------------------------------------------------
        // 2. Seed USERS
        // ------------------------------------------------------------------------
        console.log('👤 Seeding USERS...');
        const defaultPinHash = await bcrypt.hash('123456', 10);
        
        // Kita menggunakan crypto.randomUUID() untuk mengenerate NRP unik (VARCHAR) 
        // karena id di database kita adalah tipe SERIAL (auto-increment)
        const usersData = [
            { nrp: crypto.randomUUID(), nama: 'FIRGI', role: 'Staff', position: 'System Dev' },
            { nrp: crypto.randomUUID(), nama: 'ZIAN', role: 'Staff', position: 'Administration' },
            { nrp: crypto.randomUUID(), nama: 'ARI', role: 'Staff', position: 'Administration' },
            { nrp: crypto.randomUUID(), nama: 'DAFFA', role: 'Staff', position: 'Legal & Contract' }
        ];

        for (const u of usersData) {
            await client.query(
                `INSERT INTO USERS (nrp, pin_hash, nama, role, position, tier, is_active) 
                 VALUES ($1, $2, $3, $4, $5, 'Silver', true)`,
                [u.nrp, defaultPinHash, u.nama, u.role, u.position]
            );
        }

        // Helper untuk mendapatkan NRP berdasarkan nama
        const getNrP = (name) => usersData.find(u => u.nama === name).nrp;

        // ------------------------------------------------------------------------
        // 3. Seed TASKS
        // ------------------------------------------------------------------------
        console.log('📋 Seeding TASKS...');
        
        const tasksData = [
            // FIRGI (System Dev) -> JF: IDP
            { title: 'Peninjauan, Pembuatan, pendistribusian & Sosialisasi Dokumen SMK3L/ HIMS/ FAD', assignee: getNrP('FIRGI'), jf: 'IDP' },
            { title: 'Pelaksanaan Training Terkait SMK3L (Document Control, Awareness & Internal Audit, RAO)', assignee: getNrP('FIRGI'), jf: 'IDP' },
            { title: 'Bertanggung jawab terhadap Pengkajian SOP, INK, STD dan mensupport All Dept', assignee: getNrP('FIRGI'), jf: 'IDP' },

            // ZIAN (Administration) -> JF: PERDIN
            { title: 'Kelengkapan Data SAP target 98%', assignee: getNrP('ZIAN'), jf: 'PERDIN' },
            { title: 'Data pencairan comben 90% (perumahan, persalinan, sukacita/dukacita, COP, Admedika, dll)', assignee: getNrP('ZIAN'), jf: 'PERDIN' },
            { title: 'Kelengkapan dan service administrasi bagi karyawan 90%', assignee: getNrP('ZIAN'), jf: 'PERDIN' },

            // ARI (Administration) -> JF: PERDIN
            { title: 'Kelengkapan Data SAP target 98%', assignee: getNrP('ARI'), jf: 'PERDIN' },
            { title: 'Data pencairan comben 90% (perumahan, persalinan, sukacita/dukacita, COP, Admedika, dll)', assignee: getNrP('ARI'), jf: 'PERDIN' },
            { title: 'Kelengkapan dan service administrasi bagi karyawan 90%', assignee: getNrP('ARI'), jf: 'PERDIN' },

            // DAFFA (Legal & Contract) -> JF: IR
            { title: 'Drafting dan review Draft Kontrak Bisnis dengan customer / pemilik IUP (Berau, BRE, AGM, EBL)', assignee: getNrP('DAFFA'), jf: 'IR' }
        ];

        for (const t of tasksData) {
            await client.query(
                `INSERT INTO TASKS (title, jf, assignee_nrp, status, need_plan, is_self) 
                 VALUES ($1, $2, $3, 'Planning', true, false)`,
                [t.title, t.jf, t.assignee]
            );
        }

        await client.query('COMMIT'); // Commit Transaction jika semua berhasil
        console.log('✅ Seeding berhasil diselesaikan!');

    } catch (error) {
        await client.query('ROLLBACK'); // Rollback jika ada error
        console.error('❌ Seeding gagal, transaksi dibatalkan:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runSeeder();
