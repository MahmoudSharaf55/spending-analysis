import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { AccountSummary } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyDisplay } from '../common/MoneyDisplay';

interface AccountBreakdownProps {
  accounts: AccountSummary[];
}

export const AccountBreakdown: React.FC<AccountBreakdownProps> = ({ accounts }) => {
  const { t } = useLanguage();

  const getAccountDisplayName = (accType: string, originalName: string) => {
    if (accType === 'current') return t.currentAccount;
    if (accType === 'savings') return t.savingsAccount;
    if (accType === 'credit_card') return t.creditCard;
    return originalName;
  };

  return (
    <section className="card accounts-card">
      <div className="card-header-clean">
        <h2 className="card-title-text">{t.accountBreakdown}</h2>
        <span className="badge badge-success">
          <CheckCircle size={13} /> {t.summaryReconciliation}
        </span>
      </div>

      <div className="accounts-grid">
        {accounts.map((acc) => (
          <div key={acc.accountNumber} className="account-card">
            <div className="account-header">
              <div>
                <div className="account-name">
                  {getAccountDisplayName(acc.accountType, acc.accountName)}
                </div>
                <div className="account-num">{acc.accountNumber}</div>
              </div>
              {acc.reconciled ? (
                <span className="badge badge-success">{t.reconciled100}</span>
              ) : (
                <span className="badge badge-warning">
                  <AlertTriangle size={11} /> {t.unreconciled}
                </span>
              )}
            </div>

            <div className="balance-rows">
              {/* Beginning Balance */}
              <div className="balance-row">
                <span>{t.beginningBalance}</span>
                <MoneyDisplay amount={acc.beginningBalance} currency={acc.currency} />
              </div>

              {/* Account specific deposits/credits & withdrawals/debits */}
              {acc.accountType === 'credit_card' ? (
                <>
                  <div className="balance-row">
                    <span>{t.cardCredits}</span>
                    <MoneyDisplay
                      amount={acc.totalDepositsOrCredits}
                      currency={acc.currency}
                      sign="+"
                    />
                  </div>
                  <div className="balance-row">
                    <span>{t.cardDebits}</span>
                    <MoneyDisplay
                      amount={acc.totalWithdrawalsOrDebits}
                      currency={acc.currency}
                      sign="-"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="balance-row">
                    <span>{t.totalDeposits}</span>
                    <MoneyDisplay
                      amount={acc.totalDepositsOrCredits}
                      currency={acc.currency}
                      sign="+"
                    />
                  </div>
                  <div className="balance-row">
                    <span>{t.totalWithdrawals}</span>
                    <MoneyDisplay
                      amount={acc.totalWithdrawalsOrDebits}
                      currency={acc.currency}
                      sign="-"
                    />
                  </div>
                </>
              )}

              {/* Ending Calculated Balance */}
              <div className="balance-row highlight">
                <span>
                  {acc.accountType === 'credit_card' ? t.endingLiability : t.endingBalance}
                </span>
                <MoneyDisplay
                  amount={acc.calculatedEndingBalance}
                  currency={acc.currency}
                  className="font-semibold"
                />
              </div>
            </div>

            <div className="account-tx-count">
              {acc.transactionCount} {t.transactionsParsed}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
