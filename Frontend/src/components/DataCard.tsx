import React from 'react';
import styles from '../styles/DataCard.module.css'

interface DataCardProps {
  title: string;          // ชื่อหัวข้อการ์ด
  value: string | number; // ค่าข้อมูล
  unit: string;           // หน่วย
  theme?: 'orange' | 'blue'; // เลือกธีมสี (Default = orange)
}

const DataCard: React.FC<DataCardProps> = ({ 
  title, 
  value, 
  unit, 
  theme = 'orange' 
}) => {
  
  // Logic เลือก Class สีตาม Theme ที่ส่งเข้ามา
  const borderClass = theme === 'orange' ? styles.themeOrange : styles.themeBlue;
  const textClass = theme === 'orange' ? styles.textOrange : styles.textBlue;

  return (
    <div className={`${styles.cardContainer} ${borderClass}`}>
      
      {/* ส่วนหัวข้อ */}
      <div className={styles.title}>{title}</div>
      
      {/* ส่วนตัวเลขและหน่วย */}
      <div className={styles.valueGroup}>
        <span className={`${styles.value} ${textClass}`}>
          {value}
        </span>
        <span className={`${styles.unit} ${textClass}`}>
          {unit}
        </span>
      </div>
      
    </div>
  );
};

export default DataCard;