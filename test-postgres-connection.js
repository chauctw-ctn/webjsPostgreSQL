// Test PostgreSQL connection với Supabase
// Chạy: node test-postgres-connection.js

const { Pool } = require('pg');

// Database URL từ Supabase
const DATABASE_URL = process.env.DATABASE_URL || 
    'postgresql://postgres.llehbswibzhtsqgdulux:CR0kEeWlb8vemvuz@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres';

console.log('🔍 Testing PostgreSQL connection...\n');
console.log('📍 Connection string:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'), '\n');

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 5,
    connectionTimeoutMillis: 10000,
});

async function testConnection() {
    let client;
    
    try {
        console.log('⏳ Connecting to PostgreSQL...');
        
        // Test connection
        client = await pool.connect();
        console.log('✅ Connection successful!\n');
        
        // Test query
        console.log('⏳ Testing query...');
        const result = await client.query('SELECT version()');
        console.log('✅ Query successful!');
        console.log('📊 PostgreSQL version:', result.rows[0].version, '\n');
        
        // List tables
        console.log('⏳ Checking existing tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        if (tablesResult.rows.length > 0) {
            console.log('✅ Found tables:');
            tablesResult.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
        } else {
            console.log('ℹ️  No tables found (database is empty)');
        }
        
        // Count records if tables exist
        const tableNames = tablesResult.rows.map(r => r.table_name);
        if (tableNames.length > 0) {
            console.log('\n📊 Record counts:');
            for (const tableName of tableNames) {
                try {
                    const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
                    console.log(`   ${tableName}: ${countResult.rows[0].count} records`);
                } catch (err) {
                    console.log(`   ${tableName}: Error counting - ${err.message}`);
                }
            }
        }
        
        console.log('\n✅ All tests passed!');
        console.log('🎉 Database is ready to use!');
        
    } catch (error) {
        console.error('\n❌ Connection failed!');
        console.error('Error:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.error('\n💡 Tips:');
            console.error('   - Check if host is correct');
            console.error('   - Check your internet connection');
        } else if (error.code === '28P01') {
            console.error('\n💡 Tips:');
            console.error('   - Check username and password');
            console.error('   - Password may have expired');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Tips:');
            console.error('   - Check if port is correct');
            console.error('   - Database server may be down');
        } else {
            console.error('\n💡 Tips:');
            console.error('   - Verify DATABASE_URL is correct');
            console.error('   - Check Supabase dashboard for database status');
        }
        
        process.exit(1);
        
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
}

// Run test
testConnection();
