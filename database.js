const { Pool } = require('pg');

// Config giới hạn số lượng records (để tránh hết dung lượng)
const MAX_RECORDS = {
    TVA: 100000,    // Giới hạn 100k records cho TVA
    MQTT: 100000,   // Giới hạn 100k records cho MQTT
    SCADA: 100000   // Giới hạn 100k records cho SCADA
};

// PostgreSQL connection pool
// Hỗ trợ cả DATABASE_URL (Render/Supabase) và individual env vars
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: {
                  rejectUnauthorized: false // Required for Supabase/Render
              },
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 10000,
          }
        : {
              host: process.env.PGHOST || 'localhost',
              port: process.env.PGPORT || 5432,
              database: process.env.PGDATABASE || 'water_monitoring',
              user: process.env.PGUSER || 'postgres',
              password: process.env.PGPASSWORD || 'postgres',
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 2000,
          }
);

// Set timezone to Vietnam (GMT+7) for all connections
pool.on('connect', (client) => {
    client.query("SET timezone = 'Asia/Ho_Chi_Minh'");
});

// Helper function: Tạo timestamp theo giờ VN (GMT+7)
// CHỈ dùng khi dữ liệu KHÔNG có timestamp riêng
// Nếu dữ liệu đã có updateTime (ISO string với timezone), 
// PostgreSQL sẽ TỰ ĐỘNG parse và convert sang GMT+7
function getVietnamTimestamp() {
    const now = new Date();
    // Chuyển sang giờ VN (GMT+7)
    const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    
    // Format: YYYY-MM-DD HH:mm:ss
    const year = vietnamTime.getFullYear();
    const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getDate()).padStart(2, '0');
    const hours = String(vietnamTime.getHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getMinutes()).padStart(2, '0');
    const seconds = String(vietnamTime.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Helper function: Convert bất kỳ timestamp nào sang giờ VN
// Hỗ trợ: ISO string, Date object, hoặc timestamp string
// Nếu timestamp đã ở GMT+7, giữ nguyên
// Nếu timestamp có timezone khác (UTC, etc), convert sang GMT+7
function convertToVietnamTimestamp(timestamp) {
    if (!timestamp) {
        return getVietnamTimestamp();
    }
    
    try {
        // Parse timestamp (hỗ trợ ISO string, Date, hay string)
        const date = new Date(timestamp);
        
        // Nếu không parse được, dùng current time
        if (isNaN(date.getTime())) {
            console.warn(`⚠️ Không parse được timestamp: ${timestamp}, dùng current time`);
            return getVietnamTimestamp();
        }
        
        // Convert sang giờ VN
        const vietnamTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
        
        // Format: YYYY-MM-DD HH:mm:ss
        const year = vietnamTime.getFullYear();
        const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
        const day = String(vietnamTime.getDate()).padStart(2, '0');
        const hours = String(vietnamTime.getHours()).padStart(2, '0');
        const minutes = String(vietnamTime.getMinutes()).padStart(2, '0');
        const seconds = String(vietnamTime.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (err) {
        console.warn(`⚠️ Lỗi convert timestamp: ${err.message}, dùng current time`);
        return getVietnamTimestamp();
    }
}

// Test connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Lỗi kết nối PostgreSQL:', err.message);
        console.error('💡 Kiểm tra PostgreSQL server và cài đặt pg module: npm install pg');
        process.exit(1);
    } else {
        console.log('✅ Đã kết nối tới PostgreSQL database');
        release();
    }
});

/**
 * Khởi tạo các bảng trong database
 */
async function initDatabase() {
    const client = await pool.connect();
    
    try {
        // Bảng lưu dữ liệu TVA
        await client.query(`
            CREATE TABLE IF NOT EXISTS tva_data (
                id SERIAL PRIMARY KEY,
                station_name TEXT NOT NULL,
                station_id TEXT NOT NULL,
                parameter_name TEXT NOT NULL,
                value DOUBLE PRECISION,
                unit TEXT,
                timestamp TIMESTAMP NOT NULL,
                update_time TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Bảng tva_data đã sẵn sàng');
        await client.query('CREATE INDEX IF NOT EXISTS idx_tva_station ON tva_data(station_name)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_tva_timestamp ON tva_data(timestamp)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_tva_parameter ON tva_data(parameter_name)');

        // Bảng lưu dữ liệu MQTT
        await client.query(`
            CREATE TABLE IF NOT EXISTS mqtt_data (
                id SERIAL PRIMARY KEY,
                station_name TEXT NOT NULL,
                station_id TEXT NOT NULL,
                device_name TEXT,
                parameter_name TEXT NOT NULL,
                value DOUBLE PRECISION,
                unit TEXT,
                timestamp TIMESTAMP NOT NULL,
                update_time TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Bảng mqtt_data đã sẵn sàng');
        await client.query('CREATE INDEX IF NOT EXISTS idx_mqtt_station ON mqtt_data(station_name)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_mqtt_timestamp ON mqtt_data(timestamp)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_mqtt_parameter ON mqtt_data(parameter_name)');

        // Bảng lưu dữ liệu SCADA
        await client.query(`
            CREATE TABLE IF NOT EXISTS scada_data (
                id SERIAL PRIMARY KEY,
                station_name TEXT NOT NULL,
                station_id TEXT NOT NULL,
                parameter_name TEXT NOT NULL,
                value DOUBLE PRECISION,
                unit TEXT,
                timestamp TIMESTAMP NOT NULL,
                update_time TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Bảng scada_data đã sẵn sàng');
        await client.query('CREATE INDEX IF NOT EXISTS idx_scada_station ON scada_data(station_name)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_scada_timestamp ON scada_data(timestamp)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_scada_parameter ON scada_data(parameter_name)');

        // Bảng lưu thông tin trạm
        await client.query(`
            CREATE TABLE IF NOT EXISTS stations (
                id SERIAL PRIMARY KEY,
                station_id TEXT UNIQUE NOT NULL,
                station_name TEXT NOT NULL,
                station_type TEXT NOT NULL,
                latitude DOUBLE PRECISION,
                longitude DOUBLE PRECISION,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Bảng stations đã sẵn sàng');
        
    } catch (err) {
        console.error('❌ Lỗi khởi tạo database:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Xóa records cũ nhất để giữ trong giới hạn
 */
async function cleanupOldRecords(tableName, maxRecords) {
    const client = await pool.connect();
    
    try {
        // Đếm số records hiện tại
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const currentCount = parseInt(countResult.rows[0].count);
        
        if (currentCount <= maxRecords) {
            return 0; // Không cần xóa
        }
        
        // Xóa records cũ nhất (giữ lại maxRecords records mới nhất)
        const deleteCount = currentCount - maxRecords;
        const deleteQuery = `
            DELETE FROM ${tableName}
            WHERE id IN (
                SELECT id FROM ${tableName}
                ORDER BY timestamp ASC
                LIMIT $1
            )
        `;
        
        const result = await client.query(deleteQuery, [deleteCount]);
        console.log(`🗑️ Đã xóa ${result.rowCount} records cũ từ ${tableName} (giữ ${maxRecords} records mới nhất)`);
        return result.rowCount;
        
    } catch (err) {
        console.error(`❌ Lỗi xóa dữ liệu cũ từ ${tableName}:`, err.message);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Lưu dữ liệu TVA vào database
 */
async function saveTVAData(stations) {
    if (!stations || stations.length === 0) {
        return 0;
    }

    const client = await pool.connect();
    // Chỉ tạo timestamp mới nếu dữ liệu không có timestamp riêng
    const fallbackTimestamp = getVietnamTimestamp();
    let savedCount = 0;
    let errors = [];

    try {
        await client.query('BEGIN');
        
        for (const station of stations) {
            const stationId = `tva_${station.station.replace(/\s+/g, '_')}`;
            
            // Lưu thông tin trạm
            await saveStationInfo(stationId, station.station, 'TVA', null, null);

            // Sử dụng timestamp từ dữ liệu nếu có, convert sang GMT+7
            // Nếu không có, dùng current timestamp
            const timestamp = convertToVietnamTimestamp(station.updateTime);

            // Lưu từng thông số
            if (station.data && Array.isArray(station.data)) {
                for (const param of station.data) {
                    try {
                        await client.query(
                            `INSERT INTO tva_data (station_name, station_id, parameter_name, value, unit, timestamp, update_time)
                             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                            [
                                station.station,
                                stationId,
                                param.name,
                                param.value,
                                param.unit,
                                timestamp,
                                timestamp
                            ]
                        );
                        savedCount++;
                    } catch (err) {
                        errors.push(`${station.station} - ${param.name}: ${err.message}`);
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        
        if (errors.length > 0) {
            console.warn(`⚠️ Có ${errors.length} lỗi khi lưu dữ liệu TVA`);
        }
        
        // Cleanup old records nếu vượt giới hạn
        try {
            await cleanupOldRecords('tva_data', MAX_RECORDS.TVA);
        } catch (cleanupErr) {
            console.error('⚠️ Lỗi cleanup TVA data:', cleanupErr.message);
        }
        
        return savedCount;
        
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Lưu dữ liệu MQTT vào database
 */
async function saveMQTTData(stations) {
    if (!stations || stations.length === 0) {
        console.log('⚠️ No MQTT stations to save');
        return 0;
    }

    const client = await pool.connect();
    // Chỉ tạo timestamp mới nếu dữ liệu không có updateTime
    const fallbackTimestamp = getVietnamTimestamp();
    let savedCount = 0;
    let errors = [];

    console.log(`💾 Saving ${stations.length} MQTT stations to database`);

    try {
        await client.query('BEGIN');
        
        for (const station of stations) {
            const stationId = `mqtt_${station.station.replace(/\s+/g, '_')}`;
            
            console.log(`   💾 Saving MQTT station: ${station.station} (ID: ${stationId})`);
            
            // Lưu thông tin trạm
            await saveStationInfo(stationId, station.station, 'MQTT', station.lat, station.lng);

            // Sử dụng updateTime từ dữ liệu nếu có, convert sang GMT+7
            // (PostgreSQL TIMESTAMP không tự động convert timezone)
            const timestamp = convertToVietnamTimestamp(station.updateTime);

            // Lưu từng thông số
            if (station.data && Array.isArray(station.data)) {
                for (const param of station.data) {
                    try {
                        await client.query(
                            `INSERT INTO mqtt_data (station_name, station_id, device_name, parameter_name, value, unit, timestamp, update_time)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                            [
                                station.station,
                                stationId,
                                station.deviceName || '',
                                param.name,
                                param.value,
                                param.unit,
                                timestamp,
                                timestamp
                            ]
                        );
                        savedCount++;
                    } catch (err) {
                        errors.push(`${station.station} - ${param.name}: ${err.message}`);
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        
        if (errors.length > 0) {
            console.warn(`⚠️ Có ${errors.length} lỗi khi lưu dữ liệu MQTT`);
        }
        console.log(`✅ Successfully saved ${savedCount} MQTT records`);
        
        // Cleanup old records nếu vượt giới hạn
        try {
            await cleanupOldRecords('mqtt_data', MAX_RECORDS.MQTT);
        } catch (cleanupErr) {
            console.error('⚠️ Lỗi cleanup MQTT data:', cleanupErr.message);
        }
        
        return savedCount;
        
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Lưu dữ liệu SCADA vào database
 */
async function saveSCADAData(stationsGrouped) {
    if (!stationsGrouped || Object.keys(stationsGrouped).length === 0) {
        return 0;
    }

    const client = await pool.connect();
    // Chỉ tạo timestamp mới nếu station không có updateTime
    const fallbackTimestamp = getVietnamTimestamp();
    let savedCount = 0;
    let errors = [];

    try {
        await client.query('BEGIN');
        
        for (const station of Object.values(stationsGrouped)) {
            const stationId = `scada_${station.station}`;
            
            // Lưu thông tin trạm (không có lat/lng cho SCADA)
            await saveStationInfo(stationId, station.stationName || station.station, 'SCADA', null, null);

            // Sử dụng updateTime từ station nếu có, convert sang GMT+7
            const timestamp = convertToVietnamTimestamp(station.updateTime);

            // Lưu từng thông số
            if (station.parameters && Array.isArray(station.parameters)) {
                for (const param of station.parameters) {
                    // Parse value từ displayText hoặc value
                    let numericValue = null;
                    if (param.value !== undefined && param.value !== null) {
                        numericValue = typeof param.value === 'number' ? param.value : parseFloat(param.value);
                    } else if (param.displayText) {
                        // Remove commas from displayText (e.g., "703,880" -> 703880)
                        const cleanText = String(param.displayText).replace(/,/g, '');
                        numericValue = parseFloat(cleanText);
                    }

                    try {
                        await client.query(
                            `INSERT INTO scada_data (station_name, station_id, parameter_name, value, unit, timestamp, update_time)
                             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                            [
                                station.stationName || station.station,
                                stationId,
                                param.parameterName || param.parameter,
                                isNaN(numericValue) ? null : numericValue,
                                param.unit || '',
                                timestamp,
                                timestamp
                            ]
                        );
                        savedCount++;
                    } catch (err) {
                        errors.push(`${station.station} - ${param.parameterName}: ${err.message}`);
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        
        if (errors.length > 0) {
            console.warn(`⚠️ Có ${errors.length} lỗi khi lưu dữ liệu SCADA`);
        }
        console.log(`✅ Đã lưu ${savedCount} bản ghi SCADA vào database`);
        
        // Cleanup old records nếu vượt giới hạn
        try {
            await cleanupOldRecords('scada_data', MAX_RECORDS.SCADA);
        } catch (cleanupErr) {
            console.error('⚠️ Lỗi cleanup SCADA data:', cleanupErr.message);
        }
        
        return savedCount;
        
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Lưu hoặc cập nhật thông tin trạm
 */
async function saveStationInfo(stationId, stationName, stationType, lat, lng) {
    try {
        await pool.query(`
            INSERT INTO stations (station_id, station_name, station_type, latitude, longitude)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (station_id) DO UPDATE SET
                station_name = EXCLUDED.station_name,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                updated_at = CURRENT_TIMESTAMP
        `, [stationId, stationName, stationType, lat, lng]);
    } catch (err) {
        console.error(`❌ Lỗi lưu thông tin trạm ${stationId}:`, err.message);
    }
}

/**
 * Lấy dữ liệu thống kê từ database
 */
async function getStatsData(options) {
    const {
        stationIds = [],
        stationType = 'all', // 'all', 'TVA', 'MQTT', 'SCADA'
        parameterName = 'all',
        startDate,
        endDate,
        limit = 10000
    } = options;

    console.log('📊 getStatsData called with:', { stationIds, stationType, parameterName, startDate, endDate, limit });

    let queries = [];

    // Build separate queries for TVA, MQTT, and SCADA
    if (stationType === 'all' || stationType === 'TVA') {
        let tvaQuery = 'SELECT *, \'TVA\' as source FROM tva_data WHERE 1=1';
        let tvaParams = [];
        let paramIndex = 1;
        
        if (stationIds.length > 0) {
            const placeholders = stationIds.map((_, i) => `$${paramIndex++}`).join(',');
            tvaQuery += ` AND station_id IN (${placeholders})`;
            tvaParams.push(...stationIds);
        }
        
        if (parameterName !== 'all') {
            // Special handling for pH: match both 'pH' and 'Độ pH'
            if (parameterName.toLowerCase() === 'ph' || parameterName.toLowerCase() === 'độ ph') {
                console.log('  🔬 pH filter: matching both "ph" and "độ ph"');
                tvaQuery += ` AND (parameter_name ILIKE '%pH%' OR parameter_name ILIKE '%ph%')`;
            } else if (parameterName.toLowerCase().includes('mực nước') || parameterName.toLowerCase().includes('muc nuoc')) {
                console.log('  💧 Water level filter: matching "Mực Nước" and "Mực nước"');
                tvaQuery += ` AND (LOWER(parameter_name) LIKE '%mực nước%' OR LOWER(parameter_name) LIKE '%muc nuoc%')`;
            } else if (parameterName.toLowerCase().includes('lưu lượng')) {
                console.log('  💦 Flow rate filter: matching "Lưu lượng" but excluding "Tổng Lưu Lượng"');
                tvaQuery += ` AND LOWER(parameter_name) LIKE '%lưu lượng%' AND LOWER(parameter_name) NOT LIKE '%tổng%'`;
            } else {
                console.log(`  🔬 Parameter filter: ${parameterName}`);
                tvaQuery += ` AND LOWER(parameter_name) = LOWER($${paramIndex++})`;
                tvaParams.push(parameterName);
            }
        }
        
        if (startDate) {
            tvaQuery += ` AND timestamp >= $${paramIndex++}`;
            tvaParams.push(startDate);
        }
        
        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setDate(endDateTime.getDate() + 1);
            tvaQuery += ` AND timestamp < $${paramIndex++}`;
            tvaParams.push(endDateTime.toISOString());
        }
        
        queries.push({ query: tvaQuery, params: tvaParams, type: 'TVA' });
    }

    if (stationType === 'all' || stationType === 'MQTT') {
        let mqttQuery = 'SELECT *, \'MQTT\' as source FROM mqtt_data WHERE 1=1';
        let mqttParams = [];
        let paramIndex = 1;
        
        if (stationIds.length > 0) {
            const placeholders = stationIds.map((_, i) => `$${paramIndex++}`).join(',');
            mqttQuery += ` AND station_id IN (${placeholders})`;
            mqttParams.push(...stationIds);
        }
        
        if (parameterName !== 'all') {
            if (parameterName.toLowerCase() === 'ph' || parameterName.toLowerCase() === 'độ ph') {
                mqttQuery += ` AND (parameter_name ILIKE '%pH%' OR parameter_name ILIKE '%ph%')`;
            } else if (parameterName.toLowerCase().includes('mực nước') || parameterName.toLowerCase().includes('muc nuoc')) {
                mqttQuery += ` AND (LOWER(parameter_name) LIKE '%mực nước%' OR LOWER(parameter_name) LIKE '%muc nuoc%')`;
            } else if (parameterName.toLowerCase().includes('lưu lượng')) {
                mqttQuery += ` AND LOWER(parameter_name) LIKE '%lưu lượng%' AND LOWER(parameter_name) NOT LIKE '%tổng%'`;
            } else {
                mqttQuery += ` AND LOWER(parameter_name) = LOWER($${paramIndex++})`;
                mqttParams.push(parameterName);
            }
        }
        
        if (startDate) {
            mqttQuery += ` AND timestamp >= $${paramIndex++}`;
            mqttParams.push(startDate);
        }
        
        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setDate(endDateTime.getDate() + 1);
            mqttQuery += ` AND timestamp < $${paramIndex++}`;
            mqttParams.push(endDateTime.toISOString());
        }
        
        queries.push({ query: mqttQuery, params: mqttParams, type: 'MQTT' });
    }

    if (stationType === 'all' || stationType === 'SCADA') {
        let scadaQuery = 'SELECT *, \'SCADA\' as source FROM scada_data WHERE 1=1';
        let scadaParams = [];
        let paramIndex = 1;
        
        if (stationIds.length > 0) {
            const placeholders = stationIds.map((_, i) => `$${paramIndex++}`).join(',');
            scadaQuery += ` AND station_id IN (${placeholders})`;
            scadaParams.push(...stationIds);
        }
        
        if (parameterName !== 'all') {
            if (parameterName.toLowerCase() === 'ph' || parameterName.toLowerCase() === 'độ ph') {
                console.log('  🔬 pH filter: matching both "ph" and "độ ph"');
                scadaQuery += ` AND (parameter_name ILIKE '%pH%' OR parameter_name ILIKE '%ph%')`;
            } else if (parameterName.toLowerCase().includes('mực nước') || parameterName.toLowerCase().includes('muc nuoc')) {
                console.log('  💧 Water level filter: matching "Mực Nước" and "Mực nước"');
                scadaQuery += ` AND (LOWER(parameter_name) LIKE '%mực nước%' OR LOWER(parameter_name) LIKE '%muc nuoc%')`;
            } else if (parameterName.toLowerCase().includes('lưu lượng')) {
                console.log('  💦 Flow rate filter: matching "Lưu lượng" but excluding "Tổng Lưu Lượng"');
                scadaQuery += ` AND LOWER(parameter_name) LIKE '%lưu lượng%' AND LOWER(parameter_name) NOT LIKE '%tổng%'`;
            } else {
                console.log(`  🔬 Parameter filter: ${parameterName}`);
                scadaQuery += ` AND LOWER(parameter_name) = LOWER($${paramIndex++})`;
                scadaParams.push(parameterName);
            }
        }
        
        if (startDate) {
            scadaQuery += ` AND timestamp >= $${paramIndex++}`;
            scadaParams.push(startDate);
        }
        
        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setDate(endDateTime.getDate() + 1);
            scadaQuery += ` AND timestamp < $${paramIndex++}`;
            scadaParams.push(endDateTime.toISOString());
        }
        
        queries.push({ query: scadaQuery, params: scadaParams, type: 'SCADA' });
    }

    // Execute queries and combine results
    try {
        const allResults = [];
        
        for (const { query, params: queryParams, type: queryType } of queries) {
            console.log(`🔍 Executing ${queryType} query:`, query);
            console.log('📝 With params:', queryParams);
            
            const result = await pool.query(query, queryParams);
            console.log(`✅ ${queryType} query returned ${result.rows.length} rows`);
            if (result.rows.length > 0) {
                console.log(`   Sample ${queryType} record:`, result.rows[0]);
            }
            allResults.push(...result.rows);
        }
        
        // Sort by timestamp and limit
        allResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        console.log(`📊 getStatsData returning ${allResults.length} total records`);
        if (allResults.length > 0) {
            console.log('   Sample final record:', allResults[0]);
        }
        return allResults.slice(0, limit);
        
    } catch (err) {
        console.error('❌ Error in getStatsData:', err);
        throw err;
    }
}

/**
 * Lấy danh sách các thông số có sẵn
 */
async function getAvailableParameters() {
    const query = `
        SELECT DISTINCT parameter_name FROM (
            SELECT parameter_name FROM tva_data
            UNION
            SELECT parameter_name FROM mqtt_data
            UNION
            SELECT parameter_name FROM scada_data
        ) AS all_params ORDER BY parameter_name
    `;

    try {
        const result = await pool.query(query);
        return result.rows.map(r => r.parameter_name);
    } catch (err) {
        throw err;
    }
}

/**
 * Lấy danh sách trạm từ database
 */
async function getStations() {
    try {
        const result = await pool.query('SELECT * FROM stations ORDER BY station_name');
        return result.rows;
    } catch (err) {
        throw err;
    }
}

/**
 * Xóa dữ liệu cũ (tùy chọn)
 */
async function cleanOldData(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISO = cutoffDate.toISOString();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM tva_data WHERE timestamp < $1', [cutoffISO]);
        await client.query('DELETE FROM mqtt_data WHERE timestamp < $1', [cutoffISO]);
        await client.query('DELETE FROM scada_data WHERE timestamp < $1', [cutoffISO]);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Đóng kết nối database
 */
async function closeDatabase() {
    try {
        await pool.end();
        console.log('✅ Đã đóng kết nối database');
    } catch (err) {
        throw err;
    }
}

/**
 * Kiểm tra xem trạm có online hay không (có thay đổi giá trị trong khoảng thời gian)
 * Trả về object: { station_name: { hasChange: true/false, lastUpdate: timestamp } }
 */
async function checkStationsValueChanges(timeoutMinutes = 60) {
    const results = {};
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();
    const now = new Date();
    
    console.log(`🔍 Checking value changes for stations (timeout: ${timeoutMinutes} min, cutoff: ${cutoffTime})`);
    
    try {
        // TVA data query
        const tvaQuery = `
            SELECT 
                station_name,
                parameter_name,
                COUNT(DISTINCT value) as distinct_values,
                MAX(timestamp) as last_update,
                MIN(timestamp) as first_update,
                COUNT(*) as total_records
            FROM tva_data
            WHERE timestamp >= $1
                AND parameter_name NOT IN ('Tổng Lưu Lượng')
            GROUP BY station_name, parameter_name
        `;
        
        const tvaResult = await pool.query(tvaQuery, [cutoffTime]);
        console.log(`📊 TVA query returned ${tvaResult.rows.length} parameter groups`);
        
        // Phân tích kết quả TVA
        tvaResult.rows.forEach(row => {
            if (!results[row.station_name]) {
                results[row.station_name] = {
                    hasChange: false,
                    lastUpdate: row.last_update,
                    parameters: []
                };
            }
            
            const paramHasChange = parseInt(row.distinct_values) > 1;
            
            results[row.station_name].parameters.push({
                name: row.parameter_name,
                distinctValues: parseInt(row.distinct_values),
                totalRecords: parseInt(row.total_records),
                hasChange: paramHasChange
            });
            
            if (paramHasChange) {
                results[row.station_name].hasChange = true;
            }
            
            if (new Date(row.last_update) > new Date(results[row.station_name].lastUpdate)) {
                results[row.station_name].lastUpdate = row.last_update;
            }
        });
        
        // MQTT data query
        const mqttQuery = `
            SELECT 
                station_name,
                parameter_name,
                COUNT(DISTINCT value) as distinct_values,
                MAX(timestamp) as last_update,
                MIN(timestamp) as first_update,
                COUNT(*) as total_records
            FROM mqtt_data
            WHERE timestamp >= $1
            GROUP BY station_name, parameter_name
        `;
        
        const mqttResult = await pool.query(mqttQuery, [cutoffTime]);
        console.log(`📊 MQTT query returned ${mqttResult.rows.length} parameter groups`);
        
        // Phân tích kết quả MQTT
        mqttResult.rows.forEach(row => {
            if (!results[row.station_name]) {
                results[row.station_name] = {
                    hasChange: false,
                    lastUpdate: row.last_update,
                    parameters: []
                };
            }
            
            const paramHasChange = parseInt(row.distinct_values) > 1;
            
            results[row.station_name].parameters.push({
                name: row.parameter_name,
                distinctValues: parseInt(row.distinct_values),
                totalRecords: parseInt(row.total_records),
                hasChange: paramHasChange
            });
            
            if (paramHasChange) {
                results[row.station_name].hasChange = true;
            }
            
            if (new Date(row.last_update) > new Date(results[row.station_name].lastUpdate)) {
                results[row.station_name].lastUpdate = row.last_update;
            }
        });
        
        // SCADA data query
        const scadaQuery = `
            SELECT 
                station_name,
                parameter_name,
                COUNT(DISTINCT value) as distinct_values,
                MAX(timestamp) as last_update,
                MIN(timestamp) as first_update,
                COUNT(*) as total_records
            FROM scada_data
            WHERE timestamp >= $1
                AND parameter_name NOT IN ('Tổng Lưu Lượng')
            GROUP BY station_name, parameter_name
        `;
        
        const scadaResult = await pool.query(scadaQuery, [cutoffTime]);
        console.log(`📊 SCADA query returned ${scadaResult.rows.length} parameter groups`);
        
        // Phân tích kết quả SCADA
        scadaResult.rows.forEach(row => {
            if (!results[row.station_name]) {
                results[row.station_name] = {
                    hasChange: false,
                    lastUpdate: row.last_update,
                    parameters: []
                };
            }
            
            const paramHasChange = parseInt(row.distinct_values) > 1;
            
            results[row.station_name].parameters.push({
                name: row.parameter_name,
                distinctValues: parseInt(row.distinct_values),
                totalRecords: parseInt(row.total_records),
                hasChange: paramHasChange
            });
            
            if (paramHasChange) {
                results[row.station_name].hasChange = true;
            }
            
            if (new Date(row.last_update) > new Date(results[row.station_name].lastUpdate)) {
                results[row.station_name].lastUpdate = row.last_update;
            }
        });
        
        // Log kết quả trước khi áp dụng logic kiểm tra timeout
        console.log(`📈 Station status before timeout check:`);
        Object.keys(results).forEach(stationName => {
            const station = results[stationName];
            const changedParams = station.parameters.filter(p => p.hasChange);
            console.log(`   ${stationName}: hasChange=${station.hasChange}, lastUpdate=${station.lastUpdate}, params=${changedParams.length}/${station.parameters.length}`);
        });
        
        // Áp dụng logic: kiểm tra thời gian log dữ liệu trong SQL với thời gian hiện tại
        Object.keys(results).forEach(stationName => {
            const station = results[stationName];
            
            if (station.lastUpdate) {
                const lastUpdateTime = new Date(station.lastUpdate);
                const timeDiffMinutes = (now - lastUpdateTime) / (1000 * 60);
                
                if (timeDiffMinutes > timeoutMinutes && !station.hasChange) {
                    station.hasChange = false;
                    console.log(`   ⚠️ ${stationName}: OFFLINE (last update ${timeDiffMinutes.toFixed(1)}min ago, no changes)`);
                } else if (timeDiffMinutes > timeoutMinutes && station.hasChange) {
                    station.hasChange = true;
                    console.log(`   ℹ️ ${stationName}: ONLINE (last update ${timeDiffMinutes.toFixed(1)}min ago, but has changes)`);
                } else {
                    station.hasChange = true;
                    console.log(`   ✅ ${stationName}: ONLINE (last update ${timeDiffMinutes.toFixed(1)}min ago)`);
                }
            } else {
                station.hasChange = false;
                console.log(`   ❌ ${stationName}: OFFLINE (no update info)`);
            }
        });
        
        // Log kết quả cuối cùng
        console.log(`📊 Final station status summary:`);
        Object.keys(results).forEach(stationName => {
            const station = results[stationName];
            console.log(`   ${stationName}: ${station.hasChange ? '✅ ONLINE' : '❌ OFFLINE'}`);
        });
        
        return results;
        
    } catch (err) {
        console.error('❌ Error checking station value changes:', err);
        throw err;
    }
}

/**
 * Get last update time for each station from database
 */
async function getStationLastUpdates() {
    const lastUpdates = {};
    
    try {
        // Get last update from TVA data
        const tvaResult = await pool.query(`
            SELECT station_name, MAX(timestamp) as last_update
            FROM tva_data
            GROUP BY station_name
        `);
        
        tvaResult.rows.forEach(row => {
            lastUpdates[row.station_name] = row.last_update;
        });
        
        // Get last update from MQTT data
        const mqttResult = await pool.query(`
            SELECT station_name, MAX(timestamp) as last_update
            FROM mqtt_data
            GROUP BY station_name
        `);
        
        mqttResult.rows.forEach(row => {
            if (!lastUpdates[row.station_name] || 
                new Date(row.last_update) > new Date(lastUpdates[row.station_name])) {
                lastUpdates[row.station_name] = row.last_update;
            }
        });
        
        // Get last update from SCADA data
        const scadaResult = await pool.query(`
            SELECT station_name, MAX(timestamp) as last_update
            FROM scada_data
            GROUP BY station_name
        `);
        
        scadaResult.rows.forEach(row => {
            if (!lastUpdates[row.station_name] || 
                new Date(row.last_update) > new Date(lastUpdates[row.station_name])) {
                lastUpdates[row.station_name] = row.last_update;
            }
        });
        
        return lastUpdates;
        
    } catch (err) {
        console.error('Error getting station last updates:', err);
        throw err;
    }
}

/**
 * Get latest data for all stations from database (for map display)
 */
async function getLatestStationsData() {
    const stationsData = {};
    
    try {
        // Get latest data from TVA
        const tvaResult = await pool.query(`
            SELECT DISTINCT ON (station_name, parameter_name)
                station_name,
                station_id,
                parameter_name,
                value,
                unit,
                timestamp,
                update_time
            FROM tva_data
            WHERE timestamp >= NOW() - INTERVAL '2 hours'
            ORDER BY station_name, parameter_name, timestamp DESC
        `);
        
        // Group TVA data by station
        tvaResult.rows.forEach(row => {
            if (!stationsData[row.station_name]) {
                stationsData[row.station_name] = {
                    station: row.station_name,
                    type: 'TVA',
                    data: [],
                    updateTime: row.update_time,
                    timestamp: row.timestamp
                };
            }
            
            stationsData[row.station_name].data.push({
                name: row.parameter_name,
                value: row.value,
                unit: row.unit
            });
        });
        
        // Get latest data from MQTT
        const mqttResult = await pool.query(`
            SELECT DISTINCT ON (station_name, parameter_name)
                station_name,
                station_id,
                parameter_name,
                value,
                unit,
                timestamp,
                update_time
            FROM mqtt_data
            WHERE timestamp >= NOW() - INTERVAL '2 hours'
            ORDER BY station_name, parameter_name, timestamp DESC
        `);
        
        // Group MQTT data by station
        mqttResult.rows.forEach(row => {
            if (!stationsData[row.station_name]) {
                stationsData[row.station_name] = {
                    station: row.station_name,
                    type: 'MQTT',
                    data: [],
                    updateTime: row.update_time,
                    timestamp: row.timestamp
                };
            }
            
            stationsData[row.station_name].data.push({
                name: row.parameter_name,
                value: row.value,
                unit: row.unit
            });
        });
        
        // Get latest data from SCADA
        const scadaResult = await pool.query(`
            SELECT DISTINCT ON (station_name, parameter_name)
                station_name,
                station_id,
                parameter_name,
                value,
                unit,
                timestamp
            FROM scada_data
            WHERE timestamp >= NOW() - INTERVAL '2 hours'
            ORDER BY station_name, parameter_name, timestamp DESC
        `);
        
        // Group SCADA data by station
        scadaResult.rows.forEach(row => {
            if (!stationsData[row.station_name]) {
                stationsData[row.station_name] = {
                    station: row.station_name,
                    type: 'SCADA',
                    data: [],
                    timestamp: row.timestamp
                };
            }
            
            stationsData[row.station_name].data.push({
                name: row.parameter_name,
                value: row.value,
                unit: row.unit
            });
        });
        
        return stationsData;
        
    } catch (err) {
        console.error('Error getting latest stations data:', err);
        throw err;
    }
}

module.exports = {
    pool,
    initDatabase,
    saveTVAData,
    saveMQTTData,
    saveSCADAData,
    getStatsData,
    getAvailableParameters,
    getStations,
    saveStationInfo,
    cleanOldData,
    cleanupOldRecords,
    closeDatabase,
    checkStationsValueChanges,
    getLatestStationsData,
    MAX_RECORDS
};
