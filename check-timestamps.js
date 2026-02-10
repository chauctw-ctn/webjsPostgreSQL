// Kiểm tra timestamp trong database
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 
    'postgresql://postgres.llehbswibzhtsqgdulux:CR0kEeWlb8vemvuz@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkTimestamps() {
    console.log('🕐 Kiểm tra timestamp trong database...\n');
    
    try {
        // Check MQTT data timestamps
        const mqttResult = await pool.query(`
            SELECT 
                station_name,
                parameter_name,
                value,
                timestamp,
                update_time,
                created_at
            FROM mqtt_data 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        console.log('📊 MQTT Data (5 records mới nhất):');
        console.log('===============================================');
        mqttResult.rows.forEach(row => {
            console.log(`\nStation: ${row.station_name}`);
            console.log(`Parameter: ${row.parameter_name} = ${row.value}`);
            console.log(`Timestamp (DB): ${row.timestamp}`);
            console.log(`Update time: ${row.update_time}`);
            console.log(`Created at: ${row.created_at}`);
            
            // Show timezone info
            const dbTime = new Date(row.timestamp);
            const localTime = new Date(dbTime.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
            console.log(`→ UTC: ${dbTime.toISOString()}`);
            console.log(`→ VN Time (GMT+7): ${dbTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
        });
        
        // Check SCADA data timestamps
        const scadaResult = await pool.query(`
            SELECT 
                station_name,
                parameter_name,
                value,
                timestamp,
                update_time,
                created_at
            FROM scada_data 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        console.log('\n\n📊 SCADA Data (5 records mới nhất):');
        console.log('===============================================');
        scadaResult.rows.forEach(row => {
            console.log(`\nStation: ${row.station_name}`);
            console.log(`Parameter: ${row.parameter_name} = ${row.value}`);
            console.log(`Timestamp (DB): ${row.timestamp}`);
            console.log(`Update time: ${row.update_time}`);
            console.log(`Created at: ${row.created_at}`);
            
            const dbTime = new Date(row.timestamp);
            console.log(`→ UTC: ${dbTime.toISOString()}`);
            console.log(`→ VN Time (GMT+7): ${dbTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
        });
        
        // Show current time
        console.log('\n\n⏰ Thời gian hiện tại:');
        console.log('===============================================');
        const now = new Date();
        console.log(`Server time: ${now.toISOString()}`);
        console.log(`VN Time (GMT+7): ${now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
        
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkTimestamps();
