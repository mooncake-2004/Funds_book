// Accounts.tsx
// 具體賬戶資產管理：分大類展示卡片、支持多幣種自動折合 HKD、修改餘額對賬

import React, { useState, useEffect } from 'react';
import { Account } from './types';

// 預設你的所有真實賬戶與默認幣種
const INITIAL_ACCOUNTS: Account[] = [
  // 1. 流動資金 - 現金與電子錢包
  { id: 'acc_payme', name: 'PayMe', categoryId: 'sub_acc_cash_wallet', currency: 'HKD', balance: 1200, exchangeRate: 1.0, baseBalance: 1200 },
  { id: 'acc_octopus', name: '八達通', categoryId: 'sub_acc_cash_wallet', currency: 'HKD', balance: 350.5, exchangeRate: 1.0, baseBalance: 350.5 },
  { id: 'acc_wechat', name: '微信支付', categoryId: 'sub_acc_cash_wallet', currency: 'CNY', balance: 500, exchangeRate: 1.08, baseBalance: 540 },
  { id: 'acc_alipay', name: '支付寶', categoryId: 'sub_acc_cash_wallet', currency: 'CNY', balance: 800, exchangeRate: 1.08, baseBalance: 864 },
  { id: 'acc_receivable', name: '應收款項', categoryId: 'sub_acc_receivable', currency: 'HKD', balance: 0, exchangeRate: 1.0, baseBalance: 0 },

  // 1. 流動資金 - 銀行活期
  { id: 'acc_hs_hkd', name: 'HS HKD SA', categoryId: 'sub_acc_bank', currency: 'HKD', balance: 25000, exchangeRate: 1.0, baseBalance: 25000 },
  { id: 'acc_hs_cny', name: 'HS CNY SA', categoryId: 'sub_acc_bank', currency: 'CNY', balance: 10000, exchangeRate: 1.08, baseBalance: 10800 },
  { id: 'acc_hs_usd', name: 'HS USD SA', categoryId: 'sub_acc_bank', currency: 'USD', balance: 2000, exchangeRate: 7.82, baseBalance: 15640 },
  { id: 'acc_hsbc_hkd', name: 'HSBC HKD', categoryId: 'sub_acc_bank', currency: 'HKD', balance: 18000, exchangeRate: 1.0, baseBalance: 18000 },
  { id: 'acc_hsbc_usd', name: 'HKBC USD', categoryId: 'sub_acc_bank', currency: 'USD', balance: 1500, exchangeRate: 7.82, baseBalance: 11730 },
  { id: 'acc_abc_cny', name: '農行', categoryId: 'sub_acc_bank', currency: 'CNY', balance: 6500, exchangeRate: 1.08, baseBalance: 7020 },

  // 2. 投資資產
  { id: 'acc_mpf_fund', name: '宏利 MPF', categoryId: 'sub_acc_mpf', currency: 'HKD', balance: 85000, exchangeRate: 1.0, baseBalance: 85000 },
  { id: 'acc_insur_save', name: '儲蓄保險價值', categoryId: 'sub_acc_insurance', currency: 'HKD', balance: 120000, exchangeRate: 1.0, baseBalance: 120000 },

  // 3. 固定資產
  { id: 'acc_prop_val', name: '自住物業估值', categoryId: 'sub_acc_property', currency: 'HKD', balance: 5200000, exchangeRate: 1.0, baseBalance: 5200000 },

  // 4. 負債賬戶 - 信用卡 (以負數或欠款展示)
  { id: 'acc_hsbc_red', name: 'HSBC RED', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -3200, exchangeRate: 1.0, baseBalance: -3200 },
  { id: 'acc_hsbc_visa', name: 'HSBC VISA', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -1500, exchangeRate: 1.0, baseBalance: -1500 },
  { id: 'acc_hs_enjoy', name: 'HS ENJOY', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: 0, exchangeRate: 1.0, baseBalance: 0 },
  { id: 'acc_hs_world', name: 'HS WORLDMASTER', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -4500, exchangeRate: 1.0, baseBalance: -4500 },
  { id: 'acc_hs_mm', name: 'HS MM POWER', categoryId: 'sub_acc_credit_card', currency: 'HKD', balance: -800, exchangeRate: 1.0, baseBalance: -800 },
  { id: 'acc_mortgage_loan', name: '銀行房貸按揭', categoryId: 'sub_acc_mortgage', currency: 'HKD', balance: -3100000, exchangeRate: 1.0, baseBalance: -3100000 },
];

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_REAL_ACCOUNTS');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_REAL_ACCOUNTS', JSON.stringify(accounts));
  }, [accounts]);

  // 修改餘額狀態
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState('');

  // 快速修改餘額保存
  const handleSaveBalance = (acc: Account) => {
    const num = parseFloat(newBalance);
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
    setNewBalance('');
  };

  // 計算總淨資產 (折合 HKD)
  const totalNetWorth = accounts.reduce((sum, a) => sum + a.baseBalance, 0);

  return (
    <div className="accounts-container">
      {/* 頂部總覽條 */}
      <div className="net-summary-card">
        <div>
          <span className="summary-label">所有賬戶折算總淨資產 (HKD)</span>
          <h2 className="summary-val">${totalNetWorth.toLocaleString()}</h2>
        </div>
        <span className="summary-badge">{accounts.length} 個賬戶託管中</span>
      </div>

      {/* 賬戶網格清單 */}
      <div className="accounts-grid">
        {accounts.map((acc) => (
          <div key={acc.id} className={`acc-box ${acc.balance < 0 ? 'is-debt' : ''}`}>
            <div className="box-header">
              <strong className="acc-title">{acc.name}</strong>
              <span className={`currency-tag ${acc.currency.toLowerCase()}`}>{acc.currency}</span>
            </div>

            <div className="box-body">
              {editingAccId === acc.id ? (
                <div className="edit-balance-box">
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    placeholder="最新金額"
                    className="balance-input"
                    autoFocus
                  />
                  <button onClick={() => handleSaveBalance(acc)} className="save-mini-btn">保存</button>
                  <button onClick={() => setEditingAccId(null)} className="cancel-mini-btn">取消</button>
                </div>
              ) : (
                <div className="balance-display" onClick={() => { setEditingAccId(acc.id); setNewBalance(acc.balance.toString()); }}>
                  <span className="orig-balance">
                    {acc.currency} {acc.balance.toLocaleString()}
                  </span>
                  {acc.currency !== 'HKD' && (
                    <small className="base-sub-text">
                      ≈ HKD ${acc.baseBalance.toLocaleString()} (匯率 {acc.exchangeRate})
                    </small>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .accounts-container { max-width: 900px; margin: 0 auto; }
        .net-summary-card {
          background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff;
          padding: 20px 24px; border-radius: 14px; display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .summary-label { font-size: 13px; color: #94a3b8; }
        .summary-val { font-size: 28px; font-weight: 700; margin-top: 4px; }
        .summary-badge { background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 20px; font-size: 12px; }

        .accounts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
        .acc-box {
          background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;
          display: flex; flex-direction: column; justify-content: space-between;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .acc-box:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .acc-box.is-debt { border-left: 4px solid #ef4444; }

        .box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .acc-title { font-size: 15px; color: #0f172a; }
        .currency-tag { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
        .currency-tag.hkd { background: #e0f2fe; color: #0369a1; }
        .currency-tag.cny { background: #fee2e2; color: #b91c1c; }
        .currency-tag.usd { background: #dcfce7; color: #15803d; }

        .balance-display { cursor: pointer; display: flex; flex-direction: column; }
        .orig-balance { font-size: 20px; font-weight: 700; color: #1e293b; }
        .acc-box.is-debt .orig-balance { color: #dc2626; }
        .base-sub-text { font-size: 11px; color: #64748b; margin-top: 4px; }

        .edit-balance-box { display: flex; gap: 6px; align-items: center; }
        .balance-input { flex: 1; padding: 6px 8px; border: 1px solid #0ea5e9; border-radius: 6px; font-size: 14px; outline: none; }
        .save-mini-btn { padding: 6px 10px; background: #0ea5e9; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; }
        .cancel-mini-btn { padding: 6px 10px; background: #f1f5f9; color: #64748b; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; }
      `}</style>
    </div>
  );
};
