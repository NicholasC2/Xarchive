import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { contentType } = await req.json();

    const isAllowedType =
        contentType.startsWith("image/") ||
        contentType.startsWith("audio/");

    if (!isAllowedType) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    const key = `uploads/${randomUUID()}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: 300,
    });

    return NextResponse.json({ uploadUrl, key });
  } catch (error) {
    console.error("R2 upload error:", error);

    return NextResponse.json(
      { error: "Could not create upload URL" },
      { status: 500 }
    );
  }
}