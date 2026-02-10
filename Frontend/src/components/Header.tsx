// src/component/Header/Header.tsx
import React from 'react';
import styles from '../styles/Header.module.css';

const Header: React.FC = () => {
  return (
    <header className={styles.headerContainer}>
      {/* ใส่ Logo หรือชื่อเว็บตรงนี้ */}
      <div className={styles.logoText}>
        Water flow
      </div>
    </header>
  );
};

export default Header;