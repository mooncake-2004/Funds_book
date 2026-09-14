// AccountTypeManager.tsx
// 三級資產全景管理器：一級大類 ➜ 二級分類 ➜ 三級具體賬戶（支持自定義幣種、新增、刪除）

import React, { useState, useEffect } from 'react';
import { AccountCategory, Account } from './types';

// 預設二級架構
const INITIAL_ACCOUNT_CATEGORIES: AccountCategory[] = [
  { id: 'acc_cat_liquid', name: '流動資金', order: 1, isLiability: false, parentId: null },
  { id: 'sub_acc_receivable', name: '應收款', order: 1, isLiability: false, parentId: 'acc_cat_liquid' },
  { id: 'sub_acc_cash_wallet', name: '現金與電子錢包', order: 2, isLiability: false, parentId: 'acc_cat_liquid' },
  { id: 'sub_acc_bank', name: '銀行活期', order: 3, isLiability: false, parentId: 'acc_cat_liquid' },

  { id: 'acc_cat_invest', name: '投資資產', order: 2, isLiability: false, parentId: null },
  { id: 'sub_acc_insurance', name: '保險', order: 1, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'sub_acc_fund', name: '基金', order: 2, isLiability: false, parentId: 'acc_cat_invest' },
    { id: 'sub_acc_invest_bank', name: '銀行理財', order: 3, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'sub_acc_mpf', name: 'MPF', order: 4, isLiability: false, parentId: 'acc_cat_invest' },

  { id: 'acc_cat_fixed', name: '固定資產', order: 3, isLiability: false, parentId: null },
  { id: 'sub_acc_property', name: '房子估值', order: 1, isLiability: false, parentId: 'acc_cat_fixed' },
  { id: 'sub_acc_mortgage', name: '房貸按揭', order: 2, isLiability: true, parentId: 'acc_cat_fixed' },

  { id: 'acc_cat_liability', name: '負債賬戶', order: 4, isLiability: true, parentId: null },
  { id: 'sub_acc_credit_card', name: '信用卡', order: 1, isLiability: true, parentId: 'acc_cat_liability' },

  { id: 'acc_cat_savings', name: '應急金', order: 5, isLiability: false, parentId: null },
];

// 預設你的所有三級具體賬戶
const INITIAL_ACCOUNTS: Account[] = [
  // ================= 1. 流動資金 (Current Assets) =================
  // 銀行活期
  { id: 'acc_hs_hkd_sa', name: 'HS HKD SA', categoryId: 'sub_acc_bank', currency: 'HKD', balance: 487833.73, exchangeRate: 1.0, baseBalance: 487833.73 }, // (已包含HS8年保險 246,282.08)
  { id: 'acc_hs_cny_sa', name: 'HS CNY SA', categoryId: 'sub_acc_bank', currency: 'CNY', balance: 262.73, exchangeRate: 1.08, baseBalance: 283.75 },
  { id: 'acc_hs_usd_sa', name: 'HS USD SA', categoryId: 'sub_acc_bank', currency: 'USD', balance: 70.54, exchangeRate: 7.82, baseBalance: 551.62 },
  { id: 'acc_hsbc_hkd', name: 'HSBC HKD', categoryId: 'sub_acc_bank', currency: 'HKD', balance: 4534.52, exchangeRate: 1.0, baseBalance: 4534.52 },
  { id: 'acc_abc_cny', name: '農行 CNY', categoryId: 'sub_acc_bank', currency: 'CNY', balance: 100419.34, exchangeRate: 1.08, baseBalance: 108452.89 },
  
  // 電子錢包
  { id: 'acc_zfb_cny', name: '支付寶', categoryId: 'sub_acc_cash_wallet', currency: 'CNY', balance: 1855.32, exchangeRate: 1.08, baseBalance: 2003.75 },
  { id: 'acc_wx_cny', name: '微信', categoryId: 'sub_acc_cash_wallet', currency: 'CNY', balance: 5303.08, exchangeRate: 1.08, baseBalance: 5727.33 },
  { id: 'acc_acc_receivable', name: '應收', categoryId: 'sub_acc_receivable', currency: 'HKD', balance: 0, exchangeRate: 1.0, baseBalance: 0 },

  // ================= 2. 投資資產 (Investments) =================
  // 📁 保險 (USD)
  { id: 'acc_ins_cywl', name: '充裕未來(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 76621.79, exchangeRate: 7.82, baseBalance: 599182.40 },
  { id: 'acc_ins_awy', name: '愛無憂(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 36815.15, exchangeRate: 7.82, baseBalance: 287894.47 },
  { id: 'acc_ins_zzf', name: '真智豐(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 14167.75, exchangeRate: 7.82, baseBalance: 110791.81 },
  { id: 'acc_ins_8yr', name: '8年儲速(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 27211.72, exchangeRate: 7.82, baseBalance: 212795.65 },
  { id: 'acc_ins_yd', name: '易達終身保(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 20323.39, exchangeRate: 7.82, baseBalance: 158928.91 },

  // 📁 基金 (USD)
  { id: 'acc_fund_zy', name: '智悅(本金USD17,000)', categoryId: 'sub_acc_fund', currency: 'USD', balance: 17444.19, exchangeRate: 7.82, baseBalance: 136413.57 },

  // 📁 MPF (HKD)
  { id: 'acc_mpf_empf', name: 'eMPF', categoryId: 'sub_acc_mpf', currency: 'HKD', balance: 211128.58, exchangeRate: 1.0, baseBalance: 211128.58 },
  { id: 'acc_mpf_pfund', name: 'PFUND', categoryId: 'sub_acc_mpf', currency: 'HKD', balance: 23737.85, exchangeRate: 1.0, baseBalance: 23737.85 },

  // 📁 銀行外幣理財/存款
  { id: 'acc_hsbc_usd_inv', name: 'HSBC USD', categoryId: 'sub_acc_invest_bank', currency: 'USD', balance: 12000.00, exchangeRate: 7.82, baseBalance: 93840.00 },
  { id: 'acc_hs_usd_inv', name: 'HS USD', categoryId: 'sub_acc_invest_bank', currency: 'USD', balance: 2386.46, exchangeRate: 7.82, baseBalance: 18662.12 },
  { id: 'acc_fin_dg', name: '東莞銀行 CNY', categoryId: 'sub_acc_invest_bank', currency: 'CNY', balance: 121530.32, exchangeRate: 1.08, baseBalance: 131252.75 },
  { id: 'acc_fin_gf', name: '廣發 CNY', categoryId: 'sub_acc_invest_bank', currency: 'CNY', balance: 21008.78, exchangeRate: 1.08, baseBalance: 22689.48 },
  { id: 'acc_fin_lct', name: '理財通 CNY', categoryId: 'sub_acc_invest_bank', currency: 'CNY', balance: 30631.94, exchangeRate: 1.08, baseBalance: 33082.50 },

  // ================= 3. 固定資產 (House & Mortgage) =================
  { id: 'acc_house_prop', name: '物業估值', categoryId: 'sub_acc_property', currency: 'HKD', balance: 6370000.00, exchangeRate: 1.0, baseBalance: 6370000.00 },
  { id: 'acc_mortgage_loan', name: '房貸', categoryId: 'sub_acc_mortgage', currency: 'HKD', balance: -2233652.32, exchangeRate: 1.0, baseBalance: -2233652.32 },

  // ================= 4. 流動負債 (Current Liabilities - 信用卡) =================
  { id: 'acc_hsbc_red', name: 'HSBC Red', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -12681.40, exchangeRate: 1.0, baseBalance: -12681.40 },
  { id: 'acc_hsbc_visa', name: 'HSBC visa', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -2541.50, exchangeRate: 1.0, baseBalance: -2541.50 },
  { id: 'acc_hs_enjoy', name: 'HS enjoy', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -458.00, exchangeRate: 1.0, baseBalance: -458.00 },
];


export const AccountTypeManager: React.FC = () => {
  // 1. 賬戶大類狀態
  const [accountCategories, setAccountCategories] = useState<AccountCategory[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_ACCOUNT_CATEGORIES_TREE3');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNT_CATEGORIES;
  });

  // 2. 具體賬戶狀態
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_REAL_ACCOUNTS');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_ACCOUNT_CATEGORIES_TREE3', JSON.stringify(accountCategories));
  }, [accountCategories]);

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_REAL_ACCOUNTS', JSON.stringify(accounts));
  }, [accounts]);

  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const [addingToParentId, setAddingToParentId] = useState<string | null | 'ROOT'>(null);
  
  // 新增三級具體賬戶狀態（彈框）
  const [addingAccountToSubCatId, setAddingAccountToSubCatId] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState('HKD');

  const [inputName, setInputName] = useState('');
  const [inputIsLiability, setInputIsLiability] = useState(false);

  const parentCategories = accountCategories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 保存一級或二級大類
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    const isSub = addingToParentId !== 'ROOT';
    const newCat: AccountCategory = {
      id: 'acc_cat_' + Date.now().toString(),
      name: inputName.trim(),
      order: accountCategories.length + 1,
      isLiability: inputIsLiability,
      parentId: isSub ? (addingToParentId as string) : null,
    };
    setAccountCategories([...accountCategories, newCat]);
    setAddingToParentId(null);
    setInputName('');
  };

  // 保存三級具體賬戶
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || !addingAccountToSubCatId) return;

    const rate = newAccountCurrency === 'CNY' ? 1.08 : newAccountCurrency === 'USD' ? 7.82 : 1.0;
    const newAcc: Account = {
      id: 'acc_' + Date.now().toString(),
      name: newAccountName.trim(),
      categoryId: addingAccountToSubCatId,
      currency: newAccountCurrency,
      balance: 0,
      exchangeRate: rate,
      baseBalance: 0,
    };

    setAccounts([...accounts, newAcc]);
    setAddingAccountToSubCatId(null);
    setNewAccountName('');
    setNewAccountCurrency('HKD');
  };

  // 刪除具體賬戶
  const handleDeleteAccount = (accId: string) => {
    if (confirm('確定要刪除這個具體賬戶嗎？')) {
      setAccounts(accounts.filter((a) => a.id !== accId));
    }
  };

  return (
    <div className="acc-tree-manager">
      <div className="toolbar">
        <span className="info-text">💡 完整三級資產架構：一級大類 ➜ 二級分類 ➜ 三級具體賬戶</span>
        <button className="add-root-btn" onClick={() => setAddingToParentId('ROOT')}>
          + 新增一級大類
        </button>
      </div>

      {/* 新增一級/二級大類輸入框 */}
      {addingToParentId && (
        <form onSubmit={handleSaveCategory} className="form-box">
          <div className="form-header">
            <strong>{addingToParentId === 'ROOT' ? '新增一級大類' : '新增二級分類'}</strong>
            <button type="button" className="close-btn" onClick={() => setAddingToParentId(null)}>×</button>
          </div>
          <div className="form-inputs">
            <input
              type="text"
              placeholder="名稱 (如: 虛擬貨幣、借出款項)"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="name-input"
              autoFocus
            />
            {addingToParentId === 'ROOT' && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={inputIsLiability}
                  onChange={(e) => setInputIsLiability(e.target.checked)}
                />
                是負債類別 (信用卡/貸款)
              </label>
            )}
            <button type="submit" className="confirm-btn">保存</button>
          </div>
        </form>
      )}

      {/* 新增三級具體賬戶輸入框 */}
      {addingAccountToSubCatId && (
        <form onSubmit={handleSaveAccount} className="form-box highlight-box">
          <div className="form-header">
            <strong>
              新增賬戶到：{accountCategories.find((c) => c.id === addingAccountToSubCatId)?.name}
            </strong>
            <button type="button" className="close-btn" onClick={() => setAddingAccountToSubCatId(null)}>×</button>
          </div>
          <div className="form-inputs">
            <input
              type="text"
              placeholder="賬戶名稱 (如: 八達通、中銀活期)"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              className="name-input"
              autoFocus
            />
            <select
              value={newAccountCurrency}
              onChange={(e) => setNewAccountCurrency(e.target.value)}
              className="currency-select"
            >
              <option value="HKD">港幣 (HKD)</option>
              <option value="CNY">人民幣 (CNY)</option>
              <option value="USD">美元 (USD)</option>
            </select>
            <button type="submit" className="confirm-btn">確認新增</button>
          </div>
        </form>
      )}

      {/* 三級全景樹 */}
      <div className="tree-list">
        {parentCategories.map((parent) => {
          const isCollapsed = collapsedIds.includes(parent.id);
          const subCategories = accountCategories.filter((c) => c.parentId === parent.id);

          return (
            <div key={parent.id} className="parent-group">
              {/* 1. 一級大類行 */}
              <div className="parent-row">
                <div className="row-left">
                  <button className="collapse-btn" onClick={() => toggleCollapse(parent.id)}>
                    {isCollapsed ? '▶' : '▼'}
                  </button>
                  <strong className="parent-title">{parent.name}</strong>
                  <span className={`nature-badge ${parent.isLiability ? 'liability' : 'asset'}`}>
                    {parent.isLiability ? '負債' : '資產'}
                  </span>
                </div>
                <div className="row-right">
                  <button className="action-btn" onClick={() => setAddingToParentId(parent.id)}>
                    + 加二級分類
                  </button>
                </div>
              </div>

              {/* 2. 二級分類及掛在下面的三級賬戶 */}
              {!isCollapsed && (
                <div className="sub-list">
                  {subCategories.map((sub) => {
                    // 抓取掛在這個二級分類下的具體賬戶
                    const subAccounts = accounts.filter((a) => a.categoryId === sub.id);

                    return (
                      <div key={sub.id} className="sub-block">
                        <div className="sub-header-row">
                          <span className="sub-title">📂 {sub.name}</span>
                          <button
                            className="add-acc-btn"
                            onClick={() => setAddingAccountToSubCatId(sub.id)}
                          >
                            + 新增賬戶
                          </button>
                        </div>

                        {/* 3. 三級具體賬戶標籤雲 */}
                        <div className="accounts-pill-cloud">
                          {subAccounts.map((acc) => (
                            <div key={acc.id} className="acc-pill">
                              <span className="acc-pill-name">{acc.name}</span>
                              <span className={`acc-pill-curr ${acc.currency.toLowerCase()}`}>
                                {acc.currency}
                              </span>
                              <button
                                className="acc-pill-del"
                                onClick={() => handleDeleteAccount(acc.id)}
                                title="刪除賬戶"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {subAccounts.length === 0 && (
                            <span className="empty-pill-tip">暫無賬戶，點擊右上角新增</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .acc-tree-manager { max-width: 750px; margin: 0 auto; }
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
        .highlight-box { border-color: #b45309; }
        .form-header { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
        .form-inputs { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .name-input {
          flex: 1; min-width: 180px; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none;
        }
        .currency-select {
          padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #fff;
        }
        .checkbox-label { font-size: 13px; color: #334155; display: flex; align-items: center; gap: 6px; cursor: pointer; }
        .confirm-btn {
          padding: 8px 16px; background: #0ea5e9; color: #fff; border: none;
          border-radius: 8px; font-weight: 600; cursor: pointer;
        }

        .tree-list { display: flex; flex-direction: column; gap: 12px; }
        .parent-group {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .parent-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
        }
        .row-left, .row-right { display: flex; align-items: center; gap: 8px; }
        .collapse-btn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 11px; }
        .parent-title { font-size: 15px; color: #0f172a; font-weight: 700; }
        .nature-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
        .nature-badge.asset { background: #dcfce7; color: #15803d; }
        .nature-badge.liability { background: #fee2e2; color: #b91c1c; }

        .action-btn {
          padding: 4px 8px; background: #ffffff; border: 1px solid #cbd5e1;
          border-radius: 6px; font-size: 12px; cursor: pointer; color: #334155;
        }

        .sub-list { padding: 10px 16px 14px 24px; display: flex; flex-direction: column; gap: 12px; }
        .sub-block { background: #fbfcfe; border: 1px solid #f1f5f9; border-radius: 8px; padding: 10px 12px; }
        .sub-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .sub-title { font-size: 13px; font-weight: 600; color: #475569; }
        .add-acc-btn {
          padding: 2px 8px; font-size: 11px; background: #fff; border: 1px dashed #cbd5e1;
          border-radius: 4px; cursor: pointer; color: #0ea5e9; font-weight: 600;
        }
        .add-acc-btn:hover { border-color: #0ea5e9; background: #f0f9ff; }

        /* 三級具體賬戶膠囊雲 */
        .accounts-pill-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
        .acc-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: #ffffff; border: 1px solid #e2e8f0; padding: 4px 10px;
          border-radius: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .acc-pill-name { font-size: 13px; color: #1e293b; font-weight: 500; }
        .acc-pill-curr { font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 3px; }
        .acc-pill-curr.hkd { background: #e0f2fe; color: #0369a1; }
        .acc-pill-curr.cny { background: #fee2e2; color: #b91c1c; }
        .acc-pill-curr.usd { background: #dcfce7; color: #15803d; }
        .acc-pill-del { background: none; border: none; font-size: 14px; color: #94a3b8; cursor: pointer; padding: 0 2px; }
        .acc-pill-del:hover { color: #ef4444; }
        .empty-pill-tip { font-size: 12px; color: #cbd5e1; font-style: italic; }
      `}</style>
    </div>
  );
};
