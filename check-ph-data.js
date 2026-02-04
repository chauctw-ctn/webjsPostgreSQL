const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./water_monitoring.db');

console.log('=== Checking SCADA data parameters ===\n');

// Get all distinct parameters from scada_data
db.all('SELECT DISTINCT parameter_name FROM scada_data ORDER BY parameter_name', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Parameters in scada_data:');
        rows.forEach(row => {
            console.log(`  - ${row.parameter_name}`);
        });
    }
    
    // Count records with pH
    db.get(`
        SELECT COUNT(*) as count 
        FROM scada_data 
        WHERE LOWER(parameter_name) LIKE '%ph%'
    `, [], (err, row) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log(`\n📊 Total records with 'pH' in name: ${row.count}`);
        }
        
        // Get sample pH data
        db.all(`
            SELECT station_name, parameter_name, value, timestamp 
            FROM scada_data 
            WHERE LOWER(parameter_name) LIKE '%ph%'
            LIMIT 5
        `, [], (err, rows) => {
            if (err) {
                console.error('Error:', err);
            } else {
                console.log('\n📝 Sample pH records:');
                rows.forEach(row => {
                    console.log(`  ${row.station_name} | ${row.parameter_name} | ${row.value} | ${row.timestamp}`);
                });
            }
            
            db.close();
        });
    });
});
