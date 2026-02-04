const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./water_monitoring.db');

console.log('=== Checking SCADA stations ===\n');

// Get all distinct stations from scada_data
db.all('SELECT DISTINCT station_name, station_id FROM scada_data ORDER BY station_name', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('SCADA Stations in database:');
        rows.forEach(row => {
            console.log(`  ${row.station_id} → ${row.station_name}`);
        });
    }
    
    // Check stations table
    db.all('SELECT * FROM stations WHERE station_type = "SCADA" ORDER BY station_name', [], (err, rows) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log(`\n📋 Stations table (SCADA type): ${rows.length} records`);
            rows.forEach(row => {
                console.log(`  ${row.station_id} → ${row.station_name}`);
            });
        }
        
        db.close();
    });
});
