// Transactions.tsx
// 完整流水明細與快捷記賬面板：精準復刻參考圖、多幣種實時換算、賬戶餘額實時連鎖扣減與回滾

import React, { useState, useEffect } from 'react';
import { Transaction, Account, Category, AccountCategory, TransactionType } from './types';
import { CurrencyRate } from './CurrencyManager';

// 預設幾條貼近真實生活的初始流水記錄（對標圖二）
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    date: '2026-09-14T15:16',
    type: 'EXPENSE',
    amount: -30.00,
    currency: 'CNY',
    exchangeRate: 1.168,
    baseAmount: -35.05,
    categoryId: 'sub_act',
    account: 'acc_zfb_cny',
    note: '陪玩',
  },
  {
    id: 'tx_2',
    date: '2026-09-13T12:30',
    type: 'EXPENSE',
    amount: -79.00,
    currency: 'HKD',
    exchangeRate: 1.0,
    baseAmount: -79.00,
    categoryId: 'sub_food_raw',
    account: 'acc_hs_hkd_sa',
    note: '飯',
  },
  {
    id: 'tx_3',
    date: '2026-09-12T19:45',
    type: 'EXPENSE',
    amount: -368.40,
    currency: 'HKD',
    exchangeRate: 1.0,
    baseAmount: -368.40,
    categoryId: 'sub_food_raw',
    account: 'acc_hsbc_red',
    note: 'hktvmall',
  },
  {
    id: 'tx_4',
    date: '2026-09-11T16:20',
    type: 'EXPENSE',
    amount: -12.10,
    currency: 'CNY',
    exchangeRate: 1.078,
    baseAmount: -13.04,
    categoryId: 'sub_shop',
    account: 'acc_wx_cny',
    note: '文具',
  },
  {
    id: 'tx_5',
    date: '2026-09-11T11:05',
    type: 'EXPENSE',
    amount: -17.43,
    currency: 'CNY',
    exchangeRate: 1.078,
    baseAmount: -18.79,
    categoryId: 'sub_food_raw',
    account: 'acc_wx_cny',
    note: '零食',
  },
];

export const Transactions: React.FC = () => {
  // 1. 流水列表
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_TRANSACTIONS');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_TRANSACTIONS;
  });

  // 2. 賬戶數據
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_ACCOUNTS_V3');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. 分類數據
  const [categories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_CATEGORIES');
    return saved ? JSON.parse(saved) : [];
  });

  // 4. 賬戶分類數據
  const [accountCategories] = useState<AccountCategory[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_ACCOUNT_CATEGORIES_TREE3');
    return saved ? JSON.parse(saved) : [];
  });

  // 5. 實時匯率庫
  const [rates] = useState<CurrencyRate[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_CURRENCY_RATES');
    return saved ? JSON.parse(saved) : [
      { code: 'HKD', rateToHKD: 1.0, symbol: 'HK$' },
      { code: 'CNY', rateToHKD: 1.085, symbol: '¥' },
      { code: 'USD', rateToHKD: 7.82, symbol: '$' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_TRANSACTIONS', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_ACCOUNTS_V3', JSON.stringify(accounts));
  }, [accounts]);

  // 控制添加彈窗展示
  const [showAddModal, setShowAddModal] = useState(false);

  // 表單輸入狀態
  const [recordType, setRecordType] = useState<TransactionType>('EXPENSE');
  const [note, setNote] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState(''); // 轉賬專用
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [dateTime, setDateTime] = useState('');

  // 初始化彈窗表單
  const handleOpenAdd = () => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDateTime(localIso);
    setNote('');
    setAmountStr('');
    setRecordType('EXPENSE');

    // 默認選中第一個可用賬戶與分類
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
    const expenseCats = categories.filter((c) => c.parentId && c.type === 'EXPENSE');
    if (expenseCats.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(expenseCats[0].id);
    }
    setShowAddModal(true);
  };

  // 當前選中的扣款賬戶
  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const targetToAccount = accounts.find((a) => a.id === toAccountId) || (accounts.length > 1 ? accounts[1] : accounts[0]);
  const currentCurrency = currentAccount ? currentAccount.currency : 'HKD';

  // 當前選中賬戶的最新匯率
  const matchedRateObj = rates.find((r) => r.code === currentCurrency);
  const currentRateToHKD = matchedRateObj ? matchedRateObj.rateToHKD : (currentAccount ? currentAccount.exchangeRate : 1.0);

  // 雙向匯率計算
  const inverseRate = currentRateToHKD > 0 ? (1 / currentRateToHKD).toFixed(3) : '1';
  const numericAmount = parseFloat(amountStr) || 0;
  const calculatedBaseHKD = (numericAmount * currentRateToHKD).toFixed(2);

  // 提交保存一筆交易（支持連續記賬）
  const handleSaveTransaction = (keepOpen: boolean = false) => {
    if (!amountStr || numericAmount <= 0) {
      alert('請輸入大於 0 的金額');
      return;
    }
    if (!currentAccount) {
      alert('請選擇賬戶');
      return;
    }

    // 金額符號流：支出為負數，收入為正數
    const signedAmount = recordType === 'EXPENSE' ? -Math.abs(numericAmount) : Math.abs(numericAmount);
    const signedBaseAmount = Math.round(signedAmount * currentRateToHKD * 100) / 100;

    const newTx: Transaction = {
      id: 'tx_' + Date.now().toString(),
      date: dateTime || new Date().toISOString().slice(0, 16),
      type: recordType,
      amount: signedAmount,
      currency: currentCurrency,
      exchangeRate: currentRateToHKD,
      baseAmount: signedBaseAmount,
      categoryId: recordType === 'TRANSFER' ? 'TRANSFER' : selectedCategoryId,
      account: currentAccount.id,
      toAccount: recordType === 'TRANSFER' ? targetToAccount.id : undefined,
      note: note.trim() || (recordType === 'EXPENSE' ? '支出' : recordType === 'INCOME' ? '收入' : '轉賬'),
    };

    // 1. 新增到流水列表頂部
    setTransactions([newTx, ...transactions]);

    // 2. 實時連鎖更新賬戶餘額 (純符號流加法)
    setAccounts((prev) =>
      prev.map((acc) => {
        if (recordType === 'TRANSFER') {
          if (acc.id === currentAccount.id) {
            const newBal = acc.balance - Math.abs(numericAmount);
            return { ...acc, balance: newBal, baseBalance: Math.round(newBal * acc.exchangeRate * 100) / 100 };
          }
          if (acc.id === targetToAccount.id) {
            // 轉入賬戶按對應幣種折算
            const transferredBase = Math.abs(numericAmount) * currentRateToHKD;
            const targetCurrencyAmount = transferredBase / (acc.exchangeRate || 1.0);
            const newBal = acc.balance + targetCurrencyAmount;
            return { ...acc, balance: newBal, baseBalance: Math.round(newBal * acc.exchangeRate * 100) / 100 };
          }
        } else {
          if (acc.id === currentAccount.id) {
            const newBal = acc.balance + signedAmount;
            return { ...acc, balance: newBal, baseBalance: Math.round(newBal * acc.exchangeRate * 100) / 100 };
          }
        }
        return acc;
      })
    );

    if (keepOpen) {
      // +1 連續記賬模式：清空金額與備註，保留面板
      setAmountStr('');
      setNote('');
    } else {
      setShowAddModal(false);
    }
  };

  // 刪除流水記錄並自動回滾賬戶金額
  const handleDeleteTransaction = (tx: Transaction) => {
    if (!confirm(`確定要刪除「${tx.note}」這筆記錄嗎？對應賬戶餘額將會自動回滾。`)) return;

    // 1. 從流水中移除
    setTransactions((prev) => prev.filter((t) => t.id !== tx.id));

    // 2. 回滾賬戶餘額（反向操作）
    setAccounts((prev) =>
      prev.map((acc) => {
        if (tx.type === 'TRANSFER') {
          if (acc.id === tx.account) {
            const newBal = acc.balance + Math.abs(tx.amount);
            return { ...acc, balance: newBal, baseBalance: Math.round(newBal * acc.exchangeRate * 100) / 100 };
          }
          if (tx.toAccount && acc.id === tx.toAccount) {
            const transferredBase = Math.abs(tx.baseAmount);
            const targetCurrencyAmount = transferredBase / (acc.exchangeRate || 1.0);
            const newBal = acc.balance - targetCurrencyAmount;
            return { ...acc, balance: newBal, baseBalance: Math.round(newBal * acc.exchangeRate * 100) / 100 };
          }
        } else {
          if (acc.id === tx.account) {
            const rollbackBal = acc.balance - tx.amount; // 減去原符號值即為反轉
            return { ...acc, balance: rollbackBal, baseBalance: Math.round(rollbackBal * acc.exchangeRate * 100) / 100 };
          }
        }
        return acc;
      })
    );
  };

  // 格式化日期標籤 (如: 周一 2026年9月14日)
  const formatDateGroupHeader = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekDay = days[d.getDay()];
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const date = d.getDate();
      return `${weekDay} ${year}年${month}月${date}日`;
    } catch (e) {
      return isoStr.slice(0, 10);
    }
  };

  // 按日期分組流水
  const groupedTransactions: { [key: string]: Transaction[] } = {};
  transactions.forEach((tx) => {
    const dayKey = tx.date.slice(0, 10);
    if (!groupedTransactions[dayKey]) {
      groupedTransactions[dayKey] = [];
    }
    groupedTransactions[dayKey].push(tx);
  });
  const sortedDayKeys = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  return (
    <div className="tx-container">
      {/* 頂部導航小 Tab */}
      <div className="tx-header">
        <div className="tx-title-tab">交易記錄</div>
      </div>

      {/* 流水明細列表（按日期分組） */}
      <div className="tx-list">
        {sortedDayKeys.map((dayKey) => {
          const list = groupedTransactions[dayKey];
          // 計算當日總 HKD 收支合計
          const daySumHKD = list.reduce((sum, item) => sum + item.baseAmount, 0);

          return (
            <div key={dayKey} className="day-group">
              {/* 日期小灰條 */}
              <div className="day-header-pill">
                <span className="day-text">{formatDateGroupHeader(list[0].date)}</span>
                <span className={`day-sum ${daySumHKD < 0 ? 'text-subtle' : 'text-green'}`}>
                  {daySumHKD < 0 ? '-' : '+'}HK${Math.abs(daySumHKD).toFixed(2)}
                </span>
              </div>

              {/* 當日條目清單 */}
              <div className="day-items">
                {list.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const acc = accounts.find((a) => a.id === tx.account);
                  const isExp = tx.amount < 0;

                  return (
                    <div key={tx.id} className="tx-row" onClick={() => handleDeleteTransaction(tx)} title="點擊可刪除此流水並回滾餘額">
                      {/* 左側圓形圖標 */}
                      <div className={`tx-avatar ${isExp ? 'bg-pink' : 'bg-green'}`}>
                        {cat ? cat.icon || '🏷️' : tx.type === 'TRANSFER' ? '🔄' : '💰'}
                      </div>

                      {/* 中間：名稱 + 分類 */}
                      <div className="tx-info">
                        <span className="tx-name">{tx.note}</span>
                        <span className="tx-subcat">{cat ? cat.name : tx.type === 'TRANSFER' ? '內部轉賬' : '其他'}</span>
                      </div>

                      {/* 右側：原幣種 + 折合HKD + 賬戶名稱與餘額 */}
                      <div className="tx-amount-col">
                        <div className="tx-amounts-top">
                          {tx.currency !== 'HKD' && (
                            <span className="tx-orig-badge">
                              {isExp ? '-' : '+'}{tx.currency === 'CNY' ? '¥' : '$'}{Math.abs(tx.amount).toFixed(2)}
                            </span>
                          )}
                          <span className={`tx-base-amount ${isExp ? 'text-pink' : 'text-green'}`}>
                            {isExp ? '-' : '+'}HK${Math.abs(tx.baseAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="tx-account-bottom">
                          <span className="tx-acc-label">
                            {acc ? acc.name : '未知賬戶'}
                            {acc && (
                              <span className="tx-acc-bal">
                                {' '}{acc.currency === 'CNY' ? '¥' : '$'}{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <div className="tx-empty">
            <p>暫無交易流水</p>
            <small>點擊右下角「+」記下第一筆賬吧！</small>
          </div>
        )}
      </div>

      {/* 右下角深藍色 FAB 懸浮按鈕 */}
      <button className="fab-btn" onClick={handleOpenAdd} title="快速記一筆">
        +
      </button>

      {/* ============================================================ */}
      {/* 復刻圖一：添加交易面板 (Drawer / Modal) */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* 頂部標題條 */}
            <div className="modal-header">
              <button className="back-btn" onClick={() => setShowAddModal(false)}>←</button>
              <h2 className="modal-title">添加</h2>
              <button className="quick-add-btn" onClick={() => handleSaveTransaction(true)} title="保存並記下一筆">
                +1
              </button>
            </div>

            {/* 名稱輸入行 */}
            <div className="input-group-clean">
              <input
                type="text"
                placeholder="名稱"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="name-big-input"
                autoFocus
              />
              <span className="paperclip-icon">📎</span>
            </div>

            {/* 日期時間條 */}
            <div className="date-row">
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="datetime-input"
              />
            </div>

            {/* 大金額輸入卡片 */}
            <div className="amount-card">
              <div className={`sign-circle ${recordType === 'EXPENSE' ? 'minus' : 'plus'}`}>
                {recordType === 'EXPENSE' ? '－' : '＋'}
              </div>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="amount-big-input"
              />
              <span className="calc-icon">🖩</span>
              <span className="curr-badge-btn">{currentCurrency}</span>
            </div>

            {/* 實時匯率雙向卡片 */}
            <div className="exchange-info-box">
              <div className="exchange-header">
                <span className="exchange-icon">🔄</span>
                <strong>匯率</strong>
              </div>
              <div className="exchange-details">
                <p>
                  {(numericAmount || 0).toFixed(2)} {currentCurrency} = {calculatedBaseHKD} HKD
                </p>
                <p>1 {currentCurrency} = {currentRateToHKD.toFixed(3)} HKD</p>
                <p>1 HKD = {inverseRate} {currentCurrency}</p>
              </div>
            </div>

            {/* 分類與賬戶選擇 */}
            <div className="picker-section">
              {recordType !== 'TRANSFER' && (
                <div className="picker-row">
                  <div className="picker-label">
                    <span className="picker-icon">•••</span>
                    <span>收支分類</span>
                  </div>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="picker-select"
                  >
                    {categories
                      .filter((c) => c.parentId && c.type === recordType)
                      .map((c) => {
                        const parent = categories.find((p) => p.id === c.parentId);
                        return (
                          <option key={c.id} value={c.id}>
                            {parent ? parent.name + ' / ' : ''}{c.icon || ''} {c.name}
                          </option>
                        );
                      })}
                  </select>
                </div>
              )}

              {/* 扣款賬戶 */}
              <div className="picker-row">
                <div className="picker-label">
                  <span className="picker-icon">💳</span>
                  <span>{recordType === 'TRANSFER' ? '轉出賬戶' : '扣款賬戶'}</span>
                </div>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="picker-select"
                >
                  {accounts.map((a) => {
                    const subCat = accountCategories.find((c) => c.id === a.categoryId);
                    return (
                      <option key={a.id} value={a.id}>
                        {subCat ? subCat.name + ' / ' : ''}{a.name} ({a.currency})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 轉賬專用：轉入賬戶 */}
              {recordType === 'TRANSFER' && (
                <div className="picker-row">
                  <div className="picker-label">
                    <span className="picker-icon">📥</span>
                    <span>轉入賬戶</span>
                  </div>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="picker-select"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 底部操作欄 */}
            <div className="modal-bottom-bar">
              <div className="type-pills-bar">
                <button
                  type="button"
                  className={`type-pill-btn ${recordType === 'EXPENSE' ? 'active-exp' : ''}`}
                  onClick={() => setRecordType('EXPENSE')}
                >
                  支出
                </button>
                <button
                  type="button"
                  className={`type-pill-btn ${recordType === 'INCOME' ? 'active-inc' : ''}`}
                  onClick={() => setRecordType('INCOME')}
                >
                  收入
                </button>
                <button
                  type="button"
                  className={`type-pill-btn ${recordType === 'TRANSFER' ? 'active-trans' : ''}`}
                  onClick={() => setRecordType('TRANSFER')}
                >
                  轉賬
                </button>
              </div>

              <button
                type="button"
                className="save-btn-green"
                onClick={() => handleSaveTransaction(false)}
                title="保存"
              >
                💾
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 樣式定義 */}
      <style>{`
        .tx-container { max-width: 600px; margin: 0 auto; position: relative; min-height: 80vh; padding-bottom: 80px; }
        .tx-header { display: flex; justify-content: center; margin-bottom: 12px; }
        .tx-title-tab {
          font-size: 16px; font-weight: 700; color: #1e293b;
          border-bottom: 3px solid #3b82f6; padding: 6px 16px;
        }

        .tx-list { display: flex; flex-direction: column; gap: 16px; }
        .day-group { display: flex; flex-direction: column; gap: 8px; }

        .day-header-pill {
          display: flex; justify-content: space-between; align-items: center;
          background: #eef2f6; border-radius: 16px; padding: 6px 14px;
          font-size: 12.5px; font-weight: 600; color: #475569;
        }
        .day-sum { font-family: monospace; }
        .text-subtle { color: #334155; }
        .text-pink { color: #f43f5e !important; font-weight: 700; }
        .text-green { color: #10b981 !important; font-weight: 700; }

        .day-items { display: flex; flex-direction: column; gap: 2px; }
        .tx-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 8px; background: #ffffff; border-bottom: 1px solid #f8fafc;
          cursor: pointer; transition: background 0.15s; border-radius: 8px;
        }
        .tx-row:hover { background: #f8fafc; }

        .tx-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; color: #ffffff; flex-shrink: 0;
        }
        .bg-pink { background: #f43f5e; }
        .bg-green { background: #10b981; }

        .tx-info { display: flex; flex-direction: column; margin-left: 12px; flex: 1; }
        .tx-name { font-size: 14.5px; font-weight: 600; color: #1e293b; }
        .tx-subcat { font-size: 12px; color: #94a3b8; margin-top: 2px; }

        .tx-amount-col { display: flex; flex-direction: column; align-items: flex-end; }
        .tx-amounts-top { display: flex; align-items: baseline; gap: 6px; }
        .tx-orig-badge { color: #38bdf8; font-size: 13px; font-weight: 600; font-family: monospace; }
        .tx-base-amount { font-size: 14.5px; font-family: monospace; }
        .tx-account-bottom { font-size: 11.5px; color: #64748b; margin-top: 2px; font-family: monospace; }
        .tx-acc-bal { font-weight: 600; color: #334155; }

        /* FAB 懸浮按鈕 */
        .fab-btn {
          position: fixed; right: 28px; bottom: 36px;
          width: 54px; height: 54px; border-radius: 16px;
          background: #475569; color: #ffffff; border: none;
          font-size: 32px; font-weight: 300; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(71, 85, 105, 0.4);
          cursor: pointer; z-index: 99; transition: transform 0.15s;
        }
        .fab-btn:hover { transform: scale(1.06); background: #334155; }

        /* 彈窗樣式 (Drawer 風格) */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.4); z-index: 1000;
          display: flex; justify-content: center; align-items: flex-end;
        }
        .modal-content {
          background: #fbfcfe; width: 100%; max-width: 480px;
          border-radius: 24px 24px 0 0; padding: 18px 20px 24px 20px;
          box-shadow: 0 -8px 24px rgba(0,0,0,0.12);
          max-height: 92vh; overflow-y: auto;
        }

        .modal-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
        }
        .back-btn { background: none; border: none; font-size: 22px; cursor: pointer; color: #334155; }
        .modal-title { font-size: 17px; font-weight: 700; color: #1e293b; }
        .quick-add-btn {
          width: 34px; height: 34px; border-radius: 50%; border: none;
          background: #f1f5f9; font-size: 14px; font-weight: 700; color: #334155; cursor: pointer;
        }

        .input-group-clean {
          display: flex; align-items: center; border-bottom: 1.5px solid #e2e8f0;
          padding: 8px 0; margin-bottom: 8px;
        }
        .name-big-input {
          flex: 1; border: none; background: transparent; font-size: 20px;
          font-weight: 600; color: #334155; outline: none;
        }
        .paperclip-icon { font-size: 18px; color: #475569; }

        .date-row { margin-bottom: 14px; }
        .datetime-input {
          border: none; background: transparent; font-size: 13px;
          color: #475569; outline: none; font-weight: 500;
        }

        /* 大金額卡片 */
        .amount-card {
          display: flex; align-items: center; background: #ffffff;
          border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 10px 14px; gap: 10px; margin-bottom: 16px;
        }
        .sign-circle {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800; color: #ffffff; flex-shrink: 0;
        }
        .sign-circle.minus { background: #f43f5e; }
        .sign-circle.plus { background: #10b981; }
        .amount-big-input {
          flex: 1; border: none; outline: none; font-size: 26px;
          font-weight: 700; font-family: monospace; color: #1e293b;
        }
        .calc-icon { font-size: 18px; color: #475569; }
        .curr-badge-btn {
          background: #475569; color: #ffffff; padding: 4px 10px;
          border-radius: 12px; font-size: 12px; font-weight: 700;
        }

        /* 實時匯率區域 */
        .exchange-info-box {
          background: #f8fafc; border-radius: 12px; padding: 10px 14px;
          margin-bottom: 16px; font-size: 12px; color: #475569;
        }
        .exchange-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 13px; color: #334155; }
        .exchange-details p { margin: 2px 0; font-family: monospace; }

        /* 分類與賬戶選擇 */
        .picker-section { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .picker-row {
          display: flex; justify-content: space-between; align-items: center;
          background: #ffffff; border: 1px solid #f1f5f9; border-radius: 10px;
          padding: 8px 12px;
        }
        .picker-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #475569; }
        .picker-select {
          border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 10px;
          font-size: 13px; outline: none; max-width: 220px; background: #fff;
        }

        /* 底部欄 */
        .modal-bottom-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .type-pills-bar {
          flex: 1; display: flex; background: #e2e8f0; border-radius: 20px; padding: 4px; gap: 4px;
        }
        .type-pill-btn {
          flex: 1; border: none; background: transparent; padding: 8px 0;
          border-radius: 16px; font-size: 14px; font-weight: 600;
          color: #64748b; cursor: pointer; transition: all 0.15s;
        }
        .type-pill-btn.active-exp { background: #f43f5e; color: #ffffff; }
        .type-pill-btn.active-inc { background: #10b981; color: #ffffff; }
        .type-pill-btn.active-trans { background: #3b82f6; color: #ffffff; }

        .save-btn-green {
          width: 52px; height: 46px; border-radius: 14px; border: none;
          background: #10b981; color: #ffffff; font-size: 22px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);
        }
        .save-btn-green:hover { background: #059669; }

        .tx-empty { text-align: center; padding: 40px 0; color: #94a3b8; }
      `}</style>
    </div>
  );
};
