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
  ArrowRight,
  Save,
  Play,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { projectsApi, ApiClientError } from '@/lib/api'
import type { ObjectDetectionResult, UploadResponse } from '@/lib/api'

const wizardSteps = [
  { id: 'upload', label: 'Upload', description: 'Add your plans' },
  { id: 'detect', label: 'Detect', description: 'Processing' },
  { id: 'review', label: 'Review', description: 'Verify symbols' },
  { id: 'mapping', label: 'Mapping', description: 'Map products' },
  { id: 'export', label: 'Export', description: 'Download CSV' },
]

interface UploadedFile {
  file: File
  name: string
  size: string
  pages: number
  public_id: string
  secure_url: string
  file_type: 'pdf' | 'image'
}

const supportedPlanTypes = new Set(['application/pdf', 'image/png', 'image/jpeg'])

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDetectionLabel(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
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
  const [totalPages, setTotalPages] = useState(1)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [detection, setDetection] = useState<ObjectDetectionResult | null>(null)
  const [detectionError, setDetectionError] = useState<string | null>(null)

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
    if (files.length > 0 && supportedPlanTypes.has(files[0].type)) {
      handleFileUpload(files[0])
    } else {
      setUploadError('Only PDF, PNG, JPG, and JPEG files are accepted.')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = (file: File) => {
    setUploadError(null)

    if (!supportedPlanTypes.has(file.type)) {
      setUploadError('Only PDF, PNG, JPG, and JPEG files are accepted.')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      setUploadError('The uploaded file must be 100 MB or smaller.')
      return
    }

    const fileType = file.type === 'application/pdf' ? 'pdf' : 'image'
    setUploadProgress(100)
    setUploadedFile({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      pages: 1,
      public_id: '',
      secure_url: '',
      file_type: fileType,
    })
    setTotalPages(1)
    setProjectName(file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' '))
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
    setDetection(null)
    setDetectionError(null)

    const phaseTimers = [
      setTimeout(() => setDetectionPhase(1), 700),
      setTimeout(() => setDetectionPhase(2), 1400),
    ]

    try {
      const result: UploadResponse = await projectsApi.uploadPlan(uploadedFile.file, {
        projectName: projectName.trim(),
        notes: notes || undefined,
      })
      phaseTimers.forEach(clearTimeout)

      setUploadedFile(current => current ? {
        ...current,
        name: result.file_name,
        size: result.file_size,
        pages: result.pages,
        public_id: result.public_id,
        secure_url: result.secure_url,
        file_type: result.file_type,
      } : current)
      setCreatedProjectId(result.project_id)
      setDetection(result.detection || null)
      setTotalPages(result.pages)
      setDetectionPhase(3)
      await new Promise(resolve => setTimeout(resolve, 500))
      setDetectionPhase(4)
    } catch (err) {
      phaseTimers.forEach(clearTimeout)
      setDetectionError(
        err instanceof ApiClientError
          ? err.detail
          : 'Failed to upload and analyze the plan. Please try again.',
      )
    }
  }

  const goToReview = () => {
    if (createdProjectId) {
      router.push(`/projects/${createdProjectId}?tab=review`)
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
                Upload a PDF or plan image to begin the take-off process.
              </p>
            </div>

            {/* Upload Zone */}
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
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
                            {uploadedFile.file_type === 'image' ? 'Image plan' : `${uploadedFile.pages} page PDF`}, {uploadedFile.size}
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
                          Drag and drop your PDF or image here, or{' '}
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
                  Files are processed securely and stored in your protected project workspace.
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
                        {step.progress && detectionPhase === 2 && !detectionError && (
                          <div className="mt-2">
                            <Progress value={70} className="h-2" />
                            <p className="mt-1 text-xs text-muted-foreground">
                              Waiting for the AI detection service...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {detectionError && (
                  <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive">Detection failed</p>
                        <p className="mt-1 text-sm text-muted-foreground">{detectionError}</p>
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" onClick={startDetection}>Try Again</Button>
                          <Button size="sm" variant="outline" onClick={() => setCurrentStep(0)}>
                            Back to Upload
                          </Button>
                        </div>
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
                        {detection
                          ? `${detection.total_detections} objects detected in ${totalPages} image`
                          : `PDF uploaded across ${totalPages} page`}
                      </p>
                    </div>
                    {detection && Object.keys(detection.object_counts).length > 0 && (
                      <div className="grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
                        {Object.entries(detection.object_counts).map(([type, count]) => (
                          <div key={type} className="rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm">
                            <p className="truncate text-muted-foreground">{formatDetectionLabel(type)}</p>
                            <p className="text-lg font-semibold">{count}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button onClick={goToReview} size="lg" disabled={!createdProjectId}>
                      Go to Review
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Run in background option */}
            {detectionPhase < 4 && !detectionError && (
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
