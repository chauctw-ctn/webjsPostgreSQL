const fs = require('fs');
const path = require('path');
const { saveSCADAData, initDatabase } = require('./database');

async function saveSCADAToDB() {
    try {
        console.log('🚀 Đang khởi tạo database...');
        await initDatabase();
        
        const scadaPath = path.join(__dirname, 'data_scada_tva.json');
        console.log(`📂 Đang đọc file: ${scadaPath}`);
        
        if (!fs.existsSync(scadaPath)) {
            console.error('❌ Không tìm thấy file data_scada_tva.json');
            return;
        }
        
        const scadaData = JSON.parse(fs.readFileSync(scadaPath, 'utf-8'));
        console.log(`✅ Đã đọc file SCADA: ${scadaData.totalStations} trạm`);
        
        if (!scadaData.stationsGrouped) {
            console.error('❌ Không có dữ liệu stationsGrouped');
            return;
        }
        
        console.log('💾 Đang lưu dữ liệu vào database...');
        const savedCount = await saveSCADAData(scadaData.stationsGrouped);
        console.log(`✅ Đã lưu ${savedCount} bản ghi SCADA vào database`);
        
        console.log('\n✨ Hoàn thành!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error);
        process.exit(1);
    }
}

saveSCADAToDB();
