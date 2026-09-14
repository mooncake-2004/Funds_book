// CurrencyManager.tsx
// 實時外匯牌價中心：支持自由添加全世界任意貨幣、免 Key 實時聯網更新、手動覆蓋

import React, { useState, useEffect } from 'react';

export interface CurrencyRate {
  code: string;       // 幣種代碼 (如 USD, CNY, JPY, THB, GBP)
  name: string;       // 幣種名稱 (如 美元, 泰銖)
  rateToHKD: number;  // 1 該貨幣 = 多少 HKD
  symbol: string;     // 貨幣符號
  lastUpdated?: string;
}

const DEFAULT_CURRENCIES: CurrencyRate[] = [
  { code: 'HKD', name: '港幣 (本位幣)', rateToHKD: 1.0, symbol: 'HK$', lastUpdated: '基準本位幣' },
  { code: 'USD', name: '美元', rateToHKD: 7.82, symbol: '$', lastUpdated: '預設參考' },
  { code: 'CNY', name: '人民幣', rateToHKD: 1.085, symbol: '¥', lastUpdated: '預設參考' },
  { code: 'JPY', name: '日元', rateToHKD: 0.052, symbol: '¥', lastUpdated: '預設參考' },
  { code: 'EUR', name: '歐元', rateToHKD: 8.52, symbol: '€', lastUpdated: '預設參考' },
  { code: 'GBP', name: '英鎊', rateToHKD: 10.15, symbol: '£', lastUpdated: '預設參考' },
];

export const CurrencyManager: React.FC = () => {
  const [currencies, setCurrencies] = useState<CurrencyRate[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_CURRENCY_RATES');
    return saved ? JSON.parse(saved) : DEFAULT_CURRENCIES;
  });

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_CURRENCY_RATES', JSON.stringify(currencies));
  }, [currencies]);

  const [isLoading, setIsLoading] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);

  // 手動編輯匯率狀態
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState('');

  // 新增幣種狀態
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  // 聯網拉取實時牌價
  const fetchLiveRates = async () => {
    setIsLoading(true);
    setFetchMsg(null);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/HKD');
      const data = await res.json();

      if (data && data.rates) {
        const timeStr = new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });

        setCurrencies((prev) =>
          prev.map((c) => {
            if (c.code === 'HKD') return { ...c, lastUpdated: '基準本位幣' };
            const foreignRate = data.rates[c.code];
            if (foreignRate) {
              const directRate = Math.round((1 / foreignRate) * 10000) / 10000;
              return { ...c, rateToHKD: directRate, lastUpdated: `今日 ${timeStr} 聯網更新` };
            }
            return c;
          })
        );
        syncAccountsBaseBalance(data.rates);
        setFetchMsg('✅ 實時匯率已更新並同步至全系統！');
      }
    } catch (err) {
      setFetchMsg('❌ 聯網失敗，請檢查網絡連接');
    } finally {
      setIsLoading(false);
    }
  };

  const syncAccountsBaseBalance = (liveRates: { [key: string]: number }) => {
    const savedAccounts = localStorage.getItem('MY_LEDGER_ACCOUNTS_V3');
    if (!savedAccounts) return;
    try {
      const accList = JSON.parse(savedAccounts);
      const updated = accList.map((a: any) => {
        if (a.currency === 'HKD') return a;
        const rate = liveRates[a.currency];
        if (rate) {
          const directRate = Math.round((1 / rate) * 10000) / 10000;
          return { ...a, exchangeRate: directRate, baseBalance: a.balance * directRate };
        }
        return a;
      });
      localStorage.setItem('MY_LEDGER_ACCOUNTS_V3', JSON.stringify(updated));
    } catch (e) {}
  };

  // 保存手動修改的匯率
  const handleSaveManualRate = (code: string) => {
    const num = parseFloat(tempRate);
    if (isNaN(num) || num <= 0) return;
    setCurrencies((prev) =>
      prev.map((c) => (c.code === code ? { ...c, rateToHKD: num, lastUpdated: '手動自定義固定' } : c))
    );
    setEditingCode(null);
  };

  // 添加全新幣種（自動聯網查出它的最新匯率！）
  const handleAddNewCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeUpper = newCode.trim().toUpperCase();
    if (!codeUpper) return;

    if (currencies.some((c) => c.code === codeUpper)) {
      alert('該貨幣已存在！');
      return;
    }

    setIsLoading(true);
    try {
      // 聯網查一下這個新幣種的即時匯率
      const res = await fetch('https://open.er-api.com/v6/latest/HKD');
      const data = await res.json();
      let initRate = 1.0;
      if (data && data.rates && data.rates[codeUpper]) {
        initRate = Math.round((1 / data.rates[codeUpper]) * 10000) / 10000;
      }

      const newCurrencyItem: CurrencyRate = {
        code: codeUpper,
        name: newName.trim() || codeUpper,
        rateToHKD: initRate,
        symbol: codeUpper,
        lastUpdated: '今日聯網新增',
      };

      setCurrencies([...currencies, newCurrencyItem]);
      setIsAdding(false);
      setNewCode('');
      setNewName('');
      setFetchMsg(`✅ 成功添加新幣種 ${codeUpper}，實時匯率為 ${initRate} HKD`);
    } catch (e) {
      alert('添加失敗，請檢查貨幣代碼是否正確');
    } finally {
      setIsLoading(false);
    }
  };

  // 刪除自定義貨幣
  const handleDeleteCurrency = (code: string) => {
    if (code === 'HKD' || code === 'USD' || code === 'CNY') {
      alert('常用核心貨幣不建議刪除');
      return;
    }
    if (confirm(`確定要移除 ${code} 嗎？`)) {
      setCurrencies(currencies.filter((c) => c.code !== code));
    }
  };

  return (
    <div className="currency-manager">
      <div className="currency-header-card">
        <div>
          <h3 className="card-title">💱 實時外匯牌價中心</h3>
          <p className="card-subtitle">本位幣：<strong>港幣 (HKD)</strong> · 支持添加世界各國貨幣</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setIsAdding(!isAdding)} className="add-curr-btn">
            {isAdding ? '取消' : '+ 添加幣種'}
          </button>
          <button onClick={fetchLiveRates} disabled={isLoading} className="refresh-btn">
            {isLoading ? '🔄 拉取中...' : '⚡️ 刷新實時匯率'}
          </button>
        </div>
      </div>

      {fetchMsg && (
        <div className={`status-banner ${fetchMsg.includes('✅') ? 'success' : 'warn'}`}>
          {fetchMsg}
        </div>
      )}

      {/* 新增幣種彈框 */}
      {isAdding && (
        <form onSubmit={handleAddNewCurrency} className="add-curr-form">
          <input
            type="text"
            placeholder="貨幣代碼 (如 THB, CAD, AUD, KRW)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="input-code"
            maxLength={5}
            autoFocus
          />
          <input
            type="text"
            placeholder="顯示名稱 (如: 泰銖, 加幣)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input-name"
          />
          <button type="submit" disabled={isLoading} className="btn-confirm-add">
            {isLoading ? '查詢中...' : '確認並自動獲取匯率'}
          </button>
        </form>
      )}

      {/* 貨幣匯率卡片網格 */}
      <div className="rates-grid">
        {currencies.map((curr) => (
          <div key={curr.code} className={`rate-card ${curr.code === 'HKD' ? 'base-card' : ''}`}>
            <div className="card-top">
              <span className="currency-code-badge">{curr.code}</span>
              <strong className="currency-name">{curr.name}</strong>
              {curr.code !== 'HKD' && curr.code !== 'USD' && curr.code !== 'CNY' && (
                <button
                  onClick={() => handleDeleteCurrency(curr.code)}
                  className="del-curr-btn"
                  title="刪除"
                >
                  ×
                </button>
              )}
            </div>

            <div className="card-middle">
              {editingCode === curr.code ? (
                <div className="edit-rate-row">
                  <span className="rate-prefix">1 {curr.code} =</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    className="rate-input"
                    autoFocus
                  />
                  <span className="rate-suffix">HKD</span>
                  <button onClick={() => handleSaveManualRate(curr.code)} className="btn-ok">✓</button>
                  <button onClick={() => setEditingCode(null)} className="btn-cancel">×</button>
                </div>
              ) : (
                <div
                  className="rate-display"
                  onClick={() => {
                    if (curr.code !== 'HKD') {
                      setEditingCode(curr.code);
                      setTempRate(curr.rateToHKD.toString());
                    }
                  }}
                  title={curr.code !== 'HKD' ? '點擊手動修改自定義匯率' : ''}
                >
                  <div className="rate-equation">
                    <span className="unit-label">1 {curr.code} =</span>
                    <strong className="rate-val">{curr.rateToHKD}</strong>
                    <span className="unit-label">HKD</span>
                    {curr.code !== 'HKD' && <span className="edit-pencil">✏️</span>}
                  </div>
                </div>
              )}
            </div>

            <div className="card-bottom">
              <span className="update-tag">{curr.lastUpdated}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .currency-manager { max-width: 750px; margin: 0 auto; }
        .currency-header-card {
          background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 18px 20px; display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px;
        }
        .card-title { font-size: 17px; color: #0f172a; margin-bottom: 4px; }
        .card-subtitle { font-size: 13px; color: #64748b; }
        .header-actions { display: flex; gap: 8px; }
        .add-curr-btn {
          padding: 8px 14px; background: #ffffff; border: 1px solid #cbd5e1;
          color: #334155; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .add-curr-btn:hover { background: #f8fafc; border-color: #94a3b8; }
        .refresh-btn {
          padding: 8px 16px; background: #0284c7; color: #ffffff; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .refresh-btn:hover { background: #0369a1; }

        .add-curr-form {
          background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px;
          padding: 12px; margin-bottom: 16px; display: flex; gap: 8px; align-items: center;
        }
        .input-code { width: 140px; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; text-transform: uppercase; }
        .input-name { flex: 1; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; }
        .btn-confirm-add {
          padding: 8px 16px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;
        }

        .status-banner {
          padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; margin-bottom: 16px;
        }
        .status-banner.success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .status-banner.warn { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

        .rates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .rate-card {
          background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;
          padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between;
        }
        .rate-card.base-card { border-left: 4px solid #3b82f6; background: #f8fafc; }

        .card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; position: relative; }
        .currency-code-badge {
          background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
        }
        .currency-name { font-size: 14px; color: #334155; }
        .del-curr-btn {
          margin-left: auto; background: none; border: none; font-size: 16px; color: #94a3b8; cursor: pointer;
        }
        .del-curr-btn:hover { color: #ef4444; }

        .rate-display { cursor: pointer; padding: 4px 0; }
        .rate-equation { display: flex; align-items: baseline; gap: 4px; }
        .unit-label { font-size: 13px; color: #64748b; }
        .rate-val { font-size: 20px; color: #0284c7; font-family: monospace; }
        .edit-pencil { font-size: 11px; opacity: 0.5; margin-left: 4px; }
        .rate-display:hover .edit-pencil { opacity: 1; }

        .edit-rate-row { display: flex; align-items: center; gap: 4px; font-size: 13px; }
        .rate-input { width: 75px; padding: 3px 6px; font-size: 14px; border: 1px solid #0284c7; border-radius: 4px; }
        .btn-ok { background: #10b981; color: #fff; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer; }
        .btn-cancel { background: #94a3b8; color: #fff; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer; }

        .card-bottom { margin-top: 10px; border-top: 1px solid #f1f5f9; padding-top: 6px; }
        .update-tag { font-size: 11px; color: #94a3b8; }
      `}</style>
    </div>
  );
};
