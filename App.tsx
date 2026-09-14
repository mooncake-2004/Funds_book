// App.tsx
// 主裝配總裝車間：完整集成導航、設置、賬戶資產看板與交易明細流水

import React, { useState } from 'react';
import { Settings } from './Settings';
import { Navbar, TabType } from './Navbar';
import { Accounts } from './Accounts';
import { Transactions } from './Transactions';

export default function App() {
  // 默認選中「明細」或「綜合」
  const [currentTab, setCurrentTab] = useState<TabType>('TRANSACTIONS');

  return (
    <div className="app-layout">
      {/* 1. 自適應導航條 */}
      <Navbar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* 2. 主內容區域 */}
      <main className="main-content">
        {currentTab === 'SETTINGS' && <Settings />}
        {currentTab === 'ACCOUNTS' && <Accounts />}
        {currentTab === 'TRANSACTIONS' && <Transactions />}

        {/* 其它尚未開發的模塊，才展示白底卡片和文字提示 */}
        {currentTab !== 'SETTINGS' &&
          currentTab !== 'ACCOUNTS' &&
          currentTab !== 'TRANSACTIONS' && (
            <div className="content-card">
              <p>
                {currentTab === 'DASHBOARD_COMPUTER' && '👉 這裡是電腦版大盤看板！'}
                {currentTab === 'DASHBOARD_MOBILE' && '👉 這裡是手機版大盤速覽！'}
                {currentTab === 'AI_RECORD' && '👉 這裡是 AI 記賬快速輸入！'}
                {currentTab === 'BUDGETS' && '👉 這裡是預算管理！'}
                {currentTab === 'SAVINGS' && '👉 這裡是應急資金 / 機動池！'}
                {currentTab === 'ANALYTICS' && '👉 這裡是報表分析！'}
              </p>
            </div>
          )}
      </main>

      {/* 佈局適配樣式 */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

        body { background-color: #f1f5f9; }

        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .main-content {
          flex: 1;
          padding: 16px;
        }

        .content-card {
          background: #ffffff;
          padding: 30px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        @media (min-width: 768px) {
          .app-layout {
            flex-direction: row;
          }
          .main-content {
            margin-left: 220px;
            padding: 32px;
          }
        }
      `}</style>
    </div>
  );
}
