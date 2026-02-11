// StationManagement.tsx
import React, { useState, useEffect } from 'react';
import { transformData,type StationData, mockDatabaseData } from '../components/Station.ts'; // เช็ค Path ให้ถูกนะครับ

// Import Component ย่อยที่เราแยกไว้
import StationHeader from '../components/StationHeader';
import StationTable from '../components/StationTable';

const StationManagement: React.FC = () => {
  // 1. State Management
  const [stations, setStations] = useState<StationData[]>([]);

  // 2. Fetch Data Logic
  useEffect(() => {
    const data = transformData(mockDatabaseData);
    setStations(data);
  }, []);

  // 3. Render
  return (
    <div className="bg-gray-100 min-h-screen p-8 font-sans">
      
      {/* ส่วนหัว (Search & Button) */}
      <StationHeader />

      {/* ส่วนตาราง (ส่งข้อมูล stations ไปให้) */}
      <StationTable stations={stations} />
      
    </div>
  );
};

export default StationManagement;