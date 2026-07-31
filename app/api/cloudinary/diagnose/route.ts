import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      // Client-side variables
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      
      // Server-side variables
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '***PRESENT***' : '***MISSING***',
      
      // Validation
      hasClientCloudName: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      hasServerCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasClientApiKey: !!process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      hasServerApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasServerSecret: !!process.env.CLOUDINARY_API_SECRET,
      serverApiKeyLength: process.env.CLOUDINARY_API_KEY?.length,
      clientApiKeyLength: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY?.length,
    };

    // Test Cloudinary configuration
    let cloudinaryTest = null;
    let pingStatus = 'Not Tested';

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        // Test with a simple API call - get account info
        const testResult = await cloudinary.api.resource('', { 
          resource_type: 'image',
          max_results: 1 
        });
        
        cloudinaryTest = {
          success: true,
          rate_limit_remaining: testResult.rate_limit_remaining,
          rate_limit_reset_at: testResult.rate_limit_reset_at
        };
        pingStatus = 'Success';
      } catch (error: any) {
        cloudinaryTest = {
          success: false,
          error: error.message,
          error_type: error.name || 'Unknown'
        };
        pingStatus = 'Failed';
      }
    }

    const diagnostic: {
      timestamp: string,
      status: string,
      configDetected: typeof envCheck,
      cloudinaryTest: typeof cloudinaryTest,
      recommendations: string[]
    } = {
      timestamp: new Date().toISOString(),
      status: pingStatus,
      configDetected: envCheck,
      cloudinaryTest: cloudinaryTest,
      recommendations: []
    };

    // Add recommendations based on findings
    if (!envCheck.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      diagnostic.recommendations.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is missing from .env.local");
    }
    if (!envCheck.CLOUDINARY_CLOUD_NAME) {
      diagnostic.recommendations.push("CLOUDINARY_CLOUD_NAME is missing from .env.local (server-side)");
    }
    if (!envCheck.CLOUDINARY_API_KEY) {
      diagnostic.recommendations.push("CLOUDINARY_API_KEY is missing from .env.local");
    }
    if (!envCheck.CLOUDINARY_API_SECRET) {
      diagnostic.recommendations.push("CLOUDINARY_API_SECRET is missing from .env.local");
    }
    if (envCheck.serverApiKeyLength && envCheck.serverApiKeyLength !== 15) {
      diagnostic.recommendations.push(`CLOUDINARY_API_KEY length is ${envCheck.serverApiKeyLength}, expected 15 digits`);
    }

    return NextResponse.json(diagnostic, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error: any) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'Error',
      error: error.message,
      configDetected: null,
      cloudinaryTest: null,
      recommendations: ['Check server logs for detailed error information'] as string[]
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}
