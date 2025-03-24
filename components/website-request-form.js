import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

const ThankYouComponent = ({ onAddNew }) => {
  return (
    <div className="thank-you-container animate-fade-in">
      <div className="thank-you-icon">✓</div>
      <h3>Thank You!</h3>
      <p>Your resource has been submitted successfully.</p>
      <p>We'll review it shortly and add it to our collection.</p>
      <button onClick={onAddNew} className="button primary">
        Add a new request
      </button>
    </div>
  )
}

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

const genAI = new GoogleGenerativeAI(geminiApiKey)

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction: '제공되는 링크를 방문해 제공된 structured output을 결과로 전달해줘. title 은 가능한 해당 웹사이트의 meta title 혹은 <h> 태그를 그대로 사용하되, 설명식으로 적혀져있다면 실제 이름을 유추해서 명사형으로 작성해줘. description은 LLM 을 통해 사이트의 역할, 내용, 콘텐츠를 분석해 검색에 사용될만한 meta keyword들을 리스트업 해줘. 이 때 한국어와 영어로 모두 작성해주고 발생할 수 있는 오타를 염두에 두고 가능한 많이 작성해줘. 각 항목은 \',\' 로 분리하면 돼. category는 너가 주어진 enum 타입 중에서 가장 적절한 카테고리를 1개 정해줘. 특정 주제의 콘텐츠를 모아주는 역할을 하는 사이트의 경우에는 \'Collection\' 을 사용해. tags 는 너가 사이트의 역할, 내용, 콘텐츠를 분석해 적절한 태그를 3개에서 5개 사이로 만들어줘. tags 는 Branding, Company, curation, Inspiration, Mockup, OfflineDesign, Pattern, PitchDeck, Portfolio, portfolio, SaaS, Store, UXPattern 이와 같이 영문으로 1개에서 2개 단어로 구성되어야 하고 사이트의 제목을 포함해서는 안돼.',
})

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
        enum: ['AI', 'Collection', 'Website', 'Article', 'Tool', 'Book'],
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      original_link: { type: 'string' },
      created_at: { type: 'string' },
    },
    required: ['title', 'category', 'original_link'],
  },
}

function WebsiteRequestForm() {
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [subscribeConsent, setSubscribeConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)

  const resetForm = () => {
    setUrl('')
    setEmail('')
    setSubscribeConsent(false)
    setMessage('')
    setIsSuccess(false)
    setShowThankYou(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!url) {
      setMessage('URL is required')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const chatSession = model.startChat({ generationConfig, history: [] })
      const result = await chatSession.sendMessage(url) || {}
      let responseText = result.response.candidates[0].content.parts[0].text
      const response = JSON.parse(responseText)

      const { title, description, category, tags, original_link, created_at } = response

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
        title,
        description,
        category,
        tags,
        original_link
        // created_at,
        // user_email: email || null,
        // subscribe_consent: subscribeConsent,
        // user_id: userId
      }

      console.log('Supabase request:', newRequest)

      const { data, error } = await supabase
        .from('bookmarks')
        .insert([newRequest])
        .select()

      if (error) throw error

      setIsSuccess(true)
      setMessage('Thank you for your submission!')
      setShowThankYou(true)
    } catch (error) {
      console.error('Error:', error)
      setMessage('Internal Server Error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showThankYou) return <ThankYouComponent onAddNew={resetForm} />

  return (
    <div className="website-request-form">
      <h3>Suggest a Resource</h3>
      {message && <div className={`message ${isSuccess ? 'success' : 'error'}`}>{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">Resource URL *</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Your Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="subscribeConsent"
            checked={subscribeConsent}
            onChange={e => setSubscribeConsent(e.target.checked)}
          />
          <label htmlFor="subscribeConsent">
            I agree to receive updates about new design resources
          </label>
        </div>
        <button type="submit" className="button primary" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Resource'}
        </button>
      </form>
    </div>
  )
}

export default WebsiteRequestForm
