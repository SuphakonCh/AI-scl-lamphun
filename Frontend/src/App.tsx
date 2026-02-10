import { useState } from 'react'
import WaterLevelChart from './component/WaterLevelChart'; 
import DataCard from './component/DataCard';
import StatusCard from './component/StatusCard';
import Header from './component/Header';
import StationManagement from './component/Station.tsx'
import {BrowserRouter, Routes, Route, Link} from "react-router-dom"
import { Home } from 'lucide-react';
import Homepage from './component/็Home.tsx';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      {/* ใส่กราฟหรือข้อมูลที่คุณต้องการโชว์ในหน้าแรกตรงนี้ */}      
      <WaterLevelChart />
    </div>
  );
};
  
const Navbar = () => {
  return (
    <nav className="bg-blue-900 text-white p-4 flex gap-4 mb-4 rounded-lg">
      <Link to="/" className="hover:text-blue-200 font-bold">
        <p className='name-page'>แดชบอร์ด</p>
        <p className='name-page under'>ภาพรวมของระบบ</p>
      </Link>
      <Link to="/station" className="hover:text-blue-200 font-bold">
        <p className='name-page'>ข้อมูลสถานี</p>
        <p className='name-page under'>ข้อมูลโดยละเอียด</p>
      </Link>
    </nav>
  );
};
     //<Link to ="/WaterLevelChart">WaterLevelChart</Link>  
     //<Route path='/WaterLevelChart' element={<WaterLevelChart/>}
        

function App() {
  return (
<BrowserRouter>
      
      <div className="p-4"> {/* Container หลัก */}
        <Header />
        
        {/* ใส่ Navbar ตรงนี้ เพื่อให้ทุกหน้ามองเห็นเมนู */}
        <Navbar />

        <div style={{ marginBottom: '32px' }}>
          <h1 className="text-2xl font-bold text-blue-800 mb-4">
            Lamphun Smart Water
          </h1>

          <div className="content-area bg-white p-6 rounded-lg shadow-sm">
            {/* 4. กำหนด Routes */}
            <Routes>
              {/* หน้าแรก: ให้ไปที่ Dashboard Component ที่เราสร้างใหม่ด้านบน */}
              <Route path='/' element={<Dashboard />} />
              
              {/* หน้า Station: ลิงก์ไปหาไฟล์ StationManagement */}
              <Route path='/station' element={<StationManagement />} />
            </Routes>
          </div>
        </div>
      </div>
 </BrowserRouter>     
  );
}

export default App