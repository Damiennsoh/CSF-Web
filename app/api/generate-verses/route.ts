import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prayerPoints, eventType, randomSeed } = await request.json()
    // Support both NEXT_PUBLIC_ for local/legacy and GEMINI_API_KEY for Vercel/server-side
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    if (apiKey.length < 20) {
      return NextResponse.json(
        { error: 'Gemini API key appears to be invalid (too short)' },
        { status: 500 }
      )
    }

    const prompt = `Random seed: ${randomSeed}

Generate Bible verses for these prayer points for ${eventType}:
${prayerPoints.map((point: string, index: number) => `${index + 1}. ${point}`).join('\n')}

For each numbered prayer point, provide ONE specific Bible verse reference that directly relates to that prayer point.
Format your response as a numbered list matching the prayer points, with ONLY the verse references.
Example format:
1. John 3:16
2. Psalm 23:1-3
3. Philippians 4:13

Each verse should be different and specifically relevant to its corresponding prayer point.
Do not include explanations or verse text itself.
Do not repeat verses you've provided before. Find new, relevant verses.`

    // List of available models in order of preference (gemini-2.5-flash as default)
    // NOTE: 1.5, 1.0 pro and flash models are retired and should not be used
    const availableModels = [
      'gemini-2.5-flash',     // Primary - fastest and most cost-effective
      'gemini-2.5-pro',       // Fallback - higher quality if needed
      'gemini-2.0-flash'      // Final fallback - stable and widely available
    ]

    let lastErrorDetails: any = null
    let successfulModel: string | null = null

    // Try each model until one works
    for (const model of availableModels) {
      try {
        console.log(`Attempting to generate verses with model: ${model}`)
        
        // Create AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 1024,
            }
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          console.log(`Successfully generated verses with model: ${model}`)
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const text = data.candidates[0].content.parts[0].text
            
            // Parse the response to extract verse references
            const verseLines = text.split('\n')
              .filter((line: string) => line.trim())
              .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
              .filter((verse: string) => verse)
            
            return NextResponse.json({
              success: true,
              verses: verseLines,
              model: model
            })
          } else {
            console.warn(`Model ${model} returned empty candidates`)
            lastErrorDetails = `Model ${model} returned empty candidates`
          }
        } else {
          const errorText = await response.text()
          console.error(`Model ${model} failed with status ${response.status}:`, errorText)
          lastErrorDetails = {
            model,
            status: response.status,
            error: errorText
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error(`Exception occurred with model ${model}:`, errMsg)
        
        // Check if it's an abort/timeout error
        if (err instanceof Error && err.name === 'AbortError') {
          lastErrorDetails = `Request to ${model} timed out after 30 seconds`
        } else {
          lastErrorDetails = errMsg
        }
      }
    }

    return NextResponse.json(
      { 
        error: 'All Gemini models failed', 
        details: lastErrorDetails,
        keyUsed: apiKey.substring(0, 6) + '...' // For debugging key prefix
      },
      { status: 500 }
    )
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
