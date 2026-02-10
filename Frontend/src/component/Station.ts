// 1. แก้ไข Interface ให้รองรับข้อมูลจริง
export interface DeviceData {
  deviceId: string;
  deviceSecretKey: string;
  monitorItem: string;
  customName?: string | null;
  deviceLocation?: {
    latitude?: string | null;
    longtitude?: string | null;
  };
}

export interface StationDaata {
  // แก้จุดที่ 1: เปลี่ยน id เป็น string เพื่อรับ deviceId ได้
  id?: string; 
  
  // ลบ | "No name" ออก เพราะใน Interface เรากำหนดแค่ Type ไม่ใช่ค่า Default
  name?: string; 
  
  location?: string;
  
  // แก้คำผิด waring -> warning
  status?: 'normal' | 'warning' | 'critical' | 'offline';
  
  date: Date | null;
  action: number | null;
}

export const transformData = (dvData: DeviceData[]): StationDaata[] => {
  return dvData.map((item) => {
    
    // แก้จุดที่ 2: จัดการ Location ให้ปลอดภัยขึ้น
    let locationString = "ไม่ระบุตำแหน่ง";
    
    // เช็คว่ามี object และมีค่า latitude/longtitude จริงๆ ถึงจะแสดง
    if (item.deviceLocation?.latitude && item.deviceLocation?.longtitude) {
        locationString = `${item.deviceLocation.latitude}, ${item.deviceLocation.longtitude}`;
    }

    return {
      id: item.deviceId,           // ใส่ได้แล้วเพราะแก้ Type เป็น string แล้ว
      name: item.customName ?? "No name", // ใช้ ?? เพื่อตั้งค่า Default
      location: locationString,
      status: 'normal',
      date: null,
      action: null
    };
  });
};




//  Mock Data (ข้อมูลสมมติที่มาจาก Database) ---
export const mockDatabaseData: DeviceData[] = [
  {
    deviceId: 'D001',
    deviceSecretKey: 'xxx',
    monitorItem: 'Water',
    customName: 'ลำพูน',
    deviceLocation: { latitude: 'ลำพูน', longtitude: 'อ.เมือง' }
  },
  {
    deviceId: 'D002',
    deviceSecretKey: 'xxx',
    monitorItem: 'Water',
    customName: 'ลำพูน',
    deviceLocation: { latitude: 'ลำพูน', longtitude: 'อ.ต.' }
  },
  {
    deviceId: 'D003',
    deviceSecretKey: 'xxx',
    monitorItem: 'Water',
    customName: 'ลำพูน',
    deviceLocation: { latitude: 'ลำพูน', longtitude: 'อ.ต.' }
  },
];