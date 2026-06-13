'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Edit3,
  Trash2,
  Users,
  Key,
  Shield,
  Activity,
  Layers,
  FileText,
  CheckCircle,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Lightbulb,
  Plug,
  Wind,
  Network,
  DoorOpen,
  MoreHorizontal,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { adminApi, ApiClientError } from '@/lib/api'
import type { SymbolCategory, MappingTemplate, TeamMember, ActivityLog, SystemHealth } from '@/lib/api'

const symbolIcons: Record<string, React.ElementType> = {
  light: Lightbulb,
  gpo: Plug,
  fan: Wind,
  data: Network,
  exit: DoorOpen,
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('symbols')
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [retentionDays, setRetentionDays] = useState('30')
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true)

  // Symbol categories
  const [categories, setCategories] = useState<SymbolCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)

  // Mapping templates
  const [templates, setTemplates] = useState<MappingTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamLoading, setTeamLoading] = useState(true)

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [activityLoading, setActivityLoading] = useState(true)

  // System health
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  // Error state
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setError(null)
    try {
      const [cats, temps, team, act, health] = await Promise.all([
        adminApi.listCategories(),
        adminApi.listTemplates(),
        adminApi.listTeam(),
        adminApi.getActivity(10),
        adminApi.getSystemHealth(),
      ])
      setCategories(cats)
      setTemplates(temps)
      setTeamMembers(team)
      setActivityLogs(act)
      setSystemHealth(health)
    } catch (err) {
      setError('Failed to load data. Make sure the backend server is running.')
      console.error('Admin fetch error:', err)
    } finally {
      setCategoriesLoading(false)
      setTemplatesLoading(false)
      setTeamLoading(false)
      setActivityLoading(false)
      setHealthLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleCreateCategory = async () => {
    try {
      const created = await adminApi.createCategory({ name: newCategoryName, description: newCategoryDesc })
      setCategories(prev => [...prev, created])
      setCategoryDialogOpen(false)
      setNewCategoryName('')
      setNewCategoryDesc('')
    } catch (err) {
      console.error('Create category error:', err)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await adminApi.deleteCategory(id)
      setCategories(prev => prev.filter(c => c._id !== id))
    } catch { /* silently fail */ }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      await adminApi.deleteTemplate(id)
      setTemplates(prev => prev.filter(t => t._id !== id))
    } catch { /* silently fail */ }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await adminApi.removeTeamMember(userId)
      setTeamMembers(prev => prev.filter(m => m._id !== userId))
    } catch { /* silently fail */ }
  }

  const handleUpdateMemberRole = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateTeamMember(userId, { role: newRole })
      setTeamMembers(prev => prev.map(m => m._id === userId ? { ...m, role: newRole } : m))
    } catch { /* silently fail */ }
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Admin Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your symbol library, templates, team, and security settings.
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{error}</p>
              <Button variant="link" className="h-auto p-0 text-sm" onClick={fetchAll}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 h-auto w-full justify-start gap-1 rounded-lg bg-muted p-1">
          <TabsTrigger value="symbols" className="gap-2 rounded-md px-4 py-2"><Layers className="h-4 w-4" />Symbol Library</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 rounded-md px-4 py-2"><FileText className="h-4 w-4" />Mapping Templates</TabsTrigger>
          <TabsTrigger value="team" className="gap-2 rounded-md px-4 py-2"><Users className="h-4 w-4" />Team</TabsTrigger>
          <TabsTrigger value="security" className="gap-2 rounded-md px-4 py-2"><Shield className="h-4 w-4" />Security</TabsTrigger>
          <TabsTrigger value="system" className="gap-2 rounded-md px-4 py-2"><Activity className="h-4 w-4" />System Status</TabsTrigger>
        </TabsList>

        {/* Symbol Library Tab */}
        <TabsContent value="symbols" className="space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Symbol Categories</CardTitle><CardDescription>Manage the symbol types available for detection.</CardDescription></div>
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" />Add Category</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Symbol Category</DialogTitle><DialogDescription>Create a new category for symbol detection.</DialogDescription></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2"><Label>Category Name</Label><Input placeholder="e.g., Smoke Detectors" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Description</Label><Input placeholder="Brief description of this category" value={newCategoryDesc} onChange={(e) => setNewCategoryDesc(e.target.value)} /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>Add Category</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className="text-center">Symbols</TableHead><TableHead className="text-center">Status</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => {
                      const Icon = symbolIcons[category._id] || Layers
                      return (
                        <TableRow key={category._id} className="border-border/50">
                          <TableCell><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Icon className="h-5 w-5 text-muted-foreground" /></div><span className="font-medium">{category.name}</span></div></TableCell>
                          <TableCell className="text-muted-foreground">{category.description}</TableCell>
                          <TableCell className="text-center">{category.symbol_count || 0}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={category.active ? 'default' : 'secondary'} className={category.active ? 'bg-success text-success-foreground' : ''}>{category.active ? 'Active' : 'Inactive'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Edit3 className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(category._id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapping Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Mapping Templates</CardTitle><CardDescription>Pre-configured product mappings for quick setup.</CardDescription></div>
                <Button><Plus className="mr-2 h-4 w-4" />Create Template</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Template Name</TableHead><TableHead>Description</TableHead><TableHead>Created</TableHead><TableHead className="text-center">Default</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template._id} className="border-border/50">
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="text-muted-foreground">{template.description}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(template.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                        <TableCell className="text-center">{template.is_default && <Badge variant="outline" className="border-primary text-primary">Default</Badge>}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Edit3 className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                              {!template.is_default && <DropdownMenuItem><CheckCircle className="mr-2 h-4 w-4" />Set as Default</DropdownMenuItem>}
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTemplate(template._id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Team Members</CardTitle><CardDescription>Manage who has access to your organisation.</CardDescription></div>
                <Button><Plus className="mr-2 h-4 w-4" />Invite Member</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {teamLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member._id} className="border-border/50">
                        <TableCell><div><p className="font-medium">{member.name}</p><p className="text-sm text-muted-foreground">{member.email}</p></div></TableCell>
                        <TableCell><Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>{member.role}</Badge></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateMemberRole(member._id, member.role === 'admin' ? 'estimator' : 'admin')}><Edit3 className="mr-2 h-4 w-4" />Toggle Role</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveMember(member._id)}><Trash2 className="mr-2 h-4 w-4" />Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader><CardTitle>Data Retention</CardTitle><CardDescription>Configure how long uploaded files and project data are retained.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5"><Label>Auto-delete uploaded files</Label><p className="text-sm text-muted-foreground">Automatically delete original PDF uploads after processing.</p></div>
                <Switch checked={autoDeleteEnabled} onCheckedChange={setAutoDeleteEnabled} />
              </div>
              <div className="space-y-2">
                <Label>Project data retention period</Label>
                <Select value={retentionDays} onValueChange={setRetentionDays}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="0">Never delete</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Projects older than this will be automatically archived.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardHeader><CardTitle>Security Information</CardTitle><CardDescription>How we keep your data secure.</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { icon: Shield, title: 'Encrypted in transit', description: 'All data is encrypted using TLS 1.3 during transfer.' },
                  { icon: Shield, title: 'Encrypted at rest', description: 'Stored data is encrypted using AES-256 encryption.' },
                  { icon: Clock, title: 'Automatic deletion', description: 'Uploaded files are deleted immediately after processing.' },
                  { icon: Key, title: 'Access controls', description: 'Role-based permissions ensure only authorised access.' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><item.icon className="h-5 w-5 text-primary" /></div>
                    <div><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.description}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Status Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader><CardTitle>System Health</CardTitle><CardDescription>Current status of FrankAI services.</CardDescription></CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : systemHealth ? (
                <div className="space-y-4">
                  {systemHealth.services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-2.5 w-2.5 rounded-full', service.status === 'operational' ? 'bg-success' : 'bg-amber-500')} />
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{service.latency}</span>
                        <Badge className={service.status === 'operational' ? 'bg-success text-success-foreground' : 'bg-amber-500/20 text-amber-400'}>{service.status === 'operational' ? 'Operational' : 'Degraded'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">Unable to load system health.</p>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>System-wide activity log.</CardDescription></CardHeader>
            <CardContent className="p-0">
              {activityLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="divide-y divide-border/50">
                  {activityLogs.map((log) => (
                    <div key={log._id} className="flex items-start gap-4 p-4">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        log.type === 'auth' && 'bg-info/20', log.type === 'export' && 'bg-success/20',
                        log.type === 'project' && 'bg-primary/20', log.type === 'settings' && 'bg-warning/20',
                        log.type === 'security' && 'bg-destructive/20'
                      )}>
                        <Activity className={cn(
                          'h-4 w-4', log.type === 'auth' && 'text-info', log.type === 'export' && 'text-success',
                          log.type === 'project' && 'text-primary', log.type === 'settings' && 'text-warning',
                          log.type === 'security' && 'text-destructive'
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{log.action}</p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{log.user}</span>
                          <span>|</span>
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}