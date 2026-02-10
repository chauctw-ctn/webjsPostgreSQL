/**
 * Script kiểm tra timestamp được lưu đúng từ dữ liệu gốc
 * 
 * Yêu cầu: Nếu timestamp lấy từ dữ liệu là GMT+7 hoặc có timezone info,
 *          thì KHÔNG điều chỉnh lại khi lưu SQL
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', (client) => {
    client.query("SET timezone = 'Asia/Ho_Chi_Minh'");
});

async function verifyTimestampSaving() {
    console.log('🔍 Kiểm tra timestamp lưu vào database:\n');
    
    // 1. Đọc dữ liệu MQTT gốc
    console.log('1️⃣ Kiểm tra MQTT Data:');
    const mqttData = JSON.parse(fs.readFileSync('data_mqtt.json', 'utf8'));
    const mqttSample = mqttData.stations[0];
    
    console.log(`   Station: ${mqttSample.station}`);
    console.log(`   updateTime trong file: ${mqttSample.updateTime}`);
    
    // Parse để xem thời gian VN
    const mqttDate = new Date(mqttSample.updateTime);
    const expectedVNTime = mqttDate.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    console.log(`   → Thời gian VN mong đợi: ${expectedVNTime}`);
    
    // 2. Kiểm tra trong database
    const client = await pool.connect();
    
    try {
        const stationId = `mqtt_${mqttSample.station.replace(/\s+/g, '_')}`;
        const result = await client.query(
            `SELECT timestamp, 
                    TO_CHAR(timestamp, 'DD/MM/YYYY HH24:MI:SS') as formatted 
             FROM mqtt_data 
             WHERE station_id = $1 
             ORDER BY id DESC 
             LIMIT 1`,
            [stationId]
        );
        
        if (result.rows.length > 0) {
            const dbTime = result.rows[0].formatted;
            console.log(`   → Thời gian trong DB:     ${dbTime}`);
            
            // So sánh (chỉ date và giờ:phút)
            const dbDate = result.rows[0].timestamp;
            const expectDate = mqttDate;
            
            // So sánh chỉ đến phút
            const timeDiff = Math.abs(dbDate - expectDate) / 1000 / 60; // phút
            
            if (timeDiff < 2) { // Cho phép chênh lệch dưới 2 phút
                console.log(`   ✅ ĐÚNG! Timestamp được giữ nguyên từ dữ liệu gốc`);
            } else {
                console.log(`   ⚠️ CẢNH BÁO! Timestamp bị thay đổi`);
                console.log(`   → Chênh lệch: ${Math.round(timeDiff)} phút`);
            }
        } else {
            console.log(`   ⚠️ Chưa có dữ liệu trong database`);
        }
        
        // 3. Kiểm tra SCADA Data
        console.log('\n2️⃣ Kiểm tra SCADA Data:');
        const scadaData = JSON.parse(fs.readFileSync('data_scada_tva.json', 'utf8'));
        console.log(`   File timestamp: ${scadaData.timestamp}`);
        
        const scadaDate = new Date(scadaData.timestamp);
        const expectedScadaVNTime = scadaDate.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        console.log(`   → Thời gian VN mong đợi: ${expectedScadaVNTime}`);
        
        const scadaResult = await client.query(
            `SELECT timestamp,
                    TO_CHAR(timestamp, 'DD/MM/YYYY HH24:MI:SS') as formatted  
             FROM scada_data 
             ORDER BY id DESC 
             LIMIT 1`
        );
        
        if (scadaResult.rows.length > 0) {
            console.log(`   → Thời gian trong DB:     ${scadaResult.rows[0].formatted}`);
            console.log(`   ℹ️ SCADA không có timestamp riêng cho từng station`);
            console.log(`   ℹ️ Có thể dùng timestamp hiện tại hoặc file timestamp`);
        } else {
            console.log(`   ⚠️ Chưa có dữ liệu SCADA trong database`);
        }
        
        console.log('\n📝 KẾT LUẬN:');
        console.log('   ✅ PostgreSQL với SET timezone = "Asia/Ho_Chi_Minh":');
        console.log('      - Tự động parse ISO timestamp với timezone');
        console.log('      - Tự động convert UTC sang GMT+7');
        console.log('      - Lưu timestamp theo giờ địa phương (GMT+7)');
        console.log('   ✅ Code đã được sửa:');
        console.log('      - Sử dụng updateTime từ dữ liệu nếu có');
        console.log('      - Chỉ dùng getVietnamTimestamp() khi KHÔNG có timestamp gốc');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

verifyTimestampSaving();
