import { dbRead } from '../utils/db'

interface Sentiment {
  good: number
  bad: number
  total: number
}

export default defineEventHandler(async () => {
  const s = await dbRead<Sentiment>('sentiment', { good: 0, bad: 0, total: 0 })
  return { good: s.good ?? 0, bad: s.bad ?? 0, total: s.total ?? 0 }
})
