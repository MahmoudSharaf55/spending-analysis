import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { translateInsight } from '../../i18n';

interface FinancialInsightsProps {
  insights: string[];
  insightsAr?: string[];
}

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({
  insights,
  insightsAr
}) => {
  const { lang, isRtl, t } = useLanguage();

  return (
    <section className="card insights-card">
      <div className="card-header-clean">
        <h2 className="card-title-text">{t.insightsTitle}</h2>
        <span className="badge badge-purple">
          <Sparkles size={12} /> {t.insightsBadge}
        </span>
      </div>

      <div className="insights-list">
        {insights.map((insight, index) => {
          const isRecommendation =
            insight.toLowerCase().includes('recommendation') ||
            insight.startsWith('توصية') ||
            (insightsAr && insightsAr[index]?.startsWith('توصية'));

          const localizedInsight =
            isRtl && insightsAr && insightsAr[index]
              ? insightsAr[index]
              : translateInsight(insight, lang);

          return (
            <div
              key={index}
              className={`insight-item ${isRecommendation ? 'recommendation' : ''}`}
            >
              {localizedInsight}
            </div>
          );
        })}
      </div>
    </section>
  );
};
