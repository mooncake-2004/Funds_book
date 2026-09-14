// Accounts.tsx
// 專業財務狀態視圖：頂部大類多選動態合計、手風琴分組折疊、圖二雙行金融排版

import React, { useState, useEffect } from 'react';
import { Account, AccountCategory } from './types';

// 預設二級大類
const DEFAULT_CATEGORIES: AccountCategory[] = [
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

// 預設你的全部真實賬戶
const INITIAL_ACCOUNTS: Account[] = [
  // 1. 現金與錢包
  { id: 'acc_zfb_cny', name: '支付寶', categoryId: 'sub_acc_cash_wallet', currency: 'CNY', balance: 1855.32, exchangeRate: 1.08, baseBalance: 2003.75 },
  { id: 'acc_wx_cny', name: '微信', categoryId: 'sub_acc_cash_wallet', currency: 'CNY', balance: 5303.08, exchangeRate: 1.08, baseBalance: 5727.33 },

  // 2. 銀行活期
  { id: 'acc_hs_hkd_sa', name: 'HS HKD SA', categoryId: 'sub_acc_bank', currency: 'HKD', balance: 487833.73, exchangeRate: 1.0, baseBalance: 487833.73 },
  { id: 'acc_hsbc_hkd', name: 'HSBC HKD', categoryId: 'sub_acc_bank', currency: 'HKD', balance: 4534.52, exchangeRate: 1.0, baseBalance: 4534.52 },
  { id: 'acc_hs_cny_sa', name: 'HS CNY SA', categoryId: 'sub_acc_bank', currency: 'CNY', balance: 262.73, exchangeRate: 1.08, baseBalance: 283.75 },
  { id: 'acc_hs_usd_sa', name: 'HS USD SA', categoryId: 'sub_acc_bank', currency: 'USD', balance: 70.54, exchangeRate: 7.82, baseBalance: 551.62 },
  { id: 'acc_abc_cny', name: '農行 CNY', categoryId: 'sub_acc_bank', currency: 'CNY', balance: 100419.34, exchangeRate: 1.08, baseBalance: 108452.89 },

  // 3. 保險儲蓄 (USD)
  { id: 'acc_ins_cywl', name: '充裕未來(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 76621.79, exchangeRate: 7.82, baseBalance: 599182.40 },
  { id: 'acc_ins_awy', name: '愛無憂(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 36815.15, exchangeRate: 7.82, baseBalance: 287894.47 },
  { id: 'acc_ins_zzf', name: '真智豐(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 14167.75, exchangeRate: 7.82, baseBalance: 110791.81 },
  { id: 'acc_ins_8yr', name: '8年儲速(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 27211.72, exchangeRate: 7.82, baseBalance: 212795.65 },
  { id: 'acc_ins_yd', name: '易達終身保(USD)', categoryId: 'sub_acc_insurance', currency: 'USD', balance: 20323.39, exchangeRate: 7.82, baseBalance: 158928.91 },

  // 4. 基金投資 (USD)
  { id: 'acc_fund_zy', name: '智悅(本金USD17,000)', categoryId: 'sub_acc_fund', currency: 'USD', balance: 17444.19, exchangeRate: 7.82, baseBalance: 136413.57 },

  // 5. MPF 強積金 (HKD)
  { id: 'acc_mpf_empf', name: 'eMPF', categoryId: 'sub_acc_mpf', currency: 'HKD', balance: 211128.58, exchangeRate: 1.0, baseBalance: 211128.58 },
  { id: 'acc_mpf_pfund', name: 'PFUND', categoryId: 'sub_acc_mpf', currency: 'HKD', balance: 23737.85, exchangeRate: 1.0, baseBalance: 23737.85 },

  // 6. 外幣存款/理財
  { id: 'acc_hsbc_usd_inv', name: 'HSBC USD', categoryId: 'sub_acc_invest_bank', currency: 'USD', balance: 12000.00, exchangeRate: 7.82, baseBalance: 93840.00 },
  { id: 'acc_hs_usd_inv', name: 'HS USD', categoryId: 'sub_acc_invest_bank', currency: 'USD', balance: 2386.46, exchangeRate: 7.82, baseBalance: 18662.12 },
  { id: 'acc_fin_dg', name: '東莞銀行 CNY', categoryId: 'sub_acc_invest_bank', currency: 'CNY', balance: 121530.32, exchangeRate: 1.08, baseBalance: 131252.75 },
  { id: 'acc_fin_gf', name: '廣發 CNY', categoryId: 'sub_acc_invest_bank', currency: 'CNY', balance: 21008.78, exchangeRate: 1.08, baseBalance: 22689.48 },
  { id: 'acc_fin_lct', name: '理財通 CNY', categoryId: 'sub_acc_invest_bank', currency: 'CNY', balance: 30631.94, exchangeRate: 1.08, baseBalance: 33082.50 },

  // 7. 物業與按揭
  { id: 'acc_house_prop', name: '物業估值', categoryId: 'sub_acc_property', currency: 'HKD', balance: 6370000.00, exchangeRate: 1.0, baseBalance: 6370000.00 },
  { id: 'acc_mortgage_loan', name: '房貸', categoryId: 'sub_acc_property', currency: 'HKD', balance: -2233652.32, exchangeRate: 1.0, baseBalance: -2233652.32 },

  // 8. 信用卡負債
  { id: 'acc_hsbc_red', name: 'HSBC Red', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -12681.40, exchangeRate: 1.0, baseBalance: -12681.40 },
  { id: 'acc_hsbc_visa', name: 'HSBC visa', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -2541.50, exchangeRate: 1.0, baseBalance: -2541.50 },
  { id: 'acc_hs_enjoy', name: 'HS enjoy', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -458.00, exchangeRate: 1.0, baseBalance: -458.00 },
];

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_ACCOUNTS_V3');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_ACCOUNTS_V3', JSON.stringify(accounts));
  }, [accounts]);

  // 1. 頂部大類勾選過濾器（默認全選）
  const [selectedParentCats, setSelectedParentCats] = useState<string[]>([
    'acc_cat_liquid', 'acc_cat_invest', 'acc_cat_fixed', 'acc_cat_liability'
  ]);

  // 控制各分組折疊狀態
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  // 快速修改餘額彈框
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState('');

  const parentCategories = DEFAULT_CATEGORIES.filter((c) => !c.parentId);

  // 切換大類過濾
  const toggleParentCat = (id: string) => {
    setSelectedParentCats((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 折疊切換
  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
  };

  // 保存餘額
  const handleSaveBalance = (acc: Account) => {
    const num = parseFloat(tempBalance);
    if (isNaN(num)) return;

    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id === acc.id) {
          const base = num * a.exchangeRate;
          return { ...a, balance: num, baseBalance: base };
        }
        return a;
      })
    );
    setEditingAccId(null);
  };

  // 計算選中大類下的「動態總身家」
  const currentTotal = accounts.reduce((sum, a) => {
    const subCat = DEFAULT_CATEGORIES.find((c) => c.id === a.categoryId);
    if (!subCat) return sum;
    // 檢查這個賬戶的一級大類是否被勾選了
    if (selectedParentCats.includes(subCat.parentId || '')) {
      return sum + a.baseBalance;
    }
    return sum;
  }, 0);

  return (
    <div className="finance-view">
      {/* ============================================================ */}
      {/* 頂部區域：大類多選過濾器 + 動態合計大卡片 */}
      {/* ============================================================ */}
      <div className="filter-header">
        <div className="filter-chips">
          {parentCategories.map((p) => {
            const isChecked = selectedParentCats.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleParentCat(p.id)}
                className={`chip-btn ${isChecked ? 'active' : ''}`}
              >
                {isChecked ? '✓ ' : '+ '}{p.name}
              </button>
            );
          })}
        </div>

        <div className="total-display-card">
          <span className="total-label">選中大類折算淨資產 (HKD)</span>
          <h1 className={`total-amount ${currentTotal < 0 ? 'text-red' : 'text-primary'}`}>
            ${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 分組手風琴列表（完全復刻圖二結構） */}
      {/* ============================================================ */}
      <div className="groups-container">
        {DEFAULT_CATEGORIES.filter((c) => c.parentId && selectedParentCats.includes(c.parentId)).map((subCat) => {
          const subAccounts = accounts.filter((a) => a.categoryId === subCat.id);
          if (subAccounts.length === 0) return null;

          // 計算該小組合計金額
          const groupTotal = subAccounts.reduce((sum, a) => sum + a.baseBalance, 0);
          const isCollapsed = collapsedGroups.includes(subCat.id);

          return (
            <div key={subCat.id} className="group-wrapper">
              {/* 分組標題條（圖二藍色圓角標籤風格） */}
              <div className="group-header" onClick={() => toggleGroup(subCat.id)}>
                <div className="header-left">
                  <span className={`circle-arrow ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                  <strong className="group-name">{subCat.name}</strong>
                </div>

                <div className="header-right">
                  <span className={`group-total ${groupTotal < 0 ? 'text-red' : 'text-green'}`}>
                    HK${groupTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* 具體賬戶條目清單（展開時展示） */}
              {!isCollapsed && (
                <div className="group-items">
                  {subAccounts.map((acc) => (
                    <div key={acc.id} className="account-row">
                      <div className="row-left">
                        <span className="acc-name">{acc.name}</span>
                        <span className={`curr-tag ${acc.currency.toLowerCase()}`}>{acc.currency}</span>
                      </div>

                      {editingAccId === acc.id ? (
                        <div className="row-edit">
                          <input
                            type="number"
                            value={tempBalance}
                            onChange={(e) => setTempBalance(e.target.value)}
                            className="inline-input"
                            autoFocus
                          />
                          <button onClick={() => handleSaveBalance(acc)} className="btn-ok">✓</button>
                          <button onClick={() => setEditingAccId(null)} className="btn-cancel">×</button>
                        </div>
                      ) : (
                        <div
                          className="row-right clickable"
                          onClick={() => { setEditingAccId(acc.id); setTempBalance(acc.balance.toString()); }}
                          title="點擊修改餘額對賬"
                        >
                          {/* 第一行：折合 HKD 大字（圖二綠色/紅色） */}
                          <span className={`base-val ${acc.baseBalance < 0 ? 'text-red' : 'text-green'}`}>
                            HK${acc.baseBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>

                          {/* 第二行：原幣種小字 */}
                          {acc.currency !== 'HKD' && (
                            <small className="orig-val">
                              {acc.currency === 'CNY' ? '¥' : '$'}
                              {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 復刻圖二的高級專業金融樣式 */}
      <style>{`
        .finance-view { max-width: 650px; margin: 0 auto; padding: 12px; }

        /* 頂部過濾標籤 */
        .filter-header { margin-bottom: 16px; }
        .filter-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .chip-btn {
          padding: 6px 14px; border-radius: 20px; border: 1px solid #cbd5e1;
          background: #ffffff; color: #64748b; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .chip-btn.active {
          background: #3b82f6; border-color: #3b82f6; color: #ffffff;
        }

        /* 總資產看板卡片 */
        .total-display-card {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: #ffffff; padding: 20px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .total-label { font-size: 13px; color: #94a3b8; }
        .total-amount { font-size: 32px; font-weight: 800; margin-top: 6px; }

        /* 分組手風琴容器 */
        .groups-container { display: flex; flex-direction: column; gap: 14px; }
        .group-wrapper {
          background: #ffffff; border-radius: 14px; overflow: hidden;
          border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.02);
        }

        /* 分組標題行（藍色圓角按鈕風格） */
        .group-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; background: #f8fafc; cursor: pointer; user-select: none;
        }
        .header-left { display: flex; align-items: center; gap: 10px; }
        .circle-arrow {
          display: inline-flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; background: #3b82f6; color: #ffffff;
          border-radius: 50%; font-size: 10px; transition: transform 0.2s;
        }
        .circle-arrow.collapsed { transform: rotate(-90deg); }
        .group-name { font-size: 15px; color: #1e293b; font-weight: 700; }
        .group-total { font-size: 15px; font-weight: 700; }

        /* 賬戶明細行 */
        .group-items { display: flex; flex-direction: column; }
        .account-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px; border-top: 1px solid #f1f5f9;
        }
        .account-row:hover { background: #fcfdfe; }
        .row-left { display: flex; align-items: center; gap: 8px; }
        .acc-name { font-size: 14px; color: #334155; font-weight: 600; }
        .curr-tag { font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; }
        .curr-tag.hkd { background: #e0f2fe; color: #0284c7; }
        .curr-tag.cny { background: #fee2e2; color: #dc2626; }
        .curr-tag.usd { background: #dcfce7; color: #16a34a; }

        /* 雙行數值排版（綠色/紅色） */
        .row-right { display: flex; flex-direction: column; align-items: flex-end; }
        .row-right.clickable { cursor: pointer; }
        .base-val { font-size: 15px; font-weight: 700; font-family: monospace; }
        .orig-val { font-size: 11px; color: #64748b; margin-top: 2px; font-family: monospace; }

        .text-green { color: #10b981 !important; }
        .text-red { color: #ef4444 !important; }
        .text-primary { color: #38bdf8 !important; }

        /* 行內編輯 */
        .row-edit { display: flex; gap: 6px; align-items: center; }
        .inline-input { width: 110px; padding: 4px 8px; font-size: 14px; border: 1px solid #3b82f6; border-radius: 6px; }
        .btn-ok { background: #10b981; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
        .btn-cancel { background: #94a3b8; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
      `}</style>
    </div>
  );
};
