// CategoryManager.tsx
// 二級樹狀收支分類管理器：支持 Emoji 選擇、添加子分類、拖拽排序與跨大類換家

import React, { useState } from 'react';
import { Category, TransactionType } from './types';
import { EmojiPicker } from './EmojiPicker';
import React, { useState, useEffect } from 'react';

// 預設一組初始的二級分類數據（方便預覽效果）
const INITIAL_CATEGORIES: Category[] = [
  // 支出一級大類
  { id: 'exp_food', name: '餐飲美食', type: 'EXPENSE', icon: '🍔', order: 1, parentId: null },
  { id: 'sub_coffee', name: '咖啡奶茶', type: 'EXPENSE', icon: '🧋', order: 1, parentId: 'exp_food' },
  { id: 'sub_meal', name: '日常三餐', type: 'EXPENSE', icon: '🍱', order: 2, parentId: 'exp_food' },
  
  { id: 'exp_fun', name: '休閒娛樂', type: 'EXPENSE', icon: '🎮', order: 2, parentId: null },
  { id: 'sub_movie', name: '電影院線', type: 'EXPENSE', icon: '🎬', order: 1, parentId: 'exp_fun' },
  { id: 'sub_game', name: '遊戲充值', type: 'EXPENSE', icon: '🕹️', order: 2, parentId: 'exp_fun' },

  // 收入一級大類
  { id: 'inc_job', name: '主業薪資', type: 'INCOME', icon: '💼', order: 1, parentId: null },
  { id: 'inc_sub_salary', name: '固定月薪', type: 'INCOME', icon: '💰', order: 1, parentId: 'inc_job' },
];

export const CategoryManager: React.FC = () => {
 // 1. 先讀取保險箱
 const [categories, setCategories] = useState<Category[]>(() => {
   const saved = localStorage.getItem('MY_LEDGER_CATEGORIES');
   return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
 });

 // 2. 每次改變自動存進保險箱
 useEffect(() => {
   localStorage.setItem('MY_LEDGER_CATEGORIES', JSON.stringify(categories));
 }, [categories]);
  const [currentType, setCurrentType] = useState<TransactionType>('EXPENSE');

  // 控制每個一級大類的折疊/展開狀態（存放折疊的大類 ID）
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);

  // 彈窗/輸入狀態：記錄當前正在給哪個大類加子分類（null 代表加一級大類）
  const [addingToParentId, setAddingToParentId] = useState<string | null | 'ROOT'>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🏷️');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // 拖拽狀態：記錄正在被拖拽的分類 ID
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // 篩選當前支出或收入的所有分類
  const filteredCategories = categories.filter((c) => c.type === currentType);
  // 篩選一級大類 (parentId 為空)
  const parentCategories = filteredCategories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order);

  // 折疊/展開切換
  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 添加新分類（無論是一級還是二級）
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const isSub = addingToParentId && addingToParentId !== 'ROOT';
    const newCategory: Category = {
      id: 'cat_' + Date.now().toString(),
      name: newName.trim(),
      type: currentType,
      icon: newIcon,
      order: categories.length + 1,
      parentId: isSub ? (addingToParentId as string) : null,
    };

    setCategories([...categories, newCategory]);
    // 重置輸入狀態
    setNewName('');
    setNewIcon('🏷️');
    setAddingToParentId(null);
    setShowEmojiPicker(false);
  };

  // 刪除分類（若是一級大類，連帶子分類一起刪除）
  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
  };

  // ============================================================
  // 拖拽核心邏輯 (HTML5 Drag and Drop)
  // ============================================================
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedId(id);
  };

  // 拖到某個目標上方鬆手
  const handleDrop = (e: React.DragEvent, targetId: string, isTargetParent: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId || draggedId === targetId) return;

    const draggedItem = categories.find((c) => c.id === draggedId);
    if (!draggedItem) return;

    // 情景 A：如果是二級子類拖到了一級大類上面 ➜ 換家！修改其 parentId
    if (draggedItem.parentId && isTargetParent) {
      setCategories((prev) =>
        prev.map((c) => (c.id === draggedId ? { ...c, parentId: targetId } : c))
      );
      setDraggedId(null);
      return;
    }

    // 情景 B：同級別拖拽排序（交換順序）
    const targetItem = categories.find((c) => c.id === targetId);
    if (!targetItem || draggedItem.parentId !== targetItem.parentId) return;

    const updated = [...categories];
    const dragIdx = updated.findIndex((c) => c.id === draggedId);
    const targetIdx = updated.findIndex((c) => c.id === targetId);

    // 交換位置
    const [removed] = updated.splice(dragIdx, 1);
    updated.splice(targetIdx, 0, removed);

    // 重新校正 order
    setCategories(updated.map((item, idx) => ({ ...item, order: idx + 1 })));
    setDraggedId(null);
  };

  return (
    <div className="cat-manager">
      {/* 1. 支出 / 收入 頂部切換 */}
      <div className="type-toggle">
        <button
          className={`type-btn ${currentType === 'EXPENSE' ? 'active-exp' : ''}`}
          onClick={() => { setCurrentType('EXPENSE'); setAddingToParentId(null); }}
        >
          🔴 支出分類
        </button>
        <button
          className={`type-btn ${currentType === 'INCOME' ? 'active-inc' : ''}`}
          onClick={() => { setCurrentType('INCOME'); setAddingToParentId(null); }}
        >
          🟢 收入分類
        </button>
      </div>

      {/* 2. 頂部工具條：新增一級大類按鈕 */}
      <div className="toolbar">
        <span className="info-text">💡 提示：按住左側手柄 ⠿ 可上下拖動排序，或將子分類拖入其他大類</span>
        <button className="add-root-btn" onClick={() => setAddingToParentId('ROOT')}>
          + 新增一級大類
        </button>
      </div>

      {/* 3. 新增分類彈出輸入框（當點擊新增時出現） */}
      {addingToParentId && (
        <form onSubmit={handleSaveCategory} className="add-box">
          <div className="add-box-header">
            <strong>
              {addingToParentId === 'ROOT'
                ? `新增【${currentType === 'EXPENSE' ? '支出' : '收入'}】一級大類`
                : `新增子分類到：${categories.find((c) => c.id === addingToParentId)?.name}`}
            </strong>
            <button type="button" className="close-btn" onClick={() => setAddingToParentId(null)}>×</button>
          </div>

          <div className="add-box-inputs">
            {/* 點擊圖標按鈕打開 Emoji 選擇板 */}
            <button
              type="button"
              className="icon-selector-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {newIcon} <small>更換</small>
            </button>

            <input
              type="text"
              placeholder="輸入分類名稱 (例如: 咖啡)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="name-input"
              autoFocus
            />

            <button type="submit" className="confirm-btn">保存</button>
          </div>

          {/* 展開我們的 EmojiPicker 組件 */}
          {showEmojiPicker && (
            <div className="picker-popover">
              <EmojiPicker
                selectedEmoji={newIcon}
                onSelect={(emoji) => {
                  setNewIcon(emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </form>
      )}

      {/* 4. 二級分類樹清單 */}
      <div className="tree-list">
        {parentCategories.map((parent) => {
          const isCollapsed = collapsedIds.includes(parent.id);
          // 抓取該大類下的所有子分類
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
              {/* 一級大類行 */}
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
                    className="add-sub-btn"
                    title="添加子分類"
                    onClick={() => setAddingToParentId(parent.id)}
                  >
                    + 加子類
                  </button>
                  <button
                    className="del-btn"
                    title="刪除"
                    onClick={() => handleDelete(parent.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* 二級子分類列表（展開時顯示） */}
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
                        <button
                          className="del-btn"
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

      {/* 樣式控制 */}
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
        .info-text { font-size: 12px; color: #94a3b8; }
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
        .row-left, .row-right { display: flex; align-items: center; gap: 10px; }
        .drag-handle { color: #cbd5e1; cursor: grab; font-size: 16px; user-select: none; }
        .drag-handle:hover { color: #64748b; }
        .collapse-btn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 12px; }
        .cat-icon { font-size: 18px; }
        .cat-name { font-size: 15px; color: #0f172a; }
        .count-badge { font-size: 11px; background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 12px; }
        .add-sub-btn {
          padding: 4px 8px; background: #f1f5f9; border: 1px solid #cbd5e1;
          border-radius: 6px; font-size: 12px; cursor: pointer; color: #334155;
        }
        .add-sub-btn:hover { background: #e2e8f0; }
        .del-btn { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; }
        .del-btn:hover { opacity: 1; }

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
