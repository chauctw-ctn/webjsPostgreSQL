const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'water_monitoring.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Testing LOWER() function with Vietnamese characters...\n');

// Test 1: Check actual parameter names
const query1 = `SELECT DISTINCT parameter_name, LOWER(parameter_name) as lowercase FROM scada_data WHERE parameter_name LIKE '%pH%'`;

db.all(query1, [], (err, rows) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }
    
    console.log('📋 Distinct parameter_name values and their LOWER():');
    rows.forEach(row => {
        console.log(`  Original: "${row.parameter_name}"`);
        console.log(`  LOWER():  "${row.lowercase}"`);
        console.log('');
    });
    
    //Test 2: Try different matching approaches
    console.log('\n🧪 Testing different pH matching approaches:\n');
    
    const tests = [
        { name: 'LOWER match ph', query: `SELECT COUNT(*) as count FROM scada_data WHERE LOWER(parameter_name) = 'ph'` },
        { name: 'LOWER match độ ph', query: `SELECT COUNT(*) as count FROM scada_data WHERE LOWER(parameter_name) = 'độ ph'` },
        { name: 'LIKE %pH%', query: `SELECT COUNT(*) as count FROM scada_data WHERE parameter_name LIKE '%pH%'` },
        { name: 'LIKE %ph%', query: `SELECT COUNT(*) as count FROM scada_data WHERE parameter_name LIKE '%ph%'` },
        { name: 'LIKE %Độ pH%', query: `SELECT COUNT(*) as count FROM scada_data WHERE parameter_name LIKE '%Độ pH%'` },
        { name: 'Exact match "Độ pH"', query: `SELECT COUNT(*) as count FROM scada_data WHERE parameter_name = 'Độ pH'` }
    ];
    
    let completed = 0;
    tests.forEach(test => {
        db.get(test.query, [], (err, row) => {
            if (err) {
                console.error(`  ❌ ${test.name}: Error - ${err.message}`);
            } else {
                console.log(`  ${row.count > 0 ? '✅' : '❌'} ${test.name}: ${row.count} rows`);
            }
            completed++;
            if (completed === tests.length) {
                db.close();
            }
        });
    });
});
