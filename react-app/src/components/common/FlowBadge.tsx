import React from 'react';
import type { FlowType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface FlowBadgeProps {
  flowType: FlowType;
}

export const FlowBadge: React.FC<FlowBadgeProps> = ({ flowType }) => {
  const { t } = useLanguage();

  switch (flowType) {
    case 'INCOME':
      return <span className="badge badge-success">{t.flowIncome}</span>;
    case 'EXPENSE':
      return <span className="badge badge-danger">{t.flowExpense}</span>;
    case 'INTERNAL_TRANSFER':
      return <span className="badge badge-info">{t.flowTransfer}</span>;
    case 'DEBT_PAYMENT':
      return <span className="badge badge-purple">{t.flowDebtPayment}</span>;
    case 'INTEREST_INCOME':
      return <span className="badge badge-success">{t.flowInterestIncome}</span>;
    case 'INTEREST_EXPENSE':
      return <span className="badge badge-warning">{t.flowInterestExpense}</span>;
    default:
      return <span className="badge badge-neutral">{t.flowUnknown}</span>;
  }
};
