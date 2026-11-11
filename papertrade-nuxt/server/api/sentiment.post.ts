import { dbMutate } from '../utils/db'

interface Sentiment {
  good: number
  bad: number
  total: number
}

export default defineEventHandler(async (event) => {
  const body = await readJsonBody(event)
  const vote = String(body.vote ?? '')

  if (vote !== 'good' && vote !== 'bad') {
    throw createError({ statusCode: 400, data: { message: 'Vote harus good/bad' } })
  }

  enforceRate(event, 'sentiment', 30, 60 * 60 * 1000)

  const next = await dbMutate<Sentiment>('sentiment', (cur) => {
    const s = (cur as Sentiment) ?? { good: 0, bad: 0, total: 0 }
    return {
      good: s.good + (vote === 'good' ? 1 : 0),
      bad: s.bad + (vote === 'bad' ? 1 : 0),
      total: s.total + 1
    }
  })

  return { good: next?.good ?? 0, bad: next?.bad ?? 0, total: next?.total ?? 1 }
})
