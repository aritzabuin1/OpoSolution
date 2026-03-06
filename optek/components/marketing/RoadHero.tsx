'use client'

/**
 * RoadHero — Ilustración SVG animada del "camino del opositor".
 *
 * La carretera se dibuja sola de izquierda a derecha, atravesando un paisaje
 * que transiciona de gris/niebla (caos del estudio sin rumbo) a verde/sol
 * (el destino: aprobar). Los hitos aparecen secuencialmente.
 *
 * Branding: navy #1B4F72, dorado #F39C12, verde destino #22C55E
 */

import { useEffect, useRef, useState } from 'react'

export function RoadHero() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full max-w-4xl mx-auto mt-12 px-4" aria-hidden="true">
      <svg
        viewBox="0 0 1000 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        role="img"
      >
        {/* ── Sky ───────────────────────────────────────────── */}
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="40%" stopColor="#BAC8D9" />
            <stop offset="70%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9CA3AF" />
            <stop offset="35%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#F39C12" />
          </linearGradient>
          <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="60%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          {/* Niebla izquierda */}
          <linearGradient id="fog" x1="0" y1="0" x2="0.4" y2="0">
            <stop offset="0%" stopColor="#D1D5DB" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#D1D5DB" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Cielo */}
        <rect width="1000" height="180" fill="url(#sky)" />

        {/* Sol (destino) */}
        <circle
          cx="900" cy="60" r="50"
          fill="url(#sun)"
          className={`transition-all duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '2.5s' }}
        />
        {/* Rayos del sol */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <line
            key={angle}
            x1={900 + Math.cos(angle * Math.PI / 180) * 40}
            y1={60 + Math.sin(angle * Math.PI / 180) * 40}
            x2={900 + Math.cos(angle * Math.PI / 180) * 60}
            y2={60 + Math.sin(angle * Math.PI / 180) * 60}
            stroke="#FBBF24"
            strokeWidth="2"
            strokeLinecap="round"
            className={`transition-all duration-700 ${visible ? 'opacity-60' : 'opacity-0'}`}
            style={{ transitionDelay: '2.8s' }}
          />
        ))}

        {/* Nubes grises (izquierda) */}
        <ellipse cx="80" cy="60" rx="60" ry="25" fill="#D1D5DB" opacity="0.5" />
        <ellipse cx="130" cy="50" rx="50" ry="20" fill="#D1D5DB" opacity="0.4" />
        <ellipse cx="250" cy="70" rx="40" ry="15" fill="#E5E7EB" opacity="0.3" />

        {/* Colinas del fondo */}
        {/* Colina gris izquierda */}
        <ellipse cx="120" cy="180" rx="180" ry="60" fill="#9CA3AF" opacity="0.5" />
        {/* Colina transición */}
        <ellipse cx="400" cy="180" rx="200" ry="50" fill="#86EFAC" opacity="0.4" />
        {/* Colinas verdes destino */}
        <ellipse cx="700" cy="175" rx="180" ry="55" fill="#4ADE80" opacity="0.5" />
        <ellipse cx="900" cy="170" rx="160" ry="65" fill="#22C55E" opacity="0.6" />

        {/* Suelo */}
        <rect y="180" width="1000" height="100" fill="url(#ground)" />

        {/* Niebla izquierda (overlay) */}
        <rect y="0" width="300" height="280" fill="url(#fog)" />

        {/* ── La carretera ──────────────────────────────── */}
        {/* Sombra de la carretera */}
        <path
          d="M -20 240 C 100 240, 150 200, 250 210 C 350 220, 380 250, 500 230 C 620 210, 650 190, 750 195 C 850 200, 880 180, 1020 175"
          stroke="#00000020"
          strokeWidth="28"
          fill="none"
          strokeLinecap="round"
        />
        {/* Carretera base */}
        <path
          d="M -20 235 C 100 235, 150 195, 250 205 C 350 215, 380 245, 500 225 C 620 205, 650 185, 750 190 C 850 195, 880 175, 1020 170"
          stroke="#374151"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
        />
        {/* Línea central dorada (la que se anima) */}
        <path
          d="M -20 235 C 100 235, 150 195, 250 205 C 350 215, 380 245, 500 225 C 620 205, 650 185, 750 190 C 850 195, 880 175, 1020 170"
          stroke="url(#roadGrad)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="8 12"
          className={visible ? 'animate-road-draw' : ''}
          style={{
            strokeDashoffset: visible ? 0 : 1200,
          }}
        />

        {/* ── Papeles dispersos (izquierda — caos) ──────── */}
        <g className={`transition-all duration-500 ${visible ? 'opacity-70' : 'opacity-0'}`}
           style={{ transitionDelay: '0.3s' }}>
          {/* Papel 1 */}
          <rect x="40" y="210" width="16" height="20" rx="1" fill="#F9FAFB" transform="rotate(-15 48 220)" />
          <line x1="44" y1="215" x2="52" y2="215" stroke="#D1D5DB" strokeWidth="1" transform="rotate(-15 48 220)" />
          <line x1="44" y1="219" x2="54" y2="219" stroke="#D1D5DB" strokeWidth="1" transform="rotate(-15 48 220)" />
          {/* Papel 2 */}
          <rect x="100" y="225" width="14" height="18" rx="1" fill="#F9FAFB" transform="rotate(10 107 234)" />
          {/* Papel 3 */}
          <rect x="160" y="215" width="12" height="16" rx="1" fill="#F3F4F6" transform="rotate(-25 166 223)" />
        </g>

        {/* ── Hitos del camino ──────────────────────────── */}

        {/* Hito 1: "Inicio" (izquierda) */}
        <g className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
           style={{ transitionDelay: '0.8s' }}>
          <rect x="195" y="175" width="36" height="22" rx="4" fill="#1B4F72" />
          <text x="213" y="190" textAnchor="middle" fill="#F39C12" fontSize="10" fontWeight="700">01</text>
          {/* Poste */}
          <rect x="211" y="197" width="4" height="12" fill="#1B4F72" opacity="0.7" />
        </g>

        {/* Hito 2: "Practica" (centro) */}
        <g className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
           style={{ transitionDelay: '1.5s' }}>
          <rect x="470" y="195" width="36" height="22" rx="4" fill="#1B4F72" />
          <text x="488" y="210" textAnchor="middle" fill="#F39C12" fontSize="10" fontWeight="700">02</text>
          <rect x="486" y="217" width="4" height="12" fill="#1B4F72" opacity="0.7" />
        </g>

        {/* Hito 3: "Mejora" (derecha) */}
        <g className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
           style={{ transitionDelay: '2s' }}>
          <rect x="720" y="160" width="36" height="22" rx="4" fill="#1B4F72" />
          <text x="738" y="175" textAnchor="middle" fill="#F39C12" fontSize="10" fontWeight="700">03</text>
          <rect x="736" y="182" width="4" height="12" fill="#1B4F72" opacity="0.7" />
        </g>

        {/* ── Arboles (destino) ──────────────────────────── */}
        <g className={`transition-all duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
           style={{ transitionDelay: '2.2s' }}>
          {/* Arbol 1 */}
          <rect x="828" y="155" width="5" height="20" fill="#854D0E" rx="1" />
          <ellipse cx="830" cy="148" rx="15" ry="18" fill="#16A34A" />
          {/* Arbol 2 */}
          <rect x="868" y="145" width="5" height="22" fill="#854D0E" rx="1" />
          <ellipse cx="870" cy="137" rx="18" ry="20" fill="#15803D" />
          {/* Arbol 3 (pequeno) */}
          <rect x="910" y="150" width="4" height="16" fill="#854D0E" rx="1" />
          <ellipse cx="912" cy="144" rx="12" ry="14" fill="#22C55E" />
        </g>

        {/* ── Bandera destino ───────────────────────────── */}
        <g className={`transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
           style={{ transitionDelay: '3s', transformOrigin: '950px 130px' }}>
          {/* Poste */}
          <rect x="948" y="130" width="4" height="42" fill="#1B4F72" rx="1" />
          {/* Bandera */}
          <path d="M 952 130 L 980 138 L 952 148 Z" fill="#F39C12" />
          {/* Brillo */}
          <circle cx="952" cy="128" r="4" fill="#FBBF24" opacity="0.8" />
        </g>

        {/* ── Labels debajo de los hitos ─────────────────── */}
        <text x="213" y="270" textAnchor="middle" fill="#6B7280" fontSize="9" fontWeight="600"
              className={`transition-all duration-500 ${visible ? 'opacity-80' : 'opacity-0'}`}
              style={{ transitionDelay: '1s' }}>
          Descubre
        </text>
        <text x="488" y="270" textAnchor="middle" fill="#4B5563" fontSize="9" fontWeight="600"
              className={`transition-all duration-500 ${visible ? 'opacity-80' : 'opacity-0'}`}
              style={{ transitionDelay: '1.7s' }}>
          Practica
        </text>
        <text x="738" y="270" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="600"
              className={`transition-all duration-500 ${visible ? 'opacity-80' : 'opacity-0'}`}
              style={{ transitionDelay: '2.2s' }}>
          Mejora
        </text>
        <text x="950" y="270" textAnchor="middle" fill="#15803D" fontSize="10" fontWeight="700"
              className={`transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '3.2s' }}>
          Aprueba
        </text>

      </svg>

      <style jsx>{`
        @keyframes road-draw {
          from { stroke-dashoffset: 1200; }
          to { stroke-dashoffset: 0; }
        }
        .animate-road-draw {
          animation: road-draw 3s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}
