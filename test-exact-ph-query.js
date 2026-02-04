const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'water_monitoring.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Testing pH query with exact parameters...\n');

// Same query as in server log
const query = `
SELECT *, "SCADA" as source 
FROM scada_data 
WHERE 1=1 
AND station_id IN ('scada_G4_NM2', 'scada_G5_NM1', 'scada_G4_NM1', 'scada_TRAM_1', 'scada_TRAM_24') 
AND (LOWER(parameter_name) = 'ph' OR LOWER(parameter_name) = 'độ ph') 
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
        console.log('\nSample row:');
        console.log(rows[0]);
    } else {
        console.log('\n❌ No rows returned!');
        console.log('\nLet me try without timestamp filter...\n');
        
        const query2 = `
SELECT *, "SCADA" as source 
FROM scada_data 
WHERE 1=1 
AND station_id IN ('scada_G4_NM2', 'scada_G5_NM1', 'scada_G4_NM1', 'scada_TRAM_1', 'scada_TRAM_24') 
AND (LOWER(parameter_name) = 'ph' OR LOWER(parameter_name) = 'độ ph')
LIMIT 5
`;
        
        db.all(query2, [], (err2, rows2) => {
            if (err2) {
                console.error('❌ Error:', err2.message);
            } else {
                console.log(`✅ Without timestamp filter: ${rows2.length} rows`);
                if (rows2.length > 0) {
                    console.log('\nSample row:');
                    console.log(rows2[0]);
                    console.log('\nTimestamp field:');
                    console.log('  Value:', rows2[0].timestamp);
                    console.log('  Type:', typeof rows2[0].timestamp);
                }
            }
            db.close();
        });
    }
});
