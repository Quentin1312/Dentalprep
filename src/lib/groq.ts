import Groq from 'groq-sdk'

export function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! })
}

export const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
export const TEXT_MODEL = 'llama-3.3-70b-versatile'
