// Mock data store for FrankAI
export interface DetectedSymbol {
  id: string
  type: 'light' | 'gpo' | 'fan' | 'data' | 'exit' | 'emergency' | 'switch' | 'downlight'
  label: string
  confidence: number
  page: number
  x: number
  y: number
  verified: boolean
  note?: string
}

export interface Project {
  id: string
  name: string
  notes?: string
  status: 'processing' | 'needs-review' | 'ready' | 'exported'
  createdAt: string
  lastExportedAt?: string
  pages: number
  fileSize: string
  fileName: string
  symbols: DetectedSymbol[]
  mappingComplete: boolean
}

export interface MappingRow {
  symbolType: string
  productCode: string
  description: string
  unit: string
  notes: string
  status: 'mapped' | 'unmapped'
}

export const symbolTypeLabels: Record<string, string> = {
  light: 'Lights (General)',
  downlight: 'Downlights',
  gpo: 'Power Points (GPOs)',
  fan: 'Exhaust Fans',
  data: 'Data Outlets',
  exit: 'Exit Signs',
  emergency: 'Emergency Lights',
  switch: 'Switches',
}

export const symbolTypeColors: Record<string, string> = {
  light: 'bg-chart-1',
  gpo: 'bg-chart-2',
  fan: 'bg-chart-3',
  data: 'bg-chart-4',
  exit: 'bg-chart-5',
}

// Mock project data
export const mockProject: Project = {
  id: 'proj-001',
  name: 'Warehouse Fitout – Lot 12',
  notes: 'Main warehouse electrical installation for client ABC Holdings',
  status: 'needs-review',
  createdAt: '2026-01-18T09:30:00Z',
  lastExportedAt: undefined,
  pages: 18,
  fileSize: '24.5 MB',
  fileName: 'warehouse-lot12-electrical.pdf',
  mappingComplete: false,
  symbols: [
    // Page 1 - Warehouse area - Downlights (D1)
    { id: 'd1-1', type: 'downlight' as const, label: 'D1', x: 140, y: 120, page: 1, confidence: 98, verified: true },
    { id: 'd1-2', type: 'downlight' as const, label: 'D1', x: 220, y: 120, page: 1, confidence: 96, verified: true },
    { id: 'd1-3', type: 'downlight' as const, label: 'D1', x: 300, y: 120, page: 1, confidence: 94, verified: false },
    { id: 'd1-4', type: 'downlight' as const, label: 'D1', x: 380, y: 120, page: 1, confidence: 97, verified: true },
    { id: 'd1-5', type: 'downlight' as const, label: 'D1', x: 140, y: 200, page: 1, confidence: 95, verified: true },
    { id: 'd1-6', type: 'downlight' as const, label: 'D1', x: 220, y: 200, page: 1, confidence: 92, verified: false },
    { id: 'd1-7', type: 'downlight' as const, label: 'D1', x: 300, y: 200, page: 1, confidence: 89, verified: false },
    { id: 'd1-8', type: 'downlight' as const, label: 'D1', x: 380, y: 200, page: 1, confidence: 91, verified: false },
    { id: 'd1-9', type: 'downlight' as const, label: 'D1', x: 140, y: 280, page: 1, confidence: 96, verified: true },
    { id: 'd1-10', type: 'downlight' as const, label: 'D1', x: 220, y: 280, page: 1, confidence: 94, verified: true },
    { id: 'd1-11', type: 'downlight' as const, label: 'D1', x: 300, y: 280, page: 1, confidence: 93, verified: false },
    { id: 'd1-12', type: 'downlight' as const, label: 'D1', x: 380, y: 280, page: 1, confidence: 95, verified: true },
    
    // Office area - Downlights (D2)
    { id: 'd2-1', type: 'downlight' as const, label: 'D2', x: 480, y: 100, page: 1, confidence: 97, verified: true },
    { id: 'd2-2', type: 'downlight' as const, label: 'D2', x: 540, y: 100, page: 1, confidence: 96, verified: true },
    { id: 'd2-3', type: 'downlight' as const, label: 'D2', x: 600, y: 100, page: 1, confidence: 94, verified: false },
    { id: 'd2-4', type: 'downlight' as const, label: 'D2', x: 480, y: 160, page: 1, confidence: 98, verified: true },
    { id: 'd2-5', type: 'downlight' as const, label: 'D2', x: 540, y: 160, page: 1, confidence: 95, verified: true },
    { id: 'd2-6', type: 'downlight' as const, label: 'D2', x: 600, y: 160, page: 1, confidence: 93, verified: false },
    
    // Emergency lights (EM1, EM3)
    { id: 'em1-1', type: 'emergency' as const, label: 'EM1', x: 100, y: 150, page: 1, confidence: 99, verified: true },
    { id: 'em1-2', type: 'emergency' as const, label: 'EM1', x: 260, y: 330, page: 1, confidence: 97, verified: true },
    { id: 'em1-3', type: 'emergency' as const, label: 'EM1', x: 470, y: 250, page: 1, confidence: 96, verified: true },
    { id: 'em3-1', type: 'emergency' as const, label: 'EM3', x: 530, y: 340, page: 1, confidence: 95, verified: false },
    { id: 'em1-4', type: 'emergency' as const, label: 'EM1', x: 590, y: 340, page: 1, confidence: 98, verified: true },
    
    // Exit signs (EX1, EX3)
    { id: 'ex1-1', type: 'exit' as const, label: 'EX1', x: 90, y: 220, page: 1, confidence: 99, verified: true },
    { id: 'ex1-2', type: 'exit' as const, label: 'EX1', x: 420, y: 400, page: 1, confidence: 98, verified: true },
    { id: 'ex3-1', type: 'exit' as const, label: 'EX3', x: 600, y: 440, page: 1, confidence: 97, verified: true },
    { id: 'ex1-3', type: 'exit' as const, label: 'EX1', x: 530, y: 420, page: 1, confidence: 96, verified: false },
    
    // GPOs in office
    { id: 'gpo-1', type: 'gpo' as const, label: 'GPO', x: 455, y: 85, page: 1, confidence: 99, verified: true },
    { id: 'gpo-2', type: 'gpo' as const, label: 'GPO', x: 610, y: 85, page: 1, confidence: 97, verified: true },
    { id: 'gpo-3', type: 'gpo' as const, label: 'GPO', x: 455, y: 180, page: 1, confidence: 95, verified: false },
    { id: 'gpo-4', type: 'gpo' as const, label: 'GPO', x: 610, y: 180, page: 1, confidence: 88, verified: false },
    
    // GPOs in warehouse
    { id: 'gpo-5', type: 'gpo' as const, label: 'GPO', x: 95, y: 260, page: 1, confidence: 96, verified: true },
    { id: 'gpo-6', type: 'gpo' as const, label: 'GPO', x: 95, y: 340, page: 1, confidence: 94, verified: false },
    { id: 'gpo-7', type: 'gpo' as const, label: 'GPO', x: 420, y: 260, page: 1, confidence: 93, verified: true },
    { id: 'gpo-8', type: 'gpo' as const, label: 'GPO', x: 420, y: 340, page: 1, confidence: 91, verified: false },
    
    // Data outlets in office
    { id: 'data-1', type: 'data' as const, label: 'DATA', x: 455, y: 130, page: 1, confidence: 93, verified: true },
    { id: 'data-2', type: 'data' as const, label: 'DATA', x: 530, y: 130, page: 1, confidence: 91, verified: false },
    { id: 'data-3', type: 'data' as const, label: 'DATA', x: 605, y: 130, page: 1, confidence: 62, verified: false }, // Low confidence
    
    // Switches
    { id: 'ms1-1', type: 'switch' as const, label: 'MS1', x: 455, y: 200, page: 1, confidence: 97, verified: true },
    { id: 'ms2-1', type: 'switch' as const, label: 'MS2', x: 560, y: 305, page: 1, confidence: 95, verified: true },
    { id: 'ms1-2', type: 'switch' as const, label: 'MS1', x: 100, y: 85, page: 1, confidence: 58, verified: false }, // Low confidence
    
    // Fans in amenities
    { id: 'ef-1', type: 'fan' as const, label: 'EF', x: 485, y: 245, page: 1, confidence: 87, verified: false },
    { id: 'ef-2', type: 'fan' as const, label: 'EF', x: 575, y: 245, page: 1, confidence: 85, verified: false },
    
    // Loading dock lights (B1)
    { id: 'b1-1', type: 'light' as const, label: 'B1', x: 140, y: 400, page: 1, confidence: 94, verified: true },
    { id: 'b1-2', type: 'light' as const, label: 'B1', x: 220, y: 400, page: 1, confidence: 93, verified: false },
    { id: 'b1-3', type: 'light' as const, label: 'B1', x: 300, y: 400, page: 1, confidence: 92, verified: true },
    { id: 'b1-4', type: 'light' as const, label: 'B1', x: 380, y: 400, page: 1, confidence: 55, verified: false }, // Low confidence
    
    // Page 2 - Additional areas
    { id: 'p2-d1-1', type: 'downlight' as const, label: 'D1', x: 150, y: 120, page: 2, confidence: 96, verified: true },
    { id: 'p2-d1-2', type: 'downlight' as const, label: 'D1', x: 280, y: 120, page: 2, confidence: 94, verified: false },
    { id: 'p2-gpo-1', type: 'gpo' as const, label: 'GPO', x: 350, y: 200, page: 2, confidence: 97, verified: true },
    { id: 'p2-ex1-1', type: 'exit' as const, label: 'EX1', x: 100, y: 400, page: 2, confidence: 99, verified: true },
    { id: 'p2-ef-1', type: 'fan' as const, label: 'EF', x: 500, y: 300, page: 2, confidence: 64, verified: false }, // Low confidence
  ],
}

const symbolLabels = ['D1', 'D2', 'GPO', 'EF', 'DATA', 'EX1', 'EM1', 'MS1']

export const mockProjects: Project[] = [
  mockProject,
  {
    id: 'proj-002',
    name: 'Office Tower Level 3',
    status: 'exported',
    createdAt: '2026-01-15T14:20:00Z',
    lastExportedAt: '2026-01-16T10:45:00Z',
    pages: 8,
    fileSize: '12.3 MB',
    fileName: 'office-tower-l3.pdf',
    mappingComplete: true,
    symbols: Array.from({ length: 156 }, (_, i) => {
      const types = ['downlight', 'gpo', 'fan', 'data', 'exit'] as const
      const type = types[Math.floor(i / 32) % types.length]
      return {
        id: `p2-${i}`,
        type,
        label: type === 'downlight' ? 'D1' : type === 'gpo' ? 'GPO' : type === 'fan' ? 'EF' : type === 'data' ? 'DATA' : 'EX1',
        confidence: 80 + Math.random() * 20,
        page: Math.floor(i / 20) + 1,
        x: 100 + Math.random() * 700,
        y: 100 + Math.random() * 500,
        verified: true,
      }
    }),
  },
  {
    id: 'proj-003',
    name: 'Retail Fitout - Shop 4B',
    status: 'ready',
    createdAt: '2026-01-12T08:15:00Z',
    pages: 4,
    fileSize: '5.8 MB',
    fileName: 'retail-shop4b.pdf',
    mappingComplete: true,
    symbols: Array.from({ length: 48 }, (_, i) => {
      const types = ['downlight', 'gpo', 'data'] as const
      const type = types[i % types.length]
      return {
        id: `p3-${i}`,
        type,
        label: type === 'downlight' ? 'D2' : type === 'gpo' ? 'GPO' : 'DATA',
        confidence: 85 + Math.random() * 15,
        page: Math.floor(i / 12) + 1,
        x: 100 + Math.random() * 700,
        y: 100 + Math.random() * 500,
        verified: true,
      }
    }),
  },
  {
    id: 'proj-004',
    name: 'Hospital Wing Extension',
    status: 'processing',
    createdAt: '2026-01-21T07:00:00Z',
    pages: 24,
    fileSize: '45.2 MB',
    fileName: 'hospital-wing-ext.pdf',
    mappingComplete: false,
    symbols: [],
  },
]

export const defaultMappings: MappingRow[] = [
  { symbolType: 'downlight', productCode: 'DL-LED-10W', description: 'LED Downlight 10W 3000K', unit: 'ea', notes: '', status: 'mapped' },
  { symbolType: 'light', productCode: 'LED-PANEL-600', description: 'LED Panel Light 600x600 40W', unit: 'ea', notes: '', status: 'mapped' },
  { symbolType: 'gpo', productCode: 'GPO-DBL-10A', description: 'Double GPO 10A White', unit: 'ea', notes: '', status: 'mapped' },
  { symbolType: 'fan', productCode: 'EXH-FAN-150', description: 'Exhaust Fan 150mm', unit: 'ea', notes: '', status: 'mapped' },
  { symbolType: 'data', productCode: '', description: '', unit: 'ea', notes: '', status: 'unmapped' },
  { symbolType: 'exit', productCode: 'EXIT-LED-STD', description: 'Exit Sign LED Standard', unit: 'ea', notes: '', status: 'mapped' },
  { symbolType: 'emergency', productCode: 'EM-SPITFIRE', description: 'Emergency Spitfire LED', unit: 'ea', notes: '', status: 'mapped' },
  { symbolType: 'switch', productCode: 'SW-1G-10A', description: 'Single Gang Switch 10A', unit: 'ea', notes: '', status: 'mapped' },
]

// Stats helpers
export function getProjectStats(projects: Project[]) {
  const last30Days = projects.filter(p => {
    const created = new Date(p.createdAt)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return created >= thirtyDaysAgo
  })
  
  const totalSymbols = projects.reduce((acc, p) => acc + p.symbols.length, 0)
  const symbolsByType = projects.reduce((acc, p) => {
    p.symbols.forEach(s => {
      acc[s.type] = (acc[s.type] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)
  
  const avgConfidence = projects.reduce((acc, p) => {
    if (p.symbols.length === 0) return acc
    const projectAvg = p.symbols.reduce((sum, s) => sum + s.confidence, 0) / p.symbols.length
    return acc + projectAvg
  }, 0) / projects.filter(p => p.symbols.length > 0).length

  return {
    plansProcessed: last30Days.length,
    avgProcessingTime: '2m 34s',
    avgConfidence: avgConfidence.toFixed(1),
    totalSymbols,
    symbolsByType,
  }
}

export function getLowConfidenceSymbols(symbols: DetectedSymbol[], threshold = 70) {
  return symbols.filter(s => s.confidence < threshold && !s.verified)
}

export function getSymbolCounts(symbols: DetectedSymbol[]) {
  return symbols.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}
