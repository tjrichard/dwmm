/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 * 
 * framer-motion export * 에러를 피하기 위해 클라이언트 컴포넌트로 변경
 */

'use client'

import dynamic from 'next/dynamic'
import config from '../../../../sanity.config'

// framer-motion export * 에러를 피하기 위해 동적 import 사용
const NextStudio = dynamic(
  () => import('next-sanity/studio').then((mod) => ({ default: mod.NextStudio })),
  {
    ssr: false,
    loading: () => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading Sanity Studio...
      </div>
    )
  }
)

export default function StudioPage() {
  return <NextStudio config={config} />
}
