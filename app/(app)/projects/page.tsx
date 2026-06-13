'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  FolderOpen,
  Copy,
  Download,
  Trash2,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'
import Loading from './loading'
import { projectsApi } from '@/lib/api'
import type { ProjectResponse } from '@/lib/api'

function formatProjectDate(value?: string | null, includeYear = true) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' as const } : {}),
  })
}

function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectsApi.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      })
      setProjects(data)
    } catch (err) {
      setError('Failed to load projects. Make sure the backend server is running.')
      console.error('Projects fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleDelete = async (projectId: string) => {
    try {
      await projectsApi.delete(projectId)
      setProjects(prev => prev.filter(p => p._id !== projectId))
    } catch {
      // silently fail
    }
  }

  const handleExport = async (projectId: string) => {
    try {
      const data = await projectsApi.export(projectId, 'simpro')
      const csvRows: string[] = []
      csvRows.push('Product Code,Description,Quantity,Unit,Notes')
      data.rows.forEach(row => {
        csvRows.push(`"${row.product_code || ''}","${row.description || ''}","${row.quantity}","${row.unit || 'ea'}","${row.notes || ''}"`)
      })
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
    }
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all your electrical take-off projects.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/new-takeoff">
            <Plus className="h-5 w-5" />
            New Take-off
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9 sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="needs-review">Needs Review</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="exported">Exported</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Table view</span>
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{error}</p>
              <Button variant="link" className="h-auto p-0 text-sm" onClick={fetchProjects}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {isLoading ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Loading projects...</p>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No projects found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by creating your first take-off'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button asChild className="mt-4">
                <Link href="/new-takeoff">
                  <Plus className="mr-2 h-4 w-4" />
                  New Take-off
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Project Name</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead className="text-center">Pages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Symbols</TableHead>
                  <TableHead>Last Exported</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project._id} className="border-border/50">
                    <TableCell>
                      <Link
                        href={`/projects/${project._id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {project.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{project.file_name}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatProjectDate(project.created_at)}
                    </TableCell>
                    <TableCell className="text-center">{project.pages}</TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      {project.symbols_count > 0 ? project.symbols_count : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatProjectDate(project.last_exported_at, false)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project._id}`} className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4" />
                              Open
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2" onClick={() => handleExport(project._id)}>
                            <Download className="h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(project._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project._id} className="border-border/50 bg-card/50 transition-colors hover:border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/projects/${project._id}`}>
                      <CardTitle className="line-clamp-1 text-base hover:text-primary hover:underline">
                        {project.name}
                      </CardTitle>
                    </Link>
                    <CardDescription className="mt-1">{project.file_name}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/projects/${project._id}`} className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          Open
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2" onClick={() => handleExport(project._id)}>
                        <Download className="h-4 w-4" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-destructive"
                        onClick={() => handleDelete(project._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <StatusBadge status={project.status} />
                  <span className="text-sm text-muted-foreground">
                    {formatProjectDate(project.created_at, false)}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-sm">
                  <span className="text-muted-foreground">{project.pages} pages</span>
                  <span className="font-medium">
                    {project.symbols_count > 0 ? `${project.symbols_count} symbols` : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WrappedProjectsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProjectsPage />
    </Suspense>
  )
}
