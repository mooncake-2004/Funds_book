// CategoryManager.tsx
// 二級樹狀收支分類管理器：支持 Emoji 選擇、新增、編輯修改、拖拽排序與 localStorage 永久保存

import React, { useState, useEffect } from 'react';
import { Category, TransactionType } from './types';
import { EmojiPicker } from './EmojiPicker';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'exp_food', name: '餐飲美食', type: 'EXPENSE', icon: '🍔', order: 1, parentId: null },
  { id: 'sub_coffee', name: '咖啡奶茶', type: 'EXPENSE', icon: '🧋', order: 1, parentId: 'exp_food' },
  { id: 'sub_meal', name: '日常三餐', type: 'EXPENSE', icon: '🍱', order: 2, parentId: 'exp_food' },
  { id: 'exp_fun', name: '休閒娛樂', type: 'EXPENSE', icon: '🎮', order: 2, parentId: null },
  { id: 'sub_movie', name: '電影院線', type: 'EXPENSE', icon: '🎬', order: 1, parentId: 'exp_fun' },
  { id: 'sub_game', name: '遊戲充值', type: 'EXPENSE', icon: '🕹️', order: 2, parentId: 'exp_fun' },
  { id: 'inc_job', name: '主業薪資', type: 'INCOME', icon: '💼', order: 1, parentId: null },
  { id: 'inc_sub_salary', name: '固定月薪', type: 'INCOME', icon: '💰', order: 1, parentId: 'inc_job' },
];

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_CATEGORIES');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_CATEGORIES', JSON.stringify(categories));
  }, [categories]);

  const [currentType, setCurrentType] = useState<TransactionType>('EXPENSE');
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  
  // 彈窗狀態：addingToParentId 代表在新增（'ROOT' 或 某大類ID），editingId 代表在修改
  const [addingToParentId, setAddingToParentId] = useState<string | null | 'ROOT'>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [inputName, setInputName] = useState('');
  const [inputIcon, setInputIcon] = useState('🏷️');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.type === currentType);
  const parentCategories = filteredCategories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 打開「新增」彈框
  const handleOpenAdd = (parentId: string | 'ROOT') => {
    setEditingId(null); // 關閉編輯狀態
    setAddingToParentId(parentId);
    setInputName('');
    setInputIcon('🏷️');
    setShowEmojiPicker(false);
  };

  // 打開「編輯」彈框
  const handleOpenEdit = (cat: Category) => {
    setAddingToParentId(null); // 關閉新增狀態
    setEditingId(cat.id);
    setInputName(cat.name);
    setInputIcon(cat.icon);
    setShowEmojiPicker(false);
  };

  // 關閉任何輸入彈框
  const handleCloseBox = () => {
    setAddingToParentId(null);
    setEditingId(null);
    setShowEmojiPicker(false);
  };

  // 保存（新增 或 修改）
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    if (editingId) {
      // 👈 核心修改邏輯：原地更新
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingId ? { ...c, name: inputName.trim(), icon: inputIcon } : c
        )
      );
    } else if (addingToParentId) {
      // 核心新增邏輯
      const isSub = addingToParentId !== 'ROOT';
      const newCategory: Category = {
        id: 'cat_' + Date.now().toString(),
        name: inputName.trim(),
        type: currentType,
        icon: inputIcon,
        order: categories.length + 1,
        parentId: isSub ? (addingToParentId as string) : null,
      };
      setCategories([...categories, newCategory]);
    }

    handleCloseBox();
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這個分類嗎？若為大類，其下的子分類也會一併刪除。')) {
      setCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
      if (editingId === id) handleCloseBox();
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string, isTargetParent: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId || draggedId === targetId) return;

    const draggedItem = categories.find((c) => c.id === draggedId);
    if (!draggedItem) return;

    if (draggedItem.parentId && isTargetParent) {
      setCategories((prev) =>
        prev.map((c) => (c.id === draggedId ? { ...c, parentId: targetId } : c))
      );
      setDraggedId(null);
      return;
    }

    const targetItem = categories.find((c) => c.id === targetId);
    if (!targetItem || draggedItem.parentId !== targetItem.parentId) return;

    const updated = [...categories];
    const dragIdx = updated.findIndex((c) => c.id === draggedId);
    const targetIdx = updated.findIndex((c) => c.id === targetId);

    const [removed] = updated.splice(dragIdx, 1);
    updated.splice(targetIdx, 0, removed);

    setCategories(updated.map((item, idx) => ({ ...item, order: idx + 1 })));
    setDraggedId(null);
  };

  return (
    <div className="cat-manager">
      {/* 1. 支出 / 收入 頂部切換 */}
      <div className="type-toggle">
        <button
          className={`type-btn ${currentType === 'EXPENSE' ? 'active-exp' : ''}`}
          onClick={() => { setCurrentType('EXPENSE'); handleCloseBox(); }}
        >
          🔴 支出分類
        </button>
        <button
          className={`type-btn ${currentType === 'INCOME' ? 'active-inc' : ''}`}
          onClick={() => { setCurrentType('INCOME'); handleCloseBox(); }}
        >
          🟢 收入分類
        </button>
      </div>

      {/* 2. 工具條 */}
      <div className="toolbar">
        <span className="info-text">💡 支持拖拽排序與換家，點擊 ✏️ 可修改名稱和圖標</span>
        <button className="add-root-btn" onClick={() => handleOpenAdd('ROOT')}>
          + 新增一級大類
        </button>
      </div>

      {/* 3. 輸入編輯框（新增或修改時彈出） */}
      {(addingToParentId || editingId) && (
        <form onSubmit={handleFormSubmit} className="add-box">
          <div className="add-box-header">
            <strong>
              {editingId
                ? `編輯分類：${categories.find((c) => c.id === editingId)?.name}`
                : addingToParentId === 'ROOT'
                ? `新增【${currentType === 'EXPENSE' ? '支出' : '收入'}】一級大類`
                : `新增子分類到：${categories.find((c) => c.id === addingToParentId)?.name}`}
            </strong>
            <button type="button" className="close-btn" onClick={handleCloseBox}>×</button>
          </div>

          <div className="add-box-inputs">
            <button
              type="button"
              className="icon-selector-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {inputIcon} <small>更換</small>
            </button>

            <input
              type="text"
              placeholder="輸入分類名稱"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="name-input"
              autoFocus
            />

            <button type="submit" className="confirm-btn">
              {editingId ? '保存修改' : '保存'}
            </button>
          </div>

          {showEmojiPicker && (
            <div className="picker-popover">
              <EmojiPicker
                selectedEmoji={inputIcon}
                onSelect={(emoji) => {
                  setInputIcon(emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </form>
      )}

      {/* 4. 分類樹展示列表 */}
      <div className="tree-list">
        {parentCategories.map((parent) => {
          const isCollapsed = collapsedIds.includes(parent.id);
          const subCategories = filteredCategories
            .filter((c) => c.parentId === parent.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={parent.id}
              className="parent-group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, parent.id, true)}
            >
              <div
                className="parent-row"
                draggable
                onDragStart={(e) => handleDragStart(e, parent.id)}
              >
                <div className="row-left">
                  <span className="drag-handle">⠿</span>
                  <button className="collapse-btn" onClick={() => toggleCollapse(parent.id)}>
                    {isCollapsed ? '▶' : '▼'}
                  </button>
                  <span className="cat-icon">{parent.icon}</span>
                  <strong className="cat-name">{parent.name}</strong>
                  <span className="count-badge">{subCategories.length} 個子類</span>
                </div>

                <div className="row-right">
                  <button
                    className="action-btn"
                    title="添加子分類"
                    onClick={() => handleOpenAdd(parent.id)}
                  >
                    + 加子類
                  </button>
                  {/* ✏️ 編輯大類按鈕 */}
                  <button
                    className="action-icon-btn"
                    title="編輯此分類"
                    onClick={() => handleOpenEdit(parent)}
                  >
                    ✏️
                  </button>
                  <button
                    className="action-icon-btn del-btn"
                    title="刪除"
                    onClick={() => handleDelete(parent.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="sub-list">
                  {subCategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="sub-row"
                      draggable
                      onDragStart={(e) => handleDragStart(e, sub.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, sub.id, false)}
                    >
                      <div className="row-left">
                        <span className="drag-handle sub-handle">⠿</span>
                        <span className="cat-icon">{sub.icon}</span>
                        <span className="sub-name">{sub.name}</span>
                      </div>
                      <div className="row-right">
                        {/* ✏️ 編輯子類按鈕 */}
                        <button
                          className="action-icon-btn"
                          title="編輯此分類"
                          onClick={() => handleOpenEdit(sub)}
                        >
                          ✏️
                        </button>
                        <button
                          className="action-icon-btn del-btn"
                          title="刪除"
                          onClick={() => handleDelete(sub.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  {subCategories.length === 0 && (
                    <div className="empty-sub">暫無子分類，點擊右上角「+ 加子類」添加</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .cat-manager { max-width: 700px; margin: 0 auto; }
        .type-toggle { display: flex; gap: 10px; margin-bottom: 16px; }
        .type-btn {
          flex: 1; padding: 10px; border: 1px solid #cbd5e1; background: #fff;
          border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600;
          color: #64748b; transition: all 0.2s;
        }
        .type-btn.active-exp { background: #fee2e2; border-color: #ef4444; color: #dc2626; }
        .type-btn.active-inc { background: #dcfce7; border-color: #22c55e; color: #16a34a; }

        .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .info-text { font-size: 12px; color: #64748b; font-weight: 500; }
        .add-root-btn {
          padding: 6px 14px; background: #0ea5e9; color: #fff; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
        }

        .add-box {
          background: #fff; border: 2px solid #0ea5e9; border-radius: 12px;
          padding: 14px; margin-bottom: 16px; position: relative;
        }
        .add-box-header { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
        .add-box-inputs { display: flex; gap: 8px; align-items: center; }
        .icon-selector-btn {
          padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc;
          border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; align-items: center; gap: 4px;
        }
        .icon-selector-btn small { font-size: 11px; color: #64748b; }
        .name-input {
          flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none;
        }
        .confirm-btn {
          padding: 8px 16px; background: #0ea5e9; color: #fff; border: none;
          border-radius: 8px; font-weight: 600; cursor: pointer;
        }
        .picker-popover { margin-top: 10px; }

        .tree-list { display: flex; flex-direction: column; gap: 12px; }
        .parent-group {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .parent-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
          cursor: grab;
        }
        .row-left, .row-right { display: flex; align-items: center; gap: 8px; }
        .drag-handle { color: #cbd5e1; cursor: grab; font-size: 16px; user-select: none; }
        .drag-handle:hover { color: #64748b; }
        .collapse-btn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 12px; }
        .cat-icon { font-size: 18px; }
        .cat-name { font-size: 15px; color: #0f172a; }
        .count-badge { font-size: 11px; background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 12px; }
        
        .action-btn {
          padding: 4px 8px; background: #f1f5f9; border: 1px solid #cbd5e1;
          border-radius: 6px; font-size: 12px; cursor: pointer; color: #334155;
        }
        .action-btn:hover { background: #e2e8f0; }

        .action-icon-btn {
          background: none; border: none; cursor: pointer; font-size: 13px; opacity: 0.6; padding: 2px 4px;
        }
        .action-icon-btn:hover { opacity: 1; transform: scale(1.1); }
        .del-btn:hover { color: #ef4444; }

        .sub-list { padding: 6px 16px 12px 42px; display: flex; flex-direction: column; gap: 6px; }
        .sub-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; background: #ffffff; border: 1px dashed #e2e8f0;
          border-radius: 8px; cursor: grab;
        }
        .sub-row:hover { border-color: #cbd5e1; background: #fbfcfe; }
        .sub-handle { font-size: 14px; }
        .sub-name { font-size: 14px; color: #334155; }
        .empty-sub { font-size: 12px; color: #94a3b8; font-style: italic; padding: 8px 0; }
      `}</style>
    </div>
  );
};
