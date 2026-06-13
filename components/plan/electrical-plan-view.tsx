'use client'

import { cn } from '@/lib/utils'
import { JSX } from 'react' // Import JSX to fix the undeclared variable error

interface ElectricalPlanViewProps {
  zoom: number
  currentPage: number
  selectedSymbol: string | null
  onSymbolClick: (id: string) => void
  symbols: Array<{
    id: string
    type: string
    x: number
    y: number
    confidence: number
    verified: boolean
    label: string
  }>
}

// Symbol rendering based on type
const symbolShapes: Record<string, (x: number, y: number, label: string, isSelected: boolean, isLowConf: boolean, isVerified: boolean) => JSX.Element> = {
  light: (x, y, label, isSelected, isLowConf, isVerified) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="8" fill={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : isVerified ? '#22c55e' : '#fff'} stroke={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : '#333'} strokeWidth="1.5" opacity={isSelected ? 1 : 0.9} />
      <line x1="-4" y1="0" x2="4" y2="0" stroke="#333" strokeWidth="1" />
      <line x1="0" y1="-4" x2="0" y2="4" stroke="#333" strokeWidth="1" />
      <text y="18" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">{label}</text>
    </g>
  ),
  gpo: (x, y, label, isSelected, isLowConf, isVerified) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-7" y="-7" width="14" height="14" fill={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : isVerified ? '#22c55e' : '#fff'} stroke={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : '#333'} strokeWidth="1.5" opacity={isSelected ? 1 : 0.9} rx="1" />
      <circle cx="-2" cy="0" r="2" fill="#333" />
      <circle cx="2" cy="0" r="2" fill="#333" />
      <text y="18" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">{label}</text>
    </g>
  ),
  exit: (x, y, label, isSelected, isLowConf, isVerified) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-10" y="-6" width="20" height="12" fill={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : isVerified ? '#22c55e' : '#22c55e'} stroke={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : '#166534'} strokeWidth="1.5" opacity={isSelected ? 1 : 0.9} rx="1" />
      <text y="3" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">EXIT</text>
      <text y="18" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">{label}</text>
    </g>
  ),
  emergency: (x, y, label, isSelected, isLowConf, isVerified) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="8" fill={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : isVerified ? '#22c55e' : '#fef3c7'} stroke={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : '#f59e0b'} strokeWidth="1.5" opacity={isSelected ? 1 : 0.9} />
      <text y="3" textAnchor="middle" fontSize="7" fill="#92400e" fontWeight="bold">E</text>
      <text y="18" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">{label}</text>
    </g>
  ),
  data: (x, y, label, isSelected, isLowConf, isVerified) => (
    <g transform={`translate(${x}, ${y})`}>
      <polygon points="0,-8 8,0 0,8 -8,0" fill={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : isVerified ? '#22c55e' : '#dbeafe'} stroke={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : '#3b82f6'} strokeWidth="1.5" opacity={isSelected ? 1 : 0.9} />
      <text y="3" textAnchor="middle" fontSize="6" fill="#1e40af" fontWeight="bold">D</text>
      <text y="18" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">{label}</text>
    </g>
  ),
  fan: (x, y, label, isSelected, isLowConf, isVerified) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="9" fill={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : isVerified ? '#22c55e' : '#fff'} stroke={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : '#333'} strokeWidth="1.5" opacity={isSelected ? 1 : 0.9} />
      <path d="M0,-5 Q3,-2 0,0 Q-3,2 0,5" fill="none" stroke="#333" strokeWidth="1" />
      <path d="M-5,0 Q-2,3 0,0 Q2,-3 5,0" fill="none" stroke="#333" strokeWidth="1" />
      <text y="20" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">{label}</text>
    </g>
  ),
  switch: (x, y, label, isSelected, isLowConf, isVerified) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="6" fill={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : isVerified ? '#22c55e' : '#fff'} stroke={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : '#333'} strokeWidth="1.5" opacity={isSelected ? 1 : 0.9} />
      <line x1="6" y1="0" x2="14" y2="-6" stroke="#333" strokeWidth="1.5" />
      <text y="18" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">{label}</text>
    </g>
  ),
  downlight: (x, y, label, isSelected, isLowConf, isVerified) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="7" fill={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : isVerified ? '#22c55e' : '#fff'} stroke={isSelected ? '#14b8a6' : isLowConf ? '#f59e0b' : '#333'} strokeWidth="1.5" opacity={isSelected ? 1 : 0.9} />
      <circle r="3" fill="#333" />
      <text y="18" textAnchor="middle" fontSize="7" fill="#333" fontWeight="500">{label}</text>
    </g>
  ),
}

export function ElectricalPlanView({
  zoom,
  currentPage,
  selectedSymbol,
  onSymbolClick,
  symbols,
}: ElectricalPlanViewProps) {
  const scale = zoom / 100

  return (
    <div
      className="relative mx-auto bg-white shadow-lg overflow-hidden"
      style={{
        width: `${900 * scale}px`,
        height: `${650 * scale}px`,
      }}
    >
      <svg
        viewBox="0 0 900 650"
        className="w-full h-full"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Background */}
        <rect width="900" height="650" fill="#fafafa" />
        
        {/* Title Block Area */}
        <rect x="700" y="520" width="190" height="120" fill="#fff" stroke="#333" strokeWidth="1" />
        <line x1="700" y1="550" x2="890" y2="550" stroke="#333" strokeWidth="0.5" />
        <line x1="700" y1="580" x2="890" y2="580" stroke="#333" strokeWidth="0.5" />
        <line x1="700" y1="610" x2="890" y2="610" stroke="#333" strokeWidth="0.5" />
        <text x="795" y="538" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#333">ELECTRICAL SERVICES</text>
        <text x="795" y="568" textAnchor="middle" fontSize="7" fill="#333">WAREHOUSE FITOUT - LOT 12</text>
        <text x="795" y="598" textAnchor="middle" fontSize="7" fill="#333">LIGHTING LAYOUT</text>
        <text x="795" y="628" textAnchor="middle" fontSize="6" fill="#666">DWG: E-101 REV: T1 | PAGE {currentPage}</text>
        
        {/* Grid Lines - Vertical */}
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((num, i) => (
          <g key={`v-${num}`}>
            <line x1={80 + i * 60} y1="40" x2={80 + i * 60} y2="500" stroke="#ccc" strokeWidth="0.5" strokeDasharray="4,2" />
            <circle cx={80 + i * 60} cy="30" r="10" fill="#fff" stroke="#333" strokeWidth="1" />
            <text x={80 + i * 60} y="34" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#333">{num}</text>
            <circle cx={80 + i * 60} cy="510" r="10" fill="#fff" stroke="#333" strokeWidth="1" />
            <text x={80 + i * 60} y="514" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#333">{num}</text>
          </g>
        ))}
        
        {/* Grid Lines - Horizontal */}
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter, i) => (
          <g key={`h-${letter}`}>
            <line x1="60" y1={70 + i * 55} x2="680" y2={70 + i * 55} stroke="#ccc" strokeWidth="0.5" strokeDasharray="4,2" />
            <circle cx="30" cy={70 + i * 55} r="10" fill="#fff" stroke="#333" strokeWidth="1" />
            <text x="30" y={74 + i * 55} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#333">{letter}</text>
            <circle cx="690" cy={70 + i * 55} r="10" fill="#fff" stroke="#333" strokeWidth="1" />
            <text x="690" y={74 + i * 55} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#333">{letter}</text>
          </g>
        ))}
        
        {/* Building Outline */}
        <rect x="80" y="70" width="540" height="385" fill="none" stroke="#333" strokeWidth="2" />
        
        {/* Room Divisions */}
        {/* Main warehouse area */}
        <rect x="80" y="70" width="360" height="300" fill="#f8fafc" stroke="#333" strokeWidth="1" />
        <text x="260" y="200" textAnchor="middle" fontSize="12" fill="#64748b" fontWeight="500">WAREHOUSE</text>
        
        {/* Office area */}
        <rect x="440" y="70" width="180" height="150" fill="#f1f5f9" stroke="#333" strokeWidth="1" />
        <text x="530" y="145" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="500">OFFICE</text>
        
        {/* Amenities */}
        <rect x="440" y="220" width="90" height="70" fill="#fef3c7" stroke="#333" strokeWidth="1" />
        <text x="485" y="258" textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="500">AMENITIES</text>
        
        {/* Store room */}
        <rect x="530" y="220" width="90" height="70" fill="#e0f2fe" stroke="#333" strokeWidth="1" />
        <text x="575" y="258" textAnchor="middle" fontSize="8" fill="#0369a1" fontWeight="500">STORE</text>
        
        {/* DB Room */}
        <rect x="440" y="290" width="60" height="80" fill="#fce7f3" stroke="#333" strokeWidth="1" />
        <text x="470" y="330" textAnchor="middle" fontSize="8" fill="#be185d" fontWeight="600">DB</text>
        <text x="470" y="342" textAnchor="middle" fontSize="6" fill="#be185d">ROOM</text>
        
        {/* Comms */}
        <rect x="500" y="290" width="60" height="80" fill="#dbeafe" stroke="#333" strokeWidth="1" />
        <text x="530" y="335" textAnchor="middle" fontSize="8" fill="#1e40af" fontWeight="500">COMMS</text>
        
        {/* Entry */}
        <rect x="560" y="290" width="60" height="80" fill="#dcfce7" stroke="#333" strokeWidth="1" />
        <text x="590" y="335" textAnchor="middle" fontSize="8" fill="#166534" fontWeight="500">ENTRY</text>
        
        {/* External area */}
        <rect x="80" y="370" width="360" height="85" fill="#f0fdf4" stroke="#333" strokeWidth="1" />
        <text x="260" y="418" textAnchor="middle" fontSize="10" fill="#166534" fontWeight="500">LOADING DOCK</text>
        
        {/* Stair */}
        <rect x="440" y="370" width="60" height="85" fill="#f5f5f4" stroke="#333" strokeWidth="1" />
        <text x="470" y="415" textAnchor="middle" fontSize="7" fill="#57534e" fontWeight="500">STAIR</text>
        {/* Stair lines */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line key={`stair-${i}`} x1="445" y1={380 + i * 12} x2="495" y2={380 + i * 12} stroke="#a8a29e" strokeWidth="0.5" />
        ))}
        
        {/* Lift */}
        <rect x="500" y="370" width="60" height="85" fill="#e2e8f0" stroke="#333" strokeWidth="1" />
        <text x="530" y="415" textAnchor="middle" fontSize="8" fill="#475569" fontWeight="500">LIFT</text>
        
        {/* Fire exit markers */}
        <rect x="75" y="200" width="10" height="40" fill="#22c55e" stroke="#166534" strokeWidth="1" />
        <rect x="615" y="420" width="10" height="35" fill="#22c55e" stroke="#166534" strokeWidth="1" />
        
        {/* Notes area */}
        <rect x="700" y="70" width="190" height="180" fill="#fff" stroke="#333" strokeWidth="0.5" />
        <text x="710" y="88" fontSize="8" fontWeight="bold" fill="#333">NOTES:</text>
        <text x="710" y="102" fontSize="6" fill="#666">1. ALL LIGHTING TO COMPLY WITH AS/NZS</text>
        <text x="710" y="112" fontSize="6" fill="#666">2. EMERGENCY LIGHTS PER NCC REQ.</text>
        <text x="710" y="122" fontSize="6" fill="#666">3. SWITCHES AT 900-1100MM HEIGHT</text>
        <text x="710" y="132" fontSize="6" fill="#666">4. GPOs TO BE LOCATED AS MARKED</text>
        <text x="710" y="142" fontSize="6" fill="#666">5. REFER TO LEGEND FOR SYMBOLS</text>
        
        {/* Legend */}
        <rect x="700" y="260" width="190" height="250" fill="#fff" stroke="#333" strokeWidth="0.5" />
        <text x="795" y="278" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#333">SYMBOL LEGEND</text>
        <line x1="705" y1="285" x2="885" y2="285" stroke="#333" strokeWidth="0.5" />
        
        {/* Legend items */}
        <g transform="translate(720, 305)">
          <circle r="6" fill="#fff" stroke="#333" strokeWidth="1" />
          <line x1="-3" y1="0" x2="3" y2="0" stroke="#333" strokeWidth="0.8" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#333" strokeWidth="0.8" />
          <text x="15" y="3" fontSize="7" fill="#333">D1, D2 - Downlight</text>
        </g>
        
        <g transform="translate(720, 330)">
          <circle r="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
          <text y="3" textAnchor="middle" fontSize="5" fill="#92400e" fontWeight="bold">E</text>
          <text x="15" y="3" fontSize="7" fill="#333">EM1, EM3 - Emergency Light</text>
        </g>
        
        <g transform="translate(720, 355)">
          <rect x="-8" y="-5" width="16" height="10" fill="#22c55e" stroke="#166534" strokeWidth="1" rx="1" />
          <text y="3" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">EXIT</text>
          <text x="15" y="3" fontSize="7" fill="#333">EX1, EX3 - Exit Sign</text>
        </g>
        
        <g transform="translate(720, 380)">
          <rect x="-5" y="-5" width="10" height="10" fill="#fff" stroke="#333" strokeWidth="1" />
          <circle cx="-1" cy="0" r="1.5" fill="#333" />
          <circle cx="2" cy="0" r="1.5" fill="#333" />
          <text x="15" y="3" fontSize="7" fill="#333">GPO - General Power Outlet</text>
        </g>
        
        <g transform="translate(720, 405)">
          <polygon points="0,-6 6,0 0,6 -6,0" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
          <text y="2" textAnchor="middle" fontSize="5" fill="#1e40af" fontWeight="bold">D</text>
          <text x="15" y="3" fontSize="7" fill="#333">DATA - Data Outlet</text>
        </g>
        
        <g transform="translate(720, 430)">
          <circle r="5" fill="#fff" stroke="#333" strokeWidth="1" />
          <line x1="5" y1="0" x2="12" y2="-5" stroke="#333" strokeWidth="1" />
          <text x="15" y="3" fontSize="7" fill="#333">MS1, MS2 - Switch</text>
        </g>
        
        <g transform="translate(720, 455)">
          <circle r="6" fill="#fff" stroke="#333" strokeWidth="1" />
          <path d="M0,-3 Q2,-1 0,0 Q-2,1 0,3" fill="none" stroke="#333" strokeWidth="0.8" />
          <text x="15" y="3" fontSize="7" fill="#333">EF - Exhaust Fan</text>
        </g>
        
        <g transform="translate(720, 480)">
          <rect x="-12" y="-3" width="24" height="6" fill="#fff" stroke="#333" strokeWidth="1" />
          <line x1="-10" y1="0" x2="10" y2="0" stroke="#333" strokeWidth="0.5" />
          <text x="20" y="3" fontSize="7" fill="#333">LF - Linear Fitting</text>
        </g>
        
        {/* Detected Symbols - render from props */}
        {symbols.map((symbol) => {
          const isSelected = selectedSymbol === symbol.id
          const isLowConf = symbol.confidence < 70
          const isVerified = symbol.verified
          const renderSymbol = symbolShapes[symbol.type] || symbolShapes.light
          
          return (
            <g
              key={symbol.id}
              onClick={() => onSymbolClick(symbol.id)}
              className="cursor-pointer"
              style={{ pointerEvents: 'all' }}
            >
              {renderSymbol(symbol.x, symbol.y, symbol.label, isSelected, isLowConf, isVerified)}
              {isSelected && (
                <circle
                  cx={symbol.x}
                  cy={symbol.y}
                  r="14"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  className="animate-pulse"
                />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
