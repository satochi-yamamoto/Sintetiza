'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Upload, FileText, Download, History, Loader2, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

interface DocumentFile {
  file: File
  preview: string
  id: string
}

interface Summary {
  id: string
  title: string
  content: string
  summaryType: string
  wordCount: number
  createdAt: string
  documentName: string
}

export default function Home() {
  const { data: session, status } = useSession()
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null)
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load history on component mount and when session changes
  useEffect(() => {
    if (status === 'authenticated') {
      loadHistory()
    } else if (status === 'unauthenticated') {
      setIsLoading(false)
      setSummaries([])
    }
  }, [status])

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/history')
      if (response.ok) {
        const history = await response.json()
        setSummaries(history)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveToHistory = async (summary: Summary) => {
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(summary)
      })
      
      if (response.ok) {
        await loadHistory() // Refresh history
      }
    } catch (error) {
      console.error('Failed to save to history:', error)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newDocuments = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }))
    
    setDocuments(prev => [...prev, ...newDocuments])
    setError(null)
    
    toast({
      title: "Files uploaded",
      description: `${acceptedFiles.length} file(s) uploaded successfully`,
    })
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  })

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  const generateSummary = async () => {
    if (!session) {
      signIn()
      return
    }

    if (documents.length === 0) {
      setError('Please upload a document first')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', documents[0].file)

      const response = await fetch('/api/summarize', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const summary = await response.json()
      setCurrentSummary(summary)
      setSummaries(prev => [summary, ...prev])
      
      // Save to history
      await saveToHistory(summary)
      
      toast({
        title: "Summary generated",
        description: "Your document has been summarized successfully",
      })
    } catch (err) {
      setError('Failed to generate summary. Please try again.')
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const exportSummary = async (format: 'txt' | 'pdf' | 'markdown') => {
    if (!currentSummary) return

    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentSummary)
      })

      if (!response.ok) {
        throw new Error('Failed to export summary')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `summary-${currentSummary.id}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: `Summary exported as ${format.toUpperCase()}`,
      })
    } catch (err) {
      toast({
        title: "Export failed",
        description: "Failed to export summary. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Authentication */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              AI Document Summarizer
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Upload your documents and get intelligent summaries in seconds. Supports PDF, DOCX, and TXT files.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {session.user?.name || session.user?.email}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Signed in
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={() => signIn()}>
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>

        {status === 'unauthenticated' ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                Sign In Required
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
                Please sign in to upload documents and generate summaries
              </p>
              <Button onClick={() => signIn()}>
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        ) : status === 'loading' ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="upload" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload & Summarize</TabsTrigger>
              <TabsTrigger value="summary">Current Summary</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Document
                </CardTitle>
                <CardDescription>
                  Upload PDF, DOCX, or TXT files to generate summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  {isDragActive ? (
                    <p className="text-lg font-medium">Drop the file here...</p>
                  ) : (
                    <div>
                      <p className="text-lg font-medium mb-2">
                        Drag & drop a file here, or click to select
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Supports PDF, DOCX, and TXT files
                      </p>
                    </div>
                  )}
                </div>

                {documents.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-medium">Uploaded Files:</h3>
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-slate-500" />
                          <div>
                            <p className="font-medium">{doc.file.name}</p>
                            <p className="text-sm text-slate-500">
                              {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDocument(doc.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <Alert className="mt-4" variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={generateSummary}
                    disabled={documents.length === 0 || isProcessing}
                    size="lg"
                    className="px-8"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Summary...
                      </>
                    ) : (
                      'Generate Summary'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            {currentSummary ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentSummary.title || 'Document Summary'}</CardTitle>
                      <CardDescription>
                        {currentSummary.documentName} • {currentSummary.wordCount} words
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{currentSummary.summaryType}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{currentSummary.content}</p>
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSummary('txt')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export TXT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSummary('pdf')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSummary('markdown')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Markdown
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-slate-400 mb-4" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                    No summary generated yet
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Upload a document and generate a summary to see it here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Summary History
                </CardTitle>
                <CardDescription>
                  Your previously generated summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-spin" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                      Loading history...
                    </p>
                  </div>
                ) : summaries.length > 0 ? (
                  <div className="space-y-4">
                    {summaries.map((summary) => (
                      <div
                        key={summary.id}
                        className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onClick={() => setCurrentSummary(summary)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{summary.title || 'Untitled Summary'}</h3>
                          <Badge variant="outline">{summary.summaryType}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {summary.documentName} • {summary.wordCount} words
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(summary.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                      No summaries yet
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Generate your first summary to see it appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  )
}