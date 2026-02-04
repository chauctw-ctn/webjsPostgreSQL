const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'water_monitoring.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Testing pH query with LIKE instead of LOWER...\n');

// Updated query with LIKE
const query = `
SELECT *, "SCADA" as source 
FROM scada_data 
WHERE 1=1 
AND station_id IN ('scada_G4_NM2', 'scada_G5_NM1', 'scada_G4_NM1', 'scada_TRAM_1', 'scada_TRAM_24') 
AND (parameter_name LIKE '%pH%' OR parameter_name LIKE '%ph%')
AND timestamp >= '2026-02-04' 
AND timestamp < '2026-02-05T00:00:00.000Z'
`;

console.log('Query:', query);
console.log('\n');

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }
    
    console.log(`✅ Query returned ${rows.length} rows`);
    
    if (rows.length > 0) {
        console.log('\nSample rows:');
        rows.slice(0, 3).forEach((row, i) => {
            console.log(`\n${i + 1}. Station: ${row.station_id}`);
            console.log(`   Parameter: ${row.parameter_name}`);
            console.log(`   Value: ${row.value}`);
            console.log(`   Timestamp: ${row.timestamp}`);
        });
    }
    
    db.close();
});
