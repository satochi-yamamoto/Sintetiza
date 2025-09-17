import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import * as pdfjsLib from 'pdf-parse'
import mammoth from 'mammoth'

// Helper function to extract text from different file types
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  const buffer = Buffer.from(await file.arrayBuffer())

  switch (fileType) {
    case 'application/pdf':
      try {
        const data = await pdfjsLib(buffer)
        return data.text
      } catch (error) {
        throw new Error('Failed to parse PDF file')
      }

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      try {
        const result = await mammoth.extractRawText({ buffer })
        return result.value
      } catch (error) {
        throw new Error('Failed to parse DOCX file')
      }

    case 'text/plain':
      return buffer.toString('utf-8')

    default:
      throw new Error('Unsupported file type')
  }
}

// Helper function to generate summary using AI
async function generateSummary(text: string, summaryType: string = 'STANDARD'): Promise<string> {
  try {
    const zai = await ZAI.create()
    
    let prompt = `Please provide a comprehensive summary of the following text. The summary should be:
    - Clear and concise
    - Well-structured
    - Capture the main points and key information
    - Maintain the original meaning and context
    
    Text to summarize:
    ${text}
    
    Please provide the summary in a well-formatted manner.`

    if (summaryType === 'EXECUTIVE') {
      prompt = `Please provide an executive summary of the following text. The summary should be:
      - High-level overview focused on business implications
      - Concise and actionable
      - Highlight key decisions, recommendations, and business impact
      - Suitable for busy executives and decision-makers
      
      Text to summarize:
      ${text}
      
      Please provide the executive summary in a clear, business-appropriate format.`
    } else if (summaryType === 'TECHNICAL') {
      prompt = `Please provide a technical summary of the following text. The summary should be:
      - Detailed technical analysis
      - Include technical specifications, methodologies, and technical implications
      - Maintain technical accuracy and precision
      - Suitable for technical professionals and engineers
      
      Text to summarize:
      ${text}
      
      Please provide the technical summary with appropriate technical detail.`
    } else if (summaryType === 'BULLET_POINTS') {
      prompt = `Please provide a bullet-point summary of the following text. The summary should be:
      - Organized in clear, concise bullet points
      - Easy to scan and understand quickly
      - Capture all main points and key information
      - Use proper bullet point hierarchy when needed
      
      Text to summarize:
      ${text}
      
      Please provide the summary in well-structured bullet points.`
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert document summarizer. Provide accurate, well-structured summaries that capture the essence of the original text while being concise and readable.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    const messageContent = completion.choices[0]?.message?.content
    if (!messageContent) {
      throw new Error('No summary generated')
    }

    return messageContent.trim()
  } catch (error) {
    console.error('AI summarization error:', error)
    throw new Error('Failed to generate AI summary')
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' },
        { status: 400 }
      )
    }

    // Extract text from file
    const extractedText = await extractTextFromFile(file)

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from the file' },
        { status: 400 }
      )
    }

    // Generate summary (for MVP, we'll use STANDARD type)
    const summaryContent = await generateSummary(extractedText, 'STANDARD')

    // For now, we'll create a simple response without database storage
    // In a real application, you would save this to the database with user info
    const summary = {
      id: Math.random().toString(36).substr(2, 9),
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      content: summaryContent,
      summaryType: 'STANDARD',
      wordCount: summaryContent.split(/\s+/).length,
      createdAt: new Date().toISOString(),
      documentName: file.name
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Summarization error:', error)
    return NextResponse.json(
      { error: 'Failed to process file and generate summary' },
      { status: 500 }
    )
  }
}