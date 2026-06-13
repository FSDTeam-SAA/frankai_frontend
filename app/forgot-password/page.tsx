'use client'

import React from "react"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers, Loader2, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { authApi, ApiClientError } from '@/lib/api'

type StepType = 'email' | 'verify-token' | 'reset-password' | 'success'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<StepType>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Form states
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (currentStep !== 'success') return

    const timeoutId = window.setTimeout(() => {
      router.push('/login')
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [currentStep, router])

  // Step 1: Email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setNotice(null)

    try {
      await authApi.forgotPassword(email)
      setResetToken('')
      setCurrentStep('verify-token')
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail)
      } else {
        setError('Unable to connect to server. Please check your connection.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Token verification
  const handleTokenVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = resetToken.trim()

    if (token.length !== 6) {
      setError('Enter the 6-digit verification code.')
      return
    }

    setIsLoading(true)
    setError(null)
    setNotice(null)

    try {
      await authApi.verifyResetToken(email, token)
      setCurrentStep('reset-password')
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail)
      } else {
        setError('Token verification failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setIsLoading(true)

    try {
      await authApi.resetPassword(email, resetToken.trim(), newPassword)
      setCurrentStep('success')
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail)
      } else {
        setError('Password reset failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form to email step
  const handleReset = () => {
    setCurrentStep('email')
    setEmail('')
    setResetToken('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setNotice(null)
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError(null)
    setNotice(null)

    try {
      await authApi.forgotPassword(email)
      setResetToken('')
      setNotice('A new verification code has been sent.')
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail)
      } else {
        setError('Unable to resend code. Please check your connection.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Background pattern */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <Layers className="h-7 w-7 text-primary" />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FrankAI</h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          {currentStep === 'email' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Reset your password</CardTitle>
                <CardDescription>
                  {"Enter your email address and we'll send you a verification code."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com.au"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send verification code'
                    )}
                  </Button>
                </form>
                <div className="mt-4">
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to sign in
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 'verify-token' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Verify your code</CardTitle>
                <CardDescription>
                  {"We've sent a verification code to "}
                  <span className="font-medium text-foreground">{email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTokenVerification} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {notice && (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{notice}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="token">Verification Code</Label>
                    <Input
                      id="token"
                      type="text"
                      placeholder="Enter the 6-digit code"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                    <p className="text-xs text-muted-foreground">
                      Check your email for the verification code
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || resetToken.length !== 6}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify code'
                    )}
                  </Button>
                </form>
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="w-full"
                  >
                    Use a different email
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendCode}
                    className="w-full"
                    disabled={isLoading}
                  >
                    Resend code
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to sign in
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 'reset-password' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl">Create new password</CardTitle>
                <CardDescription>
                  {"Enter your new password below"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset password'
                    )}
                  </Button>
                </form>
                <div className="mt-4">
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to sign in
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 'success' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-xl">Password reset successful</CardTitle>
                <CardDescription>
                  {"Your password has been reset. Redirecting to login..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-center text-sm text-muted-foreground">
                    You can now sign in with your new password.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/login">Go to Login</Link>
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
