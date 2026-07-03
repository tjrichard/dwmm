import React, { useState, useEffect } from 'react'
import LoadingOverlay from './LoadingOverlay'
import { Check } from 'lucide-react'

const SCRAPE_TIMEOUT_MS = 65000;

function getPayloadMessage(payload) {
  if (!payload) return null;
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error?.message) return payload.error.message;
  if (typeof payload.message === 'string') return payload.message;
  return null;
}

async function invokeScrapeWebsite(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

  try {
    const response = await fetch('/api/scrape-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let payload = null;
    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      payload = { message: responseText };
    }

    if (!response.ok) {
      return {
        data: null,
        error: new Error(getPayloadMessage(payload) || `Edge Function failed with ${response.status}`),
      };
    }

    return { data: payload, error: null };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        data: null,
        error: new Error('스크래핑 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'),
      };
    }

    return {
      data: null,
      error,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

const ThankYouComponent = ({ onAddNew }) => {
  return (
    <div className="thank-you-container animate-fade-in">
      <div className="thank-you-content">
        <div className="thank-you-icon"><Check size={24} /></div>
        <h3>💯 Thank you!</h3>
        <p>We will review and add your site soon 😉 </p>
      </div>
      <button onClick={onAddNew} className="button primary">
        Suggest another
      </button>
    </div>
  )
}

function WebsiteRequestForm({ onComplete = () => {}, onSubmit = () => {}, fromSuggest = false }) {
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [subscribeConsent, setSubscribeConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [showThankYou, setShowThankYou] = useState(false)

  // 로딩 단계 상태 추가
  const [loadingStep, setLoadingStep] = useState(-1)
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)

  // Extract domain name from URL for title suggestion
  const extractDomainName = (url) => {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return (
        domain.split(".")[0].charAt(0).toUpperCase() +
        domain.split(".")[0].slice(1)
      );
    } catch (e) {
      return "";
    }
  };

  const resetForm = () => {
    setUrl('')
    setEmail('')
    setSubscribeConsent(false)
    setMessage('')
    setShowThankYou(false)
    setLoadingStep(-1)
    setShowLoadingOverlay(false)

    // fromSuggest가 false일 때만 모달 닫기
    if (!fromSuggest && onComplete) {
      onComplete();
    }
  }

  // 로딩 단계를 일정 시간 간격으로 자동 진행하는 효과
  useEffect(() => {
    if (!showLoadingOverlay) return;
    const stepTimes = [450, 650, 850, 900, 950, 650];
    let timer;
    if (loadingStep < 5) {
      timer = setTimeout(() => {
        setLoadingStep(prev => prev + 1);
      }, stepTimes[loadingStep + 1]);
    }
    return () => clearTimeout(timer);
  }, [loadingStep, showLoadingOverlay]);

  async function handleSubmit(event) {
    event.preventDefault()
    if (!url) {
      setMessage('URL is required')
      return
    }
    setIsSubmitting(true)
    setMessage('')
    setShowLoadingOverlay(true)
    setLoadingStep(0)
    try {
      const { data: edgeFunctionData, error: edgeFunctionError } = await invokeScrapeWebsite(url)

      if (edgeFunctionError) {
        setShowLoadingOverlay(false)
        setMessage(`요청 처리 중 오류가 발생했습니다. ${edgeFunctionError.message || 'URL을 확인하거나 잠시 후 다시 시도해주세요.'}`)
        return
      }

      // 성공 처리
      if (onSubmit && edgeFunctionData) {
        onSubmit(edgeFunctionData)
      }
      setTimeout(() => {
        setShowLoadingOverlay(false)
        setShowThankYou(true)
      }, 1000);
    } catch (error) {
      setShowLoadingOverlay(false)
      let errorMessage = '요청 처리 중 오류가 발생했습니다. '
      if (error.message.includes('Failed to fetch')) {
        errorMessage += '네트워크 오류: 서버에 연결할 수 없습니다.'
      } else if (error.code === '23505') {
        errorMessage += '이미 제출된 리소스입니다.'
      } else if (error.code === '23502') {
        errorMessage += '필수 입력값이 누락되었습니다.'
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += '다시 시도해주세요.'
      }
      setMessage(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showThankYou) return (
    <div className="website-request-form">
      <ThankYouComponent onAddNew={resetForm} />
    </div>
  );
  if (showLoadingOverlay) {
    return (
      <div className="website-request-form">
        <h3>Suggest a website</h3>
        <p className="website-request-form__caption">좋은 발견이 더 빨리 공유되도록, 큐레이션 파이프라인을 실행하고 있어요.</p>
        <LoadingOverlay
          currentStep={loadingStep}
        />
      </div>
    );
  }

  return (
    <div className="website-request-form">
      <h3>Suggest a website</h3>
      {message && (
        <div className="message bg-red-100 text-red-800 p-4 rounded-md">
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="url">
            URL *
          </label>
          <input
            type="url"
            id="url"
            className="cursor-pointer"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
        </div>
        {/* 이메일 및 구독 동의 관련 UI는 필요시 복구 가능 */}
        <button
          type="submit"
          className='button primary l text-center cursor-pointer submit-btn'
          disabled={isSubmitting}
        >
          {isSubmitting ? "Curating..." : "Submit"}
        </button>
      </form>
    </div>
  )
}
export default WebsiteRequestForm
