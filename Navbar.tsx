// Navbar.tsx
// 自適應雙軌導航：手機端與電腦端擁有完全獨立的菜單項和佈局

import React from 'react';

// 1. 定義系統可能涉及的所有頁面標籤
export type TabType = 
  | 'DASHBOARD_COMPUTER' // 綜合大盤 (電腦專屬)
  | 'DASHBOARD_MOBILE'   // 綜合速覽 (手機專屬)
  | 'ANALYTICS'          // 深度趨勢分析 (電腦專屬)
  | 'TRANSACTIONS'       // 流水清單 (兩端都有)
  | 'AI_RECORD'          // 快速記賬 (手機主打)
  | 'ACCOUNTS'           // 賬戶資產
  | 'BUDGETS'            // 預算管理
  | 'SAVINGS'            // 應急資金 / 機動池
  | 'SETTINGS';          // 系統設置

// 2. 📱【手機端專屬菜單】：符合你平時習慣的高頻功能
const MOBILE_NAV_ITEMS: { id: TabType; label: string }[] = [
  { id: 'DASHBOARD_MOBILE', label: '綜合' },
  { id: 'AI_RECORD', label: 'AI' },
  { id: 'TRANSACTIONS', label: '明細' },
  { id: 'ACCOUNTS', label: '賬戶' },
  { id: 'BUDGETS', label: '預算' },
  { id: 'SETTINGS', label: '設置' },
];

// 3. 💻【電腦端專屬菜單】：完整財務工作台，左側展開
const DESKTOP_NAV_ITEMS: { id: TabType; label: string; icon: string }[] = [
  { id: 'DASHBOARD_COMPUTER', label: '綜合', icon: '📊' },
  { id: 'TRANSACTIONS', label: '明細', icon: '📝' },
  { id: 'ACCOUNTS', label: '賬戶', icon: '💳' },
  { id: 'ANALYTICS', label: '報表', icon: '📈' },
  { id: 'SAVINGS', label: '應急', icon: '🏦' }, 
  { id: 'BUDGETS', label: '預算', icon: '🎯' },  
  { id: 'SETTINGS', label: '設置', icon: '⚙️' },
];

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <>
      {/* ============================================================ */}
      {/* 📱 手機端導航：純文字膠囊，只遍歷 MOBILE_NAV_ITEMS */}
      {/* ============================================================ */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`mobile-tab-btn ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ============================================================ */}
      {/* 💻 電腦端導航：左側完整側邊欄，只遍歷 DESKTOP_NAV_ITEMS */}
      {/* ============================================================ */}
      <aside className="desktop-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">💰</span>
          <span className="logo-text">我的錢錢</span>
        </div>

        <div className="sidebar-items">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`sidebar-btn ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 樣式控制：手機下只顯 mobile-nav，電腦下只顯 desktop-sidebar */}
      {/* ============================================================ */}
      <style>{`
        /* 1. 默認手機屏幕 (< 768px) */
        .mobile-nav {
          display: flex;
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          background-color: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 10px 16px;
          z-index: 100;
        }

        .mobile-nav-items {
          display: flex;
          gap: 12px;
          width: 100%;
          justify-content: space-around;
        }

        .mobile-tab-btn {
          flex: 1;
          padding: 8px 0;
          border: none;
          background: transparent;
          border-radius: 20px;
          font-size: 14px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .mobile-tab-btn.active {
          background-color: #b45309; /* 琥珀棕膠囊高亮 */
          color: #ffffff;
          font-weight: 600;
        }

        /* 手機端把電腦側邊欄徹底隱藏 */
        .desktop-sidebar {
          display: none;
        }

        /* 2. 電腦屏幕 (>= 768px) */
        @media (min-width: 768px) {
          /* 電腦端把手機頂部導航徹底隱藏 */
          .mobile-nav {
            display: none;
          }

          /* 電腦側邊欄展開顯示 */
          .desktop-sidebar {
            display: flex;
            flex-direction: column;
            width: 220px;
            height: 100vh;
            background-color: #f8fafc;
            border-right: 1px solid #e2e8f0;
            padding: 24px 12px;
            position: fixed;
            left: 0;
            top: 0;
            box-sizing: border-box;
          }

          .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 24px;
            padding-left: 8px;
          }

          .sidebar-items {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .sidebar-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            border: none;
            background: transparent;
            border-radius: 8px;
            font-size: 14px;
            color: #475569;
            cursor: pointer;
            text-align: left;
            transition: background 0.15s;
          }

          .sidebar-btn:hover:not(.active) {
            background-color: #e2e8f0;
          }

          .sidebar-btn.active {
            background-color: #b45309;
            color: #ffffff;
            font-weight: 600;
          }
        }
      `}</style>
    </>
  );
};
