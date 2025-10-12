import { useState, useEffect } from 'react';
import './App.css';
import Slot from './components/Slot';
import EditPopover from './components/EditPopover';
import { db } from './firebase';
import { collection, getDocs, doc, addDoc, deleteDoc, query, orderBy, setDoc } from 'firebase/firestore'; 

// お店の固定レイアウトをここで定義する
const LAYOUT_SLOTS = [
  { id: 'slot-001', name: '入口正面ワゴン', position: { x: 40, y: 50 }, size: { width: 200, height: 80 } },
  { id: 'slot-002', name: 'レジ横', position: { x: 300, y: 50 }, size: { width: 140, height: 50 } },
  { id: 'slot-003', name: '壁際書架 A-1', position: { x: 40, y: 180 }, size: { width: 140, height: 50 } },
  { id: 'slot-004', name: '壁際書架 A-2', position: { x: 40, y: 240 }, size: { width: 140, height: 50 } },
  { id: 'slot-005', name: '雑誌コーナー', position: { x: 300, y: 180 }, size: { width: 200, height: 50 } },
];

function App() {
  const [categories, setCategories] = useState([]);
  const [displaySlots, setDisplaySlots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');
  const [editingSlotId, setEditingSlotId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryQuery = query(collection(db, "categories"), orderBy("name"));
        const categorySnapshot = await getDocs(categoryQuery);
        const categoryData = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(categoryData);

        const assignmentSnapshot = await getDocs(collection(db, 'slotAssignments'));
        const assignmentData = assignmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const newDisplaySlots = LAYOUT_SLOTS.map(slot => {
          const assignment = assignmentData.find(a => a.slotId === slot.id);
          const assignedCategory = assignment ? categoryData.find(c => c.id === assignment.categoryId) : null;
          
          const parentCategory = assignedCategory && assignedCategory.parentId 
            ? categoryData.find(c => c.id === assignedCategory.parentId) 
            : null;

          return {
            ...slot,
            assignedCategory: assignedCategory,
            parentCategory: parentCategory,
          };
        });
        setDisplaySlots(newDisplaySlots);
      } catch (error) {
        console.error("データの読み込み中にエラーが発生しました:", error);
      }
    };
    fetchData();
  }, []);

  const handleAssignmentChange = async (slotId, newCategoryId) => {
    const assignmentRef = doc(db, "slotAssignments", slotId);
    if (newCategoryId) {
      await setDoc(assignmentRef, { slotId: slotId, categoryId: newCategoryId });
    } else {
      await deleteDoc(assignmentRef);
    }

    const newCategory = newCategoryId ? categories.find(c => c.id === newCategoryId) : null;
    const newParentCategory = newCategory && newCategory.parentId ? categories.find(c => c.id === newCategory.parentId) : null;
    
    setDisplaySlots(prevSlots => prevSlots.map(slot => 
      slot.id === slotId ? { ...slot, assignedCategory: newCategory, parentCategory: newParentCategory } : slot
    ));
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 85%)`;
    
    const newCategoryData = { 
      name: newCategoryName, 
      color: randomColor 
    };
    if (newCategoryParent) {
      newCategoryData.parentId = newCategoryParent;
    }

    const docRef = await addDoc(collection(db, "categories"), newCategoryData);
    setCategories(prev => [...prev, { id: docRef.id, ...newCategoryData }].sort((a,b) => a.name.localeCompare(b.name)));
    setNewCategoryName('');
    setNewCategoryParent('');
  };

  const handleDeleteCategory = async (categoryIdToDelete) => {
    if (window.confirm("このカテゴリを削除しますか？（子カテゴリがある場合はそれらも表示されなくなります）")) {
      await deleteDoc(doc(db, "categories", categoryIdToDelete));
      setCategories(prev => prev.filter(cat => cat.id !== categoryIdToDelete));
    }
  };
  
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
    <div className="app-container">
      <div className="content-wrapper">
        <h1>書店レイアウト管理</h1>
        <div className="controls-container">
          <div className="control-group">
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
              <form onSubmit={handleAddCategory} className="add-category-form">
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
        <div className="search-container">
          <input type="text" placeholder="スロット名やカテゴリ名で検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input"/>
        </div>
      </div>
      
      <div className="floor-map">
        {filteredSlots.map((slot) => (
          <Slot 
            key={slot.id} 
            slotData={slot}
            onSlotClick={() => setEditingSlotId(slot.id)}
          />
        ))}
      </div>

      {editingSlot && (
        <EditPopover
          slotData={editingSlot}
          allCategories={categories}
          onAssignmentChange={handleAssignmentChange}
          onClose={() => setEditingSlotId(null)}
        />
      )}
    </div>
  );
}

export default App;