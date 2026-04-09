import { askCamino } from '../../../src/query.js'
import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const question: string = body?.question?.trim()

  if (!question) {
    throw createError({ statusCode: 400, statusMessage: 'question is required' })
  }

  const answer = await askCamino(question)
  return { answer }
})
