const fs = require('fs');
const { groupByStation } = require('./tva-channel-mapping');

// Tạo dữ liệu giả với giá trị
const mockChannels = [
    // G5 NM1
    { CnlNum: 2907, Val: 15.5, TextWithUnit: '15.5', Stat: 1 },
    { CnlNum: 2909, Val: 25.3, TextWithUnit: '25.3', Stat: 1 },
    { CnlNum: 2910, Val: 1234.5, TextWithUnit: '1234.5', Stat: 1 },
    { CnlNum: 2928, Val: 0.3, TextWithUnit: '0.3', Stat: 1 },
    { CnlNum: 2929, Val: 8.5, TextWithUnit: '8.5', Stat: 1 },
    { CnlNum: 2930, Val: 7.2, TextWithUnit: '7.2', Stat: 1 },
    { CnlNum: 2931, Val: 450, TextWithUnit: '450', Stat: 1 },
    
    // G4 NM2
    { CnlNum: 2902, Val: 12.8, TextWithUnit: '12.8', Stat: 1 },
    { CnlNum: 2904, Val: 30.2, TextWithUnit: '30.2', Stat: 1 },
    { CnlNum: 2905, Val: 2456.7, TextWithUnit: '2456.7', Stat: 1 },
    { CnlNum: 2932, Val: 0.4, TextWithUnit: '0.4', Stat: 1 },
    { CnlNum: 2933, Val: 9.2, TextWithUnit: '9.2', Stat: 1 },
    { CnlNum: 2934, Val: 6.8, TextWithUnit: '6.8', Stat: 1 },
    { CnlNum: 2935, Val: 520, TextWithUnit: '520', Stat: 1 },
    
    // G4 NM1
    { CnlNum: 2912, Val: 18.3, TextWithUnit: '18.3', Stat: 1 },
    { CnlNum: 2914, Val: 22.5, TextWithUnit: '22.5', Stat: 1 },
    { CnlNum: 2915, Val: 3456.8, TextWithUnit: '3456.8', Stat: 1 },
    
    // TRẠM 1
    { CnlNum: 2917, Val: 8.5, TextWithUnit: '8.5', Stat: 1 },
    { CnlNum: 2919, Val: 45.6, TextWithUnit: '45.6', Stat: 1 },
    { CnlNum: 2920, Val: 5678.9, TextWithUnit: '5678.9', Stat: 1 },
    
    // TRẠM 24
    { CnlNum: 2922, Val: 0.4, TextWithUnit: '0.4', Stat: 1 },
    { CnlNum: 2923, Val: 10.2, TextWithUnit: '10.2', Stat: 1 },
    { CnlNum: 2925, Val: 8.5, TextWithUnit: '8.5', Stat: 1 },
    { CnlNum: 2926, Val: 7.5, TextWithUnit: '7.5', Stat: 1 },
    { CnlNum: 2927, Val: 380, TextWithUnit: '380', Stat: 1 },
];

const groupedStations = groupByStation(mockChannels);

const outputData = {
    timestamp: new Date().toISOString(),
    source: "SCADA_TVA",
    method: "MOCK_DATA",
    totalChannels: mockChannels.length,
    totalStations: Object.keys(groupedStations).length,
    channels: mockChannels,
    stationsGrouped: groupedStations,
};

fs.writeFileSync('data_scada_tva.json', JSON.stringify(outputData, null, 2), 'utf-8');
console.log('✅ Đã tạo dữ liệu SCADA giả');
console.log('Stations:', Object.keys(groupedStations));
