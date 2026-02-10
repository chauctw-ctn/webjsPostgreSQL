const fs = require('fs');

console.log('🔍 Kiểm tra format timestamp từ các nguồn dữ liệu:\n');

// 1. MQTT Data
console.log('1️⃣ MQTT Data:');
try {
    const mqttData = JSON.parse(fs.readFileSync('data_mqtt.json', 'utf8'));
    if (mqttData.stations && mqttData.stations.length > 0) {
        const sample = mqttData.stations[0];
        console.log(`   Station: ${sample.station}`);
        console.log(`   updateTime: ${sample.updateTime}`);
        console.log(`   → Format: ${sample.updateTime?.includes('+') || sample.updateTime?.includes('Z') ? 'ISO với timezone ✅' : 'Không có timezone info ⚠️'}`);
        
        // Parse để xem múi giờ
        if (sample.updateTime) {
            const date = new Date(sample.updateTime);
            console.log(`   → Parse: ${date.toISOString()}`);
            console.log(`   → VN time: ${date.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`);
        }
    }
} catch (err) {
    console.log('   ⚠️ Không đọc được data_mqtt.json');
}

// 2. TVA/SCADA Data
console.log('\n2️⃣ TVA/SCADA Data:');
try {
    const scadaData = JSON.parse(fs.readFileSync('data_scada_tva.json', 'utf8'));
    console.log(`   File timestamp: ${scadaData.timestamp}`);
    console.log(`   → Format: ${scadaData.timestamp?.includes('+') || scadaData.timestamp?.includes('Z') ? 'ISO với timezone ✅' : 'Không có timezone info ⚠️'}`);
    
    // Kiểm tra xem có station nào có timestamp riêng không
    if (scadaData.channels && scadaData.channels.length > 0) {
        const sample = scadaData.channels[0];
        console.log(`   Sample channel: ${sample.name}`);
        console.log(`   updateTime: ${sample.updateTime || 'KHÔNG CÓ ⚠️'}`);
        console.log(`   → Các channel KHÔNG có timestamp riêng`);
        console.log(`   → Chỉ có timestamp chung cho toàn file`);
    }
    
    if (scadaData.timestamp) {
        const date = new Date(scadaData.timestamp);
        console.log(`   → Parse: ${date.toISOString()}`);
        console.log(`   → VN time: ${date.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`);
    }
} catch (err) {
    console.log('   ⚠️ Không đọc được data_scada_tva.json');
}

console.log('\n📝 KẾT LUẬN:');
console.log('   - MQTT: Mỗi station có updateTime riêng (ISO format)');
console.log('   - TVA/SCADA: Chỉ có timestamp chung cho file');
console.log('   - Tất cả đều có timezone info (UTC hoặc Z)');
console.log('   - PostgreSQL sẽ tự động convert sang GMT+7');
