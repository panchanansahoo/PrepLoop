import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function LearningPathShowcase({
  guideTitle,
  guideSubtitle,
  steps = [],
  ctaLabel,
  onCtaClick,
  insightsTitle,
  insightsSubtitle,
  insights = [],
}) {
  return (
    <>
      <div className="lp-study-guide">
        <div className="lp-study-guide__left">
          <div className="lp-section-header lp-section-header--compact">
            <div className="lp-section-icon" style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15' }}>
              <ArrowRight size={16} />
            </div>
            <div>
              <h2 className="lp-section-title">{guideTitle}</h2>
              <p className="lp-section-subtitle">{guideSubtitle}</p>
            </div>
          </div>

          <div className="lp-study-guide__steps">
            {steps.map((item) => (
              <div key={item.step} className="lp-study-step">
                <div className="lp-study-step__number">{item.step}</div>
                <div>
                  <div className="lp-study-step__title">{item.title}</div>
                  <p className="lp-study-step__desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onCtaClick}
          className="lp-study-guide__cta"
        >
          <ArrowRight size={16} />
          <span>{ctaLabel}</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="lp-section-header">
        <div className="lp-section-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
          <ArrowRight size={16} />
        </div>
        <div>
          <h2 className="lp-section-title">{insightsTitle}</h2>
          <p className="lp-section-subtitle">{insightsSubtitle}</p>
        </div>
      </div>

      <div className="lp-insight-grid">
        {insights.map((insight) => (
          <button
            key={insight.id}
            type="button"
            className="lp-insight-card"
            onClick={insight.onClick}
          >
            <div className="lp-insight-card__top">
              <div>
                <div className="lp-insight-topic" style={{ color: insight.color || '#fff' }}>
                  {insight.title}
                </div>
                <div className="lp-insight-meta">{insight.meta}</div>
              </div>
              <div className="lp-insight-badge" style={{ background: `${insight.color || '#818cf8'}18`, color: insight.color || '#818cf8' }}>
                {insight.badge || 'Depth'}
              </div>
            </div>

            <div className="lp-insight-section">{insight.sectionTitle}</div>
            <p className="lp-insight-copy">{insight.content}</p>

            <div className="lp-insight-formulas">
              {(insight.chips || []).map((chip, index) => (
                <span key={`${insight.id}-${index}`} className="lp-insight-chip">
                  {chip}
                </span>
              ))}
            </div>

            <div className="lp-insight-footer">
              <span className="lp-insight-footer__hint">{insight.footerHint}</span>
              <span className="lp-insight-footer__action">Open topic →</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
