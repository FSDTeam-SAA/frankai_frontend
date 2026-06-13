'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { MappingRowsEditor } from './mapping-rows-editor'
import { adminApi, ApiClientError } from '@/lib/api'
import type { MappingTemplate, MappingRow } from '@/lib/api'

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: MappingTemplate | null
  onSuccess: () => void
}

interface FormState {
  name: string
  description: string
  is_default: boolean
  mappings: MappingRow[]
}

const INITIAL_FORM: FormState = {
  name: '',
  description: '',
  is_default: false,
  mappings: [],
}

export function TemplateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: TemplateDialogProps) {
  const isEditing = !!template
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens/closes or template changes
  useEffect(() => {
    if (open && template) {
      setForm({
        name: template.name,
        description: template.description || '',
        is_default: template.is_default || false,
        mappings: (template.mappings || []).map((m) => ({
          symbolType: m.symbolType || m.symbol_type || '',
          productCode: m.productCode || m.product_code || '',
          description: m.description || '',
          unit: m.unit || 'ea',
          notes: m.notes || '',
          status: m.status || 'unmapped',
        })),
      })
      setError(null)
    } else if (open && !template) {
      setForm(INITIAL_FORM)
      setError(null)
    }
  }, [open, template])

  const handleSave = useCallback(async () => {
    // Validate
    if (!form.name.trim()) {
      setError('Template name is required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Normalize mappings for backend (camelCase -> snake_case in request body)
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        is_default: form.is_default,
        mappings: form.mappings.map((m) => ({
          symbol_type: m.symbolType || '',
          product_code: m.productCode || '',
          description: m.description || '',
          unit: m.unit || 'ea',
          notes: m.notes || '',
          status: m.status || 'unmapped',
        })),
      }

      if (isEditing && template) {
        await adminApi.updateTemplate(template._id, payload)
      } else {
        await adminApi.createTemplate(payload)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.detail
          : 'Failed to save template.'
      setError(message)
      console.error('Template save error:', err)
    } finally {
      setSaving(false)
    }
  }, [form, isEditing, template, onSuccess, onOpenChange])

  const handleMappingsChange = useCallback((mappings: MappingRow[]) => {
    setForm((prev) => ({ ...prev, mappings }))
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the template name, description, and product mappings.'
              : 'Create a new mapping template with pre-configured product mappings.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="template-name"
              placeholder="e.g. Standard Electrical Fitout"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-desc">Description</Label>
            <Textarea
              id="template-desc"
              placeholder="Brief description of this template's use case"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={2}
            />
          </div>

          {/* Default */}
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="template-default">Set as Default</Label>
              <p className="text-sm text-muted-foreground">
                This template will be automatically applied to new projects.
              </p>
            </div>
            <Switch
              id="template-default"
              checked={form.is_default}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, is_default: checked }))
              }
            />
          </div>

          {/* Mappings */}
          <div className="space-y-2">
            <Label>Product Mappings</Label>
            <p className="text-sm text-muted-foreground">
              Define which products map to each symbol type.
            </p>
            <MappingRowsEditor
              mappings={form.mappings}
              onChange={handleMappingsChange}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              'Update Template'
            ) : (
              'Create Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}