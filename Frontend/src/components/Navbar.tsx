import { Routes, Route, Link, useLocation } from "react-router-dom";
import DashboardPage from '../pages/DashboradPage'; // เช็คชื่อไฟล์ดีๆ นะครับ (Dashboard)
import Station from '../pages/Station';

// 1. สร้างส่วน "หน้าตาปุ่มเมนู" ไว้เป็นตัวแปรข้างบน (เพื่อให้โค้ดอ่านง่าย)
const MenuBar = () => {
  const location = useLocation();
  
  // ฟังก์ชันเช็คว่าอยู่หน้าไหนให้ปุ่มเป็นสีเข้ม
  const isActive = (path: string) => 
    location.pathname === path ? "bg-blue-800 shadow-inner" : "hover:bg-blue-800";

  return (
    <nav className="bg-blue-900 text-white p-4 flex gap-4 mb-4 rounded-lg shadow-md">
      {/* ปุ่ม Dashboard */}
      <Link to="/" className={`flex flex-col px-4 py-2 rounded-md transition-all ${isActive('/')}`}>
        <p className='font-bold'>แดชบอร์ด</p>
        <p className='text-xs text-blue-200 font-light'>ภาพรวมของระบบ</p>
      </Link>

      {/* ปุ่ม Station */}
      <Link to="/station" className={`flex flex-col px-4 py-2 rounded-md transition-all ${isActive('/station')}`}>
        <p className='font-bold'>ข้อมูลสถานี</p>
        <p className='text-xs text-blue-200 font-light'>ข้อมูลโดยละเอียด</p>
      </Link>
    </nav>
  );
};

// 2. Component หลัก (ที่จะ Export ไปใช้)
function Navbar() {
  return (
    <div className="container-layout">
      
      {/* ส่วนที่ 1: แสดงเมนูอยู่ด้านบนเสมอ */}
      <MenuBar />

      {/* ส่วนที่ 2: พื้นที่แสดงเนื้อหาที่จะเปลี่ยนไปตาม URL */}
      <div className="content-area">
        <Routes>
          <Route path='/' element={<DashboardPage />} />
          <Route path='/station' element={<Station />} />
        </Routes>
      </div>

    </div>
  );
}

export default Navbar;