require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.on('connect', (client) => {
    client.query("SET timezone = 'Asia/Ho_Chi_Minh'");
});

async function checkOldTimestamps() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Kiểm tra records từ ngày 10/02/2026:\n');
        
        // MQTT từ ngày 10
        console.log('1️⃣ MQTT Data từ 10/02:');
        const mqtt = await client.query(`
            SELECT station_name, parameter_name, 
                   TO_CHAR(timestamp, 'DD/MM/YYYY HH24:MI:SS') as time
            FROM mqtt_data 
            WHERE timestamp >= '2026-02-10' AND timestamp < '2026-02-11'
            ORDER BY timestamp DESC 
            LIMIT 5
        `);
        
        if (mqtt.rows.length > 0) {
            mqtt.rows.forEach(r => console.log(`   ${r.station_name}: ${r.time}`));
            console.log(`   ✅ Tìm thấy ${mqtt.rowCount} records từ ngày 10`);
        } else {
            console.log('   ⚠️ Không có records từ ngày 10');
        }
        
        // SCADA từ ngày 10
        console.log('\n2️⃣ SCADA Data từ 10/02:');
        const scada = await client.query(`
            SELECT station_name, parameter_name,
                   TO_CHAR(timestamp, 'DD/MM/YYYY HH24:MI:SS') as time
            FROM scada_data 
            WHERE timestamp >= '2026-02-10' AND timestamp < '2026-02-11'
            ORDER BY timestamp DESC 
            LIMIT 5
        `);
        
        if (scada.rows.length > 0) {
            scada.rows.forEach(r => console.log(`   ${r.station_name}: ${r.time}`));
            console.log(`   ✅ Tìm thấy ${scada.rowCount} records từ ngày 10`);
        } else {
            console.log('   ⚠️ Không có records từ ngày 10');
        }
        
        console.log('\n✅ Kiểm tra hoàn tất!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkOldTimestamps();
