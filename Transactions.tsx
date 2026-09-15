// Transactions.tsx
// 交易流水與全屏快捷記賬：嚴格賬戶隔離回滾(已修復審核Bug)、同幣種轉賬1:1精準對等、Notes備註框、名稱智能記憶快照、純淨幣種膠囊、存摺動態餘額

import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Account, Category, AccountCategory, TransactionType, TransactionSplit } from './types';
import { CurrencyRate } from './CurrencyManager';

const MASTER_CATEGORIES: Category[] = [
  { id: 'exp_home', name: '家庭', type: 'EXPENSE', icon: '🏡', order: 1, parentId: null },
  { id: 'sub_food_raw', name: '飯飯', type: 'EXPENSE', icon: '🍚', order: 1, parentId: 'exp_home' },
  { id: 'sub_cloth', name: '衣物', type: 'EXPENSE', icon: '👕', order: 2, parentId: 'exp_home' },
  { id: 'sub_med', name: '醫療', type: 'EXPENSE', icon: '💊', order: 3, parentId: 'exp_home' },
  { id: 'sub_ship', name: '集運', type: 'EXPENSE', icon: '📦', order: 4, parentId: 'exp_home' },
  { id: 'sub_study', name: '學習', type: 'EXPENSE', icon: '📚', order: 5, parentId: 'exp_home' },
  { id: 'sub_rr', name: 'R&R', type: 'EXPENSE', icon: '💆', order: 6, parentId: 'exp_home' },
  { id: 'sub_tax', name: 'tax', type: 'EXPENSE', icon: '🏛️', order: 7, parentId: 'exp_home' },

  { id: 'exp_fun', name: '娛樂', type: 'EXPENSE', icon: '🎮', order: 2, parentId: null },
  { id: 'sub_act', name: '活動', type: 'EXPENSE', icon: '🎪', order: 1, parentId: 'exp_fun' },
  { id: 'sub_shop', name: '購物', type: 'EXPENSE', icon: '🛍️', order: 2, parentId: 'exp_fun' },
  { id: 'sub_camp', name: '手工', type: 'EXPENSE', icon: '⛺️', order: 3, parentId: 'exp_fun' },

  { id: 'exp_car', name: '汽車', type: 'EXPENSE', icon: '🚗', order: 3, parentId: null },
  { id: 'sub_trans', name: '交通', type: 'EXPENSE', icon: '🚇', order: 1, parentId: 'exp_car' },

  { id: 'exp_util', name: '公用事業', type: 'EXPENSE', icon: '🔌', order: 4, parentId: null },
  { id: 'sub_water', name: '水費', type: 'EXPENSE', icon: '💧', order: 1, parentId: 'exp_util' },
  { id: 'sub_net', name: '網絡費', type: 'EXPENSE', icon: '📶', order: 2, parentId: 'exp_util' },
  { id: 'sub_power', name: '電費', type: 'EXPENSE', icon: '⚡️', order: 3, parentId: 'exp_util' },
  { id: 'sub_gas', name: '煤氣費', type: 'EXPENSE', icon: '🔥', order: 4, parentId: 'exp_util' },

  { id: 'exp_others', name: '其他支出', type: 'EXPENSE', icon: '💵', order: 5, parentId: null },
  { id: 'exp_mortgage', name: '房貸支出', type: 'EXPENSE', icon: '🏦', order: 1, parentId: 'exp_others' },
  { id: 'exp_management', name: '管理費', type: 'EXPENSE', icon: '🏦', order: 2, parentId: 'exp_others' },
  { id: 'exp_insurance', name: '保險保費', type: 'EXPENSE', icon: '🛡️', order: 3, parentId: 'exp_others' },
  { id: 'exp_gifts', name: '禮物', type: 'EXPENSE', icon: '🎁', order: 4, parentId: 'exp_others' },
  { id: 'exp_others2', name: '其他雜項', type: 'EXPENSE', icon: '🪙', order: 5, parentId: 'exp_others' },
  { id: 'exp_shopback', name: 'shopback', type: 'EXPENSE', icon: '🪙', order: 6, parentId: 'exp_others' },

  { id: 'inc_job', name: '薪資', type: 'INCOME', icon: '💼', order: 1, parentId: null },
  { id: 'inc_sub_salary', name: '工資', type: 'INCOME', icon: '💰', order: 1, parentId: 'inc_job' },
  { id: 'inc_bonus', name: '獎金', type: 'INCOME', icon: '💰', order: 2, parentId: 'inc_job' },
  { id: 'inc_part_time', name: '兼職', type: 'INCOME', icon: '💰', order: 3, parentId: 'inc_job' },

  { id: 'inc_others', name: '其他收入', type: 'INCOME', icon: '⭐', order: 2, parentId: null },
  { id: 'inc_sub_interest', name: '利息收入', type: 'INCOME', icon: '⭐', order: 1, parentId: 'inc_others' },
  { id: 'inc_others2', name: '投資收益', type: 'INCOME', icon: '⭐', order: 2, parentId: 'inc_others' },
];

const MASTER_ACCOUNTS: Account[] = [
  { id: 'acc_zfb_cny', name: '支付寶', categoryId: 'sub_acc_cash_wallet', order: 1, currency: 'CNY', balance: 1855.32, exchangeRate: 1.08, baseBalance: 2003.75 },
  { id: 'acc_wx_cny', name: '微信', categoryId: 'sub_acc_cash_wallet', order: 2, currency: 'CNY', balance: 5303.08, exchangeRate: 1.08, baseBalance: 5727.33 },
  { id: 'acc_hs_hkd_sa', name: 'HS HKD SA', categoryId: 'sub_acc_bank', order: 1, currency: 'HKD', balance: 487833.73, exchangeRate: 1.0, baseBalance: 487833.73 },
  { id: 'acc_hsbc_hkd', name: 'HSBC HKD', categoryId: 'sub_acc_bank', order: 2, currency: 'HKD', balance: 4534.52, exchangeRate: 1.0, baseBalance: 4534.52 },
  { id: 'acc_hs_cny_sa', name: 'HS CNY SA', categoryId: 'sub_acc_bank', order: 3, currency: 'CNY', balance: 262.73, exchangeRate: 1.08, baseBalance: 283.75 },
  { id: 'acc_hs_usd_sa', name: 'HS USD SA', categoryId: 'sub_acc_bank', order: 4, currency: 'USD', balance: 70.54, exchangeRate: 7.82, baseBalance: 551.62 },
  { id: 'acc_abc_cny', name: '農行 CNY', categoryId: 'sub_acc_bank', order: 5, currency: 'CNY', balance: 100419.34, exchangeRate: 1.08, baseBalance: 108452.89 },
  { id: 'acc_ins_cywl', name: '充裕未來(USD)', categoryId: 'sub_acc_insurance', order: 1, currency: 'USD', balance: 76621.79, exchangeRate: 7.82, baseBalance: 599182.40 },
  { id: 'acc_ins_awy', name: '愛無憂(USD)', categoryId: 'sub_acc_insurance', order: 2, currency: 'USD', balance: 36815.15, exchangeRate: 7.82, baseBalance: 287894.47 },
  { id: 'acc_ins_zzf', name: '真智豐(USD)', categoryId: 'sub_acc_insurance', order: 3, currency: 'USD', balance: 14167.75, exchangeRate: 7.82, baseBalance: 110791.81 },
  { id: 'acc_ins_8yr', name: '8年儲速(USD)', categoryId: 'sub_acc_insurance', order: 4, currency: 'USD', balance: 27211.72, exchangeRate: 7.82, baseBalance: 212795.65 },
  { id: 'acc_ins_yd', name: '易達終身保(USD)', categoryId: 'sub_acc_insurance', order: 5, currency: 'USD', balance: 20323.39, exchangeRate: 7.82, baseBalance: 158928.91 },
  { id: 'acc_fund_zy', name: '智悅(本金USD17,000)', categoryId: 'sub_acc_fund', order: 1, currency: 'USD', balance: 17444.19, exchangeRate: 7.82, baseBalance: 136413.57 },
  { id: 'acc_mpf_empf', name: 'eMPF', categoryId: 'sub_acc_mpf', order: 1, currency: 'HKD', balance: 211128.58, exchangeRate: 1.0, baseBalance: 211128.58 },
  { id: 'acc_mpf_pfund', name: 'PFUND', categoryId: 'sub_acc_mpf', order: 2, currency: 'HKD', balance: 23737.85, exchangeRate: 1.0, baseBalance: 23737.85 },
  { id: 'acc_hsbc_usd_inv', name: 'HSBC USD', categoryId: 'sub_acc_invest_bank', order: 1, currency: 'USD', balance: 12000.00, exchangeRate: 7.82, baseBalance: 93840.00 },
  { id: 'acc_hs_usd_inv', name: 'HS USD', categoryId: 'sub_acc_invest_bank', order: 2, currency: 'USD', balance: 2386.46, exchangeRate: 7.82, baseBalance: 18662.12 },
  { id: 'acc_fin_dg', name: '東莞銀行 CNY', categoryId: 'sub_acc_invest_bank', order: 3, currency: 'CNY', balance: 121530.32, exchangeRate: 1.08, baseBalance: 131252.75 },
  { id: 'acc_fin_gf', name: '廣發 CNY', categoryId: 'sub_acc_invest_bank', order: 4, currency: 'CNY', balance: 21008.78, exchangeRate: 1.08, baseBalance: 22689.48 },
  { id: 'acc_fin_lct', name: '理財通 CNY', categoryId: 'sub_acc_invest_bank', order: 5, currency: 'CNY', balance: 30631.94, exchangeRate: 1.08, baseBalance: 33082.50 },
  { id: 'acc_house_prop', name: '物業估值', categoryId: 'sub_acc_property', order: 1, currency: 'HKD', balance: 6370000.00, exchangeRate: 1.0, baseBalance: 6370000.00 },
  { id: 'acc_mortgage_loan', name: '房貸', categoryId: 'sub_acc_property', order: 2, currency: 'HKD', balance: -2233652.32, exchangeRate: 1.0, baseBalance: -2233652.32 },
  { id: 'acc_hsbc_red', name: 'HSBC RED', categoryId: 'sub_acc_credit_card', order: 1, currency: 'HKD', balance: -12681.40, exchangeRate: 1.0, baseBalance: -12681.40 },
  { id: 'acc_hsbc_visa', name: 'HSBC visa', categoryId: 'sub_acc_credit_card', order: 2, currency: 'HKD', balance: -2541.50, exchangeRate: 1.0, baseBalance: -2541.50 },
  { id: 'acc_hs_enjoy', name: 'HS enjoy', categoryId: 'sub_acc_credit_card', order: 3, currency: 'HKD', balance: -458.00, exchangeRate: 1.0, baseBalance: -458.00 },
];

const MASTER_ACCOUNT_CATEGORIES: AccountCategory[] = [
  { id: 'acc_cat_liquid', name: '流動資金', order: 1, isLiability: false, parentId: null },
  { id: 'sub_acc_cash_wallet', name: '現金與電子錢包', order: 1, isLiability: false, parentId: 'acc_cat_liquid' },
  { id: 'sub_acc_bank', name: '銀行活期', order: 2, isLiability: false, parentId: 'acc_cat_liquid' },
  { id: 'acc_cat_invest', name: '投資資產', order: 2, isLiability: false, parentId: null },
  { id: 'sub_acc_insurance', name: '保險儲蓄', order: 1, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'sub_acc_fund', name: '基金投資', order: 2, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'sub_acc_mpf', name: 'MPF 強積金', order: 3, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'sub_acc_invest_bank', name: '外幣存款/理財', order: 4, isLiability: false, parentId: 'acc_cat_invest' },
  { id: 'acc_cat_fixed', name: '固定資產', order: 3, isLiability: false, parentId: null },
  { id: 'sub_acc_property', name: '物業估值與房貸', order: 1, isLiability: false, parentId: 'acc_cat_fixed' },
  { id: 'acc_cat_liability', name: '流動負債', order: 4, isLiability: true, parentId: null },
  { id: 'sub_acc_credit_card', name: '信用卡', order: 1, isLiability: true, parentId: 'acc_cat_liability' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx_1', date: '2026-09-14T15:16', type: 'EXPENSE', amount: -30.00, currency: 'CNY', exchangeRate: 1.168, baseAmount: -35.05, categoryId: 'sub_act', account: 'acc_zfb_cny', note: '陪玩', notes: '阿明組隊' },
  { id: 'tx_2', date: '2026-09-13T12:30', type: 'EXPENSE', amount: -79.00, currency: 'HKD', exchangeRate: 1.0, baseAmount: -79.00, categoryId: 'sub_food_raw', account: 'acc_hs_hkd_sa', note: '飯' },
  { id: 'tx_3', date: '2026-09-12T19:45', type: 'EXPENSE', amount: -368.40, currency: 'HKD', exchangeRate: 1.0, baseAmount: -368.40, categoryId: 'sub_food_raw', account: 'acc_hsbc_red', note: 'hktvmall' },
  { id: 'tx_4', date: '2026-09-11T16:20', type: 'EXPENSE', amount: -12.10, currency: 'CNY', exchangeRate: 1.078, baseAmount: -13.04, categoryId: 'sub_shop', account: 'acc_wx_cny', note: '文具' },
  { id: 'tx_5', date: '2026-09-11T11:05', type: 'EXPENSE', amount: -17.43, currency: 'CNY', exchangeRate: 1.078, baseAmount: -18.79, categoryId: 'sub_food_raw', account: 'acc_wx_cny', note: '零食' },
];

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_TRANSACTIONS');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_ACCOUNTS_V3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length >= MASTER_ACCOUNTS.length) return parsed;
          const existingIds = new Set(parsed.map((a: Account) => a.id));
          const merged = [...parsed];
          MASTER_ACCOUNTS.forEach((item) => {
            if (!existingIds.has(item.id)) merged.push(item);
          });
          return merged;
        }
      } catch (e) {}
    }
    return MASTER_ACCOUNTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_CATEGORIES');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return MASTER_CATEGORIES;
  });

  const [accountCategories, setAccountCategories] = useState<AccountCategory[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_ACCOUNT_CATEGORIES_TREE3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return MASTER_ACCOUNT_CATEGORIES;
  });

  const [rates] = useState<CurrencyRate[]>(() => {
    const saved = localStorage.getItem('MY_LEDGER_CURRENCY_RATES');
    return saved ? JSON.parse(saved) : [
      { code: 'HKD', rateToHKD: 1.0, symbol: 'HK$' },
      { code: 'CNY', rateToHKD: 1.085, symbol: '¥' },
      { code: 'USD', rateToHKD: 7.82, symbol: '$' },
      { code: 'JPY', rateToHKD: 0.052, symbol: '¥' },
      { code: 'EUR', rateToHKD: 8.52, symbol: '€' },
      { code: 'GBP', rateToHKD: 10.15, symbol: '£' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_TRANSACTIONS', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('MY_LEDGER_ACCOUNTS_V3', JSON.stringify(accounts));
  }, [accounts]);

  // 動態存摺餘額算法 (Running Balance)
  const runningBalancesMap = useMemo(() => {
    const map = new Map<string, number>();

    accounts.forEach((acc) => {
      const related = transactions.filter((t) => t.account === acc.id);
      if (related.length === 0) return;

      const sorted = [...related].sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        if (cmp !== 0) return cmp;
        return a.id.localeCompare(b.id);
      });

      let running = acc.balance;
      for (let i = sorted.length - 1; i >= 0; i--) {
        const tx = sorted[i];
        map.set(`${tx.id}_${acc.id}`, running);

        // 該筆交易折合為賬戶原幣種的變動額
        const accRate = acc.exchangeRate || 1.0;
        const deltaInAccCurr = tx.baseAmount / accRate;
        running = Math.round((running - deltaInAccCurr) * 100) / 100;
      }
    });

    return map;
  }, [transactions, accounts]);

  // 全屏頁面控制
  const [isAdding, setIsAdding] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // 表單核心狀態
  const [recordType, setRecordType] = useState<TransactionType>('EXPENSE');
  const [note, setNote] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [dateTime, setDateTime] = useState('');

  // 符號切換
  const [isPositiveSign, setIsPositiveSign] = useState(false);

  // 計算機開關與運算
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');

  // 交易外幣自定義
  const [txCurrency, setTxCurrency] = useState('HKD');

  // 𝄘 拆分狀態
  const [isSplit, setIsSplit] = useState(false);
  interface SplitDraft {
    id: string;
    categoryId: string;
    amount: string;
  }
  const [splits, setSplits] = useState<SplitDraft[]>([]);

  // 智能記憶候選詞
  const matchedSuggestions = useMemo(() => {
    const trimmed = note.trim();
    if (!trimmed || editingTxId) return [];

    const seen = new Set<string>();
    const list: { note: string; tx: Transaction }[] = [];

    for (const t of transactions) {
      if (
        t.note &&
        t.note.toLowerCase().includes(trimmed.toLowerCase()) &&
        t.note.toLowerCase() !== trimmed.toLowerCase() &&
        !seen.has(t.note)
      ) {
        seen.add(t.note);
        list.push({ note: t.note, tx: t });
        if (list.length >= 5) break;
      }
    }
    return list;
  }, [note, transactions, editingTxId]);

  // 一鍵還原快照
  const handleApplySnapshot = (matchTx: Transaction) => {
    setNote(matchTx.note);
    setNotesInput(matchTx.notes || '');
    setAmountStr(Math.abs(matchTx.amount).toString());
    setRecordType(matchTx.type);
    setIsPositiveSign(matchTx.amount > 0);
    setTxCurrency(matchTx.currency);
    setSelectedAccountId(matchTx.account);
    if (matchTx.toAccount) setToAccountId(matchTx.toAccount);
    setSelectedCategoryId(matchTx.categoryId);

    if (matchTx.splits && matchTx.splits.length > 0) {
      setIsSplit(true);
      setSplits(
        matchTx.splits.map((s, idx) => ({
          id: idx.toString(),
          categoryId: s.categoryId,
          amount: Math.abs(s.amount).toString(),
        }))
      );
    } else {
      setIsSplit(false);
      setSplits([]);
    }
  };

  // 打開新增
  const handleOpenAdd = () => {
    const savedCats = localStorage.getItem('MY_LEDGER_CATEGORIES');
    if (savedCats) {
      try { setCategories(JSON.parse(savedCats)); } catch (e) {}
    }
    const savedAccs = localStorage.getItem('MY_LEDGER_ACCOUNTS_V3');
    if (savedAccs) {
      try { setAccounts(JSON.parse(savedAccs)); } catch (e) {}
    }
    const savedAccCats = localStorage.getItem('MY_LEDGER_ACCOUNT_CATEGORIES_TREE3');
    if (savedAccCats) {
      try { setAccountCategories(JSON.parse(savedAccCats)); } catch (e) {}
    }

    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditingTxId(null);
    setDateTime(localIso);
    setNote('');
    setNotesInput('');
    setAmountStr('');
    setRecordType('EXPENSE');
    setIsPositiveSign(false);
    setShowCalculator(false);
    setCalcExpr('');
    setIsSplit(false);
    setSplits([]);

    const defaultAcc = accounts[0];
    if (defaultAcc) {
      setSelectedAccountId(defaultAcc.id);
      setTxCurrency(defaultAcc.currency);
    }
    const defaultCat = categories.find((c) => c.parentId && c.type === 'EXPENSE');
    if (defaultCat) setSelectedCategoryId(defaultCat.id);
    setIsAdding(true);
  };

  // 打開編輯
  const handleOpenEdit = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setDateTime(tx.date);
    setNote(tx.note);
    setNotesInput(tx.notes || '');
    setAmountStr(Math.abs(tx.amount).toString());
    setRecordType(tx.type);
    setIsPositiveSign(tx.amount > 0);
    setShowCalculator(false);
    setCalcExpr('');
    setSelectedAccountId(tx.account);
    if (tx.toAccount) setToAccountId(tx.toAccount);
    setSelectedCategoryId(tx.categoryId);
    setTxCurrency(tx.currency);

    if (tx.splits && tx.splits.length > 0) {
      setIsSplit(true);
      setSplits(
        tx.splits.map((s, idx) => ({
          id: idx.toString(),
          categoryId: s.categoryId,
          amount: Math.abs(s.amount).toString(),
        }))
      );
    } else {
      setIsSplit(false);
      setSplits([]);
    }

    setIsAdding(true);
  };

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const targetToAccount = accounts.find((a) => a.id === toAccountId) || accounts[1] || accounts[0];

  const handleAccountChange = (accId: string) => {
    setSelectedAccountId(accId);
    const acc = accounts.find((a) => a.id === accId);
    if (acc) setTxCurrency(acc.currency);
  };

  const matchedRateObj = rates.find((r) => r.code === txCurrency);
  const txRateToHKD = matchedRateObj ? matchedRateObj.rateToHKD : 1.0;
  const inverseRate = txRateToHKD > 0 ? (1 / txRateToHKD).toFixed(3) : '1';

  const numericAmount = parseFloat(amountStr) || 0;
  const calculatedBaseHKD = (numericAmount * txRateToHKD).toFixed(2);

  const accRateToHKD = currentAccount ? (currentAccount.exchangeRate || 1.0) : 1.0;
  const accountDeductionAmount = accRateToHKD > 0 ? (numericAmount * txRateToHKD / accRateToHKD).toFixed(2) : numericAmount.toFixed(2);

  const currentCatObj = categories.find((c) => c.id === selectedCategoryId);
  const currentParentCat = currentCatObj ? categories.find((c) => c.id === currentCatObj.parentId) : null;
  const currentAccSubCat = currentAccount ? accountCategories.find((c) => c.id === currentAccount.categoryId) : null;

  const handleCalcPress = (btn: string) => {
    if (btn === 'C') {
      setCalcExpr('');
    } else if (btn === 'DEL') {
      setCalcExpr((prev) => prev.slice(0, -1));
    } else if (btn === '=') {
      try {
        const sanitized = calcExpr.replace(/×/g, '*').replace(/÷/g, '/');
        if (/^[0-9+\-*/.() ]+$/.test(sanitized)) {
          const res = Function(`'use strict'; return (${sanitized})`)();
          if (isFinite(res)) {
            const rounded = Math.round(res * 100) / 100;
            setCalcExpr(rounded.toString());
            setAmountStr(rounded.toString());
          }
        }
      } catch (e) {}
    } else if (btn === 'OK') {
      if (calcExpr) {
        try {
          const sanitized = calcExpr.replace(/×/g, '*').replace(/÷/g, '/');
          if (/^[0-9+\-*/.() ]+$/.test(sanitized)) {
            const res = Function(`'use strict'; return (${sanitized})`)();
            if (isFinite(res)) {
              setAmountStr((Math.round(res * 100) / 100).toString());
            }
          }
        } catch (e) {}
      }
      setShowCalculator(false);
    } else {
      setCalcExpr((prev) => prev + btn);
    }
  };

  const toggleSplitMode = () => {
    if (!isSplit) {
      const firstCat = categories.find((c) => c.parentId && c.type === recordType);
      setSplits([
        { id: '1', categoryId: firstCat ? firstCat.id : '', amount: amountStr || '' },
      ]);
      setIsSplit(true);
    } else {
      setIsSplit(false);
      setSplits([]);
    }
  };

  const handleAddSplitItem = () => {
    const currentSum = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const remain = Math.max(0, numericAmount - currentSum);
    const defaultCat = categories.find((c) => c.parentId && c.type === recordType);
    setSplits([
      ...splits,
      {
        id: Date.now().toString(),
        categoryId: defaultCat ? defaultCat.id : '',
        amount: remain > 0 ? remain.toString() : '',
      },
    ]);
  };

  const handleUpdateSplit = (id: string, field: 'categoryId' | 'amount', val: string) => {
    setSplits((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)));
  };

  const handleRemoveSplit = (id: string) => {
    if (splits.length <= 1) return;
    setSplits((prev) => prev.filter((item) => item.id !== id));
  };

  // 🌟 保存交易（修復：同幣種1:1無損對等、嚴格賬戶隔離回滾）
  const handleSaveTransaction = (keepOpen: boolean = false) => {
    if (!amountStr || numericAmount <= 0) {
      alert('請輸入大於 0 的金額');
      return;
    }
    if (!currentAccount) {
      alert('請選擇賬戶');
      return;
    }

    // 🌟 1. 轉賬模式處理（支持編輯時自動回滾舊配對，避免重複生成）
    if (recordType === 'TRANSFER') {
      if (currentAccount.id === targetToAccount.id) {
        alert('轉出賬戶與轉入賬戶不能相同！');
        return;
      }

      // 若是編輯已有轉賬，找到原先整組配對
      const editingTx = editingTxId ? transactions.find((t) => t.id === editingTxId) : null;
      const oldPairId = editingTx?.transferPairId;
      const oldPairList = oldPairId
        ? transactions.filter((t) => t.transferPairId === oldPairId)
        : [];

      const pairId = oldPairId || ('pair_' + Date.now().toString());

      // 判斷是否同幣種 1:1 對等
      const isSameCurrency = txCurrency === targetToAccount.currency;
      const targetRate = targetToAccount.exchangeRate || 1.0;
      const baseVal = Math.round(numericAmount * txRateToHKD * 100) / 100;
      const targetInflowAmount = isSameCurrency
        ? numericAmount
        : Math.round((baseVal / targetRate) * 100) / 100;
      const targetInflowBase = isSameCurrency
        ? baseVal
        : Math.round(targetInflowAmount * targetRate * 100) / 100;

      // 新轉出流水
      const outTx: Transaction = {
        id: 'tx_out_' + (oldPairId ? oldPairId.slice(5) : Date.now().toString()),
        transferPairId: pairId,
        date: dateTime || new Date().toISOString().slice(0, 16),
        type: 'TRANSFER',
        amount: -Math.abs(numericAmount),
        currency: txCurrency,
        exchangeRate: txRateToHKD,
        baseAmount: -Math.abs(baseVal),
        categoryId: 'TRANSFER',
        account: currentAccount.id,
        toAccount: targetToAccount.id,
        note: note.trim() ? `${note.trim()} (➔ ${targetToAccount.name})` : `轉出 ➔ ${targetToAccount.name}`,
        notes: notesInput.trim() || undefined,
      };

      // 新轉入流水
      const inTx: Transaction = {
        id: 'tx_in_' + (oldPairId ? oldPairId.slice(5) : (Date.now() + 1).toString()),
        transferPairId: pairId,
        date: dateTime || new Date().toISOString().slice(0, 16),
        type: 'TRANSFER',
        amount: Math.abs(targetInflowAmount),
        currency: targetToAccount.currency,
        exchangeRate: isSameCurrency ? txRateToHKD : targetRate,
        baseAmount: Math.abs(targetInflowBase),
        categoryId: 'TRANSFER',
        account: targetToAccount.id,
        toAccount: currentAccount.id,
        note: note.trim() ? `${note.trim()} (⬅ ${currentAccount.name})` : `轉入 ⬅ ${currentAccount.name}`,
        notes: notesInput.trim() || undefined,
      };

      // 1. 流水替換：若有舊配對則移除舊配對，再寫入新配對（徹底杜絕重複）
      setTransactions((prev) => {
        const filtered = oldPairId ? prev.filter((t) => t.transferPairId !== oldPairId) : prev;
        return [outTx, inTx, ...filtered];
      });

      // 2. 賬戶餘額安全更新：先回滾舊配對涉及的賬戶，再套用新配對
      setAccounts((prev) =>
        prev.map((acc) => {
          let updatedBal = acc.balance;

          // 步驟 A：回滾舊轉賬涉及的金額
          if (oldPairList.length > 0) {
            oldPairList.forEach((oldTx) => {
              if (acc.id === oldTx.account) {
                const oldDelta = oldTx.baseAmount / (acc.exchangeRate || 1.0);
                updatedBal -= oldDelta;
              }
            });
          }

          // 步驟 B：扣除/增加新轉賬金額
          if (acc.id === currentAccount.id) {
            const deduction = isSameCurrency && acc.currency === txCurrency
              ? numericAmount
              : Math.round((baseVal / (acc.exchangeRate || 1.0)) * 100) / 100;
            updatedBal -= deduction;
          }
          if (acc.id === targetToAccount.id) {
            const addition = isSameCurrency && acc.currency === txCurrency
              ? numericAmount
              : targetInflowAmount;
            updatedBal += addition;
          }

          updatedBal = Math.round(updatedBal * 100) / 100;
          const newBase = Math.round(updatedBal * (acc.exchangeRate || 1.0) * 100) / 100;
          return { ...acc, balance: updatedBal, baseBalance: newBase };
        })
      );

      if (keepOpen) {
        setAmountStr('');
        setNote('');
        setNotesInput('');
      } else {
        setIsAdding(false);
        setEditingTxId(null);
      }
      return;
    }


    // 🌟 2. 一般收支與退款處理（修復審核問題：嚴格賬戶隔離回滾）
    let finalSplits: TransactionSplit[] | undefined = undefined;
    if (isSplit) {
      const splitTotal = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
      if (Math.abs(splitTotal - numericAmount) > 0.01) {
        alert(`拆分金額合計 (${splitTotal.toFixed(2)}) 與總金額 (${numericAmount.toFixed(2)}) 不一致！`);
        return;
      }
      finalSplits = splits.map((s) => {
        const val = parseFloat(s.amount) || 0;
        const signedVal = isPositiveSign ? Math.abs(val) : -Math.abs(val);
        return {
          categoryId: s.categoryId,
          amount: signedVal,
          baseAmount: Math.round(signedVal * txRateToHKD * 100) / 100,
        };
      });
    }

    const signedAmount = isPositiveSign ? Math.abs(numericAmount) : -Math.abs(numericAmount);
    const signedBaseAmount = Math.round(signedAmount * txRateToHKD * 100) / 100;

    const existingTx = editingTxId ? transactions.find((t) => t.id === editingTxId) : null;

    const newTx: Transaction = {
      id: editingTxId || 'tx_' + Date.now().toString(),
      date: dateTime || new Date().toISOString().slice(0, 16),
      type: recordType,
      amount: signedAmount,
      currency: txCurrency,
      exchangeRate: txRateToHKD,
      baseAmount: signedBaseAmount,
      categoryId: isSplit ? 'SPLIT' : selectedCategoryId,
      account: currentAccount.id,
      note: note.trim() || (isPositiveSign ? '退款/收入' : '支出'),
      notes: notesInput.trim() || undefined,
      splits: finalSplits,
    };

    if (editingTxId) {
      setTransactions((prev) => prev.map((t) => (t.id === editingTxId ? newTx : t)));
    } else {
      setTransactions([newTx, ...transactions]);
    }

    // 🌟 嚴格精確更新賬戶餘額：回滾舊賬戶、扣除新賬戶，絕不波及無關賬戶！
    setAccounts((prev) =>
      prev.map((acc) => {
        let updatedBal = acc.balance;

        // 1. 【安全回滾舊數據】：只有當前賬戶等於舊交易的所屬賬戶時，才執行回滾！
        if (existingTx && acc.id === existingTx.account) {
          const deltaInAccCurr = existingTx.baseAmount / (acc.exchangeRate || 1.0);
          updatedBal -= deltaInAccCurr;
        }

        // 2. 【安全套用新數據】：只有當前賬戶等於新選中的扣款賬戶時，才執行扣除/增加！
        if (acc.id === currentAccount.id) {
          const deltaInAccCurr = signedBaseAmount / (acc.exchangeRate || 1.0);
          updatedBal += deltaInAccCurr;
        }

        updatedBal = Math.round(updatedBal * 100) / 100;
        const newBase = Math.round(updatedBal * (acc.exchangeRate || 1.0) * 100) / 100;
        return { ...acc, balance: updatedBal, baseBalance: newBase };
      })
    );

    if (keepOpen) {
      setAmountStr('');
      setNote('');
      setNotesInput('');
      setIsSplit(false);
      setSplits([]);
    } else {
      setIsAdding(false);
      setEditingTxId(null);
    }
  };

  // 刪除流水（嚴格賬戶隔離回滾）
  const handleDeleteTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    if (tx.transferPairId) {
      if (!confirm(`這是轉賬流水，確定要刪除嗎？成對的轉出與轉入兩筆流水將同時移除，兩端賬戶餘額將一同回滾。`)) return;

      const pairedList = transactions.filter((t) => t.transferPairId === tx.transferPairId);
      setTransactions((prev) => prev.filter((t) => t.transferPairId !== tx.transferPairId));

      setAccounts((prev) =>
        prev.map((acc) => {
          let newBal = acc.balance;
          pairedList.forEach((p) => {
            if (acc.id === p.account) {
              const deltaInAcc = p.baseAmount / (acc.exchangeRate || 1.0);
              newBal -= deltaInAcc;
            }
          });
          newBal = Math.round(newBal * 100) / 100;
          return { ...acc, balance: newBal, baseBalance: Math.round(newBal * (acc.exchangeRate || 1.0) * 100) / 100 };
        })
      );
    } else {
      if (!confirm(`確定要刪除「${tx.note}」這筆記錄嗎？對應賬戶餘額將會自動回滾。`)) return;

      setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
      setAccounts((prev) =>
        prev.map((acc) => {
          let newBal = acc.balance;
          if (acc.id === tx.account) {
            newBal -= tx.baseAmount / (acc.exchangeRate || 1.0);
          }
          newBal = Math.round(newBal * 100) / 100;
          return { ...acc, balance: newBal, baseBalance: Math.round(newBal * (acc.exchangeRate || 1.0) * 100) / 100 };
        })
      );
    }

    setIsAdding(false);
    setEditingTxId(null);
  };

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

  const groupedTransactions: { [key: string]: Transaction[] } = {};
  const sortedTxs = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  sortedTxs.forEach((tx) => {
    const dayKey = tx.date.slice(0, 10);
    if (!groupedTransactions[dayKey]) groupedTransactions[dayKey] = [];
    groupedTransactions[dayKey].push(tx);
  });
  const sortedDayKeys = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const splitCurrentTotal = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const splitDiff = (numericAmount - splitCurrentTotal).toFixed(2);

  return (
    <div className="tx-container">
      <div className="tx-header">
        <div className="tx-title-tab">交易記錄</div>
      </div>

      <div className="tx-list">
        {sortedDayKeys.map((dayKey) => {
          const list = groupedTransactions[dayKey];
          const daySumHKD = list.reduce((sum, item) => sum + item.baseAmount, 0);

          return (
            <div key={dayKey} className="day-group">
              <div className="day-header-pill">
                <span className="day-text">{formatDateGroupHeader(list[0].date)}</span>
                <span className={`day-sum ${daySumHKD < 0 ? 'text-subtle' : 'text-green'}`}>
                  {daySumHKD < 0 ? '-' : '+'}HK${Math.abs(daySumHKD).toFixed(2)}
                </span>
              </div>

              <div className="day-items">
                {list.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const acc = accounts.find((a) => a.id === tx.account);
                  const isPositive = tx.amount > 0;
                  const snapshotBalance = acc ? runningBalancesMap.get(`${tx.id}_${acc.id}`) : undefined;

                  return (
                    <div
                      key={tx.id}
                      className="tx-row"
                      onClick={() => handleOpenEdit(tx)}
                      title="點擊查看/修改此筆流水"
                    >
                      <div className={`tx-avatar ${!isPositive ? 'bg-pink' : 'bg-green'}`}>
                        {cat ? cat.icon || '🏷️' : tx.splits ? '🄢' : tx.type === 'TRANSFER' ? '🔄' : '💰'}
                      </div>

                      <div className="tx-info">
                        <span className="tx-name">{tx.note}</span>
                        <div className="tx-subcat-wrap">
                          {tx.splits && tx.splits.length > 0 ? (
                            <span className="tx-split-tag">
                              拆分: {tx.splits.map((s) => {
                                const c = categories.find((item) => item.id === s.categoryId);
                                return `${c ? c.name : '其他'}(${Math.abs(s.amount)})`;
                              }).join('、')}
                            </span>
                          ) : (
                            <span className="tx-subcat">
                              {cat ? cat.name : tx.type === 'TRANSFER' ? '內部轉賬' : '其他'}
                            </span>
                          )}

                          {tx.notes && (
                            <span className="tx-notes-bubble" title={tx.notes}>
                              💬 {tx.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="tx-amount-col">
                        <div className="tx-amounts-top">
                          {tx.currency !== 'HKD' && (
                            <span className="tx-orig-badge">
                              {isPositive ? '+' : '-'}{tx.currency === 'CNY' ? '¥' : tx.currency === 'JPY' ? '¥' : '$'}{Math.abs(tx.amount).toFixed(2)}
                            </span>
                          )}
                          <span className={`tx-base-amount ${!isPositive ? 'text-pink' : 'text-green'}`}>
                            {isPositive ? '+' : '-'}HK${Math.abs(tx.baseAmount).toFixed(2)}
                          </span>
                        </div>

                        <div className="tx-account-bottom">
                          <span className="tx-acc-label">
                            {acc ? acc.name : '未知賬戶'}
                            {acc && (
                              <span className="tx-acc-bal">
                                {' '}{acc.currency === 'CNY' ? '¥' : acc.currency === 'HKD' ? 'HK$' : '$'}
                                {(snapshotBalance !== undefined ? snapshotBalance : acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      <button className="fab-btn" onClick={handleOpenAdd} title="快速記一筆">
        +
      </button>

      {/* 全屏記賬與編輯面板 */}
      {isAdding && (
        <div className="full-page-record">
          <div className="record-top-nav">
            <button className="nav-back-arrow" onClick={() => { setIsAdding(false); setEditingTxId(null); }}>←</button>
            <h1 className="nav-page-title">{editingTxId ? '編輯記錄' : '添加'}</h1>
            {!editingTxId ? (
              <button className="nav-quick-btn" onClick={() => handleSaveTransaction(true)} title="保存並連續記賬">
                +1
              </button>
            ) : (
              <button className="nav-del-icon-btn" onClick={() => handleDeleteTransaction(editingTxId)} title="刪除此記錄">
                🗑️
              </button>
            )}
          </div>

          <div className="record-scroll-body">
            <div className="name-line">
              <input
                type="text"
                placeholder="名稱"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="name-pure-input"
                autoFocus
              />
              <span className="attach-icon">📎</span>
            </div>

            {matchedSuggestions.length > 0 && (
              <div className="suggestions-box">
                {matchedSuggestions.map((item) => (
                  <div
                    key={item.tx.id}
                    className="suggestion-item"
                    onClick={() => handleApplySnapshot(item.tx)}
                  >
                    <span className="sugg-name">{item.note}</span>
                    <span className="sugg-tip">點擊還原上次快照</span>
                  </div>
                ))}
              </div>
            )}

            <div className="datetime-line">
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="datetime-clean-picker"
              />
            </div>

            <div className="amount-hero-card">
              <div
                className={`sign-badge clickable-sign ${isPositiveSign ? 'inc' : 'exp'}`}
                onClick={() => setIsPositiveSign(!isPositiveSign)}
                title="點擊切換 ＋ 或 －"
              >
                {isPositiveSign ? '＋' : '－'}
              </div>

              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setCalcExpr(e.target.value);
                }}
                className="amount-giant-input"
              />

              <span
                className={`calc-small-icon ${showCalculator ? 'active' : ''}`}
                onClick={() => {
                  setShowCalculator(!showCalculator);
                  if (!calcExpr) setCalcExpr(amountStr || '');
                }}
                title="打開計算機"
              >
                🖩
              </span>

              <div className="pure-curr-badge-container">
                <select
                  value={txCurrency}
                  onChange={(e) => setTxCurrency(e.target.value)}
                  className="pure-curr-select"
                  title="點擊切換幣種"
                >
                  {rates.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.code}
                    </option>
                  ))}
                </select>
                <div className="pure-curr-display">{txCurrency}</div>
              </div>
            </div>

            {showCalculator && (
              <div className="calc-keyboard-card">
                <div className="calc-display-line">
                  <span className="calc-expr-text">{calcExpr || '0'}</span>
                </div>
                <div className="calc-grid">
                  {['C', '(', ')', '÷',
                    '7', '8', '9', '×',
                    '4', '5', '6', '-',
                    '1', '2', '3', '+',
                    '0', '.', 'DEL', '='].map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      className={`calc-key ${['÷', '×', '-', '+', '='].includes(btn) ? 'op' : btn === 'C' || btn === 'DEL' ? 'action' : ''}`}
                      onClick={() => handleCalcPress(btn)}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="calc-confirm-btn"
                  onClick={() => handleCalcPress('OK')}
                >
                  ✓ 填入金額
                </button>
              </div>
            )}

            <div className="fx-info-card">
              <div className="fx-header">
                <span className="fx-icon">🔄</span>
                <strong>匯率</strong>
              </div>
              <div className="fx-lines">
                <p>
                  {(numericAmount || 0).toFixed(2)} {txCurrency} = {calculatedBaseHKD} HKD
                </p>
                {currentAccount && currentAccount.currency !== txCurrency && (
                  <p className="fx-highlight">
                    👉 扣款賬戶 ({currentAccount.name}): 實扣約 <strong>{accountDeductionAmount} {currentAccount.currency}</strong>
                  </p>
                )}
                {recordType === 'TRANSFER' && targetToAccount && (
                  <p className="fx-highlight">
                    👉 轉入賬戶 ({targetToAccount.name}): 實收約 <strong>{targetToAccount.currency === txCurrency ? numericAmount.toFixed(2) : ((numericAmount * txRateToHKD) / (targetToAccount.exchangeRate || 1.0)).toFixed(2)} {targetToAccount.currency}</strong>
                  </p>
                )}
                <p>1 {txCurrency} = {txRateToHKD.toFixed(3)} HKD</p>
                <p>1 HKD = {inverseRate} {txCurrency}</p>
              </div>
            </div>

            <div className="select-cards-container">
              {recordType !== 'TRANSFER' && !isSplit && (
                <div className="choice-row">
                  <div className="choice-icon">•••</div>
                  <div className="choice-content">
                    <span className="choice-subtext">
                      {currentParentCat ? currentParentCat.name : '收支分類'}
                    </span>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="choice-select-overlay"
                    >
                      {categories
                        .filter((p) => !p.parentId && p.type === recordType)
                        .map((parentCat) => {
                          const subCats = categories.filter((c) => c.parentId === parentCat.id);
                          if (subCats.length === 0) return null;
                          return (
                            <optgroup key={parentCat.id} label={`${parentCat.icon || '📂'} ${parentCat.name}`}>
                              {subCats.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.icon || '🏷️'} {sub.name}
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                    </select>
                  </div>
                </div>
              )}

              <div className="choice-row">
                <div className="choice-icon">💳</div>
                <div className="choice-content">
                  <span className="choice-subtext">
                    {currentAccSubCat ? currentAccSubCat.name : (recordType === 'TRANSFER' ? '轉出賬戶' : '扣款賬戶')}
                  </span>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    className="choice-select-overlay"
                  >
                    {accountCategories
                      .filter((sub) => sub.parentId)
                      .map((subCat) => {
                        const groupAccounts = accounts.filter((a) => a.categoryId === subCat.id);
                        if (groupAccounts.length === 0) return null;
                        return (
                          <optgroup key={subCat.id} label={`📁 ${subCat.name}`}>
                            {groupAccounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({a.currency})
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                  </select>
                </div>
              </div>

              {recordType === 'TRANSFER' && (
                <div className="choice-row">
                  <div className="choice-icon">📥</div>
                  <div className="choice-content">
                    <span className="choice-subtext">轉入賬戶</span>
                    <select
                      value={toAccountId}
                      onChange={(e) => setToAccountId(e.target.value)}
                      className="choice-select-overlay"
                    >
                      {accountCategories
                        .filter((sub) => sub.parentId)
                        .map((subCat) => {
                          const groupAccounts = accounts.filter((a) => a.categoryId === subCat.id);
                          if (groupAccounts.length === 0) return null;
                          return (
                            <optgroup key={subCat.id} label={`📁 ${subCat.name}`}>
                              {groupAccounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.currency})
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                    </select>
                  </div>
                </div>
              )}

              {recordType !== 'TRANSFER' && (
                <div className="split-action-row" onClick={toggleSplitMode}>
                  <div className="split-left">
                    <span className="split-symbol">𝄘</span>
                    <strong className="split-title">拆分</strong>
                  </div>
                  <span className={`split-status-tag ${isSplit ? 'active' : ''}`}>
                    {isSplit ? '已啟用拆分 (點擊收起)' : '點擊拆分多個分類'}
                  </span>
                </div>
              )}

              {isSplit && recordType !== 'TRANSFER' && (
                <div className="split-panel-box">
                  <div className="split-panel-header">
                    <span>
                      已分配: <strong>{splitCurrentTotal.toFixed(2)}</strong> / 總額: {numericAmount.toFixed(2)}
                    </span>
                    <span className={parseFloat(splitDiff) === 0 ? 'text-green' : 'text-red'}>
                      {parseFloat(splitDiff) === 0 ? '✓ 完全吻合' : `差額: ${splitDiff}`}
                    </span>
                  </div>

                  <div className="split-items-list">
                    {splits.map((item, idx) => (
                      <div key={item.id} className="split-row-item">
                        <span className="split-idx">#{idx + 1}</span>
                        <select
                          value={item.categoryId}
                          onChange={(e) => handleUpdateSplit(item.id, 'categoryId', e.target.value)}
                          className="split-select"
                        >
                          {categories
                            .filter((p) => !p.parentId && p.type === recordType)
                            .map((parentCat) => {
                              const subCats = categories.filter((c) => c.parentId === parentCat.id);
                              if (subCats.length === 0) return null;
                              return (
                                <optgroup key={parentCat.id} label={`${parentCat.icon || '📂'} ${parentCat.name}`}>
                                  {subCats.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                      {sub.icon || '🏷️'} {sub.name}
                                    </option>
                                  ))}
                                </optgroup>
                              );
                            })}
                        </select>
                        <input
                          type="number"
                          step="any"
                          placeholder="金額"
                          value={item.amount}
                          onChange={(e) => handleUpdateSplit(item.id, 'amount', e.target.value)}
                          className="split-amount-input"
                        />
                        <button
                          type="button"
                          className="split-del-btn"
                          onClick={() => handleRemoveSplit(item.id)}
                          title="刪除此拆分"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="add-split-btn" onClick={handleAddSplitItem}>
                    + 增加拆分類別
                  </button>
                </div>
              )}

              <div className="choice-row notes-input-card">
                <div className="choice-icon">📝</div>
                <div className="choice-content">
                  <span className="choice-subtext">備註說明 (Notes)</span>
                  <textarea
                    placeholder="點擊輸入備註 (如: 轉賬事由、單號、備忘...)"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="notes-textarea"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="record-bottom-bar">
            <div className="bottom-type-capsules">
              <button
                type="button"
                className={`type-capsule ${recordType === 'EXPENSE' ? 'active-exp' : ''}`}
                onClick={() => {
                  setRecordType('EXPENSE');
                  setIsPositiveSign(false);
                }}
              >
                支出
              </button>
              <button
                type="button"
                className={`type-capsule ${recordType === 'INCOME' ? 'active-inc' : ''}`}
                onClick={() => {
                  setRecordType('INCOME');
                  setIsPositiveSign(true);
                }}
              >
                收入
              </button>
              <button
                type="button"
                className={`type-capsule ${recordType === 'TRANSFER' ? 'active-trans' : ''}`}
                onClick={() => {
                  setRecordType('TRANSFER');
                  setIsPositiveSign(false);
                }}
              >
                轉賬
              </button>
            </div>

            <button
              type="button"
              className="bottom-save-btn"
              onClick={() => handleSaveTransaction(false)}
              title="確認保存"
            >
              💾
            </button>
          </div>
        </div>
      )}

      <style>{`
        .tx-container { max-width: 600px; margin: 0 auto; min-height: 80vh; padding-bottom: 80px; position: relative; }
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
        .text-red { color: #ef4444 !important; font-weight: 700; }

        .day-items { display: flex; flex-direction: column; gap: 2px; }
        .tx-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 10px; background: #ffffff; border-bottom: 1px solid #f8fafc;
          cursor: pointer; transition: background 0.15s; border-radius: 10px;
        }
        .tx-row:hover { background: #f8fafc; }

        .tx-avatar {
          width: 42px; height: 42px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 19px; color: #ffffff; flex-shrink: 0;
        }
        .bg-pink { background: #f43f5e; }
        .bg-green { background: #10b981; }

        .tx-info { display: flex; flex-direction: column; margin-left: 12px; flex: 1; }
        .tx-name { font-size: 15px; font-weight: 600; color: #1e293b; }
        .tx-subcat-wrap { margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .tx-subcat { font-size: 12px; color: #94a3b8; }
        .tx-split-tag { font-size: 11px; color: #0284c7; background: #e0f2fe; padding: 1px 6px; border-radius: 4px; }
        .tx-notes-bubble {
          font-size: 11px; color: #475569; background: #f1f5f9; padding: 1px 6px; border-radius: 4px;
          max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .tx-amount-col { display: flex; flex-direction: column; align-items: flex-end; }
        .tx-amounts-top { display: flex; align-items: baseline; gap: 6px; }
        .tx-orig-badge { color: #38bdf8; font-size: 13px; font-weight: 600; font-family: monospace; }
        .tx-base-amount { font-size: 15px; font-family: monospace; }
        .tx-account-bottom { font-size: 11.5px; color: #64748b; margin-top: 2px; font-family: monospace; }
        .tx-acc-bal { font-weight: 600; color: #334155; }

        .fab-btn {
          position: fixed; right: 26px; bottom: 38px;
          width: 56px; height: 56px; border-radius: 18px;
          background: #475569; color: #ffffff; border: none;
          font-size: 34px; font-weight: 300; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 6px 18px rgba(71, 85, 105, 0.4);
          cursor: pointer; z-index: 99; transition: transform 0.15s;
        }
        .fab-btn:hover { transform: scale(1.05); background: #334155; }

        .full-page-record {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          width: 100vw; height: 100vh; background: #fbfcfe;
          z-index: 9999; display: flex; flex-direction: column;
          box-sizing: border-box;
        }

        .record-top-nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 20px; background: #ffffff; border-bottom: 1px solid #f1f5f9;
        }
        .nav-back-arrow { background: none; border: none; font-size: 24px; cursor: pointer; color: #334155; padding: 4px; }
        .nav-page-title { font-size: 18px; font-weight: 700; color: #1e293b; }
        .nav-quick-btn {
          width: 36px; height: 36px; border-radius: 50%; border: none;
          background: #f1f5f9; font-size: 14px; font-weight: 700; color: #334155; cursor: pointer;
        }
        .nav-del-icon-btn { background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px; }

        .record-scroll-body {
          flex: 1; overflow-y: auto; padding: 18px 20px; max-width: 560px;
          margin: 0 auto; width: 100%; box-sizing: border-box;
        }

        .name-line {
          display: flex; align-items: center; border-bottom: 1.5px solid #e2e8f0;
          padding: 8px 0; margin-bottom: 8px;
        }
        .name-pure-input {
          flex: 1; border: none; background: transparent; font-size: 22px;
          font-weight: 600; color: #1e293b; outline: none;
        }
        .attach-icon { font-size: 20px; color: #475569; }

        .suggestions-box {
          background: #f1f5f9; border-radius: 12px; padding: 6px 12px;
          margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px;
        }
        .suggestion-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 6px; cursor: pointer; border-radius: 8px;
          transition: background 0.15s;
        }
        .suggestion-item:hover { background: #e2e8f0; }
        .sugg-name { font-size: 15px; font-weight: 600; color: #1e293b; }
        .sugg-tip { font-size: 12px; color: #0284c7; }

        .datetime-line { margin-bottom: 16px; }
        .datetime-clean-picker {
          border: none; background: transparent; font-size: 13.5px;
          color: #475569; outline: none; font-weight: 500;
        }

        .amount-hero-card {
          display: flex; align-items: center; background: #ffffff;
          border: 1px solid #e2e8f0; border-radius: 18px;
          padding: 12px 16px; gap: 10px; margin-bottom: 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }
        .sign-badge {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; color: #ffffff; flex-shrink: 0;
          user-select: none;
        }
        .sign-badge.clickable-sign { cursor: pointer; transition: transform 0.15s; }
        .sign-badge.clickable-sign:active { transform: scale(0.92); }
        .sign-badge.exp { background: #f43f5e; }
        .sign-badge.inc { background: #10b981; }

        .amount-giant-input {
          flex: 1; border: none; outline: none; font-size: 28px;
          font-weight: 700; font-family: monospace; color: #1e293b;
        }

        .calc-small-icon {
          font-size: 22px; color: #64748b; cursor: pointer; padding: 4px;
          transition: all 0.2s; border-radius: 8px; user-select: none;
        }
        .calc-small-icon:hover, .calc-small-icon.active { color: #0284c7; background: #e0f2fe; }

        .pure-curr-badge-container {
          position: relative; display: inline-block; cursor: pointer;
        }
        .pure-curr-select {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          opacity: 0; cursor: pointer; z-index: 2;
        }
        .pure-curr-display {
          background: #475569; color: #ffffff; padding: 6px 14px;
          border-radius: 16px; font-size: 13.5px; font-weight: 700;
          user-select: none; text-align: center;
        }
        .pure-curr-badge-container:hover .pure-curr-display {
          background: #334155;
        }

        .calc-keyboard-card {
          background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 16px;
          padding: 14px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .calc-display-line {
          background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 10px 14px; margin-bottom: 12px; text-align: right;
        }
        .calc-expr-text { font-size: 20px; font-weight: 700; font-family: monospace; color: #0f172a; }
        .calc-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px;
        }
        .calc-key {
          padding: 12px 0; border: 1px solid #e2e8f0; background: #ffffff;
          border-radius: 10px; font-size: 17px; font-weight: 600; color: #1e293b;
          cursor: pointer; transition: background 0.1s;
        }
        .calc-key:active { background: #e2e8f0; }
        .calc-key.op { background: #e0f2fe; color: #0284c7; font-weight: 700; }
        .calc-key.action { background: #fee2e2; color: #ef4444; }
        .calc-confirm-btn {
          width: 100%; padding: 10px; background: #0284c7; color: #ffffff;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;
        }

        .fx-info-card {
          background: #f8fafc; border-radius: 14px; padding: 12px 16px;
          margin-bottom: 18px; font-size: 12.5px; color: #475569;
        }
        .fx-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 13px; color: #334155; }
        .fx-lines p { margin: 3px 0; font-family: monospace; }
        .fx-highlight { color: #0284c7; font-weight: 600; }

        .select-cards-container { display: flex; flex-direction: column; gap: 12px; margin-bottom: 30px; }
        .choice-row {
          position: relative; display: flex; align-items: center; gap: 14px;
          background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 12px 16px;
        }
        .choice-icon { font-size: 20px; color: #475569; }
        .choice-content { flex: 1; display: flex; flex-direction: column; position: relative; }
        .choice-subtext { font-size: 11px; color: #94a3b8; margin-bottom: 2px; }
        .choice-select-overlay {
          border: none; background: transparent; font-size: 15px; font-weight: 600;
          color: #1e293b; outline: none; width: 100%; cursor: pointer;
        }

        .notes-input-card { align-items: flex-start; padding: 10px 16px; }
        .notes-textarea {
          width: 100%; border: none; background: transparent; font-size: 14px;
          color: #1e293b; outline: none; resize: vertical; min-height: 44px;
          font-family: inherit; line-height: 1.4; margin-top: 2px;
        }
        .notes-textarea::placeholder { color: #94a3b8; font-size: 13px; }

        .split-action-row {
          display: flex; justify-content: space-between; align-items: center;
          background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 14px;
          padding: 12px 16px; cursor: pointer; transition: all 0.2s;
        }
        .split-action-row:hover { border-color: #0284c7; background: #f0f9ff; }
        .split-left { display: flex; align-items: center; gap: 12px; }
        .split-symbol { font-size: 20px; color: #0284c7; font-weight: bold; }
        .split-title { font-size: 15px; color: #1e293b; }
        .split-status-tag { font-size: 12px; color: #64748b; }
        .split-status-tag.active { color: #0284c7; font-weight: 600; }

        .split-panel-box {
          background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 14px;
          padding: 14px; display: flex; flex-direction: column; gap: 10px;
        }
        .split-panel-header {
          display: flex; justify-content: space-between; font-size: 12.5px;
          color: #0369a1; border-bottom: 1px solid #e0f2fe; padding-bottom: 6px;
        }
        .split-items-list { display: flex; flex-direction: column; gap: 8px; }
        .split-row-item { display: flex; align-items: center; gap: 8px; }
        .split-idx { font-size: 12px; color: #0284c7; font-weight: bold; width: 22px; }
        .split-select {
          flex: 1; padding: 6px 8px; border: 1px solid #cbd5e1;
          border-radius: 8px; background: #fff; font-size: 13px; outline: none;
        }
        .split-amount-input {
          width: 90px; padding: 6px 8px; border: 1px solid #cbd5e1;
          border-radius: 8px; background: #fff; font-size: 13px; outline: none;
          font-family: monospace; font-weight: 600;
        }
        .split-del-btn {
          background: none; border: none; color: #94a3b8; font-size: 18px;
          cursor: pointer; padding: 0 4px;
        }
        .split-del-btn:hover { color: #ef4444; }
        .add-split-btn {
          padding: 8px; background: #ffffff; border: 1px dashed #0284c7;
          color: #0284c7; border-radius: 8px; font-size: 12.5px; font-weight: 600;
          cursor: pointer; text-align: center;
        }

        .record-bottom-bar {
          background: #ffffff; border-top: 1px solid #f1f5f9;
          padding: 12px 20px 36px 20px;
          display: flex; justify-content: space-between; align-items: center; gap: 14px;
          max-width: 560px; margin: 0 auto; width: 100%; box-sizing: border-box;
        }
        .bottom-type-capsules {
          flex: 1; display: flex; background: #f1f5f9; border-radius: 20px; padding: 4px; gap: 4px;
        }
        .type-capsule {
          flex: 1; border: none; background: transparent; padding: 9px 0;
          border-radius: 16px; font-size: 14px; font-weight: 600;
          color: #64748b; cursor: pointer; transition: all 0.15s;
        }
        .type-capsule.active-exp { background: #f43f5e; color: #ffffff; }
        .type-capsule.active-inc { background: #10b981; color: #ffffff; }
        .type-capsule.active-trans { background: #3b82f6; color: #ffffff; }

        .bottom-save-btn {
          width: 54px; height: 48px; border-radius: 16px; border: none;
          background: #10b981; color: #ffffff; font-size: 22px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
        }
        .bottom-save-btn:hover { background: #059669; }

        .tx-empty { text-align: center; padding: 40px 0; color: #94a3b8; }
      `}</style>
    </div>
  );
};
