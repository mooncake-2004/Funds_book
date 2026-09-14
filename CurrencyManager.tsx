// CurrencyManager.tsx
// 幣種與實時匯率管理器：支持免 Key 免費聯網拉取最新外匯牌價、手動微調匯率、實時聯動全應用

import React, { useState, useEffect } from 'react';

export interface CurrencyRate {
  code: string;       // 幣種代碼 (如 USD, CNY, JPY, GBP)
  name: string;       // 幣種名稱 (如 美元, 人民幣)
  rateToHKD: number;  // 1 該貨幣 = 多少 HKD (例如 1 USD = 7.82 HKD, 1 CNY = 1.085 HKD)
  symbol: string;     // 貨幣符號 ($ , ¥, £)
  lastUpdated?: string;
}

// 預設常用貨幣基準
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

  // 聯網加載狀態
  const [isLoading, setIsLoading] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<string | null>(null);

  // 手動編輯單個匯率
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState('');

  // ============================================================
  // 核心功能：免費聯網拉取即時真實外匯牌價 (以 HKD 為基準)
  // ============================================================
  const fetchLiveRates = async () => {
    setIsLoading(true);
    setFetchMsg(null);
    try {
      // 調用全球開源公共匯率 API (基準為 HKD)
      const res = await fetch('https://open.er-api.com/v6/latest/HKD');
      const data = await res.json();

      if (data && data.rates) {
        const timeStr = new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });

        setCurrencies((prev) =>
          prev.map((c) => {
            if (c.code === 'HKD') return { ...c, lastUpdated: '基準本位幣' };
            
            // open.er-api 返回的是 1 HKD = X 外幣，所以 1 外幣 = 1 / X HKD
            const foreignRateAgainstHKD = data.rates[c.code];
            if (foreignRateAgainstHKD) {
              const directRate = 1 / foreignRateAgainstHKD; // 換算成 1 該貨幣 = 多少 HKD
              // 保留四位小數
              const formattedRate = Math.round(directRate * 10000) / 10000;
              return {
                ...c,
                rateToHKD: formattedRate,
                lastUpdated: `今日 ${timeStr} 聯網更新`,
              };
            }
            return c;
          })
        );

        // 同步更新具體賬戶 (Accounts) 裡的外幣折算總額！
        syncAccountsBaseBalance(data.rates);

        setFetchMsg('✅ 實時匯率已更新並同步至全系統！');
      } else {
        setFetchMsg('⚠️ 獲取匯率數據格式有誤');
      }
    } catch (err) {
      setFetchMsg('❌ 聯網失敗，請檢查網絡連接');
    } finally {
      setIsLoading(false);
    }
  };

  // 同步更新賬戶表裡的匯率和 baseBalance
  const syncAccountsBaseBalance = (liveRates: { [key: string]: number }) => {
    const savedAccounts = localStorage.getItem('MY_LEDGER_ACCOUNTS_V3');
    if (!savedAccounts) return;
    try {
      const accList = JSON.parse(savedAccounts);
      const updated = accList.map((a: any) => {
        if (a.currency === 'HKD') return a;
        const rateAgainstHKD = liveRates[a.currency];
        if (rateAgainstHKD) {
          const directRate = Math.round((1 / rateAgainstHKD) * 10000) / 10000;
          return {
            ...a,
            exchangeRate: directRate,
            baseBalance: a.balance * directRate,
          };
        }
        return a;
      });
      localStorage.setItem('MY_LEDGER_ACCOUNTS_V3', JSON.stringify(updated));
    } catch (e) {}
  };

  // 手動保存修改後的固定匯率
  const handleSaveManualRate = (code: string) => {
    const num = parseFloat(tempRate);
    if (isNaN(num) || num <= 0) return;

    setCurrencies((prev) =>
      prev.map((c) =>
        c.code === code
          ? { ...c, rateToHKD: num, lastUpdated: '手動自定義固定' }
          : c
      )
    );
    setEditingCode(null);
  };

  return (
    <div className="currency-manager">
      {/* 頂部操作卡片 */}
      <div className="currency-header-card">
        <div>
          <h3 className="card-title">💱 實時外匯牌價中心</h3>
          <p className="card-subtitle">本位幣：<strong>港幣 (HKD)</strong> · 所有資產均折算為 HKD 統計</p>
        </div>
        <button
          onClick={fetchLiveRates}
          disabled={isLoading}
          className={`refresh-btn ${isLoading ? 'loading' : ''}`}
        >
          {isLoading ? '🔄 聯網拉取中...' : '⚡️ 刷新最新實時匯率'}
        </button>
      </div>

      {fetchMsg && (
        <div className={`status-banner ${fetchMsg.includes('✅') ? 'success' : 'warn'}`}>
          {fetchMsg}
        </div>
      )}

      {/* 貨幣匯率卡片網格 */}
      <div className="rates-grid">
        {currencies.map((curr) => (
          <div key={curr.code} className={`rate-card ${curr.code === 'HKD' ? 'base-card' : ''}`}>
            <div className="card-top">
              <span className="currency-code-badge">{curr.code}</span>
              <strong className="currency-name">{curr.name}</strong>
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
          margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .card-title { font-size: 17px; color: #0f172a; margin-bottom: 4px; }
        .card-subtitle { font-size: 13px; color: #64748b; }
        .refresh-btn {
          padding: 10px 18px; background: #0284c7; color: #ffffff; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .refresh-btn:hover:not(.loading) { background: #0369a1; transform: translateY(-1px); }
        .refresh-btn.loading { opacity: 0.7; cursor: wait; }

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

        .card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .currency-code-badge {
          background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 700;
          padding: 2px 6px; border-radius: 4px;
        }
        .currency-name { font-size: 14px; color: #334155; }

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
