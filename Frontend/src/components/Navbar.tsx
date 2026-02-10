import { useState } from 'react'
import WaterLevelChart from './WaterLevelChart.tsx'; 
import DataCard from './DataCard.tsx';
import StatusCard from './StatusCard.tsx';
import StationManagement from './Station.tsx'
import {BrowserRouter, Routes, Route, Link} from "react-router-dom"



     //<Link to ="/WaterLevelChart">WaterLevelChart</Link>  
     //<Route path='/WaterLevelChart' element={<WaterLevelChart/>}
function shadowNavbar() {
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
    return(
        <Navbar />
    )
}

export default shadowNavbar
