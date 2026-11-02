import { useState, useMemo } from 'react';
import type { Transaction } from '../types';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

export function useTransactionsFilter(transactions: Transaction[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedFlowType, setSelectedFlowType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;

  // Extract unique accounts
  const uniqueAccounts = useMemo(() => {
    const map = new Map<string, string>();
    transactions.forEach((tx) => {
      if (!map.has(tx.accountNumber)) {
        map.set(tx.accountNumber, `${tx.accountType.toUpperCase()} (${tx.accountNumber})`);
      }
    });
    return Array.from(map.entries()).map(([accountNumber, label]) => ({
      accountNumber,
      label
    }));
  }, [transactions]);

  // Extract unique categories
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category) set.add(tx.category);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedAccount !== 'all' && tx.accountNumber !== selectedAccount) {
        return false;
      }
      if (selectedFlowType !== 'all' && tx.flowType !== selectedFlowType) {
        return false;
      }
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(query);
        const catMatch = tx.category.toLowerCase().includes(query);
        if (!descMatch && !catMatch) return false;
      }
      return true;
    });
  }, [transactions, selectedAccount, selectedFlowType, selectedCategory, searchTerm]);

  // Reset to first page when filters change
  const handleFilterChange = (setter: (val: any) => void) => (val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Compute footer totals across all filtered transactions
  const filteredTotals = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;

    for (const tx of filteredTransactions) {
      if (tx.flowType === 'INCOME' || tx.flowType === 'INTEREST_INCOME') {
        totalIncome += tx.amount;
      } else if (tx.flowType === 'EXPENSE' || tx.flowType === 'INTEREST_EXPENSE') {
        totalExpenses += tx.amount;
      } else if (tx.flowType === 'INTERNAL_TRANSFER') {
        totalTransfers += tx.amount;
      }
    }

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalTransfers: Math.round(totalTransfers * 100) / 100,
      netAmount: Math.round((totalIncome - totalExpenses) * 100) / 100,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  return {
    searchTerm,
    setSearchTerm: handleFilterChange(setSearchTerm),
    selectedAccount,
    setSelectedAccount: handleFilterChange(setSelectedAccount),
    selectedFlowType,
    setSelectedFlowType: handleFilterChange(setSelectedFlowType),
    selectedCategory,
    setSelectedCategory: handleFilterChange(setSelectedCategory),
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    totalCount: transactions.length,
    filteredCount: filteredTransactions.length,
    uniqueAccounts,
    uniqueCategories,
    filteredTransactions,
    paginatedTransactions,
    filteredTotals
  };
}
