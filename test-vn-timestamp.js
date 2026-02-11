require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Helper function: Tạo timestamp theo giờ VN (GMT+7)
// Tính toán thủ công để đảm bảo hoạt động đúng trên mọi môi trường (local và Render)
function getVietnamTimestamp() {
    const now = new Date();
    // Lấy thời gian UTC và cộng 7 giờ (GMT+7)
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    
    // Format: YYYY-MM-DD HH:mm:ss
    const year = vietnamTime.getUTCFullYear();
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function testTimestamp() {
    const client = await pool.connect();
    
    try {
        console.log('🕐 Testing timestamp function:\n');
        
        // Thời gian thực tế
        const now = new Date();
        console.log('⏰ System time (UTC):', now.toISOString());
        console.log('⏰ System time (VN):', now.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'}));
        
        // Timestamp mới
        const vnTimestamp = getVietnamTimestamp();
        console.log('✨ Generated VN timestamp:', vnTimestamp);
        
        // Test insert vào database
        console.log('\n🧪 Testing database insert:');
        await client.query('CREATE TEMP TABLE test_timestamp (ts TIMESTAMP)');
        await client.query('INSERT INTO test_timestamp (ts) VALUES ($1)', [vnTimestamp]);
        
        const result = await client.query('SELECT ts FROM test_timestamp');
        console.log('📦 Timestamp in DB:', result.rows[0].ts);
        console.log('📺 Display in VN:', new Date(result.rows[0].ts).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'}));
        
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

testTimestamp().catch(console.error);
