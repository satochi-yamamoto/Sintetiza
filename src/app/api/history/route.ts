import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Summary {
  id: string
  title: string
  content: string
  summaryType: string
  wordCount: number
  createdAt: string
  documentName: string
}

// Mock data for development - in a real app, this would come from the database
const mockSummaries: Summary[] = [
  {
    id: '1',
    title: 'Project Proposal',
    content: 'This project proposal outlines a comprehensive plan for developing a new AI-powered document summarization platform. The platform will leverage advanced natural language processing to provide accurate and concise summaries of various document types including PDFs, DOCX files, and plain text documents.',
    summaryType: 'STANDARD',
    wordCount: 45,
    createdAt: '2024-01-15T10:30:00Z',
    documentName: 'project-proposal.pdf'
  },
  {
    id: '2',
    title: 'Technical Documentation',
    content: 'The technical documentation provides detailed specifications for the document summarization system. It covers architecture design, API endpoints, database schema, and implementation guidelines for the various components including file processing, AI integration, and export functionality.',
    summaryType: 'STANDARD',
    wordCount: 38,
    createdAt: '2024-01-14T14:20:00Z',
    documentName: 'technical-docs.docx'
  },
  {
    id: '3',
    title: 'Meeting Notes',
    content: 'Meeting discussed project timeline, resource allocation, and key deliverables. Team agreed on two-week sprints with weekly reviews. Budget approved for initial development phase. Next meeting scheduled for Friday to review technical specifications.',
    summaryType: 'STANDARD',
    wordCount: 35,
    createdAt: '2024-01-13T09:15:00Z',
    documentName: 'meeting-notes.txt'
  }
]

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would:
    // 1. Get the user ID from the session
    // 2. Query the database for the user's summaries
    // 3. Return the actual data
    
    // For now, we'll return mock data
    return NextResponse.json(mockSummaries)
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summary history' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const summary: Summary = await request.json()

    if (!summary || !summary.content) {
      return NextResponse.json(
        { error: 'Invalid summary data' },
        { status: 400 }
      )
    }

    // In a real application, you would:
    // 1. Get the user ID from the session
    // 2. Save the summary to the database
    // 3. Return the saved summary with database ID
    
    // For now, we'll just return the summary as-is
    return NextResponse.json(summary)
  } catch (error) {
    console.error('History save error:', error)
    return NextResponse.json(
      { error: 'Failed to save summary to history' },
      { status: 500 }
    )
  }
}