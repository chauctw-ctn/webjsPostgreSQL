/**
 * Test script: Lưu dữ liệu SCADA vào database với timestamp từ file JSON
 */

require('dotenv').config();
const { saveSCADAData } = require('./database.js');
const fs = require('fs');

async function testSaveSCADAWithTimestamp() {
    console.log('🧪 Test lưu dữ liệu SCADA với timestamp từ file JSON:\n');
    
    try {
        // 1. Đọc dữ liệu SCADA
        const scadaData = JSON.parse(fs.readFileSync('data_scada_tva.json', 'utf8'));
        console.log(`📦 File timestamp: ${scadaData.timestamp}`);
        
        const fileDate = new Date(scadaData.timestamp);
        console.log(`   → Parse thành VN time: ${fileDate.toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`);
        
        // 2. Thêm timestamp vào mỗi station
        const stationsWithTimestamp = Object.values(scadaData.stationsGrouped).map(station => ({
            ...station,
            updateTime: scadaData.timestamp
        }));
        
        console.log(`\n📍 Tổng số stations: ${stationsWithTimestamp.length}`);
        console.log(`   Sample: ${stationsWithTimestamp[0].stationName}`);
        console.log(`   updateTime: ${stationsWithTimestamp[0].updateTime}`);
        
        // 3. Lưu vào database
        console.log('\n💾 Đang lưu vào database...');
        const count = await saveSCADAData(stationsWithTimestamp);
        console.log(`✅ Đã lưu ${count} records vào database`);
        
        console.log('\n✅ Hoàn tất! Bây giờ chạy: node verify-timestamp-from-source.js');
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error.stack);
    }
    
    process.exit(0);
}

testSaveSCADAWithTimestamp();
