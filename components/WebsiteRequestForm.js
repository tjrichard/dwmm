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

  const [file, setFile] = useState(null) // 이미지 파일 상태 추가
  const [preview, setPreview] = useState(null) // 이미지 미리보기 상태 추가

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  // 파일 선택 트리거
  const triggerFileInput = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.onchange = handleFileChange
    fileInput.click()
  }

  // 파일 삭제 핸들러
  const handleFileRemove = () => {
    setFile(null)
    setPreview(null)
  }

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

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setPreview(URL.createObjectURL(droppedFile))
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

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

    // 전체 과정이 약 12초 정도 걸린다고 가정하고 각 단계별로 시간 분배
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
    setLoadingStep(0) // URL 확인 단계 시작

    try {
      // Fetch data from Supabase Edge Function
      const edgeFunctionUrl = `https://lqrkuvemtnnnjgvptnlo.supabase.co/functions/v1/scrape-website?url=${encodeURIComponent(url)}`
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (!edgeResponse.ok) {
        console.error('Edge Function error:', edgeResponse.status, edgeResponse.statusText)
        throw new Error('Failed to fetch data from the server. Please check the URL or try again later.')
      }

      const edgeFunctionData = await edgeResponse.json()
      console.log('Edge Function response:', edgeFunctionData)

      let systemInstruction = successSystemInstruction

      // 웹사이트 내용 확인 단계는 자동으로 진행됨 (useEffect에서 처리)

      // Send data to Gemini
      const chatSession = genAI.getGenerativeModel({
        model: 'gemini-2.5-pro-exp-03-25',
        systemInstruction,
      }).startChat({ generationConfig, history: [] })

      const geminiResult = await chatSession.sendMessage(JSON.stringify({
        ...edgeFunctionData,
        url: url  // 명시적으로 URL 전달
      }))
      const geminiResponseText = geminiResult.response.candidates[0].content.parts[0].text
      const geminiResponse = JSON.parse(geminiResponseText)
      console.log('Gemini response:', geminiResponse)

      // 제목, 카테고리, 태그 단계는 자동으로 진행됨 (useEffect에서 처리)

      const { title, description, category, tags } = geminiResponse
      const original_link = geminiResponse.original_link || url

      let userId = null

      if (email) {
        const { data: { user }, error: getUserError } = await supabase.auth.getUser()
        if (getUserError) throw getUserError

        if (user && user.app_metadata?.provider === 'anonymous') {
          const { error: updateError } = await supabase.auth.updateUser({ email })
          if (updateError) throw updateError

          if (subscribeConsent) {
            await supabase.from('subscribers').insert([{ email, subscribed_at: new Date() }]).single()
          }
        }

        userId = user?.id
      }

      const newRequest = {
        title: title || extractDomainName(url) || "New Resource",
        description: description || `A resource submitted by a user`,
        category: category || "Website",
        tags: tags || ["User Submitted"],
        original_link,
        // user_email: email || null,
        // user_id: userId,
        public: false, // Requests start as non-public until approved
        thumbnail: null // 초기값은 null
      }

      console.log('Supabase request:', newRequest)

      // 웹사이트 등록 단계 (자동으로 진행됨)
      const { data, error } = await supabase
        .from('bookmarks')
        .insert([newRequest])
        .select()

      if (error) throw error

      const bookmarkId = data[0]?.id

      // 이미지 파일 업로드 처리
      if (file && bookmarkId) {
        const ext = file.name.split('.').pop().toLowerCase()
        const path = `bookmarks/${bookmarkId}/thumbnail.${ext}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(path, file, {
            upsert: true,
            contentType: file.type || 'application/octet-stream', // 기본 contentType 설정
          })

        if (uploadError) {
          console.error('Upload failed:', uploadError.message)
          setMessage('Failed to upload the thumbnail. Please try again.')
          return
        } else {
          const {
            data: { publicUrl }
          } = supabase.storage.from('assets').getPublicUrl(path)

          console.log('Thumbnail URL:', publicUrl)

          // DB 업데이트로 thumbnail URL 저장
          await supabase
            .from('bookmarks')
            .update({ thumbnail: publicUrl })
            .eq('id', bookmarkId)
        }
      }

      if (onSubmit && data) {
        onSubmit(data[0] || newRequest)
      }

      // 로딩 오버레이가 모든 단계를 보여준 후 성공 화면으로 전환
      setTimeout(() => {
        setShowLoadingOverlay(false)
        setIsSuccess(true)
        setMessage('Thank you for your submission!')
        setShowThankYou(true)
      }, 1000);
    } catch (error) {
      console.error('Error:', error)
      setShowLoadingOverlay(false)
      let errorMessage = "Error submitting your request. "

      if (error.message.includes('Failed to fetch')) {
        errorMessage += "Network error: Unable to reach the server. Please check your internet connection."
      } else if (error.code === "23505") {
        errorMessage += "This resource has already been submitted."
      } else if (error.code === "23502") {
        errorMessage += "Missing required fields."
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += "Please try again."
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
        <div className="form-group">
          <label>
            썸네일 이미지
          </label>
          <div
            className={`cursor-pointer file-upload-placeholder ${
              preview ? 'file-uploaded' : ''
            }">`}
            onClick={!preview ? triggerFileInput : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !preview) triggerFileInput()
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
          >
            {preview ? (
              <div className="file-preview">
                <img src={preview} alt="Preview" />
                <button
                  type="button"
                  onClick={handleFileRemove}
                  aria-label="파일 삭제"
                  className="button xs text active remove-file-button cursor-pointer"
                >
                  삭제
                </button>
              </div>
            ) : (
              <div className="placeholder-content">
                <div className="icon desktop-body-feature">📁</div>
                <p>이미지를 여기에 드래그하거나 클릭하여 업로드하세요</p>
              </div>
            )}
          </div>
        </div>
        {/* <div className="form-group">
          <label htmlFor="email">
            이메일
          </label>
          <input
            type="email"
            id="email"
            value={email}
            className='cursor-pointer'
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="subscribeConsent"
              className='cursor-pointer'
              checked={subscribeConsent}
              onChange={(e) => setSubscribeConsent(e.target.checked)}
            />
            <label htmlFor="subscribeConsent">
              업데이트 소식이 있을 때 알림을 받고 싶습니다.
            </label>
          </div>
        </div> */}
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
