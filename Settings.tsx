// Settings.tsx
// 設置中心：無多餘冗餘標題，直接以緊湊二級標籤切換各設置模塊

import React, { useState } from 'react';
import { CategoryManager } from './CategoryManager';

type SettingSubTab = 'CATEGORIES' | 'ACCOUNT_TYPES' | 'CURRENCY';

export const Settings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SettingSubTab>('CATEGORIES');

  return (
    <div className="settings-wrapper">
      {/* 頂部直接展示緊湊切換按鈕 */}
      <div className="sub-nav-tabs">
        <button
          className={`sub-tab-btn ${activeSubTab === 'CATEGORIES' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('CATEGORIES')}
        >
          分類
        </button>
        <button
          className={`sub-tab-btn ${activeSubTab === 'ACCOUNT_TYPES' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('ACCOUNT_TYPES')}
        >
          賬戶
        </button>
        <button
          className={`sub-tab-btn ${activeSubTab === 'CURRENCY' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('CURRENCY')}
        >
          幣種與匯率
        </button>
      </div>

      {/* 模塊內容區 */}
      <div className="settings-content-body">
        {/* 1. 分類管理 */}
        {activeSubTab === 'CATEGORIES' && <CategoryManager />}

        {/* 2. 賬戶管理 */}
        {activeSubTab === 'ACCOUNT_TYPES' && (
          <div className="placeholder-box">
            <h3>🏛️ 賬戶資產大類管理</h3>
            <p>（即將在此配置：流動資金、投資資產、負債類別與順序）</p>
          </div>
        )}

        {/* 3. 幣種與匯率 */}
        {activeSubTab === 'CURRENCY' && (
          <div className="placeholder-box">
            <h3>💱 本位幣與匯率聯網</h3>
            <p>（當前本位幣：HKD，支持實時刷新世界貨幣匯率）</p>
          </div>
        )}
      </div>

      <style>{`
        .settings-wrapper {
          max-width: 800px;
          margin: 0 auto;
        }

        .sub-nav-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 20px;
        }

        .sub-tab-btn {
          padding: 6px 16px;
          border: none;
          background: transparent;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sub-tab-btn:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }

        .sub-tab-btn.active {
          background-color: #b45309;
          color: #ffffff;
        }

        .placeholder-box {
          background: #ffffff;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 60px 20px;
          text-align: center;
          color: #64748b;
        }

        .placeholder-box h3 {
          margin-bottom: 8px;
          color: #334155;
        }
      `}</style>
    </div>
  );
};
