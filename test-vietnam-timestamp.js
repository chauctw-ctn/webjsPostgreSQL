require('dotenv').config();
const { Pool } = require('pg');

// Copy function from database.js
function getVietnamTimestamp() {
    const now = new Date();
    // Chuyển sang giờ VN (GMT+7)
    const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    
    // Format: YYYY-MM-DD HH:mm:ss
    const year = vietnamTime.getFullYear();
    const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getDate()).padStart(2, '0');
    const hours = String(vietnamTime.getHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getMinutes()).padStart(2, '0');
    const seconds = String(vietnamTime.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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

async function testVietnamTimestamp() {
    const client = await pool.connect();
    
    try {
        console.log('🧪 Test getVietnamTimestamp() function:\n');
        
        const now = new Date();
        const vnTimestamp = getVietnamTimestamp();
        
        console.log('⏰ Current times:');
        console.log('   UTC (ISO):      ', now.toISOString());
        console.log('   VN (formatted): ', now.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'}));
        console.log('   getVietnamTimestamp():', vnTimestamp);
        
        // Test insert
        await client.query('DROP TABLE IF EXISTS test_vn_time2');
        await client.query('CREATE TABLE test_vn_time2 (id SERIAL, ts TIMESTAMP, description TEXT)');
        
        console.log('\n💾 Inserting timestamps...');
        
        // Insert using getVietnamTimestamp()
        await client.query(
            'INSERT INTO test_vn_time2 (ts, description) VALUES ($1, $2)',
            [vnTimestamp, 'From getVietnamTimestamp()']
        );
        
        // Insert using PostgreSQL NOW()
        await client.query(
            'INSERT INTO test_vn_time2 (ts, description) VALUES (NOW(), $1)',
            ['From PostgreSQL NOW()']
        );
        
        // Query back
        const result = await client.query('SELECT * FROM test_vn_time2 ORDER BY id');
        
        console.log('\n📖 Query results:');
        result.rows.forEach(row => {
            console.log(`\n   ${row.description}`);
            console.log(`   Raw from DB: ${row.ts}`);
            console.log(`   As VN time:  ${new Date(row.ts).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`);
        });
        
        // Compare
        const diff = Math.abs(new Date(result.rows[0].ts) - new Date(result.rows[1].ts));
        console.log(`\n✅ Time difference between methods: ${diff}ms`);
        if (diff < 2000) {
            console.log('✅ SUCCESS! Both methods return Vietnam time correctly!');
        } else {
            console.log('⚠️ WARNING! There is a time difference!');
        }
        
        // Cleanup
        await client.query('DROP TABLE test_vn_time2');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

testVietnamTimestamp();
