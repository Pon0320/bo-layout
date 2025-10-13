import React, { useState, useEffect } from 'react';
import './EditPopover.css';

function EditPopover({ slotData, allCategories, onAssignmentChange, onSlotSizeChange, onDeleteSlot, onClose, gridSize }) {
  const { id, name, position, size, assignedCategory } = slotData;

  const [currentWidth, setCurrentWidth] = useState(size ? size.width : 140);
  const [currentHeight, setCurrentHeight] = useState(size ? size.height : 50);

  useEffect(() => {
    setCurrentWidth(size ? size.width : 140);
    setCurrentHeight(size ? size.height : 50);
  }, [id, size]);


  const handleSelectChange = (e) => {
    const newCategoryId = e.target.value;
    onAssignmentChange(id, newCategoryId === "" ? null : newCategoryId);
  };

  const handleSizeSave = () => {
    onSlotSizeChange(id, { width: currentWidth, height: currentHeight });
    onClose();
  };
  
  const handleDeleteClick = () => {
    onDeleteSlot(id);
    onClose();
  };
  
  const parentCategories = allCategories.filter(cat => !cat.parentId);
  const childCategories = allCategories.filter(cat => cat.parentId);

  // ★★★ 位置計算の popoverStyle は不要なので削除されています ★★★

  return (
    <>
      <div className="popover-overlay" onClick={onClose}></div>
      {/* ★★★ style属性を削除し、CSSだけで位置を制御します ★★★ */}
      <div className="edit-popover">
        <h3>{name}</h3>
        
        <div className="popover-section">
          <p>カテゴリを選択</p>
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
        </div>
        
        <div className="popover-section">
            <p>サイズを変更 (px)</p>
            <div className="size-edit-inputs">
                <input 
                    type="number" 
                    value={currentWidth} 
                    onChange={(e) => setCurrentWidth(e.target.value)}
                    step={gridSize}
                />
                <span>x</span>
                <input 
                    type="number" 
                    value={currentHeight} 
                    onChange={(e) => setCurrentHeight(e.target.value)}
                    step={gridSize}
                />
            </div>
        </div>

        <div className="popover-actions">
            <button onClick={handleSizeSave} className="save-button">サイズを保存</button>
            <button onClick={onClose} className="close-button">閉じる</button>
        </div>

        <div className="popover-section danger-zone">
            <button onClick={handleDeleteClick} className="delete-button-popover">このスロットを削除</button>
        </div>
      </div>
    </>
  );
}

export default EditPopover;