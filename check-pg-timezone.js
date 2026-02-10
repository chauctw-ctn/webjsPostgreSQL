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

async function checkTimezone() {
    const client = await pool.connect();
    
    try {
        // Kiểm tra timezone của PostgreSQL
        const tzResult = await client.query('SHOW timezone');
        console.log('🌍 PostgreSQL timezone:', tzResult.rows[0].TimeZone);
        
        // Kiểm tra thời gian hiện tại của PostgreSQL
        const nowResult = await client.query('SELECT NOW() as pg_now, NOW() AT TIME ZONE \'UTC\' as pg_utc');
        console.log('\n⏰ PostgreSQL time:');
        console.log('  NOW():', nowResult.rows[0].pg_now);
        console.log('  NOW() AT TIME ZONE \'UTC\':', nowResult.rows[0].pg_utc);
        
        // Kiểm tra thời gian của Node.js
        const nodeDate = new Date();
        console.log('\n⏰ Node.js time:');
        console.log('  new Date():', nodeDate);
        console.log('  toISOString():', nodeDate.toISOString());
        console.log('  toLocaleString(\'vi-VN\', {timeZone: \'Asia/Ho_Chi_Minh\'}):', 
            nodeDate.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'}));
        
        // Test insert và query lại
        console.log('\n🧪 Test insert timestamp:');
        const testTimestamp = new Date().toISOString();
        console.log('  Insert value:', testTimestamp);
        
        await client.query('DROP TABLE IF EXISTS test_time');
        await client.query('CREATE TEMP TABLE test_time (ts TIMESTAMPTZ)');
        await client.query('INSERT INTO test_time (ts) VALUES ($1)', [testTimestamp]);
        const selectResult = await client.query('SELECT ts FROM test_time');
        console.log('  Query result:', selectResult.rows[0].ts);
        
    } finally {
        client.release();
        await pool.end();
    }
}

checkTimezone().catch(console.error);
