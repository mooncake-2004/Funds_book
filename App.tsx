// App.tsx
// 這是我們整個應用的「主舞台/總裝車間」

import React, { useState } from 'react';
import { Settings } from './Settings';
import { Navbar, TabType } from './Navbar';
import { Accounts } from './Accounts';

export default function App() {
  // 記錄當前選中了哪個 Tab，默認先選中手機端或電腦端的「綜合」
  const [currentTab, setCurrentTab] = useState<TabType>('DASHBOARD_COMPUTER');

  return (
    <div className="app-layout">
      {/* 1. 我們的自適應導航條（手機在頂部，電腦在左側） */}
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

  {/* 2. 主內容區域 */}
  <main className="main-content">
    {currentTab === 'SETTINGS' && <Settings />}
    {currentTab === 'ACCOUNTS' && <Accounts />}

    {/* 排除已完成的 SETTINGS 和 ACCOUNTS，其它尚未開發的模塊才顯示佔位卡片 */}
    {currentTab !== 'SETTINGS' && currentTab !== 'ACCOUNTS' && (
      <div className="content-card">
        <p>
          {currentTab === 'DASHBOARD_COMPUTER' && '👉 這裡是電腦版大盤看板！'}
          {currentTab === 'DASHBOARD_MOBILE' && '👉 這裡是手機版大盤速覽！'}
          {currentTab === 'TRANSACTIONS' && '👉 這裡是交易明細列表！'}
          {currentTab === 'AI_RECORD' && '👉 這裡是 AI 記賬快速輸入！'}
          {currentTab === 'BUDGETS' && '👉 這裡是預算管理！'}
          {currentTab === 'SAVINGS' && '👉 這裡是應急資金 / 機動池！'}
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
          padding: 20px;
        }

        .content-card {
          background: #ffffff;
          padding: 30px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        /* 電腦屏幕下，把主內容向右推開 220px，留出空間給左側側邊欄 */
        @media (min-width: 768px) {
          .app-layout {
            flex-direction: row;
          }
          .main-content {
            margin-left: 220px; /* 與側邊欄寬度一致 */
            padding: 40px;
          }
        }
      `}</style>
    </div>
  );
}
