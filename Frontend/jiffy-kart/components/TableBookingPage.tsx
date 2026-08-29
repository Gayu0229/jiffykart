import React from 'react';

export const TableBookingPage: React.FC<{ onBack: () => void; shopId: string | number }> = ({ onBack, shopId }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <p style={{ color: '#999', fontSize: 18 }}>New table booking UI coming soon…</p>
    </div>
  );
};

export default TableBookingPage;
