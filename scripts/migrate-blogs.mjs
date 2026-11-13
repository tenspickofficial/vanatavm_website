import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Read .env
const envFile = fs.readFileSync(path.join(rootDir, '.env'), 'utf-8')
const envVars = {}
for (const line of envFile.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] || ''
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    envVars[match[1]] = value.trim()
  }
}

const projectId = envVars.NEXT_PUBLIC_SANITY_PROJECT_ID || '6xskmsqo'
const dataset = envVars.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = envVars.SANITY_API_WRITE_TOKEN || envVars.SANITY

console.log(`Connecting to Sanity project: ${projectId}, dataset: ${dataset}`)

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-02-01',
  useCdn: false,
  token,
})

// Read blogs data
const rawData = fs.readFileSync(path.join(rootDir, 'src/data/blogsData.json'), 'utf-8')
const blogs = JSON.parse(rawData)

console.log(`Found ${blogs.length} blogs to migrate.`)

async function run() {
  const transaction = client.transaction()

  for (const [index, blog] of blogs.entries()) {
    const docId = `post-${blog.id}`

    // Map content blocks to Portable Text
    const bodyBlocks = (blog.contentBlocks || []).map((b, idx) => {
      const cleanText = (b.text || '').replace(/<[^>]*>/g, '')
      if (b.type === 'h3') {
        return {
          _key: `block_${idx}`,
          _type: 'block',
          style: 'h3',
          markDefs: [],
          children: [{ _key: `span_${idx}`, _type: 'span', text: cleanText, marks: [] }],
        }
      }
      if (b.type === 'h4') {
        return {
          _key: `block_${idx}`,
          _type: 'block',
          style: 'h4',
          markDefs: [],
          children: [{ _key: `span_${idx}`, _type: 'span', text: cleanText, marks: [] }],
        }
      }
      if (b.type === 'quote') {
        return {
          _key: `block_${idx}`,
          _type: 'block',
          style: 'blockquote',
          markDefs: [],
          children: [{ _key: `span_${idx}`, _type: 'span', text: cleanText, marks: [] }],
        }
      }
      if (b.type === 'img') {
        return {
          _key: `block_${idx}`,
          _type: 'image',
          alt: b.alt || 'Post image',
        }
      }
      // default: normal paragraph
      return {
        _key: `block_${idx}`,
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{ _key: `span_${idx}`, _type: 'span', text: cleanText, marks: [] }],
      }
    })

    // Raw structured blocks
    const contentBlocks = (blog.contentBlocks || []).map((b, idx) => ({
      _key: `cb_${idx}`,
      _type: 'contentBlock',
      type: b.type,
      text: b.text || '',
      src: b.src || '',
      alt: b.alt || '',
    }))

    const doc = {
      _id: docId,
      _type: 'post',
      title: blog.title,
      slug: {
        _type: 'slug',
        current: blog.id,
      },
      category: blog.category,
      date: blog.date,
      author: blog.author || 'Vanatvam Team',
      img: blog.img,
      excerpt: blog.excerpt,
      body: bodyBlocks,
      contentBlocks: contentBlocks,
    }

    transaction.createOrReplace(doc)
    console.log(`[${index + 1}/${blogs.length}] Staged: "${blog.title}" (${docId})`)
  }

  console.log('Committing transaction to Sanity...')
  const result = await transaction.commit()
  console.log(`Successfully migrated ${result.results?.length || blogs.length} posts to Sanity!`)
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})

