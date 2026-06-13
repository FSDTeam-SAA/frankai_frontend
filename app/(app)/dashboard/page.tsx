'use client'

import React, { Suspense, useState, useEffect, useCallback } from "react"
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/ui/status-badge'
import { useSearchParams } from 'next/navigation'
import {
  Plus,
  Search,
  FileText,
  Clock,
  Target,
  Layers,
  MoreHorizontal,
  FolderOpen,
  Copy,
  Download,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import { projectsApi } from '@/lib/api'
import type { DashboardStats, ProjectResponse } from '@/lib/api'
import Loading from './loading'

const defaultStats: DashboardStats = {
  plans_processed: 0,
  avg_processing_time: '2m 34s',
  avg_confidence: '0',
  total_symbols: 0,
}

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

function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statsData, projectsData] = await Promise.all([
        projectsApi.getStats(),
        projectsApi.list({ status: statusFilter !== 'all' ? statusFilter : undefined, search: searchQuery || undefined }),
      ])
      setStats(statsData)
      setProjects(projectsData)
    } catch (err) {
      setError('Failed to load data. Make sure the backend server is running.')
      console.error('Dashboard fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (projectId: string) => {
    try {
      await projectsApi.delete(projectId)
      setProjects(prev => prev.filter(p => p._id !== projectId))
    } catch {
      // silently fail, could add toast later
    }
  }

  const handleExport = async (projectId: string) => {
    try {
      const data = await projectsApi.export(projectId, 'simpro')
      // Convert to CSV and download
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

  const filteredProjects = projects

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back. Here's an overview of your take-off activity.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/new-takeoff">
            <Plus className="h-5 w-5" />
            New Take-off
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plans Processed
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.plans_processed}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Processing Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avg_processing_time}</div>
            <p className="text-xs text-muted-foreground">Per project</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Detection Confidence
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avg_confidence}%</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <div className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Symbols Detected
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_symbols.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Error state */}
      {error && (
        <Card className="mb-8 border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{error}</p>
              <Button variant="link" className="h-auto p-0 text-sm" onClick={fetchData}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Projects Table */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Your electrical take-off projects</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  className="pl-9 sm:w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-[140px]">
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Project Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Pages</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Symbols</TableHead>
                    <TableHead>Last Exported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project._id} className="border-border/50">
                      <TableCell>
                        <Link
                          href={`/projects/${project._id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {project.name}
                        </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatProjectDate(project.created_at)}
                      </TableCell>
                      <TableCell className="text-center">{project.pages}</TableCell>
                      <TableCell>
                        <StatusBadge status={project.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {project.symbols_count > 0 ? (
                            <>
                              <span className="font-medium">{project.symbols_count}</span>
                              <span className="text-muted-foreground">total</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function WrappedDashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardPage />
    </Suspense>
  )
}
