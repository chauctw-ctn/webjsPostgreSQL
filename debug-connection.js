// Debug PostgreSQL connection - show details
const { parse } = require('pg-connection-string');

const DATABASE_URL = 'postgresql://postgres.llehbswibzhtsqgdulux:CR0kEeWlb8vemvuz@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres';

console.log('🔍 Parsing DATABASE_URL...\n');

const config = parse(DATABASE_URL);

console.log('Connection details:');
console.log('  Host:', config.host);
console.log('  Port:', config.port);
console.log('  Database:', config.database);
console.log('  User:', config.user);
console.log('  Password:', config.password ? '****' + config.password.slice(-4) : 'NOT SET');
console.log('  SSL:', config.ssl);
console.log('\nFull config:', JSON.stringify({...config, password: '****'}, null, 2));
