import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import styles from '../styles/WaterLevelChart.module.css';

// --- Types & Interfaces ---
interface WaterData {
  time: string;
  waterLevel: number;
  rainLevel: number;
}

interface WaterLevelChartProps {
  onDataUpdate?: (water: number, rain: number) => void;
}

// --- Sub-components ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.customTooltip}>
      <p className={`${styles.tooltipTime} text-caption`}>เวลา {label} น.</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className={styles.tooltipValueRow}>
          <div className={styles.tooltipDot} style={{ backgroundColor: entry.color }}></div>
          <span className={styles.tooltipValue}>
            {entry.name}: {Number(entry.value).toFixed(3)} {entry.unit}
          </span>
        </div>
      ))}
    </div>
  );
};

// --- Main Component ---
export const WaterLevelChart: React.FC<WaterLevelChartProps> = ({ onDataUpdate }) => {
  const [data, setData] = useState<WaterData[]>([]);
  const [currentWater, setCurrentWater] = useState<number | null>(null);
  const dataRef = useRef<WaterData[]>([]);
  
  // ตัวแปรจำค่าฝนสะสม (เริ่มที่ 0) - กู้คืนจากโค้ดทีม
  const accumulatedRainRef = useRef<number>(0);

  const fetchLatestData = useCallback(async () => {
    try {
      const response = await fetch(`/api/v2/device/latest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: import.meta.env.VITE_API_DEVICE_ID,
          deviceSecretKey: import.meta.env.VITE_API_deviceSecretKey,
          monitorItem: import.meta.env.VITE_API_monitorItem,
        })
      });

      const result = await response.json();
      if (!result.monitorValue) return;

      const waterVal = parseFloat(parseFloat(result.monitorValue).toFixed(3));
      
      // ถ้าไม่มีค่าจริงจาก API ให้สุ่มค่าเล็กๆ (0.0 - 0.5) เพื่อจำลองฝนตกปรอยๆ
      const rainDelta = result.rainLevel 
        ? parseFloat(parseFloat(result.rainLevel).toFixed(3)) 
        : parseFloat((Math.random() * 0.5).toFixed(3));
      
      // บวกทบเข้าไปในยอดสะสมรวม
      accumulatedRainRef.current += rainDelta;
      const totalRain = parseFloat(accumulatedRainRef.current.toFixed(3));

      const timeStr = new Date().toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      setCurrentWater(waterVal);
      // ส่งค่า totalRain (สะสม) ออกไปให้ DashboardPage
      if (onDataUpdate) onDataUpdate(waterVal, totalRain);

      const newItem: WaterData = { 
        time: timeStr, 
        waterLevel: waterVal, 
        rainLevel: totalRain
      };

      const newData = [...dataRef.current, newItem].slice(-24);
      
      dataRef.current = newData;
      setData(newData);
    } catch (err) {
      console.error("Failed to fetch water data:", err);
    }
  }, [onDataUpdate]);

  useEffect(() => {
    fetchLatestData();
    // ดึงข้อมูลใหม่ทุก 10 วินาที
    const interval = setInterval(fetchLatestData, 10000);
    return () => clearInterval(interval);
  }, [fetchLatestData]);

  return (
    <div className={styles.chartCard}>
      {/* ส่วน header ถูกลบไปรวมกับหน้า DataCard ตามแบบ Figma แล้ว แต่ยังคงตรรกะ currentWater และการดึงข้อมูลไว้อยู่ */}
      
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRainfall" x1="0" y1="0" x2="0" y2="1">
                {/* เปลี่ยนจากการใช้สี Hex เป็นการดึงตัวแปร CSS ของทีม */}
                <stop offset="5%" stopColor="var(--color-graf-rain)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-graf-rain)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--color-text-secondary)" />
            <XAxis 
                dataKey="time" 
                fontSize={12} 
                stroke="var(--color-text-secondary)" 
                tickLine={false} 
                axisLine={{stroke: "var(--color-text-secondary)"}} 
                dy={10}
            />
            <YAxis 
                fontSize={12} 
                stroke="var(--color-text-secondary)" 
                tickLine={false} 
                axisLine={false} 
                dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-text-secondary)', strokeWidth: 1, strokeDasharray: '3 3' }} />
            
            <Area 
              type="monotone" 
              dataKey="rainLevel" 
              name="ปริมาณน้ำฝนสะสม"
              stroke="var(--color-graf-rain)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRainfall)" 
              activeDot={{ r: 6, fill: "var(--color-graf-rain)", stroke: "#fff", strokeWidth: 2 }}
              dot={{ r: 3, fill: "#fff", stroke: "var(--color-graf-rain)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend />
    </div>
  );
};

const ChartLegend = () => (
  <div className={styles.legendContainer}>
    <div className={styles.legendItem}>
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="6" r="3" fill="#ffffff" stroke="var(--color-graf-rain)" strokeWidth="2"/>
        <line x1="7" y1="6" x2="17" y2="6" stroke="var(--color-graf-rain)" strokeWidth="2"/>
        <circle cx="20" cy="6" r="3" fill="#ffffff" stroke="var(--color-graf-rain)" strokeWidth="2"/>
      </svg>
      <span className={styles.legendText}>ปริมาณน้ำฝนสะสม</span>
    </div>
  </div>
);

export default WaterLevelChart;