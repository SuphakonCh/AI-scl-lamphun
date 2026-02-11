// src/components/Station/StationTable.tsx
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
// Import Type เข้ามาเพื่อให้ TypeScript รู้จักหน้าตาข้อมูล
import { type StationData } from './Station.ts'; 

interface StationTableProps {
  stations: StationData[]; // รับข้อมูลรายการสถานีเข้ามา
}

const StationTable: React.FC<StationTableProps> = ({ stations }) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full table-auto text-left">
        
        {/* Header */}
        <thead className="bg-[#5b6b88] text-white text-sm font-bold uppercase tracking-wide">
          <tr>
            <th className="py-4 px-6 text-center w-1/4">STATION NAME</th>
            <th className="py-4 px-6 text-center w-1/4">LOCATION</th>
            <th className="py-4 px-6 text-center w-1/6">STATUS</th>
            <th className="py-4 px-6 text-center w-1/6">DATE</th>
            <th className="py-4 px-6 text-center w-1/6">ACTION</th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="text-gray-600 text-sm font-light">
          {stations.length > 0 ? (
            stations.map((item, index) => (
              <tr 
                key={item.id || index} 
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="py-4 px-6 text-center font-bold text-gray-800">{item.name}</td>
                <td className="py-4 px-6 text-center text-gray-800 font-medium">{item.location}</td>
                
                {/* Status Column */}
                <td className="py-4 px-6">
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

                <td className="py-4 px-6 text-center font-bold text-gray-700">
                  {item.date ? item.date.toLocaleDateString('th-TH') : '-'}
                </td>
                
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center text-gray-400 hover:text-blue-600 cursor-pointer">
                    <MoreHorizontal size={20} />
                  </div>
                </td>
              </tr>
            ))
          ) : (
            // กรณีไม่มีข้อมูล
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-400">
                No stations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StationTable;