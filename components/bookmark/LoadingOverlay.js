import React, { useMemo, useState, useEffect } from 'react';
import { Link, Globe, FileText, Folder, Tag, Rocket } from 'lucide-react';

const steps = [
  { icon: <Link size={32} />, text: 'Checking URL...' },
  { icon: <Globe size={32} />, text: 'Checking website content...' },
  { icon: <FileText size={32} />, text: 'Deciding title...' },
  { icon: <Folder size={32} />, text: 'Deciding category...' },
  { icon: <Tag size={32} />, text: 'Deciding tags...' },
  { icon: <Rocket size={32} />, text: 'Submitting website...' }
];

const LoadingOverlay = ({ currentStep = 0, animationDurations }) => {
  // 애니메이션 지속 시간이 전달되지 않은 경우 기본값 생성
  const durations = useMemo(() => {
    return (
      animationDurations || Array.from({ length: steps.length }, () => 2 + Math.random() * 2)
    );
  }, [animationDurations]);

  // fade-in/out 상태 관리
  const [show, setShow] = useState(true);
  const [displayStep, setDisplayStep] = useState(currentStep);

  useEffect(() => {
    setShow(false);
    const timeout = setTimeout(() => {
      setDisplayStep(currentStep);
      setShow(true);
    }, 300); // fade-out 후 step 변경
    return () => clearTimeout(timeout);
  }, [currentStep]);

  const { icon, text } = steps[displayStep] || steps[0];

  return (
    <div className="loading-overlay">
      <div className="loading-overlay__container">
        <div
          className={`loading-overlay__emoji${show ? ' fade-in' : ''}`}
          style={{ transition: 'opacity 0.4s, transform 0.4s' }}
        >
          {icon}
        </div>
        <div
          className={`loading-overlay__text${show ? ' fade-in' : ''}`}
          style={{ transition: 'opacity 0.4s, transform 0.4s', marginTop: '2rem' }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;