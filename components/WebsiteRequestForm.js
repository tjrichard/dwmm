import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'
import LoadingOverlay from './LoadingOverlay'

const ThankYouComponent = ({ onAddNew }) => {
  return (
    <div className="thank-you-container animate-fade-in">
      <div className="thank-you-icon">✓</div>
      <div>
        <h3>💯 감사합니다!</h3>
        <p>제출하신 사이트는 빠르게 확인하고 추가해드릴게요 😉 </p>
      </div>
      <button onClick={onAddNew} className="button primary">
        추가 제안하기
      </button>
    </div>
  )
}

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

const genAI = new GoogleGenerativeAI(geminiApiKey)

const successSystemInstruction = 'Analyze the provided input and generate a structured output. Instructions: 1. Title: Use the given title directly unless it is too descriptive. If needed, infer a concise and noun-based title. 2. Description: Summarize the provided description and htmlContents to create a concise and informative description. Ensure clarity and relevance. Then add relevant meta keywords that would be useful for search. Provide keywords in both Korean and English, considering possible typos and include as many as possible. Separate each keyword with a comma. 3. Category: Determine the most suitable category from the following: "AI", "Collection", "Website", "Article", "Service", "Book". If the content curates multiple resources, classify it as "Collection". 4. Tags: Extract 3 to 5 relevant tags based on the provided keywords, description, and htmlContents. Ensure tags are useful for search and discovery. 5. Original_link: Always include the provided URL as the original_link value.'

const errorSystemInstruction = 'Visit the provided link and return the structured output as a result. Important: Set output as "not available" when there is no resources to analyze. Instructions: 1. Title: Use the meta title or <h> tag from the website whenever possible. If the title is descriptive, infer a concise and noun-based title. 2. Description: Analyze the role, content, and purpose of the site to create a concise and informative description. Add relevant meta keywords in both Korean and English, considering possible typos. Separate each keyword with a comma. 3. Category: Select the most suitable category from the following: "AI", "Collection", "Website", "Article", "Service", "Book". If the content curates multiple resources, classify it as "Collection". 4. Tags: Generate 3 to 5 relevant tags based on the content and purpose of the site. 5. Original_link: Always include the provided URL as the original_link value.'

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      category: {
        type: 'string',
        enum: ['AI', 'Collection', 'Website', 'Article', 'Service', 'Book'],
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      original_link: { type: 'string' },
      created_at: { type: 'string' },
    },
    required: ['title', 'category', 'original_link'],
  }
}

function WebsiteRequestForm({ onComplete = () => {}, onSubmit = () => {} }) {
  // 각 단계별 랜덤 애니메이션 시간 생성 (2초~4초 사이)
  const animationDurations = useMemo(() => {
    return Array.from({ length: 6 }, () => 2 + Math.random() * 2);
  }, []);

  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [subscribeConsent, setSubscribeConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
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
    setIsSuccess(false)
    setShowThankYou(false)
    setLoadingStep(-1)
    setShowLoadingOverlay(false)

    // 모달을 닫는 콜백 호출
    if (onComplete) {
      onComplete();
    }
  }

  // 로딩 단계를 일정 시간 간격으로 자동 진행하는 효과
  useEffect(() => {
    if (!showLoadingOverlay) return;
    const stepTimes = [1000, 2000, 2000, 2000, 2000, 2000];
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
      // Edge Function에 POST 요청
      const edgeFunctionUrl = `https://lqrkuvemtnnnjgvptnlo.supabase.co/functions/v1/scrape-website`
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })
      if (!edgeResponse.ok) {
        console.error('Edge Function error:', edgeResponse.status, edgeResponse.statusText)
        throw new Error('서버에서 데이터를 가져오지 못했습니다. URL을 확인하거나 잠시 후 다시 시도해주세요.')
      }
      const edgeFunctionData = await edgeResponse.json()
      // 성공 처리
      if (onSubmit && edgeFunctionData) {
        onSubmit(edgeFunctionData)
      }
      setTimeout(() => {
        setShowLoadingOverlay(false)
        setIsSuccess(true)
        setMessage('제안해주셔서 감사합니다!')
        setShowThankYou(true)
      }, 1000);
    } catch (error) {
      console.error('Error:', error)
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

  if (showThankYou) return <ThankYouComponent onAddNew={resetForm} />

  return (
    <div className="website-request-form">
      {showLoadingOverlay && (
        <LoadingOverlay
          currentStep={loadingStep}
          animationDurations={animationDurations}
        />
      )}
      <h3>사이트 제안하기</h3>
      {message && (
        <div
          className={`message ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            } p-4 rounded-md`}
        >
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
          className='button primary l cursor-pointer'
          disabled={isSubmitting}
        >
          {isSubmitting ? "제출 중..." : "제출하기"}
        </button>
      </form>
    </div>
  )
}
export default WebsiteRequestForm
