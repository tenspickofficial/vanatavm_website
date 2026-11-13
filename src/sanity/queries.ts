export const postsQuery = `*[_type == "post"] | order(_createdAt desc) {
  _id,
  "id": slug.current,
  title,
  date,
  author,
  img,
  coverImage,
  category,
  excerpt,
  contentBlocks
}`

export const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  "id": slug.current,
  title,
  date,
  author,
  img,
  coverImage,
  category,
  excerpt,
  body,
  contentBlocks
}`

export const postSlugsQuery = `*[_type == "post" && defined(slug.current)][].slug.current`
