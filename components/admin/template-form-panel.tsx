'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, X, Save } from 'lucide-react'
import { MappingRowsEditor } from './mapping-rows-editor'
import { adminApi, ApiClientError } from '@/lib/api'
import type { MappingTemplate, MappingRow } from '@/lib/api'

interface TemplateFormPanelProps {
  template?: MappingTemplate | null
  onSaved: () => void
  onCancel: () => void
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

export function TemplateFormPanel({
  template,
  onSaved,
  onCancel,
}: TemplateFormPanelProps) {
  const isEditing = !!template
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when template changes
  useEffect(() => {
    if (template) {
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
    } else {
      setForm(INITIAL_FORM)
    }
    setError(null)
  }, [template])

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      setError('Template name is required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
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

      onSaved()
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
  }, [form, isEditing, template, onSaved])

  const handleMappingsChange = useCallback((mappings: MappingRow[]) => {
    setForm((prev) => ({ ...prev, mappings }))
  }, [])

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {isEditing ? (
              <span>
                Editing:{' '}
                <span className="text-primary">{template?.name}</span>
              </span>
            ) : (
              'Create New Template'
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name & Description row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="panel-template-name">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="panel-template-name"
              placeholder="e.g. Standard Electrical Fitout"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="panel-template-desc">Description</Label>
            <Textarea
              id="panel-template-desc"
              placeholder="Brief description of this template's use case"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={1}
              className="min-h-[36px] resize-none"
            />
          </div>
        </div>

        {/* Default toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background p-4">
          <div className="space-y-0.5">
            <Label htmlFor="panel-template-default">Set as Default</Label>
            <p className="text-sm text-muted-foreground">
              This template will be automatically applied to new projects.
            </p>
          </div>
          <Switch
            id="panel-template-default"
            checked={form.is_default}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, is_default: checked }))
            }
          />
        </div>

        {/* Mappings */}
        <div className="space-y-2">
          <Label>Product Mappings</Label>
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? 'Update Template' : 'Create Template'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}