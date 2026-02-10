require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkSchema() {
    const client = await pool.connect();
    
    try {
        console.log('📋 Kiểm tra schema của các bảng:\n');
        
        const tables = ['mqtt_data', 'scada_data', 'tva_data'];
        
        for (const table of tables) {
            console.log(`\n🔍 Table: ${table}`);
            const result = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            
            if (result.rows.length > 0) {
                result.rows.forEach(row => {
                    console.log(`   ${row.column_name}: ${row.data_type}`);
                });
            } else {
                console.log('   ❌ Bảng không tồn tại');
            }
        }
        
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema().catch(console.error);
