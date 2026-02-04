const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'water_monitoring.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking pH data timestamps in scada_data table...\n');

const query = `
SELECT 
    station_id,
    parameter_name,
    value,
    timestamp,
    DATE(timestamp) as date_only,
    TIME(timestamp) as time_only
FROM scada_data 
WHERE LOWER(parameter_name) LIKE '%ph%'
ORDER BY timestamp DESC
LIMIT 20
`;

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }
    
    if (rows.length === 0) {
        console.log('❌ No pH data found in scada_data table');
    } else {
        console.log(`✅ Found ${rows.length} pH records:\n`);
        rows.forEach((row, index) => {
            console.log(`${index + 1}. Station: ${row.station_id}`);
            console.log(`   Parameter: ${row.parameter_name}`);
            console.log(`   Value: ${row.value}`);
            console.log(`   Full Timestamp: ${row.timestamp}`);
            console.log(`   Date: ${row.date_only}, Time: ${row.time_only}`);
            console.log('');
        });
        
        // Show unique dates
        const uniqueDates = [...new Set(rows.map(r => r.date_only))];
        console.log('\n📅 Unique dates with pH data:');
        uniqueDates.forEach(date => {
            const count = rows.filter(r => r.date_only === date).length;
            console.log(`   ${date} (${count} records)`);
        });
    }
    
    db.close();
});
