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

const successSystemInstruction = 'Analyze the provided input and generate a structured output. Instructions: 1. Title: Use the given title directly unless it is too descriptive. If needed, infer a concise and noun-based title. 2. Description: Summarize the provided description and htmlContents to create a concise and informative description. Ensure clarity and relevance. Then add relevant meta keywords that would be useful for search. Provide keywords in both Korean and English, considering possible typos and include as many as possible. Separate each keyword with a comma. 3. Category: Determine the most suitable category from the following: "AI", "Collection", "Website", "Article", "Service", "Book". If the content curates multiple resources, classify it as "Collection". 4. Tags: Extract 3 to 5 relevant tags based on the provided keywords, description, and htmlContents. Ensure tags are useful for search and discovery.'

const errorSystemInstruction = 'Visit the provided link and return the structured output as a result. Important: Set output as "not available" when there is no resources to analyze. Instructions: 1. Title: Use the meta title or <h> tag from the website whenever possible. If the title is descriptive, infer a concise and noun-based title. 2. Description: Analyze the role, content, and purpose of the site to create a concise and informative description. Add relevant meta keywords in both Korean and English, considering possible typos. Separate each keyword with a comma. 3. Category: Select the most suitable category from the following: "AI", "Collection", "Website", "Article", "Service", "Book". If the content curates multiple resources, classify it as "Collection". 4. Tags: Generate 3 to 5 relevant tags based on the content and purpose of the site.'

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
      // Fetch data from Supabase Edge Function
      const edgeFunctionUrl = `https://lqrkuvemtnnnjgvptnlo.supabase.co/functions/v1/scrape-website?url=${encodeURIComponent(url)}`
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      let edgeFunctionData
      let systemInstruction

      if (edgeResponse.ok) {
        edgeFunctionData = await edgeResponse.json()
        console.log('Edge Function response:', edgeFunctionData)
        systemInstruction = successSystemInstruction
      } else {
        console.error('Edge Function error, falling back to Gemini')
        edgeFunctionData = { url }
        systemInstruction = errorSystemInstruction
      }

      // Send data to Gemini
      const chatSession = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction,
      }).startChat({ generationConfig, history: [] })

      const geminiResult = await chatSession.sendMessage(JSON.stringify(edgeFunctionData))
      const geminiResponseText = geminiResult.response.candidates[0].content.parts[0].text
      const geminiResponse = JSON.parse(geminiResponseText)
      console.log('Gemini response:', geminiResponse)

      const { title, description, category, tags, original_link } = geminiResponse

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
        original_link,
        // user_email: email || null,
        // // subscribe_consent: subscribeConsent,
        // // user_id: userId,
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
      <h3>사이트 추가 제안하기</h3>
      {message && <div className={`message ${isSuccess ? 'success' : 'error'}`}>{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">URL *</label>
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
          <label htmlFor="email">이메일</label>
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
            업데이트 소식이 있을 때 알림을 받고 싶습니다.
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
