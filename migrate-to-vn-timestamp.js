require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrateTimestamps() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Bắt đầu chuyển đổi timestamp sang giờ VN...\n');
        
        // Đổi các cột time từ TIMESTAMPTZ sang TIMESTAMP
        console.log('1️⃣ Đổi mqtt_data.time sang TIMESTAMP...');
        await client.query(`
            ALTER TABLE mqtt_data 
            ALTER COLUMN time TYPE TIMESTAMP 
            USING time AT TIME ZONE 'Asia/Ho_Chi_Minh'
        `);
        console.log('   ✅ Hoàn thành mqtt_data');
        
        console.log('2️⃣ Đổi scada_data.time sang TIMESTAMP...');
        await client.query(`
            ALTER TABLE scada_data 
            ALTER COLUMN time TYPE TIMESTAMP 
            USING time AT TIME ZONE 'Asia/Ho_Chi_Minh'
        `);
        console.log('   ✅ Hoàn thành scada_data');
        
        console.log('3️⃣ Đổi tva_data.time sang TIMESTAMP...');
        await client.query(`
            ALTER TABLE tva_data 
            ALTER COLUMN time TYPE TIMESTAMP 
            USING time AT TIME ZONE 'Asia/Ho_Chi_Minh'
        `);
        console.log('   ✅ Hoàn thành tva_data');
        
        // Kiểm tra kết quả
        console.log('\n🧪 Kiểm tra dữ liệu sau khi convert:');
        const mqttCheck = await client.query('SELECT station_id, time FROM mqtt_data ORDER BY time DESC LIMIT 3');
        console.log('\nMQTT Data:');
        mqttCheck.rows.forEach(row => {
            console.log(`  ${row.station_id}: ${row.time}`);
        });
        
        const scadaCheck = await client.query('SELECT station_id, time FROM scada_data ORDER BY time DESC LIMIT 3');
        console.log('\nSCADA Data:');
        scadaCheck.rows.forEach(row => {
            console.log(`  ${row.station_id}: ${row.time}`);
        });
        
        console.log('\n✅ Migration hoàn tất! Bây giờ database sẽ lưu giờ VN (GMT+7)');
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrateTimestamps();
