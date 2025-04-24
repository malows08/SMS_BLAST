import React, { useState } from 'react';

// Simple Switch Component
export const Switch = ({ isOn, handleToggle, onLabel = "Quick Send", offLabel = "Compose SMS" }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span>{isOn ? onLabel : offLabel}</span>
    <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 20 }}>
      <input
        type="checkbox"
        checked={isOn}
        onChange={handleToggle}
        style={{ display: 'none' }}
      />
      <span
        style={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0, left: 0, right: 0, bottom: 0,
          background: isOn ? '#4caf50' : '#ccc',
          transition: '.4s',
          borderRadius: 20
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: isOn ? 20 : 0,
          top: 0,
          width: 20, height: 20,
          background: '#fff',
          borderRadius: '50%',
          transition: '.4s'
        }}
      />
    </label>
  </div>
);
export default Switch;
