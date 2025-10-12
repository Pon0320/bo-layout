import React from 'react';
import './Slot.css';

function Slot({ slotData, onSlotClick }) {
  const { name, position, size, assignedCategory, parentCategory } = slotData;

  const color = assignedCategory ? assignedCategory.color : '#E0E0E0';

  const slotStyle = {
    top: `${position.y}px`,
    left: `${position.x}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    backgroundColor: color,
    borderColor: color.includes('hsl') ? color.replace('85%)', '60%') : '#A0A0A0',
  };

  return (
    <button style={slotStyle} className="slot-container" onClick={onSlotClick}>
      <div className="slot-info">
        <span className="slot-name">{name}</span>
        <span className="slot-category">
          {parentCategory && `${parentCategory.name} / `}
          {assignedCategory ? assignedCategory.name : '（未割り当て）'}
        </span>
      </div>
    </button>
  );
}

export default Slot;