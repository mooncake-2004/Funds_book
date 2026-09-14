// Settings.tsx
// 設置中心總入口：集成分類管理、賬戶大類管理等模塊

import React, { useState } from 'react';
import { CategoryManager } from './CategoryManager';

// 定義設置頁面的內部導航標籤
type SettingSubTab = 'CATEGORIES' | 'ACCOUNT_TYPES' | 'CURRENCY';

export const Settings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SettingSubTab>('CATEGORIES');

  return (
    <div className="settings-wrapper">
      <div className="settings-header">
        <h2 className="settings-main-title">⚙️ 系統設置</h2>
        <p className="settings-desc">自定義你的收支分類、賬戶體系與本位幣規則</p>
      </div>

      {/* 設置頁面內部的橫向切換分頁 */}
      <div className="sub-nav-tabs">
        <button
          className={`sub-tab-btn ${activeSubTab === 'CATEGORIES' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('CATEGORIES')}
        >
          🏷️ 收支分類
        </button>
        <button
          className={`sub-tab-btn ${activeSubTab === 'ACCOUNT_TYPES' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('ACCOUNT_TYPES')}
        >
          🏛️ 賬戶大類
        </button>
        <button
          className={`sub-tab-btn ${activeSubTab === 'CURRENCY' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('CURRENCY')}
        >
          💱 幣種與匯率
        </button>
      </div>

      {/* 內容展示區 */}
      <div className="settings-content-body">
        {/* 1. 收支分類管理模塊（就是我們剛寫好的強大組件！） */}
        {activeSubTab === 'CATEGORIES' && <CategoryManager />}

        {/* 2. 賬戶大類模塊（下個階段即將解鎖） */}
        {activeSubTab === 'ACCOUNT_TYPES' && (
          <div className="placeholder-box">
            <h3>🏛️ 賬戶資產大類管理</h3>
            <p>（即將在此配置：流動資金、投資資產、負債類別與順序）</p>
          </div>
        )}

        {/* 3. 幣種與匯率（下個階段即將解鎖） */}
        {activeSubTab === 'CURRENCY' && (
          <div className="placeholder-box">
            <h3>💱 本位幣與匯率聯網</h3>
            <p>（當前本位幣：HKD，支持實時刷新世界貨幣匯率）</p>
          </div>
        )}
      </div>

      {/* 精緻簡約的樣式 */}
      <style>{`
        .settings-wrapper {
          max-width: 800px;
          margin: 0 auto;
        }

        .settings-header {
          margin-bottom: 20px;
        }

        .settings-main-title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .settings-desc {
          font-size: 14px;
          color: #64748b;
        }

        .sub-nav-tabs {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 24px;
        }

        .sub-tab-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
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

        .settings-content-body {
          animation: fadeIn 0.2s ease-in-out;
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

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
