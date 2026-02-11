import WaterLevelChart from '../components/WaterLevelChart';
import DataCard from '../components/DataCard';
import styles from '../styles/DashboradPage.module.css';
import Navbar from '../components/Navbar';

//import Station from '../pages/Station.tsx'
//import { Routes, Route } from "react-router-dom";

//<Navbar/>
function DashboardPage(){
    return(
        <>

    <div className='nevbar'>
<Navbar />
    </div>

      <div className={styles.cardGrid}>
        
                <DataCard 
                    title="จำนวนสถานี" 
                    value={1} 
                    unit="สถานี" 
                    theme="orange" 
                />
              <DataCard 
                    title="ระดับน้ำ" 
                    value="150.250" 
                    unit="เมตร" 
                    theme="blue" 
                />
               <DataCard 
                    title="ปริมาณน้ำฝนสะสม" 
                    value="50.568" 
                    unit="มิลลิเมตร/ชม." 
                    theme="blue" 
                />
                      
            </div>
      {/* --- พื้นที่วางกราฟ --- */}
      <div className={styles.chartSection}>
      <WaterLevelChart />
      </div>
    </>
    );
}

export default DashboardPage;