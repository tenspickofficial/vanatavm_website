import { createImageUrlBuilder } from '@sanity/image-url'
import { dataset, projectId } from './env'

const imageBuilder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
})

export type SanityImageSource = Parameters<typeof imageBuilder.image>[0]

export const urlForImage = (source: SanityImageSource) => {
  return imageBuilder?.image(source).auto('format').fit('max')
}

export const FALLBACK_BLOG_IMAGE =
  '/Blogs-content/May 2022/VT_Blog_1_The_Vanatvam_Philosophy.webp'

export function resolvePostImage(post: {
  coverImage?: SanityImageSource | null
  img?: string
}): string {
  if (post.coverImage) {
    try {
      const url = urlForImage(post.coverImage)?.url()
      if (url) return url
    } catch {
      // fall back to string img
    }
  }
  return post.img || FALLBACK_BLOG_IMAGE
}
