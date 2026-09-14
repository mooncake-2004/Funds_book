// AccountTypeManager.tsx
// 二級樹狀賬戶大類管理器：支持流動/投資/負債等大類與其下的二級子類（如銀行、電子錢包、信用卡等）

import React, { useState, useEffect } from 'react';
import { AccountCategory } from './types';
import { EmojiPicker } from './EmojiPicker';

// 預設一套符合生活習慣的二級賬戶大類
const INITIAL_ACCOUNT_CATEGORIES: AccountCategory[] = [
  // 1. 流動資金大類
  { id: 'acc_cat_liquid', name: '流動資金', icon: '💧', order: 1, isLiability: false, parentId: null },
  { id: 'sub_acc_bank', name: '銀行活期', icon: '🏦', order: 1, isLiability: false, parentId: 'acc_cat_liquid' },
  { id: 'sub_acc_wallet', name: '電子錢包/儲值卡', icon: '📱', order: 2, isLiability: false, parentId: 'acc_cat_liquid' },
  { id: 'sub_acc_cash', name: '現金現鈔', icon: '💵', order: 3, isLiability: false, parentId: 'acc_cat_liquid' },

  // 2. 投資資產大類
  { id: 'acc_cat_invest', name: '投資資產', icon: '📈', order: 2, isLiability: false, parentId: null },
  { id: 'sub_acc_stock', name: '股票證券', icon: '📊', order: 1, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'sub_acc_crypto', name: '加密貨幣', icon: '🪙', order: 2, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'sub_acc_mpf', name: '強積金/基金', icon: '📑', order: 3, isLiability: false, parentId: 'acc_cat_invest' },

  // 3. 負債大類
  { id: 'acc_cat_liability', name: '負債賬戶', icon: '💳', order: 3, isLiability: true, parentId: null },
  { id: 'sub_acc_credit', name: '信用卡', icon: '💳', order: 1, isLiability: true, parentId: 'acc_cat_liability' },
  { id: 'sub_acc_loan', name: '貸款/按揭', icon: '🏛️', order: 2, isLiability: true, parentId: 'acc_cat_liability' },

  // 4. 應急儲備大類
  { id: 'acc_cat_savings', name: '應急金/機動池', icon: '🛡️', order: 4, isLiability: false, parentId: null },
];

export const AccountTypeManager: React.FC = () => {
  const [accountCategories, setAccountCategories] = useState<AccountCategory[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_ACCOUNT_CATEGORIES_V2');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNT_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_ACCOUNT_CATEGORIES_V2', JSON.stringify(accountCategories));
  }, [accountCategories]);

  // 折疊狀態、輸入與編輯狀態
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const [addingToParentId, setAddingToParentId] = useState<string | null | 'ROOT'>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [inputName, setInputName] = useState('');
  const [inputIcon, setInputIcon] = useState('🏦');
  const [inputIsLiability, setInputIsLiability] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // 篩選一級大類
  const parentCategories = accountCategories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 打開新增
  const handleOpenAdd = (parentId: string | 'ROOT') => {
    setEditingId(null);
    setAddingToParentId(parentId);
    setInputName('');
    setInputIcon(parentId === 'ROOT' ? '🏛️' : '🏦');
    
    // 如果是加子類，自動繼承老大的負債屬性！
    if (parentId !== 'ROOT') {
      const parent = accountCategories.find((c) => c.id === parentId);
      setInputIsLiability(parent ? parent.isLiability : false);
    } else {
      setInputIsLiability(false);
    }
    setShowEmojiPicker(false);
  };

  // 打開編輯
  const handleOpenEdit = (item: AccountCategory) => {
    setAddingToParentId(null);
    setEditingId(item.id);
    setInputName(item.name);
    setInputIcon(item.icon || '🏦');
    setInputIsLiability(item.isLiability);
    setShowEmojiPicker(false);
  };

  const handleClose = () => {
    setAddingToParentId(null);
    setEditingId(null);
    setShowEmojiPicker(false);
  };

  // 保存
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    if (editingId) {
      setAccountCategories((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, name: inputName.trim(), icon: inputIcon, isLiability: inputIsLiability }
            : c
        )
      );
    } else if (addingToParentId) {
      const isSub = addingToParentId !== 'ROOT';
      const newCat: AccountCategory = {
        id: 'acc_cat_' + Date.now().toString(),
        name: inputName.trim(),
        icon: inputIcon,
        order: accountCategories.length + 1,
        isLiability: inputIsLiability,
        parentId: isSub ? (addingToParentId as string) : null,
      };
      setAccountCategories([...accountCategories, newCat]);
    }

    handleClose();
  };

  // 刪除
  const handleDelete = (id: string) => {
    if (confirm('確定要刪除嗎？若刪除一級大類，其下的子類也會一併刪除。')) {
      setAccountCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
      if (editingId === id) handleClose();
    }
  };

  return (
    <div className="acc-tree-manager">
      <div className="toolbar">
        <span className="info-text">💡 一級大類決定「資產」或「負債」屬性，子類自動繼承</span>
        <button className="add-root-btn" onClick={() => handleOpenAdd('ROOT')}>
          + 新增一級大類
        </button>
      </div>

      {/* 彈出輸入框 */}
      {(addingToParentId || editingId) && (
        <form onSubmit={handleSubmit} className="form-box">
          <div className="form-header">
            <strong>
              {editingId
                ? `編輯：${accountCategories.find((c) => c.id === editingId)?.name}`
                : addingToParentId === 'ROOT'
                ? '新增一級大類'
                : `新增二級子類到：${accountCategories.find((c) => c.id === addingToParentId)?.name}`}
            </strong>
            <button type="button" className="close-btn" onClick={handleClose}>×</button>
          </div>

          <div className="form-inputs">
            <button
              type="button"
              className="icon-selector-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {inputIcon} <small>更換</small>
            </button>

            <input
              type="text"
              placeholder="輸入名稱 (如: 銀行活期、電子錢包)"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="name-input"
              autoFocus
            />

            {/* 只有一級大類允許自由勾選負債；子類自動跟隨老大 */}
            {(!addingToParentId || addingToParentId === 'ROOT') && !editingId && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inputIsLiability}
                  onChange={(e) => setInputIsLiability(e.target.checked)}
                />
                是負債類別 (信用卡/按揭貸款)
              </label>
            )}

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

      {/* 二級大類樹展示 */}
      <div className="tree-list">
        {parentCategories.map((parent) => {
          const isCollapsed = collapsedIds.includes(parent.id);
          const subCategories = accountCategories
            .filter((c) => c.parentId === parent.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div key={parent.id} className="parent-group">
              {/* 一級大類行 */}
              <div className="parent-row">
                <div className="row-left">
                  <button className="collapse-btn" onClick={() => toggleCollapse(parent.id)}>
                    {isCollapsed ? '▶' : '▼'}
                  </button>
                  <span className="cat-icon">{parent.icon}</span>
                  <strong className="cat-name">{parent.name}</strong>
                  <span className={`nature-badge ${parent.isLiability ? 'liability' : 'asset'}`}>
                    {parent.isLiability ? '🔴 負債大類' : '🟢 資產大類'}
                  </span>
                  <span className="count-badge">{subCategories.length} 個子類</span>
                </div>

                <div className="row-right">
                  <button className="action-btn" onClick={() => handleOpenAdd(parent.id)}>
                    + 加子類
                  </button>
                  <button className="action-icon-btn" onClick={() => handleOpenEdit(parent)}>
                    ✏️
                  </button>
                  <button className="action-icon-btn del-btn" onClick={() => handleDelete(parent.id)}>
                    🗑️
                  </button>
                </div>
              </div>

              {/* 二級子類列表 */}
              {!isCollapsed && (
                <div className="sub-list">
                  {subCategories.map((sub) => (
                    <div key={sub.id} className="sub-row">
                      <div className="row-left">
                        <span className="cat-icon">{sub.icon}</span>
                        <span className="sub-name">{sub.name}</span>
                      </div>
                      <div className="row-right">
                        <button className="action-icon-btn" onClick={() => handleOpenEdit(sub)}>
                          ✏️
                        </button>
                        <button className="action-icon-btn del-btn" onClick={() => handleDelete(sub.id)}>
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
        .acc-tree-manager { max-width: 700px; margin: 0 auto; }
        .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .info-text { font-size: 12px; color: #64748b; }
        .add-root-btn {
          padding: 6px 14px; background: #0ea5e9; color: #fff; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
        }

        .form-box {
          background: #fff; border: 2px solid #0ea5e9; border-radius: 12px;
          padding: 14px; margin-bottom: 16px;
        }
        .form-header { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
        .form-inputs { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .icon-selector-btn {
          padding: 6px 10px; border: 1px solid #cbd5e1; background: #f8fafc;
          border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; align-items: center; gap: 4px;
        }
        .icon-selector-btn small { font-size: 11px; color: #64748b; }
        .name-input {
          flex: 1; min-width: 180px; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none;
        }
        .checkbox-label { font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; cursor: pointer; }
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
        }
        .row-left, .row-right { display: flex; align-items: center; gap: 8px; }
        .collapse-btn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 12px; }
        .cat-icon { font-size: 18px; }
        .cat-name { font-size: 15px; color: #0f172a; }
        .nature-badge { font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
        .nature-badge.asset { background: #dcfce7; color: #15803d; }
        .nature-badge.liability { background: #fee2e2; color: #b91c1c; }
        .count-badge { font-size: 11px; background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 12px; }

        .action-btn {
          padding: 4px 8px; background: #f1f5f9; border: 1px solid #cbd5e1;
          border-radius: 6px; font-size: 12px; cursor: pointer; color: #334155;
        }
        .action-btn:hover { background: #e2e8f0; }
        .action-icon-btn { background: none; border: none; cursor: pointer; font-size: 13px; opacity: 0.6; padding: 2px 4px; }
        .action-icon-btn:hover { opacity: 1; transform: scale(1.1); }
        .del-btn:hover { color: #ef4444; }

        .sub-list { padding: 6px 16px 12px 36px; display: flex; flex-direction: column; gap: 6px; }
        .sub-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; background: #ffffff; border: 1px dashed #e2e8f0;
          border-radius: 8px;
        }
        .sub-name { font-size: 14px; color: #334155; }
        .empty-sub { font-size: 12px; color: #94a3b8; font-style: italic; padding: 8px 0; }
      `}</style>
    </div>
  );
};
