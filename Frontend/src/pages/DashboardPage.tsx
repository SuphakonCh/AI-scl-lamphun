import WaterLevelChart from '../components/WaterLevelChart';
import DataCard from '../components/DataCard';
import styles from '../styles/DashboradPage.module.css';
import MapView  from '../components/MapView';

function DashboardPage(){
    return(
        <>
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
      {/* --- พื้นที่วางกราฟ + แผนที่ --- */}
      <div className={styles.chartSection}>
        <div className={styles.chartWrapper}>
          <WaterLevelChart />
        </div>
        
        <div className={styles.mapWrapper}>
          <MapView 
            latitude={18.598917} 
            longitude={99.031917} 
            stationName="สถานีตรวจวัดลำพูน" 
          />
        </div>
      </div>

    </>
    );
}

export default DashboardPage;