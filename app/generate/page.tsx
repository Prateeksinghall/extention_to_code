"use client"

import { useEffect, useState } from 'react'
import { AnalysisResult } from "@/components/analysis-result"
import type { WebsiteAnalysis } from "@/lib/types"

export default function GeneratePage() {
    const [analysisData, setAnalysisData] = useState<WebsiteAnalysis | null>(null)
    const [loading, setLoading] = useState(true)
    const [code, setCode] = useState('')
    const [status, setStatus] = useState('Loading extension data...')

    useEffect(() => {
        loadExtensionData()
    }, [])

    const loadExtensionData = async () => {
        try {
            const response = await fetch('/api/design-data')
            const result = await response.json()

            if (result.recentDesigns?.length > 0) {
                const latest = result.recentDesigns[0].data

                const transformed: WebsiteAnalysis = {
                    url: latest.meta.url,
                    title: latest.content.heroTitle || latest.meta.brand,
                    extractedAt: latest.meta.extractedAt,
                    screenshot: null,
                    designSystem: {
                        colors: Object.entries(latest.designTokens.colors).map(([name, hex]) => ({
                            name,
                            hex: hex as string,
                            usage: `${name} color`
                        })),
                        typography: [
                            {
                                fontFamily: latest.designTokens.fonts.heading,
                                fontSize: latest.designTokens.typography.heading.fontSize,
                                fontWeight: latest.designTokens.typography.heading.fontWeight,
                                usage: 'Heading'
                            },
                            {
                                fontFamily: latest.designTokens.fonts.body,
                                fontSize: latest.designTokens.typography.body.fontSize,
                                fontWeight: '400',
                                usage: 'Body'
                            }
                        ]
                    },
                    layout: latest.layout,
                    ...latest
                }

                setAnalysisData(transformed)
                setStatus(`✅ Loaded ${latest.meta.brand}`)
                generateCode(latest)
            } else {
                setStatus('No designs yet')
            }
        } catch (e) {
            setStatus('Waiting for extension...')
        } finally {
            setLoading(false)
        }
    }

    const generateCode = async (rawData: any) => {
        try {
            const response = await fetch('/api/design-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rawData)
            })
            const result = await response.json()
            setCode(result.codeResult?.code || '// Code ready!')
        } catch (e) {
            setCode('// Design analysis complete!')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 border-4 border-blue-500/50 border-t-blue-500 rounded-full animate-spin mx-auto mb-8"></div>
                    <p className="text-2xl font-semibold text-slate-300 mb-2">{status}</p>
                    <p className="text-slate-500">Extension → Extract → Send to App</p>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Sticky Header */}
            <header className="border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-xl sticky top-0 z-50 supports-[backdrop-filter:blur(20px)]:bg-slate-900/90">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                                🎨 Design → Code
                            </h1>
                            <p className="text-lg text-slate-400 mt-1">{status}</p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-600 text-slate-200 rounded-xl border border-slate-600 transition-all whitespace-nowrap"
                        >
                            🔄 Refresh Data
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content - Full Height & Scrollable */}
            <main className="min-h-[calc(100vh-80px)]">
                <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">
                    {analysisData ? (
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* LEFT: Analysis (scrolls naturally) */}
                            <div className="lg:max-h-[80vh] lg:overflow-y-auto lg:pr-4 space-y-6">
                                <AnalysisResult analysis={analysisData} />
                            </div>

                            {/* RIGHT: Code (scrolls independently) */}
                            <div className="lg:pl-4 lg:max-h-[80vh] lg:overflow-y-auto">
                                <div className="sticky top-0 p-1">
                                    <div className="flex items-center justify-between mb-6 bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50">
                                        <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                                            💻 Production Code
                                        </h2>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(code)}
                                            className="px-5 py-2.5 bg-emerald-500/90 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-emerald-500/50 transition-all text-sm"
                                            disabled={!code.trim()}
                                        >
                                            📋 Copy All
                                        </button>
                                    </div>

                                    <div className="bg-slate-900/95 border-2 border-emerald-500/30 rounded-2xl p-6 min-h-[400px]">
                                        <pre className="text-sm font-mono whitespace-pre-wrap text-slate-100 leading-relaxed overflow-y-auto max-h-[60vh]">
                                            {code || '// Generating production-ready Next.js + Tailwind code...\n\nDesign analysis loaded above ↑\n\nClick "Copy All" when ready!'}
                                        </pre>
                                    </div>

                                    <div className="mt-6 text-center text-xs text-slate-500 py-3 border-t border-slate-800/50">
                                        Generated from {analysisData.title} • {new Date(analysisData.extractedAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid place-items-center py-32">
                            <div className="text-center max-w-2xl p-12">
                                <div className="w-28 h-28 bg-slate-800/50 rounded-3xl p-10 mx-auto mb-12 flex items-center justify-center border-2 border-dashed border-slate-700">
                                    <span className="text-4xl">🎨</span>
                                </div>
                                <h2 className="text-4xl font-bold text-slate-300 mb-6">{status}</h2>
                                <p className="text-xl text-slate-500 mb-12">
                                    Open Chrome extension → Enter URL → Extract Design → Send to App
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-12 py-6 bg-blue-500/80 hover:bg-blue-500 text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all"
                                >
                                    🔄 Check for Data
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
