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

  return (
    <div
      ref={setNodeRef}
      style={{ ...slotStyle, ...style }} 
      className={containerClassName}
      onClick={onSlotClick}
      {...draggableProps}
    >
      <div className="slot-info">
        {/* ★★★ 棚の名前を表示する条件を削除 ★★★ */}
        <span className="slot-category">
          {parentCategory && `${parentCategory.name} / `}
          {assignedCategory ? assignedCategory.name : '（未割り当て）'}
        </span>
        {(assignedCategory || parentCategory) && (
            <span className="slot-code">
                {parentCategory?.departmentCode || assignedCategory?.departmentCode || ''}
                {assignedCategory?.genreCode && `-${assignedCategory.genreCode}`}
            </span>
        )}
      </div>
    </div>
  );
}

export default Slot;