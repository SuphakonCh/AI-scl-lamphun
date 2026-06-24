// src/pages/DashboardPage.tsx

import { useState, useCallback, useEffect, useMemo } from 'react';
import StationTable from '../components/Dashboard-StationTable';
import { DeviceService, MockDeviceService, type DeviceRangeData, type RainProbabilityData } from '../service/deviceService';
import WaterLevelChart from '../components/WaterLevelChart';
import DataCard from '../components/DataCard';
import { STATIC_STATIONS } from '../data/stationList';
import type { StationData } from '../components/MapView';
import styles from '../styles/DashboradPage.module.css';

// *** ตัวสลับโหมด: true = ใช้ข้อมูลจำลอง, false = ต่อ API จริง ***
const USE_MOCK_DATA = true; 

const DashboardPage = () => {
    // State ข้อมูลสถานี - กู้คืนจากโค้ดทีม
    const [stationName, setStationName] = useState<string>("Loading Station...");
    const [deviceId, setDeviceId] = useState<string>("UNKNOWN_ID");
    const [location, setLocation] = useState<{lat: number, lng: number}>({
        lat: 18.586659, 
        lng: 99.023166
    });

    // State ข้อมูล Sensor
    const [waterValue, setWaterValue] = useState<string>("---");
    const [rainValue, setRainValue] = useState<string>("---");

    // State ตาราง History
    const [waterHistory, setWaterHistory] = useState<DeviceRangeData[]>([]);
    const [rainHistory, setRainHistory] = useState<DeviceRangeData[]>([]);
    const [probData, setProbData] = useState<RainProbabilityData[]>([]);
    
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleDataUpdate = useCallback((water: number, rain: number) => {
        setWaterValue(water.toFixed(3));
        setRainValue(rain.toFixed(3));
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // อ่าน Environment Variables
                const envDeviceId = import.meta.env.VITE_API_DEVICE_ID || "MOCK_DEVICE_001"; 
                const secretKey = import.meta.env.VITE_API_deviceSecretKey || "MOCK_KEY"; 
                setDeviceId(envDeviceId);

                let infoRes, waterRes, rainRes, probRes;
                const endTime = Date.now();
                const startTime = endTime - (24 * 60 * 60 * 1000); // 24 ชม.

                // --- เลือกโหมด Mock หรือ Real ---
                if (USE_MOCK_DATA) {
                    console.log("🟡 Mode: Using MOCK Data");
                    infoRes = await MockDeviceService.getStationInfo(envDeviceId);
                    [waterRes, rainRes, probRes] = await Promise.all([
                        MockDeviceService.getHistory(envDeviceId, secretKey, "water_level", startTime, endTime),
                        MockDeviceService.getHistory(envDeviceId, secretKey, "rain_fall", startTime, endTime),
                        MockDeviceService.getRainProbability()
                    ]);
                } else {
                    console.log("🟢 Mode: Using REAL API");
                    infoRes = await DeviceService.getStationInfo(envDeviceId);
                    [waterRes, rainRes, probRes] = await Promise.all([
                        DeviceService.getHistory(envDeviceId, secretKey, "water_level", startTime, endTime),
                        DeviceService.getHistory(envDeviceId, secretKey, "rain_fall", startTime, endTime),
                        DeviceService.getRainProbability()
                    ]);
                }

                // --- อัปเดต State ---
                if (infoRes) {
                    setStationName(infoRes.customName || infoRes.monitorName || "Unknown Station");
                    // if (infoRes.deviceLocation) {
                    //     setLocation({
                    //         // แก้ Bug: 118 เป็น 18 (เพราะ Latitude เกิน 90 ไม่ได้)
                    //         lat: Number(infoRes.deviceLocation.latitude) || 18.575,
                    //         lng: Number(infoRes.deviceLocation.longitude) || 99.008
                    //     });
                    // }
                }

                setWaterHistory(waterRes || []);
                setRainHistory(rainRes || []);
                setProbData(probRes || []);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // กู้คืนฟังก์ชันรวมรายชื่อสถานี (StationList) และพิกัดเตรียมไว้สำหรับหน้า Map ตามตรรกะเดิมของทีม
    const stationList: StationData[] = useMemo(() => {
        const mainStation: StationData = {
            id: deviceId,
            name: stationName,   // ชื่อที่ได้จาก API
            lat: location.lat,   // พิกัดที่ได้จาก API
            lng: location.lng,   // พิกัดที่ได้จาก API
            status: 'active'
        };

        return [mainStation, ...STATIC_STATIONS];
    }, [deviceId, stationName, location]);

    return (
        <main className={styles.container}>
            
            {/* --- ส่วนบน: สถิติ และ เปอร์เซ็นต์ฝน --- */}
            <section className={styles.topSection}>
                <div className={styles.topLeft}>
                    <div className={styles.cardGrid}>
                        <DataCard title="จำนวนสถานี" value={stationList.length} unit="สถานี" theme="blue" />
                        <DataCard title="ระดับน้ำ" value={waterValue} unit="เมตร" theme="orange" />
                        <DataCard title="ปริมาณน้ำฝนสะสม" value={rainValue} unit="มิลลิเมตร/ชั่วโมง" theme="orange" />
                    </div>
                    <div className={styles.controlBar}>
                        <select className={styles.selectInput}>
                            <option>ประเภทข้อมูล</option>
                        </select>
                        <select className={styles.selectInput}>
                            <option>ตั้งค่ากราฟ</option>
                        </select>
                    </div>
                </div>

                <div className={styles.topRight}>
                    <div className={styles.probTableCard}>
                        <div className={styles.probHeader}>เปอร์เซ็นต์การเกิดฝน</div>
                        <div className={styles.probGrid}>
                            <div className={styles.probTimeCol}>time</div>
                            <div>Sun</div><div>M</div><div>Tu</div><div>W</div><div>Th</div><div>Fr</div><div>St</div>
                            
                            {probData.map((row, idx) => (
                                <span key={idx} className={styles.probRowContents}>
                                    <div className={styles.probTimeCol}>{row.time}</div>
                                    <div>{row.sun}</div><div>{row.mon}</div><div>{row.tue}</div>
                                    <div>{row.wed}</div><div>{row.thu}</div><div>{row.fri}</div><div>{row.sat}</div>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ส่วนกลาง: กราฟเต็มจอ --- */}
            <section className={styles.chartSection}>
                <div className={styles.chartWrapper}>
                    <WaterLevelChart onDataUpdate={handleDataUpdate} />
                </div>
            </section>

            {/* --- ส่วนล่าง: ตารางข้อมูล --- */}
            <section className={styles.tableSection}>
                 <StationTable 
                    waterData={waterHistory} 
                    rainData={rainHistory} 
                    isLoading={isLoading}
                    stationName={stationName}
                 />
            </section>
        </main>
    );
}

export default DashboardPage;