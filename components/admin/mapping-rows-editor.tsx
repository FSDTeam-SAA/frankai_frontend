'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
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
import { Plus, Trash2 } from 'lucide-react'
import type { MappingRow } from '@/lib/api'

const SYMBOL_TYPE_OPTIONS = [
  { value: 'light', label: 'Light (General)' },
  { value: 'downlight', label: 'Downlight' },
  { value: 'gpo', label: 'Power Point (GPO)' },
  { value: 'fan', label: 'Exhaust Fan' },
  { value: 'data', label: 'Data Outlet' },
  { value: 'exit', label: 'Exit Sign' },
  { value: 'emergency', label: 'Emergency Light' },
  { value: 'switch', label: 'Switch' },
] as const

const UNIT_OPTIONS = [
  { value: 'ea', label: 'Each (ea)' },
  { value: 'm', label: 'Metre (m)' },
  { value: 'set', label: 'Set (set)' },
  { value: 'box', label: 'Box (box)' },
  { value: 'pkt', label: 'Packet (pkt)' },
] as const

interface MappingRowsEditorProps {
  mappings: MappingRow[]
  onChange: (mappings: MappingRow[]) => void
  readOnly?: boolean
}

function createEmptyMapping(): MappingRow {
  return {
    symbolType: '',
    productCode: '',
    description: '',
    unit: 'ea',
    notes: '',
    status: 'unmapped',
  }
}

export function MappingRowsEditor({
  mappings,
  onChange,
  readOnly = false,
}: MappingRowsEditorProps) {
  const handleAddRow = () => {
    onChange([...mappings, createEmptyMapping()])
  }

  const handleRemoveRow = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index))
  }

  const handleFieldChange = (
    index: number,
    field: keyof MappingRow,
    value: string,
  ) => {
    const updated = mappings.map((row, i) => {
      if (i !== index) return row

      const newRow = { ...row, [field]: value }

      // Update status based on whether product code is filled
      if (field === 'productCode' || field === 'symbolType') {
        const symbolType = field === 'symbolType' ? value : row.symbolType
        const productCode = field === 'productCode' ? value : row.productCode
        newRow.status = symbolType && productCode ? 'mapped' : 'unmapped'
      }

      return newRow
    })

    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[140px]">Symbol Type</TableHead>
              <TableHead className="w-[130px]">Product Code</TableHead>
              <TableHead className="min-w-[150px]">Description</TableHead>
              <TableHead className="w-[100px]">Unit</TableHead>
              <TableHead className="min-w-[120px]">Notes</TableHead>
              {!readOnly && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readOnly ? 5 : 6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No mappings defined. Click "Add Row" to create one.
                </TableCell>
              </TableRow>
            ) : (
              mappings.map((row, index) => (
                <TableRow key={index} className="border-border/50">
                  <TableCell>
                    {readOnly ? (
                      <span className="text-sm capitalize">
                        {row.symbolType || '—'}
                      </span>
                    ) : (
                      <Select
                        value={row.symbolType || ''}
                        onValueChange={(val) =>
                          handleFieldChange(index, 'symbolType', val)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SYMBOL_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.productCode || ''}
                      onChange={(e) =>
                        handleFieldChange(index, 'productCode', e.target.value)
                      }
                      placeholder="e.g. LED-PANEL"
                      className="h-8 text-xs"
                      readOnly={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.description || ''}
                      onChange={(e) =>
                        handleFieldChange(index, 'description', e.target.value)
                      }
                      placeholder="Product name"
                      className="h-8 text-xs"
                      readOnly={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    {readOnly ? (
                      <span className="text-sm">{row.unit}</span>
                    ) : (
                      <Select
                        value={row.unit || 'ea'}
                        onValueChange={(val) =>
                          handleFieldChange(index, 'unit', val)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.notes || ''}
                      onChange={(e) =>
                        handleFieldChange(index, 'notes', e.target.value)
                      }
                      placeholder="Notes"
                      className="h-8 text-xs"
                      readOnly={readOnly}
                    />
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveRow(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
      )}
    </div>
  )
}