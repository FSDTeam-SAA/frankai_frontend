'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { WizardProgress } from '@/components/wizard/wizard-progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  FileText,
  X,
  Shield,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Save,
  Play,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { projectsApi, ApiClientError } from '@/lib/api'
import type { UploadResponse } from '@/lib/api'

const wizardSteps = [
  { id: 'upload', label: 'Upload', description: 'Add your plans' },
  { id: 'detect', label: 'Detect', description: 'Processing' },
  { id: 'review', label: 'Review', description: 'Verify symbols' },
  { id: 'mapping', label: 'Mapping', description: 'Map products' },
  { id: 'export', label: 'Export', description: 'Download CSV' },
]

interface UploadedFile {
  name: string
  size: string
  pages: number
  public_id: string
  secure_url: string
}

export default function NewTakeoffPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [projectName, setProjectName] = useState('')
  const [notes, setNotes] = useState('')
  const [preset, setPreset] = useState('electrical-v1')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // Detection state
  const [detectionPhase, setDetectionPhase] = useState(0)
  const [pagesProcessed, setPagesProcessed] = useState(0)
  const [totalPages, setTotalPages] = useState(18)
  const [hasWarnings, setHasWarnings] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].type === 'application/pdf') {
      handleFileUpload(files[0])
    } else {
      setUploadError('Only PDF files are accepted.')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    // Simulate progress (Cloudinary doesn't report % easily)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const result: UploadResponse = await projectsApi.uploadPdf(file)
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      setUploadedFile({
        name: result.file_name,
        size: result.file_size,
        pages: result.pages,
        public_id: result.public_id,
        secure_url: result.secure_url,
      })
      setTotalPages(result.pages)
      setProjectName(file.name.replace('.pdf', '').replace(/_/g, ' '))
    } catch (err) {
      clearInterval(progressInterval)
      if (err instanceof ApiClientError) {
        setUploadError(err.detail)
      } else {
        setUploadError('Failed to upload file. Please try again.')
      }
      setUploadedFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startDetection = async () => {
    if (!uploadedFile || !projectName.trim()) return

    setCurrentStep(1)
    setDetectionPhase(0)

    // Create the project in the backend
    try {
      const project = await projectsApi.create({
        name: projectName.trim(),
        notes: notes || undefined,
        status: 'processing',
        pages: uploadedFile.pages,
        file_size: uploadedFile.size,
        file_name: uploadedFile.name,
        mapping_complete: false,
        file_public_id: uploadedFile.public_id,
      })
      setCreatedProjectId(project._id)
    } catch (err) {
      console.error('Failed to create project:', err)
    }

    // Phase 1: Uploading
    setDetectionPhase(0)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Phase 2: Rendering pages
    setDetectionPhase(1)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Phase 3: Detecting symbols
    setDetectionPhase(2)
    for (let i = 1; i <= totalPages; i++) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setPagesProcessed(i)
    }
    
    // Add some warnings
    setHasWarnings(true)
    
    // Phase 4: Preparing review
    setDetectionPhase(3)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Complete
    setDetectionPhase(4)
  }

  const goToReview = () => {
    if (createdProjectId) {
      router.push(`/projects/${createdProjectId}?tab=review`)
    } else {
      router.push('/projects/proj-001?tab=review') // fallback to mock
    }
  }

  const runInBackground = () => {
    router.push('/dashboard')
  }

  const saveAndExit = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Sticky Progress Header */}
      <div className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-screen-xl px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <WizardProgress steps={wizardSteps} currentStep={currentStep} className="flex-1" />
            <Button variant="outline" onClick={saveAndExit} className="hidden sm:flex bg-transparent">
              <Save className="mr-2 h-4 w-4" />
              Save & Exit
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-lg px-4 py-8 lg:px-8">
        {/* Step 1: Upload */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Upload Your Plans</h1>
              <p className="mt-2 text-muted-foreground">
                Upload a PDF of your electrical plans to begin the take-off process.
              </p>
            </div>

            {/* Upload Zone */}
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    'relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : uploadError
                        ? 'border-destructive/50 bg-destructive/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50',
                    uploadedFile && !uploadError && 'border-success bg-success/5'
                  )}
                  onClick={() => !uploadedFile && !isUploading && fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-4 p-8">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <div className="w-full max-w-xs">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="mt-2 text-center text-sm text-muted-foreground">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    </div>
                  ) : uploadedFile && !uploadError ? (
                    <div className="flex w-full items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {uploadedFile.pages} pages, {uploadedFile.size}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile()
                        }}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    </div>
                  ) : uploadError ? (
                    <div className="flex flex-col items-center gap-4 p-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-destructive">Upload failed</p>
                        <p className="mt-1 text-sm text-muted-foreground">{uploadError}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadError(null)
                          fileInputRef.current?.click()
                        }}
                      >
                        Try again
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 p-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">
                          Drag and drop your PDF here, or{' '}
                          <span className="text-primary">browse</span>
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Up to 30 pages, maximum 100MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Add a name and optional notes to help identify this project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">
                    Project Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="projectName"
                    placeholder="e.g., Warehouse Fitout – Lot 12"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any relevant details about this project..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preset">Estimator Preset</Label>
                  <Select value={preset} onValueChange={setPreset}>
                    <SelectTrigger id="preset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electrical-v1">Electrical v1</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Detection optimised for electrical symbols and fixtures.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
              <Shield className="mt-0.5 h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Secure processing</p>
                <p className="text-muted-foreground">
                  Files are processed securely and deleted automatically after analysis.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={saveAndExit}>
                <Save className="mr-2 h-4 w-4" />
                Save & Exit
              </Button>
              <Button
                onClick={startDetection}
                disabled={!uploadedFile || !projectName.trim()}
              >
                Start Detection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Detection / Processing */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Processing Your Plans</h1>
              <p className="mt-2 text-muted-foreground">
                {detectionPhase < 4
                  ? 'Please wait while we analyse your electrical plans.'
                  : 'Detection complete! Your plans are ready for review.'}
              </p>
            </div>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-8">
                {/* Processing Steps */}
                <div className="space-y-6">
                  {[
                    { label: 'Uploading file & creating project', complete: detectionPhase > 0 },
                    { label: 'Rendering pages', complete: detectionPhase > 1 },
                    { label: 'Detecting symbols', complete: detectionPhase > 2, progress: detectionPhase === 2 },
                    { label: 'Preparing review view', complete: detectionPhase > 3 },
                  ].map((step, index) => (
                    <div key={step.label} className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                          step.complete
                            ? 'border-success bg-success text-success-foreground'
                            : detectionPhase === index
                              ? 'border-primary bg-primary/10'
                              : 'border-muted-foreground/30'
                        )}
                      >
                        {step.complete ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : detectionPhase === index ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <span className="text-sm text-muted-foreground">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={cn(
                            'font-medium',
                            step.complete || detectionPhase === index
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {step.label}
                        </p>
                        {step.progress && detectionPhase === 2 && (
                          <div className="mt-2">
                            <Progress value={(pagesProcessed / totalPages) * 100} className="h-2" />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {pagesProcessed}/{totalPages} pages processed
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warnings */}
                {hasWarnings && detectionPhase >= 3 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
                      <div className="text-sm">
                        <p className="font-medium text-warning">12 items require review</p>
                        <p className="text-muted-foreground">
                          Some symbols were detected with lower confidence. We recommend reviewing these before export.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Completion state */}
                {detectionPhase === 4 && (
                  <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border border-success/30 bg-success/10 p-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success">
                      <CheckCircle className="h-8 w-8 text-success-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">Detection Complete</p>
                      <p className="text-muted-foreground">
                        244 symbols detected across {totalPages} pages
                      </p>
                    </div>
                    <Button onClick={goToReview} size="lg">
                      Go to Review
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Run in background option */}
            {detectionPhase < 4 && (
              <div className="flex justify-center">
                <Button variant="ghost" onClick={runInBackground}>
                  <Play className="mr-2 h-4 w-4" />
                  Run in background
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}