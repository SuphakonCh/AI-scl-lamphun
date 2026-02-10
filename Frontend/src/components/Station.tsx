import React, { useState, useEffect } from 'react'; // 1. ต้อง import useState และ useEffect มาด้วย
import { Search, MoreHorizontal } from 'lucide-react';
// ตรวจสอบชื่อไฟล์ให้ดีว่าไฟล์ Station.ts หรือ Station.tsx อยู่โฟลเดอร์เดียวกันหรือไม่
import { transformData, StationData, mockDatabaseData } from './Station.tsx'; 

const StationManagement: React.FC = () => {
  // -------------------------------------------------------
  // ส่วนที่เพิ่มเข้ามา (ที่หายไป)
  // -------------------------------------------------------
  
  // 2. ประกาศ State เพื่อเก็บข้อมูล stations
  // เริ่มต้นให้เป็น array ว่าง []
  const [stations, setStations] = useState<StationData[]>([]);

  // 3. ใช้ useEffect เพื่อดึงข้อมูลตอนโหลดหน้าเว็บครั้งแรก
  useEffect(() => {
    // เรียกฟังก์ชันแปลงข้อมูลที่เราเขียนไว้
    const data = transformData(mockDatabaseData);
    
    // เอาข้อมูลที่ได้ไปใส่ใน State
    setStations(data);
  }, []); // [] ว่างๆ แปลว่าทำแค่ครั้งเดียวตอนเปิดหน้าเว็บ

  // -------------------------------------------------------

  return (
    <div className="bg-gray-100 min-h-screen p-8 font-sans">
      
    
      {/* --- Search Bar --- */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-3/4">
           <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
           <input type="text" className="w-full pl-12 pr-4 py-3 rounded-full bg-white shadow-sm outline-none" placeholder="" />
        </div>
        <button className="bg-white text-gray-700 font-bold py-3 px-8 rounded-full shadow-sm hover:bg-gray-50">
          Add sensor +
        </button>
      </div>

      {/* --- ตารางข้อมูล --- */}
      <div className="w-full">
        {/* หัวตาราง */}
    <thead  className="bg-[#5b6b88] text-white text-sm font-bold uppercase tracking-wide">
      <tr>
        <th className="py-3 px-6 text-center w-1/4">STATION NAME</th>
        <th className="py-3 px-6 text-center w-1/4">LOCATION</th>
        <th className="py-3 px-6 text-center w-1/6">STATUS</th>
        <th className="py-3 px-6 text-center w-1/6">DATE</th>
        <th className="py-3 px-6 text-center w-1/6">ACTION</th>
      </tr>
    </thead>


      <div className="w-full bg-white rounded-b-lg shadow-md overflow-hidden"> 
  <table className="w-full table-auto">
    <tbody className="text-gray-600 text-sm font-light">
      {stations.map((item, index) => (
        <tr 
          key={item.id || index} 
          className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
        >
          
          {/* 1. Station Name */}
          <td className="py-4 px-6 text-center font-bold text-gray-800 w-1/4">
            {item.name}
          </td>

          {/* 2. Location */}
          <td className="py-4 px-6 text-center text-gray-800 font-medium w-1/4">
            {item.location}
          </td>

          {/* 3. Status */}
          <td className="py-4 px-6 w-1/6">
            <div className="flex items-center justify-center">
               <div className="flex items-center bg-gray-100 rounded-full px-4 py-1 shadow-sm border border-gray-100">
                  <span className={`w-3 h-3 rounded-full mr-2 ${
                      item.status === 'normal' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></span>
                  <span className={`text-xs font-bold uppercase ${
                      item.status === 'normal' ? 'text-green-700' : 'text-gray-500'
                  }`}>
                      {item.status === 'normal' ? 'online' : 'offline'}
                  </span>
               </div>
            </div>
          </td>


          {/* 4. Date */}
          <td className="py-4 px-6 text-center font-bold text-gray-700 w-1/6">
            {item.date ? item.date.toLocaleDateString('th-TH') : '-'}
          </td>

          {/* 5. Action */}
          <td className="py-4 px-6 w-1/6 text-center">
            <div className="flex items-center justify-center text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">
              <MoreHorizontal size={20} />
            </div>
          </td>

        </tr>
      ))}
    </tbody>
  </table>
</div>
        </div>
      </div>

   
  );
};

export default StationManagement;