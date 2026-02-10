require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkNewTimestamps() {
    const client = await pool.connect();
    
    try {
        console.log('🕐 Kiểm tra timestamp mới nhất:\n');
        
        // Thời gian máy
        const now = new Date();
        console.log('⏰ Thời gian máy:');
        console.log('  new Date():', now);
        console.log('  Giờ VN:', now.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'}));
        
        // Dữ liệu mới nhất từ database
        console.log('\n📦 Dữ liệu mới nhất từ database:');
        
        const mqttResult = await client.query(`
            SELECT station_id, timestamp, update_time 
            FROM mqtt_data 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        console.log('\nMQTT Data (5 records mới nhất):');
        mqttResult.rows.forEach((row, i) => {
            const ts = new Date(row.timestamp);
            console.log(`  ${i+1}. ${row.station_id}`);
            console.log(`     timestamp: ${row.timestamp}`);
            console.log(`     → Hiển thị VN: ${ts.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`);
            console.log(`     update_time: ${row.update_time}`);
        });
        
        const scadaResult = await client.query(`
            SELECT station_id, timestamp, update_time 
            FROM scada_data 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        console.log('\n\nSCADA Data (5 records mới nhất):');
        scadaResult.rows.forEach((row, i) => {
            const ts = new Date(row.timestamp);
            console.log(`  ${i+1}. ${row.station_id}`);
            console.log(`     timestamp: ${row.timestamp}`);
            console.log(`     → Hiển thị VN: ${ts.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`);
            console.log(`     update_time: ${row.update_time}`);
        });
        
    } finally {
        client.release();
        await pool.end();
    }
}

checkNewTimestamps().catch(console.error);
