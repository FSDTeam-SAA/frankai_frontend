'use client'

import { useMemo, useRef, useState } from 'react'
import { ImageIcon, Maximize2, Search, ZoomIn, ZoomOut } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AggregateDetectionReviewProps {
  imageUrl: string
  objectCounts: Record<string, number>
  totalDetections: number
}

function formatDetectionLabel(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}

export function AggregateDetectionReview({
  imageUrl,
  objectCounts,
  totalDetections,
}: AggregateDetectionReviewProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(100)
  const [search, setSearch] = useState('')

  const detections = useMemo(
    () => Object.entries(objectCounts).sort(([, left], [, right]) => right - left),
    [objectCounts],
  )
  const filteredDetections = detections.filter(([type]) =>
    formatDetectionLabel(type).toLowerCase().includes(search.toLowerCase()),
  )

  const openFullscreen = async () => {
    if (viewerRef.current?.requestFullscreen) {
      await viewerRef.current.requestFullscreen()
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[560px]">
      <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-card/30">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Detected Objects</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Aggregate results returned by the AI service
              </p>
            </div>
            <Badge variant="secondary">{detections.length} types</Badge>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search object types..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredDetections.map(([type, count]) => (
            <div
              key={type}
              className="flex items-center gap-3 border-b border-border/50 px-4 py-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{formatDetectionLabel(type)}</p>
                <p className="text-xs text-muted-foreground">AI object category</p>
              </div>
              <Badge>{count}</Badge>
            </div>
          ))}
          {filteredDetections.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No object categories match your search.
            </p>
          )}
        </div>
      </aside>

      <section ref={viewerRef} className="flex min-w-0 flex-1 flex-col bg-muted/20">
        <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-2">
          <div>
            <p className="text-sm font-medium">Uploaded plan image</p>
            <p className="text-xs text-muted-foreground">
              The AI response does not include positional bounding boxes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(current => Math.max(25, current - 25))}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm">{zoom}%</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(current => Math.min(200, current + 25))}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={openFullscreen} aria-label="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-1 items-start justify-center overflow-auto p-6">
          {/* The source URL is dynamic Cloudinary data, so a plain image keeps
              the viewer independent from Next.js remote-image host settings. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Uploaded electrical plan"
            className="h-auto max-w-none rounded-sm bg-white shadow-xl"
            style={{ width: `${zoom}%` }}
          />
        </div>
      </section>

      <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card/30">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold">Detection Summary</h3>
          <p className="mt-1 text-xs text-muted-foreground">Quantities detected by object type</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-right text-xs">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detections.map(([type, count]) => (
                <TableRow key={type} className="border-border/50">
                  <TableCell className="py-2 text-xs">{formatDetectionLabel(type)}</TableCell>
                  <TableCell className="py-2 text-right text-xs font-semibold">{count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-border p-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total detected</p>
            <p className="mt-1 text-3xl font-bold">{totalDetections}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Across {detections.length} object categories
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
