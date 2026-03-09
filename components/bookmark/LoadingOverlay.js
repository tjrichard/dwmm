import React, { useMemo } from 'react';
import { Sparkles, Compass, ScanSearch, Tags, Send, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    title: '링크를 읽는 중',
    detail: '추천해주신 사이트의 첫 인상을 수집하고 있어요.',
    icon: Sparkles,
  },
  {
    title: '결을 파악하는 중',
    detail: '콘텐츠 분위기와 핵심 주제를 정리하고 있어요.',
    icon: Compass,
  },
  {
    title: '큐레이션 기준 정렬',
    detail: '제목·요약·카테고리를 가장 자연스럽게 매칭합니다.',
    icon: ScanSearch,
  },
  {
    title: '태그를 엮는 중',
    detail: '발견 가능한 키워드로 탐색성을 높이고 있어요.',
    icon: Tags,
  },
  {
    title: '큐레이터에게 전달',
    detail: '검토 가능한 형태로 제안을 안전하게 전달합니다.',
    icon: Send,
  },
  {
    title: '거의 완료됐어요',
    detail: '마지막 포맷 정리 후 바로 반영됩니다.',
    icon: CheckCircle2,
  },
];

const LoadingOverlay = ({ currentStep = 0 }) => {
  const safeStep = Math.max(0, Math.min(currentStep, steps.length - 1));
  const progress = ((safeStep + 1) / steps.length) * 100;

  const current = useMemo(() => steps[safeStep] || steps[0], [safeStep]);
  const CurrentIcon = current.icon;

  return (
    <div className="loading-overlay loading-overlay--v2" role="status" aria-live="polite" aria-atomic="true">
      <div className="loading-overlay__aurora" aria-hidden="true" />

      <div className="loading-overlay__container loading-overlay__container--v2">
        <div className="loading-overlay__badge">Curation in progress</div>
        <div className="loading-overlay__hero">
          <span className="loading-overlay__icon-wrap" aria-hidden="true">
            <CurrentIcon size={28} />
          </span>
          <div>
            <h4>{current.title}</h4>
            <p>{current.detail}</p>
          </div>
        </div>

        <div className="loading-overlay__progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <ol className="loading-overlay__steps">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const status = index < safeStep ? 'done' : index === safeStep ? 'active' : 'pending';
            return (
              <li key={step.title} className={`loading-overlay__step loading-overlay__step--${status}`}>
                <span className="loading-overlay__step-icon">
                  <StepIcon size={16} />
                </span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default LoadingOverlay;
