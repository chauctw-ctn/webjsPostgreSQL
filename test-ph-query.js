const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./water_monitoring.db');

console.log('=== Testing pH query ===\n');

// Test the exact query that should be used
const query = `
    SELECT *, "SCADA" as source 
    FROM scada_data 
    WHERE 1=1 
    AND station_id IN (?, ?, ?, ?, ?)
    AND (LOWER(parameter_name) = 'ph' OR LOWER(parameter_name) = 'độ ph')
    AND timestamp >= ?
    AND timestamp < ?
`;

const params = [
    'scada_G4_NM2',
    'scada_G5_NM1',
    'scada_G4_NM1',
    'scada_TRAM_1',
    'scada_TRAM_24',
    '2026-02-04',
    '2026-02-05T00:00:00.000Z'
];

console.log('Query:', query);
console.log('Params:', params);
console.log('');

db.all(query, params, (err, rows) => {
    if (err) {
        console.error('❌ Error:', err);
    } else {
        console.log(`✅ Found ${rows.length} records\n`);
        rows.forEach((row, i) => {
            console.log(`${i + 1}. ${row.station_id} | ${row.station_name} | ${row.parameter_name} | ${row.value} | ${row.timestamp}`);
        });
    }
    
    // Also test without station filter to see all pH data
    console.log('\n=== All pH data (no station filter) ===\n');
    const query2 = `
        SELECT * 
        FROM scada_data 
        WHERE (LOWER(parameter_name) = 'ph' OR LOWER(parameter_name) = 'độ ph')
        AND timestamp >= ?
        AND timestamp < ?
        ORDER BY timestamp DESC
    `;
    
    db.all(query2, ['2026-02-04', '2026-02-05T00:00:00.000Z'], (err, rows) => {
        if (err) {
            console.error('❌ Error:', err);
        } else {
            console.log(`✅ Found ${rows.length} records\n`);
            rows.forEach((row, i) => {
                console.log(`${i + 1}. ${row.station_id} | ${row.station_name} | ${row.parameter_name} | ${row.value}`);
            });
        }
        
        db.close();
    });
});
