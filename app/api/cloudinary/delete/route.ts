import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: Request) {
  try {
    const { publicId, resourceType } = await req.json();

    // Debug environment variables
    console.log("Server Environment Check:", {
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKeyLength: process.env.CLOUDINARY_API_KEY?.length,
      requestPublicId: publicId,
      requestResourceType: resourceType
    });

    if (!publicId) {
      return NextResponse.json({ error: "Public ID is required" }, { status: 400 });
    }

    // Cloudinary defaults to 'image' if resourceType isn't provided.
    // 'raw' and 'video' MUST be explicitly stated.
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || 'image',
      invalidate: true, // Clears the CDN cache immediately
    });

    console.log("Cloudinary Delete Result:", result);

    if (result.result !== 'ok') {
      return NextResponse.json({ error: "Cloudinary delete failed", details: result }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Cloudinary Delete Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
