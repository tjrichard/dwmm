// Sanity 스키마 타입 정의
export interface SanityWork {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  contentKind: 'blog' | 'portfolio'
  publishedAt: string
  coverImage?: any
  gallery?: any[]
  categories?: Array<{ title: string; slug: { current: string } }>
  tags?: Array<{ title: string; slug: { current: string } }>
  body?: any[]
  externalUrl?: string
  seo?: any
}

export interface SanityCategory {
  _id: string
  title: string
  slug: { current: string }
  description?: string
}

export interface SanityTag {
  _id: string
  title: string
  slug: { current: string }
}

export const WORKS_QUERY = `*[_type == "work" && defined(slug.current)] | order(publishedAt desc)[0...50] {
  _id,
  title,
  slug,
  excerpt,
  contentKind,
  publishedAt,
  coverImage,
  categories[]->{title, slug},
  tags[]->{title, slug}
}`

export const WORK_BY_SLUG_QUERY = `*[_type == "work" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  excerpt,
  contentKind,
  publishedAt,
  coverImage,
  gallery,
  categories[]->{title, slug},
  body,
  externalUrl,
  seo
}`

export const CATEGORIES_QUERY = `*[_type == "category"] | order(title asc) {
  _id,
  title,
  slug,
  description
}`

export const TAGS_QUERY = `*[_type == "tag"] | order(title asc) {
  _id,
  title,
  slug
}`
