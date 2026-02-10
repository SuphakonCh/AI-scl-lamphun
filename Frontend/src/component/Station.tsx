import React, { useState, useEffect } from 'react'; // 1. ต้อง import useState และ useEffect มาด้วย
import { Search, MoreHorizontal } from 'lucide-react';
// ตรวจสอบชื่อไฟล์ให้ดีว่าไฟล์ Station.ts หรือ Station.tsx อยู่โฟลเดอร์เดียวกันหรือไม่
import { transformData, StationDaata, mockDatabaseData } from './Station'; 

const StationManagement: React.FC = () => {
  // -------------------------------------------------------
  // ส่วนที่เพิ่มเข้ามา (ที่หายไป)
  // -------------------------------------------------------
  
  // 2. ประกาศ State เพื่อเก็บข้อมูล stations
  // เริ่มต้นให้เป็น array ว่าง []
  const [stations, setStations] = useState<StationDaata[]>([]);

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
      
      {/* --- ส่วน Header --- */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="bg-[#1e3a8a] text-white p-4 font-bold text-lg">Water Flow</div>
        <div className="flex justify-center space-x-4 p-4">
           <button className="px-6 py-2 rounded-full text-gray-500">แดชบอร์ด</button>
           <button className="px-6 py-2 rounded-full text-gray-500">แผนที่ GIS</button>
           <button className="px-6 py-2 rounded-full bg-[#1e3a8a] text-white shadow-lg">ข้อมูลสถานี</button>
           <button className="px-6 py-2 rounded-full text-gray-500">การตั้งค่า</button>
        </div>
      </div>

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
        <div className="flex bg-[#5b6b88] text-white py-3 px-6 rounded-t-lg text-sm font-bold uppercase tracking-wide mb-4 shadow-md">
          <div className="w-1/4 text-center">STATION NAME</div>
          <div className="w-1/4 text-center">LOCATION</div>
          <div className="w-1/6 text-center">STATUS</div>
          <div className="w-1/6 text-center">DATE</div>
          <div className="w-1/6 text-center">ACTION</div>
        </div>

        {/* --- Loop ข้อมูล --- */}
        <div className="space-y-3">
          {/* ตอนนี้ stations มีค่าแล้ว เพราะเราสั่ง setStations ใน useEffect */}
          {stations.map((item, index) => (
            // แนะนำให้ใช้ item.id เป็น key ถ้าไม่มีให้ใช้ index (แต่ id ดีที่สุด)
            <div key={item.id || index} className="flex items-center bg-white py-4 px-6 rounded-full shadow-md hover:shadow-lg transition-all">
              
              <div className="w-1/4 text-center font-bold text-gray-800">
                {item.name}
              </div>

              <div className="w-1/4 text-center text-gray-800 font-medium">
                {item.location}
              </div>

              <div className="w-1/6 flex justify-center">
                <div className="flex items-center bg-gray-100 rounded-full px-4 py-1 shadow-inner">
                  <span className={`w-3 h-3 rounded-full mr-2 ${
                      item.status === 'normal' ? 'bg-green-500' : 'bg-gray-500'
                  }`}></span>
                  <span className="text-sm font-bold text-gray-600 uppercase">
                      {item.status === 'normal' ? 'online' : 'offline'}
                  </span>
                </div>
              </div>

              <div className="w-1/6 text-center font-bold text-gray-700">
                {/* ตรวจสอบว่า date ไม่ใช่ null ก่อนเรียกใช้ฟังก์ชัน */}
                {item.date ? item.date.toLocaleDateString('th-TH') : '-'}
              </div>

              <div className="w-1/6 flex justify-center text-gray-400 cursor-pointer">
                <MoreHorizontal />
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default StationManagement;