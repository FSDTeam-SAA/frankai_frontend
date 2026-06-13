'use client'

import Link from 'next/link'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarClock,
  Camera,
  CheckCircle2,
  IdCard,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Shield,
  Upload,
  User,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi, setUserData } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default function ProfilePage() {
  const { user, isLoading, refreshUser, logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  const initials = useMemo(() => {
    if (!user?.name) return 'U'
    return user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }, [user?.name])

  const hasChanges = Boolean(user && (name.trim() !== user.name || email.trim() !== user.email))

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError(null)
    setMessage(null)
    try {
      await refreshUser()
      setMessage('Profile refreshed.')
    } catch {
      setError('Unable to refresh profile. Check that the backend is running.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSave = async () => {
    if (!user || !hasChanges) return

    setIsSaving(true)
    setError(null)
    setMessage(null)
    try {
      const updated = await authApi.updateMe({
        name: name.trim(),
        email: email.trim(),
      })
      setUserData(updated)
      await refreshUser()
      setMessage('Profile changes saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    setMessage(null)

    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image must be 5 MB or smaller.')
      return
    }

    setIsUploading(true)
    try {
      const updated = await authApi.uploadAvatar(file)
      setUserData(updated)
      await refreshUser()
      setMessage('Profile image uploaded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload profile image.')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-screen-xl items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-screen-sm px-4 py-16">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Profile unavailable</CardTitle>
            <CardDescription>Sign in again to view your account profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Update your FrankAI account details and profile image.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin">Admin settings</Link>
          </Button>
        </div>
      </div>

      {(message || error) && (
        <div
          className={
            error
              ? 'mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'
              : 'mb-6 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success'
          }
        >
          {error || message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-primary/30 bg-primary/10">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.name} profile image`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
                    {initials}
                  </div>
                )}
                <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-md bg-background/90 shadow-sm">
                  <Camera className="h-4 w-4" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-xl">{user.name}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </CardDescription>
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload image
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email address</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-role">Role</Label>
                <Input id="profile-role" value={user.role} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-id">User ID</Label>
                <Input id="profile-id" value={user._id || user.id} readOnly />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setName(user.name)
                  setEmail(user.email)
                  setError(null)
                  setMessage(null)
                }}
                disabled={!hasChanges || isSaving}
              >
                Reset
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Current access summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">Access</span>
                </div>
                <Badge className="bg-success text-success-foreground">
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Permission</span>
                </div>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <IdCard className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Profile</span>
                </div>
                <Badge variant="outline">{user.avatar_url ? 'Image set' : 'No image'}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Account timestamps from the backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <CalendarClock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last login</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.last_login)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={logout}
              >
                Sign out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
