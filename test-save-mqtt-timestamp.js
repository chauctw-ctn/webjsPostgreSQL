/**
 * Test script: Lưu dữ liệu MQTT vào database với code đã sửa
 * Sau đó verify timestamp có đúng không
 */

require('dotenv').config();
const { saveMQTTData } = require('./database.js');
const fs = require('fs');

async function testSaveWithCorrectTimestamp() {
    console.log('🧪 Test lưu dữ liệu MQTT với timestamp từ nguồn:\n');
    
    try {
        // 1. Đọc dữ liệu MQTT
        const mqttData = JSON.parse(fs.readFileSync('data_mqtt.json', 'utf8'));
        console.log(`📦 Đọc được ${mqttData.stations.length} stations từ data_mqtt.json`);
        
        // Hiển thị sample
        const sample = mqttData.stations[0];
        console.log(`\n📍 Sample station: ${sample.station}`);
        console.log(`   updateTime trong file: ${sample.updateTime}`);
        
        const sampleDate = new Date(sample.updateTime);
        console.log(`   → Parse thành VN time: ${sampleDate.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`);
        
        // 2. Lưu vào database
        console.log('\n💾 Đang lưu vào database...');
        const count = await saveMQTTData(mqttData.stations);
        console.log(`✅ Đã lưu ${count} records vào database`);
        
        console.log('\n✅ Hoàn tất! Bây giờ chạy: node verify-timestamp-from-source.js');
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error.stack);
    }
    
    process.exit(0);
}

testSaveWithCorrectTimestamp();
