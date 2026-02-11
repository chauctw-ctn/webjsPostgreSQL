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

async function testTimezone() {
    const client = await pool.connect();
    
    try {
        console.log('🧪 Test timezone fix:\n');
        
        // 1. Kiểm tra timezone hiện tại
        const tzResult = await client.query('SHOW timezone');
        console.log('1️⃣ PostgreSQL timezone:', tzResult.rows[0].TimeZone);
        
        // 2. Tạo bảng test
        await client.query('DROP TABLE IF EXISTS test_vn_time');
        await client.query(`
            CREATE TABLE test_vn_time (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP NOT NULL,
                description TEXT
            )
        `);
        console.log('2️⃣ Created test table\n');
        
        // 3. Insert timestamp hiện tại
        const now = new Date();
        const isoString = now.toISOString();
        
        console.log('3️⃣ Inserting data:');
        console.log('   Node.js time (UTC):', isoString);
        console.log('   Node.js time (VN): ', now.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'}));
        
        // Insert using ISO string
        await client.query(
            'INSERT INTO test_vn_time (timestamp, description) VALUES ($1, $2)',
            [isoString, 'Test from Node.js ISO string']
        );
        
        // Insert using PostgreSQL NOW()
        await client.query(
            'INSERT INTO test_vn_time (timestamp, description) VALUES (NOW(), $1)',
            ['Test from PostgreSQL NOW()']
        );
        
        console.log('   ✅ Data inserted\n');
        
        // 4. Query data back
        const result = await client.query('SELECT * FROM test_vn_time ORDER BY id');
        
        console.log('4️⃣ Query results:');
        result.rows.forEach(row => {
            console.log(`\n   ID: ${row.id}`);
            console.log(`   Description: ${row.description}`);
            console.log(`   Timestamp from DB: ${row.timestamp}`);
            console.log(`   Formatted as VN time: ${new Date(row.timestamp).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`);
        });
        
        // 5. Test với TO_CHAR để format giờ VN
        console.log('\n5️⃣ Using TO_CHAR to format in VN timezone:');
        const formattedResult = await client.query(`
            SELECT 
                description,
                timestamp,
                TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') as formatted_time
            FROM test_vn_time
            ORDER BY id
        `);
        
        formattedResult.rows.forEach(row => {
            console.log(`\n   ${row.description}`);
            console.log(`   Raw: ${row.timestamp}`);
            console.log(`   Formatted: ${row.formatted_time}`);
        });
        
        // Cleanup
        await client.query('DROP TABLE test_vn_time');
        console.log('\n✅ Test completed! Table dropped.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

testTimezone();
