require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.on('connect', (client) => {
    client.query("SET timezone = 'Asia/Ho_Chi_Minh'");
});

async function findTestRecords() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Tìm records có timestamp chính xác từ test:\n');
        
        // Tìm records tại 23:30:06 (từ MQTT test)
        console.log('1️⃣ MQTT records tại 23:30:06:');
        const mqtt = await client.query(`
            SELECT station_name,
                   TO_CHAR(timestamp, 'DD/MM/YYYY HH24:MI:SS') as time,
                   value
            FROM mqtt_data 
            WHERE TO_CHAR(timestamp, 'HH24:MI:SS') = '23:30:06'
            LIMIT 10
        `);
        
        if (mqtt.rows.length > 0) {
            mqtt.rows.forEach(r => console.log(`   ${r.station_name}: ${r.time}`));
            console.log(`   ✅ Tìm thấy ${mqtt.rowCount} records`);
        } else {
            console.log('   ⚠️ Không tìm thấy');
        }
        
        // Tìm records tại 20:32:18 (từ SCADA test)
        console.log('\n2️⃣ SCADA records tại 20:32:18:');
        const scada = await client.query(`
            SELECT station_name,
                   TO_CHAR(timestamp, 'DD/MM/YYYY HH24:MI:SS') as time,
                   value
            FROM scada_data 
            WHERE TO_CHAR(timestamp, 'HH24:MI:SS') = '20:32:18'
            LIMIT 10
        `);
        
        if (scada.rows.length > 0) {
            scada.rows.forEach(r => console.log(`   ${r.station_name}: ${r.time}`));
            console.log(`   ✅ Tìm thấy ${scada.rowCount} records`);
        } else {
            console.log('   ⚠️ Không tìm thấy');
        }
        
        console.log('\n📝 Kết luận:');
        if (mqtt.rows.length > 0 && scada.rows.length > 0) {
            console.log('   ✅ Timestamp từ dữ liệu gốc được lưu CHÍNH XÁC!');
        } else {
            console.log('   ℹ️ Records test có thể đã bị cleanup hoặc ghi đè');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

findTestRecords();
