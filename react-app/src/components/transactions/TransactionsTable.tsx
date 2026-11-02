import React from 'react';
import type { Transaction } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { translateCategory } from '../../i18n';
import { FlowBadge } from '../common/FlowBadge';
import { MoneyDisplay } from '../common/MoneyDisplay';
import { TableFilters } from './TableFilters';
import { useTransactionsFilter } from '../../hooks/useTransactionsFilter';

interface TransactionsTableProps {
  transactions: Transaction[];
  currency?: string;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  currency
}) => {
  const { lang, t } = useLanguage();

  const {
    searchTerm,
    setSearchTerm,
    selectedAccount,
    setSelectedAccount,
    selectedFlowType,
    setSelectedFlowType,
    selectedCategory,
    setSelectedCategory,
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    totalCount,
    filteredCount,
    uniqueAccounts,
    uniqueCategories,
    filteredTransactions,
    paginatedTransactions,
    filteredTotals
  } = useTransactionsFilter(transactions);

  const tableCurrency = currency || transactions[0]?.currency || 'EGP';

  const getAccountLabel = (accType: string) => {
    if (accType === 'current') return t.currentAccount;
    if (accType === 'savings') return t.savingsAccount;
    if (accType === 'credit_card') return t.creditCard;
    return accType;
  };

  const fromRow = (currentPage - 1) * pageSize + 1;
  const toRow = Math.min(currentPage * pageSize, filteredCount);

  return (
    <section className="card transactions-card">
      <div className="table-header-bar">
        <h2 className="card-title-text">
          {t.transactionsHeader} <span className="tx-count-pill">({filteredCount})</span>
        </h2>
        <div className="table-header-meta">
          {t.showingRows
            .replace('{from}', String(filteredCount === 0 ? 0 : fromRow))
            .replace('{to}', String(toRow))
            .replace('{total}', String(totalCount))}
        </div>
      </div>

      {/* Filter Controls */}
      <TableFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
        selectedFlowType={selectedFlowType}
        onFlowTypeChange={setSelectedFlowType}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        uniqueAccounts={uniqueAccounts}
        uniqueCategories={uniqueCategories}
      />

      {/* Transactions Table */}
      <div className="table-responsive">
        <table className="tx-table">
          <thead>
            <tr>
              <th>{t.colDate}</th>
              <th>{t.colDescription}</th>
              <th>{t.colAccount}</th>
              <th>{t.colAmount}</th>
              <th>{t.colFlowType}</th>
              <th>{t.colCategory}</th>
              <th>{t.colConfidence}</th>
              <th>{t.colBalance}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((tx) => {
              const isIncome =
                tx.flowType === 'INCOME' || tx.flowType === 'INTEREST_INCOME';
              const isExpense =
                tx.flowType === 'EXPENSE' || tx.flowType === 'INTEREST_EXPENSE';

              const amountClass = isIncome
                ? 'amount-income'
                : isExpense
                ? 'amount-expense'
                : 'amount-neutral';

              const amountSign = isIncome ? '+' : isExpense ? '-' : '';

              return (
                <tr key={tx.id}>
                  <td className="tx-date">{tx.date}</td>
                  <td className="tx-desc" title={tx.description}>
                    {tx.description}
                  </td>
                  <td className="tx-account">
                    {getAccountLabel(tx.accountType)}
                  </td>
                  <td className="tx-amount">
                    <span className={amountClass}>
                      <MoneyDisplay
                        amount={tx.amount}
                        currency={tx.currency}
                        sign={amountSign}
                        decimals={2}
                      />
                    </span>
                  </td>
                  <td className="tx-flow">
                    <FlowBadge flowType={tx.flowType} />
                  </td>
                  <td className="tx-category">
                    <span className="category-text">
                      {translateCategory(tx.category || 'Other', lang)}
                    </span>
                  </td>
                  <td className="tx-confidence">
                    <span className="badge badge-source">
                      {Math.round((tx.categoryConfidence || 1) * 100)}% ({tx.categorySource})
                    </span>
                  </td>
                  <td className="tx-balance">
                    {tx.balance !== null ? (
                      <MoneyDisplay
                        amount={tx.balance}
                        currency={tx.currency}
                        decimals={2}
                      />
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })}

            {paginatedTransactions.length === 0 && (
              <tr>
                <td colSpan={8} className="no-tx-cell">
                  {t.noMatchingTransactions}
                </td>
              </tr>
            )}
          </tbody>

          {filteredTransactions.length > 0 && (
            <tfoot className="tx-table-footer">
              <tr>
                <td colSpan={3} className="footer-title-cell">
                  <div className="footer-summary-heading">
                    <span className="footer-main-label">{t.tableTotalFiltered}</span>
                    <span className="footer-count-badge">
                      {filteredCount} {t.transactionsParsed}
                    </span>
                  </div>
                </td>
                <td className="footer-amounts-cell">
                  <div className="footer-amounts-list">
                    {filteredTotals.totalIncome > 0 && (
                      <div className="footer-amount-row amount-income">
                        <span className="footer-row-tag">{t.flowIncome}:</span>
                        <MoneyDisplay
                          amount={filteredTotals.totalIncome}
                          currency={tableCurrency}
                          sign="+"
                          decimals={2}
                        />
                      </div>
                    )}
                    {filteredTotals.totalExpenses > 0 && (
                      <div className="footer-amount-row amount-expense">
                        <span className="footer-row-tag">{t.flowExpense}:</span>
                        <MoneyDisplay
                          amount={filteredTotals.totalExpenses}
                          currency={tableCurrency}
                          sign="-"
                          decimals={2}
                        />
                      </div>
                    )}
                    <div
                      className={`footer-amount-row footer-net-row ${
                        filteredTotals.netAmount >= 0 ? 'net-positive' : 'net-negative'
                      }`}
                    >
                      <span className="footer-row-tag font-bold">{t.netTotal}:</span>
                      <MoneyDisplay
                        amount={Math.abs(filteredTotals.netAmount)}
                        currency={tableCurrency}
                        sign={filteredTotals.netAmount >= 0 ? '+' : '-'}
                        decimals={2}
                        className="font-bold"
                      />
                    </div>
                  </div>
                </td>
                <td colSpan={4} className="footer-trailing-cell"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="btn btn-outline btn-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            {t.previous}
          </button>
          <span className="pagination-page-info">
            {t.showingPage
              .replace('{current}', String(currentPage))
              .replace('{total}', String(totalPages))}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            {t.next}
          </button>
        </div>
      )}
    </section>
  );
};
