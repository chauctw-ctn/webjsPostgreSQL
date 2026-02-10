require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Set timezone to Vietnam (GMT+7) for all connections
pool.on('connect', (client) => {
    client.query("SET timezone = 'Asia/Ho_Chi_Minh'");
});

async function checkDatabaseTimestamps() {
    const client = await pool.connect();
    
    try {
        console.log('📊 Kiểm tra timestamps trong database:\n');
        
        // Check TVA data
        console.log('1️⃣ TVA Data (5 records mới nhất):');
        const tvaResult = await client.query(`
            SELECT station_name, parameter_name, value, timestamp,
                   TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') as formatted_time
            FROM tva_data 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        if (tvaResult.rows.length > 0) {
            tvaResult.rows.forEach(row => {
                console.log(`   ${row.station_name} - ${row.parameter_name}`);
                console.log(`   └─ Timestamp: ${row.formatted_time} (${row.value} ${row.parameter_name})`);
            });
        } else {
            console.log('   ⚠️ Chưa có dữ liệu TVA');
        }
        
        // Check MQTT data
        console.log('\n2️⃣ MQTT Data (5 records mới nhất):');
        const mqttResult = await client.query(`
            SELECT station_name, parameter_name, value, timestamp,
                   TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') as formatted_time
            FROM mqtt_data 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        if (mqttResult.rows.length > 0) {
            mqttResult.rows.forEach(row => {
                console.log(`   ${row.station_name} - ${row.parameter_name}`);
                console.log(`   └─ Timestamp: ${row.formatted_time}`);
            });
        } else {
            console.log('   ⚠️ Chưa có dữ liệu MQTT');
        }
        
        // Check SCADA data
        console.log('\n3️⃣ SCADA Data (5 records mới nhất):');
        const scadaResult = await client.query(`
            SELECT station_name, parameter_name, value, timestamp,
                   TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') as formatted_time
            FROM scada_data 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        if (scadaResult.rows.length > 0) {
            scadaResult.rows.forEach(row => {
                console.log(`   ${row.station_name} - ${row.parameter_name}`);
                console.log(`   └─ Timestamp: ${row.formatted_time}`);
            });
        } else {
            console.log('   ⚠️ Chưa có dữ liệu SCADA');
        }
        
        // Compare with current time
        console.log('\n4️⃣ So sánh với thời gian hiện tại:');
        const now = new Date();
        console.log(`   Thời gian Node.js (VN): ${now.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`);
        
        const pgNow = await client.query('SELECT NOW() as current_time, TO_CHAR(NOW(), \'YYYY-MM-DD HH24:MI:SS\') as formatted');
        console.log(`   Thời gian PostgreSQL:   ${pgNow.rows[0].formatted}`);
        
        console.log('\n✅ Kiểm tra hoàn tất!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkDatabaseTimestamps();
