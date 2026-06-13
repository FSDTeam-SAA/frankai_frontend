'use client'

import React, { useState, useEffect, useCallback } from "react"
import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge, ConfidenceBadge, SymbolTypeBadge, PageReferenceBadge } from '@/components/ui/status-badge'
import { ElectricalPlanView } from '@/components/plan/electrical-plan-view'
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  Edit3,
  Undo2,
  Redo2,
  CheckCircle,
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Download,
  Copy,
  FileText,
  Settings,
  Clock,
  Ruler,
  Cable,
  Info,
  ChevronLeft,
  ChevronRight,
  Shield,
  Save,
  Upload,
  Lightbulb,
  Plug,
  Wind,
  Network,
  DoorOpen,
  MousePointer,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  symbolTypeLabels,
  type DetectedSymbol as LocalDetectedSymbol,
  type MappingRow as LocalMappingRow,
} from '@/lib/store'
import Link from 'next/link'
import { projectsApi, adminApi } from '@/lib/api'
import type { ProjectDetailResponse, MappingRow as ApiMappingRow } from '@/lib/api'

const symbolIcons: Record<string, React.ElementType> = {
  light: Lightbulb,
  downlight: Lightbulb,
  gpo: Plug,
  fan: Wind,
  data: Network,
  exit: DoorOpen,
  emergency: AlertTriangle,
  switch: Settings,
}

const Loading = () => null

export default function ProjectWorkspacePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProjectWorkspace />
    </Suspense>
  )
}

const ProjectWorkspace = () => {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const initialTab = searchParams.get('tab') || 'review'
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [project, setProject] = useState<ProjectDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Review state
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [confidenceThreshold, setConfidenceThreshold] = useState([70])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(100)
  const [editMode, setEditMode] = useState<'select' | 'add' | 'delete'>('select')
  const [reviewView, setReviewView] = useState<'needs-review' | 'all'>('needs-review')
  
  // Mapping state
  const [mappings, setMappings] = useState<ApiMappingRow[]>([])
  
  // Undo/Redo history
  const [history, setHistory] = useState<LocalDetectedSymbol[][]>([])
  const [historyIndex, setHistoryIndex] = useState(0)
  
  // Export state
  const [exportMode, setExportMode] = useState<'basic' | 'simpro'>('simpro')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exporting, setExporting] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const symbols: any[] = (project?.symbols || []).map(s => ({
    ...s,
    id: s._id || s.id || '',
  }))

  const fetchProject = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectsApi.getById(projectId)
      setProject(data)
      setMappings(data.mappings || [])
      const syms = (data.symbols || []).map(s => ({
        ...s,
        id: s._id || s.id || '',
      }))
      setHistory([syms])
      setHistoryIndex(0)
    } catch (err) {
      setError('Failed to load project. Make sure the backend server is running.')
      console.error('Project fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const lowConfidenceSymbols = symbols.filter(s => s.confidence < confidenceThreshold[0])
  const symbolCounts = symbols.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const mappedCount = mappings.filter(m => m.status === 'mapped').length
  const totalCategories = mappings.length
  
  const filteredSymbols = symbols.filter(s => {
    const matchesCategory = categoryFilter === 'all' || s.type === categoryFilter
    const matchesSearch = searchQuery === '' || s.type.includes(searchQuery.toLowerCase()) || s.label.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesReviewView = reviewView === 'all' || (!s.verified && s.confidence < confidenceThreshold[0])
    return matchesCategory && matchesSearch && matchesReviewView
  })
  
  const pageSymbols = filteredSymbols.filter(s => s.page === currentPage)

  const saveToHistory = (newSymbols: LocalDetectedSymbol[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newSymbols)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleVerifySymbol = async (id: string) => {
    const symbol = symbols.find(s => s.id === id)
    if (!symbol) return
    const newSymbols = symbols.map(s => s.id === id ? { ...s, verified: !s.verified } : s)
    saveToHistory(newSymbols)
    // Update local state immediately
    if (project) {
      setProject({
        ...project,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        symbols: newSymbols as any,
      })
    }
    // Save to backend
    try {
      await projectsApi.updateSymbol(projectId, id, { verified: !symbol.verified })
    } catch {
      // silently fail
    }
  }

  const handleDeleteSymbol = async (id: string) => {
    const newSymbols = symbols.filter(s => s.id !== id)
    saveToHistory(newSymbols)
    if (project) {
      setProject({
        ...project,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        symbols: [...newSymbols] as any,
      })
    }
    setSelectedSymbolId(null)
    try {
      await projectsApi.deleteSymbol(projectId, id)
    } catch {
      // silently fail
    }
  }

  const handleChangeType = async (id: string, newType: string) => {
    const label = newType === 'downlight' ? 'D1' : newType === 'gpo' ? 'GPO' : newType === 'fan' ? 'EF' : newType === 'data' ? 'DATA' : newType === 'exit' ? 'EX1' : newType === 'emergency' ? 'EM1' : newType === 'switch' ? 'MS1' : 'B1'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newSymbols = symbols.map(s => s.id === id ? { ...s, type: newType as any, label } : s)
    saveToHistory(newSymbols)
    if (project) {
      setProject({
        ...project,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        symbols: [...newSymbols] as any,
      })
    }
    try {
      await projectsApi.updateSymbol(projectId, id, { type: newType, label })
    } catch {
      // silently fail
    }
  }
  
  const handleAddSymbol = () => {
    const newId = `new-${Date.now()}`
    const newSymbol: LocalDetectedSymbol = {
      id: newId,
      type: 'light',
      label: 'B1',
      x: 400 + Math.random() * 100,
      y: 250 + Math.random() * 100,
      page: currentPage,
      confidence: 100,
      verified: true,
    }
    const newSymbols = [...symbols, newSymbol]
    saveToHistory(newSymbols)
    if (project) {
      setProject({
        ...project,
        symbols: [...newSymbols] as ProjectDetailResponse['symbols'],
      })
    }
    setSelectedSymbolId(newId)
  }
  
  const handleUndo = () => {
    if (canUndo) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
    if (project) {
      setProject({
        ...project,
        symbols: [...history[newIndex]] as ProjectDetailResponse['symbols'],
      })
      }
    }
  }
  
  const handleRedo = () => {
    if (canRedo) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      if (project) {
        setProject({
          ...project,
          symbols: history[newIndex] as ProjectDetailResponse['symbols'],
        })
      }
    }
  }

  const handleSaveSymbols = async () => {
    setIsSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await projectsApi.batchSaveSymbols(projectId, symbols as any)
    } catch {
      // silently fail
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveMappings = async () => {
    setIsSaving(true)
    try {
      await projectsApi.saveMappings(projectId, mappings)
    } catch {
      // silently fail
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await projectsApi.export(projectId, exportMode)
      const csvRows: string[] = []
      if (exportMode === 'simpro') {
        csvRows.push('Product Code,Description,Quantity,Unit,Notes')
        data.rows.forEach(row => {
          csvRows.push(`"${row.product_code || ''}","${row.description || ''}","${row.quantity}","${row.unit || 'ea'}","${row.notes || ''}"`)
        })
      } else {
        csvRows.push('Symbol Type,Quantity')
        data.rows.forEach(row => {
          csvRows.push(`"${row.symbol_type || ''}","${row.quantity}"`)
        })
      }
      const csvString = csvRows.join('\n')
      const blob = new Blob([csvString], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.project_name || 'export'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail
    } finally {
      setExporting(false)
      setShowExportDialog(false)
    }
  }

  const handleLoadTemplate = async () => {
    try {
      const templates = await adminApi.listTemplates()
      if (templates.length > 0) {
        const template = templates[0]
        setMappings(template.mappings || [])
      }
    } catch {
      // silently fail
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-400" />
          <p className="text-lg font-medium">{error || 'Project not found'}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
        {/* Project Header */}
        <div className="border-b border-border bg-card/50 px-4 py-4 lg:px-8">
          <div className="mx-auto max-w-screen-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{project.pages} pages</span>
                    <span>|</span>
                    <span>{symbols.length} symbols</span>
                    <StatusBadge status={project.status} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveSymbols} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
                <Button size="sm" onClick={() => setShowExportDialog(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b border-border bg-background">
            <div className="mx-auto max-w-screen-2xl px-4 lg:px-8">
              <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-0 bg-transparent p-0">
                <TabsTrigger value="review" className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Review & Edit
                </TabsTrigger>
                <TabsTrigger value="mapping" className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Mapping
                </TabsTrigger>
                <TabsTrigger value="export" className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Export
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Review & Edit Tab */}
          <TabsContent value="review" className="mt-0 flex-1">
            <div className="flex h-[calc(100vh-12rem)]">
              {/* Left Sidebar */}
              <div className="flex w-80 flex-col border-r border-border bg-card/30">
                <div className="border-b border-border p-4">
                  <div className="flex rounded-lg bg-muted p-1">
                    <button onClick={() => setReviewView('needs-review')} className={cn('flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors', reviewView === 'needs-review' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                      <span className="flex items-center justify-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Needs Review
                        {lowConfidenceSymbols.length > 0 && (
                          <Badge variant="secondary" className="ml-1 h-5 bg-amber-500/20 text-amber-400">{lowConfidenceSymbols.length}</Badge>
                        )}
                      </span>
                    </button>
                    <button onClick={() => setReviewView('all')} className={cn('flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors', reviewView === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                      All Items
                    </button>
                  </div>
                </div>
                
                {reviewView === 'all' && (
                  <div className="space-y-4 border-b border-border p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search symbols..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        <SelectItem value="light">Lights</SelectItem>
                        <SelectItem value="gpo">Power Points (GPOs)</SelectItem>
                        <SelectItem value="fan">Fans</SelectItem>
                        <SelectItem value="data">Data Outlets</SelectItem>
                        <SelectItem value="exit">Exit Lights</SelectItem>
                        <SelectItem value="emergency">Emergency Lights</SelectItem>
                        <SelectItem value="switch">Switches</SelectItem>
                        <SelectItem value="downlight">Downlights</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex-1 overflow-auto">
                  {pageSymbols.map((symbol) => {
                    const Icon = symbolIcons[symbol.type]
                    return (
                      <div key={symbol.id} onClick={() => setSelectedSymbolId(symbol.id)} className={cn('flex cursor-pointer items-center gap-3 border-b border-border/50 p-3 transition-colors hover:bg-muted/50', selectedSymbolId === symbol.id && 'bg-primary/10 ring-1 ring-inset ring-primary/30', !symbol.verified && symbol.confidence < 70 && 'border-l-2 border-l-amber-500 bg-amber-500/5')}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">{Icon && <Icon className="h-5 w-5 text-muted-foreground" />}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <SymbolTypeBadge type={symbol.type} />
                            {symbol.verified && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
                            {!symbol.verified && symbol.confidence < 70 && <Eye className="h-3.5 w-3.5 text-amber-400" />}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <PageReferenceBadge page={symbol.page} />
                            <ConfidenceBadge confidence={symbol.confidence} size="sm" />
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleVerifySymbol(symbol.id)}><CheckCircle className="mr-2 h-4 w-4" />{symbol.verified ? 'Verified' : 'Mark verified'}</DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger><Edit3 className="mr-2 h-4 w-4" />Change type</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {Object.entries(symbolTypeLabels).map(([type, label]) => (
                                  <DropdownMenuItem key={type} onClick={() => handleChangeType(symbol.id, type)} className={symbol.type === type ? 'bg-primary/10' : ''}>
                                    {symbolIcons[type] && React.createElement(symbolIcons[type], { className: 'mr-2 h-4 w-4' })}
                                    {label}
                                    {symbol.type === type && <CheckCircle className="ml-auto h-3 w-3 text-primary" />}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSymbol(symbol.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Centre - Plan Viewer */}
              <div className="flex flex-1 flex-col bg-muted/20">
                <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-sm">Page {currentPage} of {project.pages}</span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(project.pages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(25, z - 25))}><ZoomOut className="h-4 w-4" /></Button>
                    <span className="w-12 text-center text-sm">{zoom}%</span>
                    <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(200, z + 25))}><ZoomIn className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon"><Maximize2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="relative flex-1 overflow-auto p-4">
                  <ElectricalPlanView zoom={zoom} currentPage={currentPage} selectedSymbol={selectedSymbolId} onSymbolClick={setSelectedSymbolId} symbols={pageSymbols} />
                </div>
              </div>

              {/* Right Panel */}
              <div className="flex w-72 flex-col border-l border-border bg-card/30">
                <div className="border-b border-border p-4"><h3 className="font-semibold">Tools & Summary</h3></div>
                <div className="border-b border-border p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={editMode === 'select' ? 'default' : 'outline'} size="sm" onClick={() => setEditMode('select')} className="justify-start"><MousePointer className="mr-2 h-4 w-4" />Select</Button>
                    <Button variant={editMode === 'add' ? 'default' : 'outline'} size="sm" onClick={() => { setEditMode('add'); handleAddSymbol() }} className="justify-start"><Plus className="mr-2 h-4 w-4" />Add</Button>
                    <Button variant={editMode === 'delete' ? 'destructive' : 'outline'} size="sm" onClick={() => { if (selectedSymbolId) handleDeleteSymbol(selectedSymbolId); setEditMode('delete') }} disabled={editMode === 'delete' && !selectedSymbolId} className="justify-start"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                    <Button variant="outline" size="sm" onClick={handleUndo} disabled={!canUndo} className="justify-start"><Undo2 className="mr-2 h-4 w-4" />Undo</Button>
                    <Button variant="outline" size="sm" onClick={handleRedo} disabled={!canRedo} className="justify-start col-span-2"><Redo2 className="mr-2 h-4 w-4" />Redo</Button>
                  </div>
                </div>
                <div className="border-b border-border p-4">
                  <h4 className="mb-3 text-sm font-medium">Summary</h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50"><TableHead className="h-8 text-xs">Type</TableHead><TableHead className="h-8 text-center text-xs">Qty</TableHead><TableHead className="h-8 text-center text-xs">Verified</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(symbolCounts).map(([type, count]) => {
                        const verified = symbols.filter(s => s.type === type && s.verified).length
                        return <TableRow key={type} className="border-border/50"><TableCell className="py-2 text-xs">{symbolTypeLabels[type]?.split(' ')[0]}</TableCell><TableCell className="py-2 text-center text-xs font-medium">{count}</TableCell><TableCell className="py-2 text-center text-xs text-muted-foreground">{verified}</TableCell></TableRow>
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex-1 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Overall confidence</span><span className="font-medium">{Math.round(symbols.reduce((acc, s) => acc + s.confidence, 0) / (symbols.length || 1))}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${symbols.length > 0 ? (symbols.reduce((acc, s) => acc + s.confidence, 0) / symbols.length) : 0}%` }} /></div>
                    <p className="text-[11px] text-muted-foreground">{lowConfidenceSymbols.length > 0 ? `${lowConfidenceSymbols.length} items need review before export` : 'All items are ready for export'}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Button className="w-full" onClick={() => setActiveTab('export')}><Download className="mr-2 h-4 w-4" />Continue to Export</Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Mapping Tab */}
          <TabsContent value="mapping" className="mt-0 p-8">
            <div className="mx-auto max-w-screen-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Symbol Mapping</h2>
                  <p className="text-sm text-muted-foreground">Map detected symbols to product codes and descriptions for export.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
                    <span className="text-sm text-muted-foreground">Detection confidence:</span>
                    <span className="font-semibold">{Math.round(symbols.reduce((acc, s) => acc + s.confidence, 0) / (symbols.length || 1))}%</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
                    <span className="text-sm text-muted-foreground">Mapping complete:</span>
                    <span className="font-semibold">{mappedCount}/{totalCategories}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLoadTemplate}><Upload className="mr-2 h-4 w-4" />Load Template</Button>
                  <Button variant="outline" size="sm" onClick={handleSaveMappings} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Mappings
                  </Button>
                </div>
              </div>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="w-[150px]">Symbol Type</TableHead>
                        <TableHead>Product Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[80px]">Unit</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.map((mapping, index) => (
                        <TableRow key={mapping.symbolType || mapping.symbol_type || index} className="border-border/50">
                          <TableCell><SymbolTypeBadge type={mapping.symbolType || mapping.symbol_type || ''} /></TableCell>
                          <TableCell>
                            <Input value={mapping.productCode || mapping.product_code || ''} onChange={(e) => {
                              const newMappings = [...mappings]
                              newMappings[index] = { ...newMappings[index], productCode: e.target.value, product_code: e.target.value, status: e.target.value ? 'mapped' : 'unmapped' }
                              setMappings(newMappings)
                            }} placeholder="Enter code..." className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Input value={mapping.description || ''} onChange={(e) => {
                              const newMappings = [...mappings]
                              newMappings[index] = { ...newMappings[index], description: e.target.value }
                              setMappings(newMappings)
                            }} placeholder="Enter description..." className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Select value={mapping.unit || 'ea'} onValueChange={(value) => {
                              const newMappings = [...mappings]
                              newMappings[index] = { ...newMappings[index], unit: value }
                              setMappings(newMappings)
                            }}>
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ea">ea</SelectItem>
                                <SelectItem value="m">m</SelectItem>
                                <SelectItem value="set">set</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input value={mapping.notes || ''} onChange={(e) => {
                              const newMappings = [...mappings]
                              newMappings[index] = { ...newMappings[index], notes: e.target.value }
                              setMappings(newMappings)
                            }} placeholder="Optional notes..." className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Badge variant={mapping.status === 'mapped' ? 'default' : 'secondary'} className={mapping.status === 'mapped' ? 'bg-success text-success-foreground' : ''}>
                              {mapping.status === 'mapped' ? 'Mapped' : 'Unmapped'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="mt-0 p-8">
            <div className="mx-auto max-w-screen-lg">
              <div className="mb-6">
                <h2 className="text-xl font-bold">Export Take-off</h2>
                <p className="text-sm text-muted-foreground">Download your take-off data in CSV format.</p>
              </div>
              {lowConfidenceSymbols.length > 0 ? (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <Eye className="mt-0.5 h-5 w-5 text-amber-400" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-300">{lowConfidenceSymbols.length} items need review</p>
                    <p className="text-sm text-muted-foreground">Some detected items have low confidence. We recommend reviewing these before exporting.</p>
                    <Button variant="link" className="h-auto p-0 text-amber-400" onClick={() => setActiveTab('review')}>Review items</Button>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{Math.round(symbols.reduce((acc, s) => acc + s.confidence, 0) / (symbols.length || 1))}%</p>
                    <p className="text-xs text-muted-foreground">avg confidence</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div className="flex-1">
                    <p className="font-medium">Ready to export</p>
                    <p className="text-sm text-muted-foreground">All items have been verified or have high confidence.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">{Math.round(symbols.reduce((acc, s) => acc + s.confidence, 0) / (symbols.length || 1))}%</p>
                    <p className="text-xs text-muted-foreground">avg confidence</p>
                  </div>
                </div>
              )}
              <Card className="mb-6 border-border/50 bg-card/50">
                <CardHeader><CardTitle className="text-base">Export Format</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div onClick={() => setExportMode('basic')} className={cn('flex-1 cursor-pointer rounded-lg border-2 p-4 transition-all', exportMode === 'basic' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}>
                      <p className="font-medium">Basic Counts</p>
                      <p className="mt-1 text-sm text-muted-foreground">Simple symbol counts by category.</p>
                    </div>
                    <div onClick={() => setExportMode('simpro')} className={cn('flex-1 cursor-pointer rounded-lg border-2 p-4 transition-all', exportMode === 'simpro' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}>
                      <p className="font-medium">SimPRO Format</p>
                      <p className="mt-1 text-sm text-muted-foreground">Product codes, descriptions, quantities for SimPRO import.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button size="lg" onClick={handleExport} disabled={exporting}>
                  {exporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporting...</> : <><Download className="mr-2 h-4 w-4" />Download CSV</>}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}