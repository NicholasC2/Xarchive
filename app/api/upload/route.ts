import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { bucket, bucketName } from "@/lib/r2";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    if(!bucket) return NextResponse.json(
      { error: "Bucket not configured" },
      { status: 500 }
    )

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

    const key = `${contentType.startsWith("image/") ? "images" : "audio_files"}/${randomUUID()}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(bucket, command, {
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