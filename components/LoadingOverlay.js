import React, { useMemo } from 'react';

const LoadingOverlay = ({ currentStep, animationDurations }) => {
  // 애니메이션 지속 시간이 전달되지 않은 경우 기본값 생성
  const durations = useMemo(() => {
    return animationDurations || Array.from({ length: 6 }, () => 2 + Math.random() * 2);
  }, [animationDurations]);

  const steps = [
    '🌳 Checking URL...',
    '🌳 Checking website content...',
    '🌳 Deciding title...',
    '🌳 Deciding category...',
    '🌳 Deciding tags...',
    '🌳 Submitting website...'
  ];

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h3>Analyzing website...</h3>
        <div className="loading-steps">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`loading-step ${index <= currentStep ? 'active' : ''}`}
              style={{
                '--animation-duration': `${durations[index]}s`
              }}
            >
              {index < currentStep ? step : index === currentStep ? step.replace('🌳', '⌛') : step.replace('🌳', '🌱')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay; 