//「數據規格說明書」

// 1. 交易底層基本類型
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'ADJUSTMENT';

// 2. 【動態自定義】賬戶大類
export interface AccountCategory {
  id: string;               // 唯一ID
  name: string;             // 名稱
  icon?: string;            // 圖標
  order: number;            // 排序 
  isLiability: boolean;     // 是否為負債類
  parentId?: string | null; // 👈 父級ID：null 代表一級大類；有值代表是它的二級子類！
}

// 3. 具體賬戶規格（支持多幣種餘額與自動折合本位幣）
export interface Account {
  id: string;               // 賬戶唯一ID
  name: string;             // 賬戶名稱
  categoryId: string;       // 關聯到賬戶大類的 ID
  
  // --- 賬戶金額與匯率 ---
  currency: string;         // 該賬戶幣種，例如 "CNY"、"JPY"、"HKD"
  balance: number;          // 該賬戶原始幣種當前餘額
  exchangeRate: number;     // 當前對 HKD 的最新參考匯率
  baseBalance: number;      // 折合本位幣 (HKD) 餘額
}

// 4. 【動態自定義】收支分類（可在頁面自由增刪改）
export interface Category {
  id: string;               // 分類ID
  name: string;             // 分類名稱
  type: TransactionType;    
  icon?: string;            // 圖標
  order: number;            // 排序權重
  parentId?: string | null; // 👈 父級分類ID
}

// 5. 一筆交易（賬單）的核心結構
export interface Transaction {
  id: string;               // 唯一編號
  date: string;             // 記賬時間）
  type: TransactionType;    // 交易性質
  
  // --- 金額核心規則：純靠符號決定流向 ---
  // 正數 (+)：錢增加
  // 負數 (-)：錢減少
  amount: number;           // 原始交易金額
  currency: string;         // 幣種（"HKD", "CNY", "JPY" 等）
  exchangeRate: number;     // 當時對 HKD 匯率（本位幣為 1.0）
  baseAmount: number;       // 折合 HKD 總額 = amount * exchangeRate

  // --- 分類與用途 ---
  categoryId: string;       // 關聯收支分類 ID
  
  // --- 賬戶流向 ---
  account: string;          // 扣款/收款賬戶（轉賬時代表【轉出賬戶】）
  toAccount?: string;       // 【選填】轉賬專用：代表【轉入賬戶】
  
  // --- 備註與原始輸入 ---
  note: string;             // 備註說明
  rawText?: string;         // 【AI專用】用戶原始說的話
}

// 6. AI 解析用戶話語時提取的草稿格式
export interface ParsedBill {
  type: TransactionType;
  amount: number;           // 負數代表支出，正數代表收入
  currency: string;
  category: string;         // AI 提取的分類名稱（例如 "餐飲"）
  account: string;          // 提取的賬戶名稱
  toAccount?: string;       // 提取的轉入賬戶
  date: string;
  note: string;             // 提取的備註
  exchangeRate?: number;
}
