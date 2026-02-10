// Test với direct connection (không dùng pooler)
const { Pool } = require('pg');

// Thử cả pooler (6543) và direct (5432)
const connections = [
    {
        name: 'Transaction Pooler (6543)',
        url: 'postgresql://postgres.llehbswibzhtsqgdulux:CR0kEeWlb8vemvuz@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres'
    },
    {
        name: 'Direct Connection (5432)',
        url: 'postgresql://postgres.llehbswibzhtsqgdulux:CR0kEeWlb8vemvuz@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres'
    },
    {
        name: 'Session Pooler (5432)',
        url: 'postgresql://postgres.llehbswibzhtsqgdulux:CR0kEeWlb8vemvuz@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres'
    }
];

async function testConnection(config) {
    console.log(`\n🔍 Testing: ${config.name}`);
    console.log(`📍 URL: ${config.url.replace(/:[^:@]+@/, ':****@')}`);
    
    const pool = new Pool({
        connectionString: config.url,
        ssl: {
            rejectUnauthorized: false
        },
        max: 1,
        connectionTimeoutMillis: 10000,
    });
    
    try {
        console.log('⏳ Connecting...');
        const client = await pool.connect();
        console.log('✅ Connection successful!');
        
        const result = await client.query('SELECT version()');
        console.log('✅ Query successful!');
        console.log('📊 Version:', result.rows[0].version.substring(0, 50) + '...');
        
        client.release();
        await pool.end();
        
        return true;
    } catch (error) {
        console.log('❌ Failed:', error.message);
        await pool.end();
        return false;
    }
}

async function testAll() {
    console.log('🚀 Testing multiple connection methods...\n');
    
    for (const config of connections) {
        const success = await testConnection(config);
        if (success) {
            console.log('\n✅ Found working connection!');
            console.log('Use this connection string in your .env:');
            console.log(config.url);
            return;
        }
    }
    
    console.log('\n❌ All connection methods failed');
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check Supabase Dashboard → Settings → Database');
    console.log('2. Verify password is correct (click "Show" to see it)');
    console.log('3. Check if project is paused or has issues');
    console.log('4. Try resetting database password');
}

testAll().catch(console.error);
