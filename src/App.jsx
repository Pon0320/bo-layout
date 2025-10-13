import { useState, useEffect } from 'react';
import './App.css';
import Slot from './components/Slot';
import EditPopover from './components/EditPopover';
import { db } from './firebase';
import { collection, getDocs, doc, addDoc, deleteDoc, query, orderBy, setDoc, updateDoc } from 'firebase/firestore'; 
import { DndContext } from '@dnd-kit/core';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const GRID_SIZE = 20;

function App() {
  const [layoutSlots, setLayoutSlots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slotAssignments, setSlotAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotWidth, setNewSlotWidth] = useState(140);
  const [newSlotHeight, setNewSlotHeight] = useState(40);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [templateType, setTemplateType] = useState('custom');

  useEffect(() => {
    if (templateType === 'vertical') {
      setNewSlotWidth(40);
    } else if (templateType === 'horizontal') {
      setNewSlotHeight(40);
    }
  }, [templateType]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [layoutSnapshot, categorySnapshot, assignmentSnapshot] = await Promise.all([
          getDocs(collection(db, 'layoutSlots')),
          getDocs(query(collection(db, "categories"), orderBy("name"))),
          getDocs(collection(db, 'slotAssignments'))
        ]);
        const layoutData = layoutSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const categoryData = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const assignmentData = assignmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLayoutSlots(layoutData);
        setCategories(categoryData);
        setSlotAssignments(assignmentData);
      } catch (error) {
        console.error("データの読み込み中にエラーが発生しました:", error);
      }
    };
    fetchData();
  }, []);

  const handleDragEnd = async (event) => {
    const { active, delta } = event;
    const slotId = active.id;
    const currentSlot = layoutSlots.find(slot => slot.id === slotId);
    if (!currentSlot) return;
    const newRawX = currentSlot.position.x + delta.x;
    const newRawY = currentSlot.position.y + delta.y;
    const snappedX = Math.round(newRawX / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(newRawY / GRID_SIZE) * GRID_SIZE;
    const newPosition = { x: snappedX, y: snappedY };
    setLayoutSlots(prevSlots => prevSlots.map(slot =>
      slot.id === slotId ? { ...slot, position: newPosition } : slot
    ));
    const slotRef = doc(db, "layoutSlots", slotId);
    await updateDoc(slotRef, { position: newPosition });
  };

  const handleAssignmentChange = async (slotId, newCategoryId) => {
    const assignmentRef = doc(db, "slotAssignments", slotId);
    if (newCategoryId) {
      await setDoc(assignmentRef, { slotId: slotId, categoryId: newCategoryId });
    } else {
      await deleteDoc(assignmentRef);
    }
    const updatedAssignments = newCategoryId 
      ? [...slotAssignments.filter(a => a.slotId !== slotId), { slotId, categoryId: newCategoryId }]
      : slotAssignments.filter(a => a.slotId !== slotId);
    setSlotAssignments(updatedAssignments);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 85%)`;
    const newCategoryData = { name: newCategoryName, color: randomColor };
    if (newCategoryParent) {
      newCategoryData.parentId = newCategoryParent;
    }
    const docRef = await addDoc(collection(db, "categories"), newCategoryData);
    setCategories(prev => [...prev, { id: docRef.id, ...newCategoryData }].sort((a,b) => a.name.localeCompare(b.name)));
    setNewCategoryName('');
    setNewCategoryParent('');
  };

  const handleDeleteCategory = async (categoryIdToDelete) => {
    if (window.confirm("このカテゴリを削除しますか？")) {
      await deleteDoc(doc(db, "categories", categoryIdToDelete));
      setCategories(prev => prev.filter(cat => cat.id !== categoryIdToDelete));
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlotName) {
      alert('新しいスロットの名前を入力してください。');
      return;
    }
    const newSlotData = {
      name: newSlotName,
      position: { x: 20, y: 20 },
      size: { width: Number(newSlotWidth), height: Number(newSlotHeight) }
    };
    try {
      const docRef = await addDoc(collection(db, "layoutSlots"), newSlotData);
      setLayoutSlots(prev => [...prev, { id: docRef.id, ...newSlotData }]);
      setNewSlotName('');
      setNewSlotWidth(140);
      setNewSlotHeight(40);
      setTemplateType('custom');
    } catch (error) {
      console.error("スロットの追加中にエラーが発生しました:", error);
      alert("スロットの追加中にエラーが発生しました。");
    }
  };
  
  const handleSlotSizeChange = async (slotId, newSize) => {
    const { width, height } = newSize;
    setLayoutSlots(prevSlots => prevSlots.map(slot => 
      slot.id === slotId ? { ...slot, size: { width: Number(width), height: Number(height) } } : slot
    ));
    const slotRef = doc(db, "layoutSlots", slotId);
    await updateDoc(slotRef, {
        size: {
            width: Number(width),
            height: Number(height)
        }
    });
  };

  const handleDeleteSlot = async (slotIdToDelete) => {
    if (window.confirm("このスロットを完全に削除しますか？この操作は元に戻せません。")) {
      try {
        const slotRef = doc(db, "layoutSlots", slotIdToDelete);
        const assignmentRef = doc(db, "slotAssignments", slotIdToDelete);
        await Promise.all([
          deleteDoc(slotRef),
          deleteDoc(assignmentRef)
        ]);
        setLayoutSlots(prev => prev.filter(slot => slot.id !== slotIdToDelete));
        setSlotAssignments(prev => prev.filter(a => a.slotId !== slotIdToDelete));
        setEditingSlotId(null);
      } catch (error) {
        console.error("スロットの削除中にエラーが発生しました:", error);
        alert("スロットの削除中にエラーが発生しました。");
      }
    }
  };

  const displaySlots = layoutSlots.map(slot => {
    const assignment = slotAssignments.find(a => a.slotId === slot.id);
    const assignedCategory = assignment ? categories.find(c => c.id === assignment.categoryId) : null;
    const parentCategory = assignedCategory && assignedCategory.parentId 
      ? categories.find(c => c.id === assignedCategory.parentId) 
      : null;
    return { ...slot, assignedCategory, parentCategory };
  });

  const filteredSlots = displaySlots.filter(slot => {
    const slotName = slot.name || '';
    const categoryName = slot.assignedCategory ? slot.assignedCategory.name : '';
    const parentName = slot.parentCategory ? slot.parentCategory.name : '';
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return slotName.toLowerCase().includes(lowerCaseSearchTerm) || 
           categoryName.toLowerCase().includes(lowerCaseSearchTerm) ||
           parentName.toLowerCase().includes(lowerCaseSearchTerm);
  });

  const editingSlot = editingSlotId ? displaySlots.find(slot => slot.id === editingSlotId) : null;
  const parentCategories = categories.filter(cat => !cat.parentId);
  const childCategories = categories.filter(cat => cat.parentId);

  return (
    <div className="main-layout">
      <aside className={`sidebar ${isSidebarVisible ? '' : 'sidebar-hidden'}`}>
        <button onClick={() => setIsSidebarVisible(false)} className="toggle-sidebar-button hide-button">◀</button>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h2>検索</h2>
            <input type="text" placeholder="スロット名やカテゴリ名で検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input"/>
          </div>
          <div className="sidebar-section">
            <h2>モード</h2>
            <div className="edit-mode-toggle">
              <label>
                <input type="checkbox" checked={isEditMode} onChange={() => setIsEditMode(!isEditMode)} />
                レイアウト編集モード
              </label>
            </div>
          </div>
          <details className="sidebar-section collapsible-section" open>
            <summary className="collapsible-summary">追加・管理メニュー</summary>
            <div className="collapsible-content">
              <div className="sidebar-section">
                <h3>スロットを追加</h3>
                <form onSubmit={handleAddSlot} className="sidebar-form add-slot-form">
                  <div className="template-selector">
                    <label>
                      <input type="radio" value="custom" checked={templateType === 'custom'} onChange={(e) => setTemplateType(e.target.value)} />
                      カスタム
                    </label>
                    <label>
                      <input type="radio" value="vertical" checked={templateType === 'vertical'} onChange={(e) => setTemplateType(e.target.value)} />
                      縦長 (幅40)
                    </label>
                    <label>
                      <input type="radio" value="horizontal" checked={templateType === 'horizontal'} onChange={(e) => setTemplateType(e.target.value)} />
                      横長 (高さ40)
                    </label>
                  </div>
                  <input type="text" placeholder="新しいスロット名" value={newSlotName} onChange={(e) => setNewSlotName(e.target.value)} required />
                  <div className="size-inputs">
                    <input type="number" placeholder="横幅" value={newSlotWidth} onChange={(e) => setNewSlotWidth(e.target.value)} className="size-input" step={GRID_SIZE} disabled={templateType === 'vertical'} />
                    <span>x</span>
                    <input type="number" placeholder="高さ" value={newSlotHeight} onChange={(e) => setNewSlotHeight(e.target.value)} className="size-input" step={GRID_SIZE} disabled={templateType === 'horizontal'} />
                  </div>
                  <button type="submit">スロット追加</button>
                </form>
              </div>
              <div className="sidebar-section">
                <h3>カテゴリ管理</h3>
                <div className="category-management">
                  <ul className="category-list">
                    {parentCategories.map(parent => (
                      <div key={parent.id}>
                        <li>
                          <span className="category-color-dot" style={{backgroundColor: parent.color}}></span>
                          <strong>{parent.name}</strong>
                          <button onClick={() => handleDeleteCategory(parent.id)} className="delete-button-small">×</button>
                        </li>
                        {childCategories.filter(child => child.parentId === parent.id).map(child => (
                          <li key={child.id} className="child-category">
                            <span className="category-color-dot" style={{backgroundColor: child.color}}></span>
                            {child.name}
                            <button onClick={() => handleDeleteCategory(child.id)} className="delete-button-small">×</button>
                          </li>
                        ))}
                      </div>
                    ))}
                  </ul>
                  <form onSubmit={handleAddCategory} className="sidebar-form add-category-form">
                    <input type="text" placeholder="新しいカテゴリ名" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required />
                    <select value={newCategoryParent} onChange={(e) => setNewCategoryParent(e.target.value)}>
                      <option value="">-- 親カテゴリなし --</option>
                      {parentCategories.map(parent => (
                        <option key={parent.id} value={parent.id}>{parent.name}</option>
                      ))}
                    </select>
                    <button type="submit">カテゴリ追加</button>
                  </form>
                </div>
              </div>
            </div>
          </details>
        </div>
      </aside>
      <main className="main-content">
        {!isSidebarVisible && (
          <button onClick={() => setIsSidebarVisible(true)} className="toggle-sidebar-button show-button">▶</button>
        )}
        <TransformWrapper
          initialScale={1}
          minScale={0.2}
          maxScale={3}
          limitToBounds={false}
          panning={{ disabled: isEditMode, excluded: ["slot-container"] }}
          wheel={{ step: 0.1 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="tools">
                <button onClick={() => zoomIn()}>+</button>
                <button onClick={() => zoomOut()}>-</button>
                <button onClick={() => resetTransform()}>リセット</button>
              </div>
              <DndContext onDragEnd={handleDragEnd}>
                <TransformComponent wrapperClass="transform-wrapper">
                  <div className="floor-map">
                    {filteredSlots.map((slot) => (
                      <Slot 
                        key={slot.id} 
                        slotData={slot}
                        isEditMode={isEditMode}
                        onSlotClick={() => {
                          if (!isEditMode) {
                            setEditingSlotId(slot.id);
                          }
                        }}
                        onDeleteSlot={handleDeleteSlot}
                      />
                    ))}
                  </div>
                </TransformComponent>
              </DndContext>
            </>
          )}
        </TransformWrapper>
        {editingSlot && !isEditMode && (
          <EditPopover
            slotData={editingSlot}
            allCategories={categories}
            onAssignmentChange={handleAssignmentChange}
            onSlotSizeChange={handleSlotSizeChange}
            onDeleteSlot={handleDeleteSlot}
            onClose={() => setEditingSlotId(null)}
            gridSize={GRID_SIZE}
          />
        )}
      </main>
    </div>
  );
}

export default App;