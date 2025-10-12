import React from 'react';
import './EditPopover.css';

function EditPopover({ slotData, allCategories, onAssignmentChange, onClose }) {
  const { id, name, position, size, assignedCategory } = slotData;

  const handleSelectChange = (e) => {
    const newCategoryId = e.target.value;
    onAssignmentChange(id, newCategoryId === "" ? null : newCategoryId);
    onClose();
  };
  
  const parentCategories = allCategories.filter(cat => !cat.parentId);
  const childCategories = allCategories.filter(cat => cat.parentId);

  const popoverStyle = {
    top: `${position.y}px`,
    left: `${position.x + size.width + 10}px`,
  };

  return (
    <>
      <div className="popover-overlay" onClick={onClose}></div>
      <div className="edit-popover" style={popoverStyle}>
        <h3>{name}</h3>
        <p>カテゴリを選択してください</p>
        <select 
          value={assignedCategory ? assignedCategory.id : ''} 
          onChange={handleSelectChange}
        >
          <option value="">（未割り当て）</option>
          {parentCategories.map(parent => (
            <optgroup key={parent.id} label={parent.name}>
              {childCategories
                .filter(child => child.parentId === parent.id)
                .map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))
              }
            </optgroup>
          ))}
        </select>
        <button onClick={onClose} className="close-button">閉じる</button>
      </div>
    </>
  );
}

export default EditPopover;