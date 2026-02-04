const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data_scada_tva.json', 'utf-8'));

console.log('Total stations:', data.totalStations);
console.log('Total channels:', data.totalChannels);
console.log('\nStations:', Object.keys(data.stationsGrouped));

Object.keys(data.stationsGrouped).forEach(key => {
    const st = data.stationsGrouped[key];
    console.log(`\n${key}: ${st.stationName} (${st.parameters.length} params)`);
    st.parameters.forEach(p => {
        console.log(`  - ${p.parameterName}: ${p.displayText} ${p.unit}`);
    });
});
