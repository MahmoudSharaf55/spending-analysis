import React from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translateCategory } from '../../i18n';

interface TableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedAccount: string;
  onAccountChange: (value: string) => void;
  selectedFlowType: string;
  onFlowTypeChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  uniqueAccounts: Array<{ accountNumber: string; label: string }>;
  uniqueCategories: string[];
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedAccount,
  onAccountChange,
  selectedFlowType,
  onFlowTypeChange,
  selectedCategory,
  onCategoryChange,
  uniqueAccounts,
  uniqueCategories
}) => {
  const { lang, t } = useLanguage();

  return (
    <div className="filter-bar">
      {/* Search Bar */}
      <div className="search-input-wrapper">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          className="filter-input search-input"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Account Filter */}
      <select
        className="filter-select"
        value={selectedAccount}
        onChange={(e) => onAccountChange(e.target.value)}
      >
        <option value="all">{t.allAccounts}</option>
        {uniqueAccounts.map((acc) => (
          <option key={acc.accountNumber} value={acc.accountNumber}>
            {acc.label}
          </option>
        ))}
      </select>

      {/* Flow Type Filter */}
      <select
        className="filter-select"
        value={selectedFlowType}
        onChange={(e) => onFlowTypeChange(e.target.value)}
      >
        <option value="all">{t.allFlowTypes}</option>
        <option value="INCOME">{t.flowIncome}</option>
        <option value="EXPENSE">{t.flowExpense}</option>
        <option value="INTERNAL_TRANSFER">{t.flowTransfer}</option>
        <option value="DEBT_PAYMENT">{t.flowDebtPayment}</option>
        <option value="INTEREST_INCOME">{t.flowInterestIncome}</option>
        <option value="INTEREST_EXPENSE">{t.flowInterestExpense}</option>
      </select>

      {/* Category Filter */}
      <select
        className="filter-select"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="all">{t.allCategories}</option>
        {uniqueCategories.map((cat) => (
          <option key={cat} value={cat}>
            {translateCategory(cat, lang)}
          </option>
        ))}
      </select>
    </div>
  );
};
