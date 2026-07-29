'use client'

import { useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileCode2,
  ImageIcon,
  Info,
  Layers3,
  Loader2,
  LockKeyhole,
  MousePointerClick,
  Ruler,
  UploadCloud,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiClientError, projectsApi } from '@/lib/api'
import type { DxfLayer, DxfMeasurementSummary, DxfProjectFile } from '@/lib/api'
import { cn } from '@/lib/utils'

interface CableMeasurementPanelProps {
  projectId: string
  projectName: string
  planFileName: string
  imageUrl?: string | null
  initialDxf?: DxfProjectFile | null
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const layerCardStyles = [
  { border: 'border-cyan-500/30', background: 'bg-cyan-500/10', text: 'text-cyan-300', bar: 'bg-cyan-400' },
  { border: 'border-teal-500/30', background: 'bg-teal-500/10', text: 'text-teal-300', bar: 'bg-teal-400' },
  { border: 'border-violet-500/30', background: 'bg-violet-500/10', text: 'text-violet-300', bar: 'bg-violet-400' },
  { border: 'border-amber-500/30', background: 'bg-amber-500/10', text: 'text-amber-300', bar: 'bg-amber-400' },
  { border: 'border-sky-500/30', background: 'bg-sky-500/10', text: 'text-sky-300', bar: 'bg-sky-400' },
  { border: 'border-emerald-500/30', background: 'bg-emerald-500/10', text: 'text-emerald-300', bar: 'bg-emerald-400' },
]

interface LayerResultCardProps {
  layer: DxfLayer
  index: number
  isSelected: boolean
  measurement?: DxfMeasurementSummary
  isMeasurable: boolean
  isBusy: boolean
  onSelect: () => void
}

function LayerResultCard({
  layer,
  index,
  isSelected,
  measurement,
  isMeasurable,
  isBusy,
  onSelect,
}: LayerResultCardProps) {
  const style = layerCardStyles[index % layerCardStyles.length]
  const linePercentage = layer.total_entities > 0
    ? Math.round((layer.line_entities / layer.total_entities) * 100)
    : 0

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!isMeasurable || isBusy}
      aria-pressed={isSelected}
      title={
        isMeasurable
          ? `Select ${layer.layer_name} for measurement`
          : `${layer.layer_name} has no LINE entities and cannot be measured`
      }
      className={cn(
        'group overflow-hidden rounded-lg border bg-card/60 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg',
        style.border,
        isSelected && 'border-primary ring-2 ring-primary/40 shadow-lg shadow-primary/10',
        !isMeasurable && 'cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-none',
        isBusy && 'cursor-wait',
      )}
    >
      <div className={cn('flex items-start justify-between gap-3 border-b p-3', style.border, style.background)}>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            DXF layer
          </p>
          <p className={cn('mt-1 break-all font-mono text-xs font-semibold leading-5', style.text)}>
            {layer.layer_name}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', style.background)}>
            {isSelected ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Layers3 className={cn('h-4 w-4', style.text)} />
            )}
          </div>
          {measurement && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
              Measured
            </span>
          )}
          {!isMeasurable && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              No lines
            </span>
          )}
        </div>
      </div>
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Entities</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums">{layer.total_entities}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lines</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums">{layer.line_entities}</p>
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>Line entity ratio</span>
            <span className="font-medium tabular-nums">{linePercentage}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full transition-all', style.bar)} style={{ width: `${linePercentage}%` }} />
          </div>
        </div>
        {measurement && (
          <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
            <span className="text-muted-foreground">Latest cable length</span>
            <span className="font-semibold tabular-nums text-emerald-300">
              {measurement.total_length_m.toFixed(3)} m
            </span>
          </div>
        )}
        {!isMeasurable && (
          <div className="flex items-start gap-1.5 border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>This layer has no LINE geometry available for cable measurement.</span>
          </div>
        )}
      </div>
    </button>
  )
}

export function CableMeasurementPanel({
  projectId,
  projectName,
  planFileName,
  imageUrl,
  initialDxf,
}: CableMeasurementPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedDxf, setSelectedDxf] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [storedDxf, setStoredDxf] = useState<DxfProjectFile | null>(initialDxf || null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedLayerName, setSelectedLayerName] = useState<string | null>(null)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [measurementError, setMeasurementError] = useState<string | null>(null)

  const layerAnalysis = storedDxf?.layer_analysis || null
  const totalEntities = layerAnalysis?.layers.reduce(
    (total, layer) => total + layer.total_entities,
    0,
  ) || 0
  const totalLineEntities = layerAnalysis?.layers.reduce(
    (total, layer) => total + layer.line_entities,
    0,
  ) || 0
  const measurements = storedDxf?.measurements || []
  const selectedMeasurement = selectedLayerName
    ? measurements.find(measurement => measurement.layer_name === selectedLayerName)
    : undefined

  const selectDxf = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.dxf')) {
      setSelectedDxf(null)
      setFileError('Please select a valid DXF drawing file with the .dxf extension.')
      return
    }

    setSelectedDxf(file)
    setFileError(null)
    setUploadError(null)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) selectDxf(file)
  }

  const removeDxf = () => {
    setSelectedDxf(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadAndAnalyzeDxf = async () => {
    if (!selectedDxf) return

    setIsUploading(true)
    setUploadError(null)
    try {
      const response = await projectsApi.uploadDxf(projectId, selectedDxf)
      setStoredDxf(response.dxf)
      setSelectedDxf(null)
      setSelectedLayerName(null)
      setMeasurementError(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setUploadError(
        error instanceof ApiClientError
          ? error.detail
          : 'Unable to upload and analyze the DXF file. Please try again.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  const selectLayer = (layerName: string) => {
    if (isMeasuring) return
    setSelectedLayerName(layerName)
    setMeasurementError(null)
  }

  const measureSelectedLayer = async () => {
    if (!selectedLayerName || !storedDxf) return

    setIsMeasuring(true)
    setMeasurementError(null)
    try {
      const response = await projectsApi.measureDxfLayer(projectId, selectedLayerName)
      setStoredDxf(current => {
        if (!current) return current
        const currentMeasurements = current.measurements || []
        return {
          ...current,
          measurements: [
            ...currentMeasurements.filter(
              measurement => measurement.layer_name !== response.measurement.layer_name,
            ),
            response.measurement,
          ],
        }
      })
    } catch (error) {
      setMeasurementError(
        error instanceof ApiClientError
          ? error.detail
          : 'Unable to measure the selected DXF layer. Please try again.',
      )
    } finally {
      setIsMeasuring(false)
    }
  }

  return (
    <div className="mx-auto max-w-screen-lg space-y-6 px-4 py-8 lg:px-8">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Cable Measurement</h2>
          <Badge variant="secondary" className="font-normal">Optional</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide the source DXF drawing to prepare this project for accurate cable measurement.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
        <div>
          <p className="text-sm font-semibold text-sky-300">Matching drawing required</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Upload the DXF export of the exact same drawing displayed in the Review &amp; Edit tab.
            The sheet, layout, and revision must match the uploaded plan image; using a DXF from a
            different drawing or revision may produce inaccurate cable measurements.
          </p>
        </div>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCode2 className="h-5 w-5 text-primary" />
                Upload Matching DXF File
              </CardTitle>
              <CardDescription className="mt-1.5">
                Select the CAD source file that corresponds to this project&apos;s uploaded plan.
              </CardDescription>
            </div>
            <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
              DXF only
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="grid gap-4 rounded-lg border border-border/50 bg-muted/20 p-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Current plan" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current plan
                </p>
                <p className="truncate text-sm font-medium">{planFileName || projectName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:border-l sm:border-border/60 sm:pl-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-primary/50 bg-primary/10">
                <FileCode2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Required companion file
                </p>
                <p className="text-sm font-medium">Same drawing in DXF format</p>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".dxf,application/dxf,image/vnd.dxf"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) selectDxf(file)
            }}
          />

          {storedDxf && !selectedDxf && (
            <div className={cn(
              'flex items-center gap-4 rounded-lg border p-4',
              storedDxf.status === 'analyzed'
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : storedDxf.status === 'failed'
                  ? 'border-destructive/30 bg-destructive/10'
                  : 'border-sky-500/30 bg-sky-500/10',
            )}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background/60">
                {storedDxf.status === 'analyzed' ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : storedDxf.status === 'failed' ? (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{storedDxf.file_name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {storedDxf.file_size} &middot; Stored securely and linked to this project
                </p>
                {storedDxf.error && (
                  <p className="mt-1 text-xs text-destructive">{storedDxf.error}</p>
                )}
              </div>
              <Badge variant={storedDxf.status === 'analyzed' ? 'default' : 'secondary'}>
                {storedDxf.status === 'analyzed' ? 'Analyzed' : storedDxf.status === 'failed' ? 'Analysis failed' : 'Processing'}
              </Badge>
            </div>
          )}

          {selectedDxf ? (
            <div className="flex items-center gap-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{selectedDxf.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatFileSize(selectedDxf.size)} &middot; Ready to upload and analyze
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={removeDxf} aria-label="Remove DXF file">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click()
              }}
              onDragOver={event => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={event => {
                event.preventDefault()
                setIsDragging(false)
              }}
              onDrop={handleDrop}
              className={cn(
                'flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                isDragging
                  ? 'border-primary bg-primary/10'
                  : fileError
                    ? 'border-destructive/50 bg-destructive/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30',
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <UploadCloud className="h-7 w-7 text-primary" />
              </div>
              <p className="mt-4 font-medium">Drop the matching DXF file here</p>
              <p className="mt-1 text-sm text-muted-foreground">
                or <span className="font-medium text-primary">browse your computer</span>
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Accepted format: .dxf</p>
            </div>
          )}

          {fileError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Secure project storage</p>
                <p className="text-xs text-muted-foreground">
                  The DXF file and complete layer analysis will be stored with this project.
                </p>
              </div>
            </div>
            <Button onClick={uploadAndAnalyzeDxf} disabled={!selectedDxf || isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Uploading & Analyzing...' : 'Upload & Analyze DXF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">DXF Layer Analysis</CardTitle>
          <CardDescription>
            Review the layers and entity totals returned by the DXF analysis service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {layerAnalysis ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">Layers</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">{layerAnalysis.layer_count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">CAD layers analyzed</p>
                </div>
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-300">Total entities</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">{totalEntities}</p>
                  <p className="mt-1 text-xs text-muted-foreground">All entities across layers</p>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">Line entities</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">{totalLineEntities}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Potential measurable geometry</p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Drawing Layers</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Select a layer containing one or more LINE entities to measure its cable length
                    </p>
                  </div>
                  <Badge variant="secondary">{layerAnalysis.layers.length} layer cards</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {layerAnalysis.layers.map((layer, index) => {
                    const measurement = measurements.find(
                      item => item.layer_name === layer.layer_name,
                    )
                    return (
                      <LayerResultCard
                        key={`${layer.layer_name}-${index}`}
                        layer={layer}
                        index={index}
                        isSelected={selectedLayerName === layer.layer_name}
                        measurement={measurement}
                        isMeasurable={layer.line_entities > 0}
                        isBusy={isMeasuring}
                        onSelect={() => selectLayer(layer.layer_name)}
                      />
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/10 p-4 sm:p-5">
                {selectedLayerName ? (
                  <div className="space-y-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <MousePointerClick className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Selected layer
                          </p>
                          <p className="truncate font-mono text-sm font-semibold text-primary">
                            {selectedLayerName}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Measurement will reuse {storedDxf?.file_name || 'the stored DXF'} from secure project storage.
                          </p>
                        </div>
                      </div>
                      <Button onClick={measureSelectedLayer} disabled={isMeasuring} className="shrink-0">
                        {isMeasuring ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Ruler className="mr-2 h-4 w-4" />
                        )}
                        {isMeasuring
                          ? 'Measuring Layer...'
                          : selectedMeasurement
                            ? 'Measure Again'
                            : 'Measure Selected Layer'}
                      </Button>
                    </div>

                    {measurementError && (
                      <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{measurementError}</span>
                      </div>
                    )}

                    {selectedMeasurement && (
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold">Measurement Summary</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Complete segment geometry is stored securely with the project.
                            </p>
                          </div>
                          <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                            Saved
                          </Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
                              Segments
                            </p>
                            <p className="mt-1 text-3xl font-bold tabular-nums">
                              {selectedMeasurement.segment_count}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">Measured cable segments</p>
                          </div>
                          <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
                              Total length (mm)
                            </p>
                            <p className="mt-1 text-3xl font-bold tabular-nums">
                              {selectedMeasurement.total_length_mm.toLocaleString('en-US', {
                                maximumFractionDigits: 3,
                              })}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">Millimetres</p>
                          </div>
                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">
                              Total length (m)
                            </p>
                            <p className="mt-1 text-3xl font-bold tabular-nums">
                              {selectedMeasurement.total_length_m.toLocaleString('en-US', {
                                maximumFractionDigits: 3,
                              })}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">Metres</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-28 flex-col items-center justify-center text-center">
                    <MousePointerClick className="h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">Select one layer to measure</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Choose a layer card above. Only one layer can be measured at a time.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/10 p-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <Layers3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">No DXF layer analysis yet</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
              Upload the matching DXF file to discover its layers and entity totals.
            </p>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
