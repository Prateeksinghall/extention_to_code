import { type NextRequest, NextResponse } from "next/server"
import { generateCode } from "@/lib/ai-generator"

let recentDesigns = []  // In-memory storage (dev only)
let designCounter = 0

export const maxDuration = 60

export async function POST(request: NextRequest) {
    try {
        const designData = await request.json()

        console.log("🎨 Design data received:", {
            brand: designData.meta?.brand,
            pageIntent: designData.meta?.pageIntent,
            colors: designData.designTokens?.colors
        })

        // Store recent design
        designCounter++
        recentDesigns.unshift({
            id: `design_${designCounter}`,
            data: designData,
            timestamp: new Date().toISOString()
        })
        recentDesigns = recentDesigns.slice(0, 5)  // Keep last 5

        let codeResult = null
        try {
            // Safe AI call
            const safePayload = {
                analysis: {
                    designTokens: designData.designTokens || {},
                    layout: designData.layout || {},
                    content: designData.content || {},
                    pageIntent: designData.meta?.pageIntent || 'marketing'
                },
                instructions: "Generate Next.js code"
            }
            codeResult = await generateCode(safePayload)
        } catch (aiError) {
            console.log("🤖 AI skipped:", aiError.message)
        }

        return NextResponse.json({
            success: true,
            recentDesigns,  // Array of stored designs
            currentDesignId: recentDesigns[0]?.id,
            codeResult
        })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// ✅ ADD GET SUPPORT
export async function GET() {
    return NextResponse.json({
        success: true,
        recentDesigns,
        message: "Latest designs",
        count: recentDesigns.length
    })
}
