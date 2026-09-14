// AccountTypeManager.tsx
// 三級資產全景管理器：動態聯動匯率庫幣種、支持填寫初始金額、完整增刪改

import React, { useState, useEffect } from 'react';
import { AccountCategory, Account } from './types';
import { CurrencyRate } from './CurrencyManager';

// 預設二級大類
const INITIAL_ACCOUNT_CATEGORIES: AccountCategory[] = [
  { id: 'acc_cat_liquid', name: '流動資金', order: 1, isLiability: false, parentId: null },
  { id: 'sub_acc_cash_wallet', name: '現金與電子錢包', order: 1, isLiability: false, parentId: 'acc_cat_liquid' },
  { id: 'sub_acc_bank', name: '銀行活期', order: 2, isLiability: false, parentId: 'acc_cat_liquid' },

  { id: 'acc_cat_invest', name: '投資資產', order: 2, isLiability: false, parentId: null },
  { id: 'sub_acc_insurance', name: '保險儲蓄', order: 1, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'sub_acc_fund', name: '基金投資', order: 2, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'sub_acc_mpf', name: 'MPF 強積金', order: 3, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'sub_acc_invest_bank', name: '外幣存款/理財', order: 4, isLiability: false, parentId: 'acc_cat_invest' },

  { id: 'acc_cat_fixed', name: '固定資產', order: 3, isLiability: false, parentId: null },
  { id: 'sub_acc_property', name: '物業估值與房貸', order: 1, isLiability: false, parentId: 'acc_cat_fixed' },

  { id: 'acc_cat_liability', name: '流動負債', order: 4, isLiability: true, parentId: null },
  { id: 'sub_acc_credit_card', name: '信用卡', order: 1, isLiability: true, parentId: 'acc_cat_liability' },
];

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc_zfb_cny', name: '支付寶', categoryId: 'sub_acc_cash_wallet', currency: 'CNY', balance: 1855.32, exchangeRate: 1.08, baseBalance: 2003.75 },
  { id: 'acc_wx_cny', name: '微信', categoryId: 'sub_acc_cash_wallet', currency: 'CNY', balance: 5303.08, exchangeRate: 1.08, baseBalance: 5727.33 },
  { id: 'acc_hs_hkd_sa', name: 'HS HKD SA', categoryId: 'sub_acc_bank', currency: 'HKD', balance: 487833.73, exchangeRate: 1.0, baseBalance: 487833.73 },
  { id: 'acc_hsbc_hkd', name: 'HSBC HKD', categoryId: 'sub_acc_bank', currency: 'HKD', balance: 4534.52, exchangeRate: 1.0, baseBalance: 4534.52 },
  { id: 'acc_hs_cny_sa', name: 'HS CNY SA', categoryId: 'sub_acc_bank', currency: 'CNY', balance: 262.73, exchangeRate: 1.08, baseBalance: 283.75 },
  { id: 'acc_hs_usd_sa', name: 'HS USD SA', categoryId: 'sub_acc_bank', currency: 'USD', balance: 70.54, exchangeRate: 7.82, baseBalance: 551.62 },
  { id: 'acc_abc_cny', name: '農行 CNY', categoryId: 'sub_acc_bank', currency: 'CNY', balance: 100419.34, exchangeRate: 1.08, baseBalance: 108452.89 },
  { id: 'acc_ins_cywl', name: '充裕未來(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 76621.79, exchangeRate: 7.82, baseBalance: 599182.40 },
  { id: 'acc_ins_awy', name: '愛無憂(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 36815.15, exchangeRate: 7.82, baseBalance: 287894.47 },
  { id: 'acc_ins_zzf', name: '真智豐(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 14167.75, exchangeRate: 7.82, baseBalance: 110791.81 },
  { id: 'acc_ins_8yr', name: '8年儲速(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 27211.72, exchangeRate: 7.82, baseBalance: 212795.65 },
  { id: 'acc_ins_yd', name: '易達終身保(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 20323.39, exchangeRate: 7.82, baseBalance: 158928.91 },
  { id: 'acc_fund_zy', name: '智悅(本金USD17,000)', categoryId: 'sub_acc_fund', currency: 'USD', balance: 17444.19, exchangeRate: 7.82, baseBalance: 136413.57 },
  { id: 'acc_mpf_empf', name: 'eMPF', categoryId: 'sub_acc_mpf', currency: 'HKD', balance: 211128.58, exchangeRate: 1.0, baseBalance: 211128.58 },
  { id: 'acc_mpf_pfund', name: 'PFUND', categoryId: 'sub_acc_mpf', currency: 'HKD', balance: 23737.85, exchangeRate: 1.0, baseBalance: 23737.85 },
  { id: 'acc_hsbc_usd_inv', name: 'HSBC USD', categoryId: 'sub_acc_invest_bank', currency: 'USD', balance: 12000.00, exchangeRate: 7.82, baseBalance: 93840.00 },
  { id: 'acc_hs_usd_inv', name: 'HS USD', categoryId: 'sub_acc_invest_bank', currency: 'USD', balance: 2386.46, exchangeRate: 7.82, baseBalance: 18662.12 },
  { id: 'acc_fin_dg', name: '東莞銀行 CNY', categoryId: 'sub_acc_invest_bank', currency: 'CNY', balance: 121530.32, exchangeRate: 1.08, baseBalance: 131252.75 },
  { id: 'acc_fin_gf', name: '廣發 CNY', categoryId: 'sub_acc_invest_bank', currency: 'CNY', balance: 21008.78, exchangeRate: 1.08, baseBalance: 22689.48 },
  { id: 'acc_fin_lct', name: '理財通 CNY', categoryId: 'sub_acc_invest_bank', currency: 'CNY', balance: 30631.94, exchangeRate: 1.08, baseBalance: 33082.50 },
  { id: 'acc_house_prop', name: '物業估值', categoryId: 'sub_acc_property', currency: 'HKD', balance: 6370000.00, exchangeRate: 1.0, baseBalance: 6370000.00 },
  { id: 'acc_mortgage_loan', name: '房貸', categoryId: 'sub_acc_property', currency: 'HKD', balance: -2233652.32, exchangeRate: 1.0, baseBalance: -2233652.32 },
  { id: 'acc_hsbc_red', name: 'HSBC Red', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -12681.40, exchangeRate: 1.0, baseBalance: -12681.40 },
  { id: 'acc_hsbc_visa', name: 'HSBC visa', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -2541.50, exchangeRate: 1.0, baseBalance: -2541.50 },
  { id: 'acc_hs_enjoy', name: 'HS enjoy', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -458.00, exchangeRate: 1.0, baseBalance: -458.00 },
];

export const AccountTypeManager: React.FC = () => {
  // 1. 賬戶大類狀態
  const [accountCategories, setAccountCategories] = useState<AccountCategory[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_ACCOUNT_CATEGORIES_TREE3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ACCOUNT_CATEGORIES;
  });

  // 2. 具體賬戶狀態
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_ACCOUNTS_V3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ACCOUNTS;
  });

  // 3. 【核心升級】：動態讀取匯率庫裡的可用幣種！
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyRate[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_CURRENCY_RATES');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { code: 'HKD', name: '港幣', rateToHKD: 1.0, symbol: 'HK$' },
      { code: 'USD', name: '美元', rateToHKD: 7.82, symbol: '$' },
      { code: 'CNY', name: '人民幣', rateToHKD: 1.085, symbol: '¥' },
      { code: 'JPY', name: '日元', rateToHKD: 0.052, symbol: '¥' },
      { code: 'EUR', name: '歐元', rateToHKD: 8.52, symbol: '€' },
      { code: 'GBP', name: '英鎊', rateToHKD: 10.15, symbol: '£' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_ACCOUNT_CATEGORIES_TREE3', JSON.stringify(accountCategories));
  }, [accountCategories]);

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_ACCOUNTS_V3', JSON.stringify(accounts));
  }, [accounts]);

  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  
  // 一級/二級 分類操作狀態
  const [addingToParentId, setAddingToParentId] = useState<string | null | 'ROOT'>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [inputCatName, setInputCatName] = useState('');
  const [inputIsLiability, setInputIsLiability] = useState(false);

  // 三級 具體賬戶操作狀態
  const [addingAccountToSubCatId, setAddingAccountToSubCatId] = useState<string | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountNameInput, setAccountNameInput] = useState('');
  const [accountCurrencyInput, setAccountCurrencyInput] = useState('HKD');
  const [accountBalanceInput, setAccountBalanceInput] = useState('0'); // 👈 新增初始金額輸入框！

  const parentCategories = accountCategories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenEditCat = (cat: AccountCategory) => {
    handleCloseAll();
    setEditingCatId(cat.id);
    setInputCatName(cat.name);
    setInputIsLiability(cat.isLiability);
  };

  const handleOpenEditAccount = (acc: Account) => {
    handleCloseAll();
    setEditingAccountId(acc.id);
    setAccountNameInput(acc.name);
    setAccountCurrencyInput(acc.currency);
    setAccountBalanceInput(acc.balance.toString()); // 👈 編輯時帶出當前金額
  };

  const handleCloseAll = () => {
    setAddingToParentId(null);
    setEditingCatId(null);
    setAddingAccountToSubCatId(null);
    setEditingAccountId(null);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCatName.trim()) return;

    if (editingCatId) {
      setAccountCategories((prev) =>
        prev.map((c) =>
          c.id === editingCatId ? { ...c, name: inputCatName.trim(), isLiability: inputIsLiability } : c
        )
      );
    } else if (addingToParentId) {
      const isSub = addingToParentId !== 'ROOT';
      const newCat: AccountCategory = {
        id: 'acc_cat_' + Date.now().toString(),
        name: inputCatName.trim(),
        order: accountCategories.length + 1,
        isLiability: inputIsLiability,
        parentId: isSub ? (addingToParentId as string) : null,
      };
      setAccountCategories([...accountCategories, newCat]);
    }
    handleCloseAll();
  };

  // 保存賬戶（獲取選中幣種的最新匯率，自動折算 baseBalance）
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNameInput.trim()) return;

    const initialAmount = parseFloat(accountBalanceInput) || 0;
    
    // 從匯率庫裡找到該幣種的當前匯率
    const matchedCurr = availableCurrencies.find((c) => c.code === accountCurrencyInput);
    const rate = matchedCurr ? matchedCurr.rateToHKD : 1.0;
    const base = Math.round(initialAmount * rate * 100) / 100;

    if (editingAccountId) {
      // 編輯保存
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === editingAccountId) {
            return {
              ...a,
              name: accountNameInput.trim(),
              currency: accountCurrencyInput,
              balance: initialAmount,
              exchangeRate: rate,
              baseBalance: base,
            };
          }
          return a;
        })
      );
    } else if (addingAccountToSubCatId) {
      // 新增保存
      const newAcc: Account = {
        id: 'acc_' + Date.now().toString(),
        name: accountNameInput.trim(),
        categoryId: addingAccountToSubCatId,
        currency: accountCurrencyInput,
        balance: initialAmount,
        exchangeRate: rate,
        baseBalance: base,
      };
      setAccounts([...accounts, newAcc]);
    }
    handleCloseAll();
  };

  const handleDeleteAccount = (accId: string) => {
    if (confirm('確定要刪除這個賬戶嗎？')) {
      setAccounts(accounts.filter((a) => a.id !== accId));
    }
  };

  const handleDeleteCat = (id: string) => {
    if (confirm('確定要刪除嗎？若刪除一級大類，其下的子類也會一併刪除。')) {
      setAccountCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
    }
  };

  return (
    <div className="acc-tree-manager">
      <div className="toolbar">
        <span className="info-text">💡 完整資產架構：一級大類 ➜ 二級分類 ➜ 三級具體賬戶</span>
        <button
          className="add-root-btn"
          onClick={() => {
            handleCloseAll();
            setAddingToParentId('ROOT');
            setInputCatName('');
            setInputIsLiability(false);
          }}
        >
          + 新增一級大類
        </button>
      </div>

      {/* 1. 分類編輯/新增彈窗 */}
      {(addingToParentId || editingCatId) && (
        <form onSubmit={handleSaveCategory} className="form-box">
          <div className="form-header">
            <strong>
              {editingCatId
                ? `編輯分類：${accountCategories.find((c) => c.id === editingCatId)?.name}`
                : addingToParentId === 'ROOT'
                ? '新增一級大類'
                : '新增二級分類'}
            </strong>
            <button type="button" className="close-btn" onClick={handleCloseAll}>×</button>
          </div>
          <div className="form-inputs">
            <input
              type="text"
              placeholder="名稱 (如: 虛擬貨幣、借出款項)"
              value={inputCatName}
              onChange={(e) => setInputCatName(e.target.value)}
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

      {/* 2. 具體賬戶編輯/新增彈窗（支持初始金額與全部動態幣種！） */}
      {(addingAccountToSubCatId || editingAccountId) && (
        <form onSubmit={handleSaveAccount} className="form-box highlight-box">
          <div className="form-header">
            <strong>
              {editingAccountId
                ? `編輯賬戶：${accounts.find((a) => a.id === editingAccountId)?.name}`
                : `新增賬戶到：${accountCategories.find((c) => c.id === addingAccountToSubCatId)?.name}`}
            </strong>
            <button type="button" className="close-btn" onClick={handleCloseAll}>×</button>
          </div>
          <div className="form-inputs">
            <input
              type="text"
              placeholder="賬戶名稱 (如: 泰國曼谷銀行、冷錢包)"
              value={accountNameInput}
              onChange={(e) => setAccountNameInput(e.target.value)}
              className="name-input"
              autoFocus
            />

            {/* 👈 動態渲染匯率庫裡的所有幣種！ */}
            <select
              value={accountCurrencyInput}
              onChange={(e) => setAccountCurrencyInput(e.target.value)}
              className="currency-select"
            >
              {availableCurrencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.name})
                </option>
              ))}
            </select>

            {/* 👈 初始金額輸入框（原幣種）！ */}
            <input
              type="number"
              step="any"
              placeholder="當前金額 (原幣種)"
              value={accountBalanceInput}
              onChange={(e) => setAccountBalanceInput(e.target.value)}
              className="balance-input"
            />

            <button type="submit" className="confirm-btn">
              {editingAccountId ? '保存修改' : '確認新增'}
            </button>
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
                  <button
                    className="action-btn"
                    onClick={() => {
                      handleCloseAll();
                      setAddingToParentId(parent.id);
                      setInputCatName('');
                    }}
                  >
                    + 加二級分類
                  </button>
                  <button className="action-icon-btn" onClick={() => handleOpenEditCat(parent)}>
                    ✏️
                  </button>
                  <button className="action-icon-btn del-btn" onClick={() => handleDeleteCat(parent.id)}>
                    🗑️
                  </button>
                </div>
              </div>

              {/* 2. 二級分類與具體賬戶 */}
              {!isCollapsed && (
                <div className="sub-list">
                  {subCategories.map((sub) => {
                    const subAccounts = accounts.filter((a) => a.categoryId === sub.id);

                    return (
                      <div key={sub.id} className="sub-block">
                        <div className="sub-header-row">
                          <div className="sub-title-wrap">
                            <span className="sub-title">📂 {sub.name}</span>
                            <button className="sub-edit-btn" onClick={() => handleOpenEditCat(sub)}>✏️</button>
                          </div>
                          <button
                            className="add-acc-btn"
                            onClick={() => {
                              handleCloseAll();
                              setAddingAccountToSubCatId(sub.id);
                              setAccountNameInput('');
                              setAccountCurrencyInput('HKD');
                              setAccountBalanceInput('0');
                            }}
                          >
                            + 新增賬戶
                          </button>
                        </div>

                        {/* 3. 三級具體賬戶膠囊雲 */}
                        <div className="accounts-pill-cloud">
                          {subAccounts.map((acc) => (
                            <div key={acc.id} className="acc-pill">
                              <span className="acc-pill-name">{acc.name}</span>
                              <span className={`acc-pill-curr ${acc.currency.toLowerCase()}`}>
                                {acc.currency}
                              </span>
                              <span className="acc-pill-amount">
                                {acc.currency} {acc.balance.toLocaleString()}
                              </span>
                              <button
                                className="acc-pill-btn"
                                onClick={() => handleOpenEditAccount(acc)}
                                title="編輯賬戶"
                              >
                                ✏️
                              </button>
                              <button
                                className="acc-pill-btn del"
                                onClick={() => handleDeleteAccount(acc.id)}
                                title="刪除賬戶"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {subAccounts.length === 0 && (
                            <span className="empty-pill-tip">暫無賬戶</span>
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
          flex: 1; min-width: 160px; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none;
        }
        .currency-select {
          padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #fff;
        }
        .balance-input {
          width: 130px; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none;
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
        .action-icon-btn { background: none; border: none; cursor: pointer; font-size: 13px; opacity: 0.6; padding: 2px; }
        .action-icon-btn:hover { opacity: 1; transform: scale(1.1); }
        .del-btn:hover { color: #ef4444; }

        .sub-list { padding: 10px 16px 14px 24px; display: flex; flex-direction: column; gap: 12px; }
        .sub-block { background: #fbfcfe; border: 1px solid #f1f5f9; border-radius: 8px; padding: 10px 12px; }
        .sub-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .sub-title-wrap { display: flex; align-items: center; gap: 6px; }
        .sub-title { font-size: 13px; font-weight: 600; color: #475569; }
        .sub-edit-btn { background: none; border: none; cursor: pointer; font-size: 11px; opacity: 0.5; }
        .sub-edit-btn:hover { opacity: 1; }
        
        .add-acc-btn {
          padding: 2px 8px; font-size: 11px; background: #fff; border: 1px dashed #cbd5e1;
          border-radius: 4px; cursor: pointer; color: #0ea5e9; font-weight: 600;
        }
        .add-acc-btn:hover { border-color: #0ea5e9; background: #f0f9ff; }

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
        .acc-pill-amount { font-size: 11px; color: #64748b; font-family: monospace; }
        
        .acc-pill-btn { background: none; border: none; font-size: 11px; color: #94a3b8; cursor: pointer; padding: 0 2px; }
        .acc-pill-btn:hover { color: #0ea5e9; }
        .acc-pill-btn.del:hover { color: #ef4444; }
        .empty-pill-tip { font-size: 12px; color: #cbd5e1; font-style: italic; }
      `}</style>
    </div>
  );
};
