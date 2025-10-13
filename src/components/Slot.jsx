import React from 'react';
import './Slot.css';
import { useDraggable } from '@dnd-kit/core';

function Slot({ slotData, isEditMode, onSlotClick, onDeleteSlot }) {
  const { id, name, position, size, assignedCategory, parentCategory } = slotData;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    disabled: !isEditMode,
  });

  const color = assignedCategory ? assignedCategory.color : '#E0E0E0';

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const slotStyle = {
    top: `${position.y}px`,
    left: `${position.x}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    backgroundColor: color,
    borderColor: color.includes('hsl') ? color.replace('85%)', '60%') : '#A0A0A0',
  };

  const isVertical = size.height > size.width;
  const draggableProps = isEditMode ? { ...listeners, ...attributes } : {};
  const containerClassName = `slot-container ${isEditMode ? 'draggable' : 'clickable'} ${isVertical ? 'vertical' : ''}`;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDeleteSlot(id);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...slotStyle, ...style }} 
      className={containerClassName}
      onClick={onSlotClick}
      {...draggableProps}
    >
      {isEditMode && (
        <button onClick={handleDeleteClick} className="delete-slot-button">×</button>
      )}
      <div className="slot-info">
        <span className="slot-name">{name}</span>
        <span className="slot-category">
          {parentCategory && `${parentCategory.name} / `}
          {assignedCategory ? assignedCategory.name : '（未割り当て）'}
        </span>
      </div>
    </div>
  );
}

export default Slot;