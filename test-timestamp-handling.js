require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', (client) => {
    client.query("SET timezone = 'Asia/Ho_Chi_Minh'");
});

async function testTimestampHandling() {
    const client = await pool.connect();
    
    try {
        console.log('🧪 Test cách PostgreSQL xử lý timestamp:\n');
        
        // Test 1: Insert ISO string với timezone
        console.log('1️⃣ Test ISO string với timezone (như MQTT data):');
        const isoWithTZ = "2026-02-10T16:30:06+0000"; // UTC time
        console.log(`   Input: "${isoWithTZ}" (UTC)`);
        console.log(`   → Thời gian VN tương ứng: 23:30:06 (UTC+7)`);
        
        const result1 = await client.query(
            `SELECT $1::timestamptz as parsed_tz,
                    $1::timestamp as parsed_no_tz,
                    TO_CHAR($1::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI:SS') as formatted_tz,
                    TO_CHAR($1::timestamp, 'YYYY-MM-DD HH24:MI:SS') as formatted_no_tz`,
            [isoWithTZ]
        );
        console.log(`   Cast sang TIMESTAMPTZ: ${result1.rows[0].formatted_tz}`);
        console.log(`   Cast sang TIMESTAMP:   ${result1.rows[0].formatted_no_tz}`);
        console.log(`   → TIMESTAMP bỏ qua timezone info!\n`);
        
        // Test 2: Current timestamp
        console.log('2️⃣ Test current timestamp:');
        const result2 = await client.query(`SELECT NOW() as current, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS') as formatted`);
        console.log(`   PostgreSQL NOW(): ${result2.rows[0].formatted}\n`);
        
        // Test 3: So sánh với getVietnamTimestamp()
        console.log('3️⃣ Test hàm getVietnamTimestamp():');
        const vnTime = getVietnamTimestamp();
        console.log(`   getVietnamTimestamp(): ${vnTime}`);
        console.log(`   PostgreSQL NOW():      ${result2.rows[0].formatted}`);
        console.log(`   → ${vnTime === result2.rows[0].formatted ? 'GIỐNG NHAU ✅' : 'KHÁC NHAU ⚠️'}\n`);
        
        // Test 4: Giả lập lưu dữ liệu MQTT
        console.log('4️⃣ Giả lập lưu dữ liệu MQTT:');
        
        // Cách hiện tại (SAI)
        const currentMethod = vnTime;
        console.log(`   ❌ Cách hiện tại: dùng getVietnamTimestamp()`);
        console.log(`      → Lưu: ${currentMethod}`);
        console.log(`      → MẤT thời gian thực tế từ thiết bị!`);
        
        // Cách đúng (ĐÚNG)
        console.log(`\n   ✅ Cách đúng: dùng updateTime từ dữ liệu`);
        console.log(`      → Input: ${isoWithTZ}`);
        console.log(`      → Nếu dùng TIMESTAMP (hiện tại): ${result1.rows[0].formatted_no_tz} ❌ Sai!`);
        console.log(`      → Nếu dùng TIMESTAMPTZ: ${result1.rows[0].formatted_tz} ✅ Đúng!`);
        
        console.log('\n📝 KẾT LUẬN:');
        console.log('   - Database đang dùng TIMESTAMP (không có timezone)');
        console.log('   - Nếu updateTime từ dữ liệu ĐÃ Ở GMT+7:');
        console.log('     → SỬ DỤNG trực tiếp, KHÔNG chuyển đổi');
        console.log('   - Nếu updateTime là UTC (+0000):');
        console.log('     → CẦN chuyển sang GMT+7 trước khi lưu');
        console.log('   - Hoặc đổi cột sang TIMESTAMPTZ để tự động xử lý');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

// Copy từ database.js
function getVietnamTimestamp() {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    
    const year = vietnamTime.getFullYear();
    const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getDate()).padStart(2, '0');
    const hours = String(vietnamTime.getHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getMinutes()).padStart(2, '0');
    const seconds = String(vietnamTime.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

testTimestampHandling();
