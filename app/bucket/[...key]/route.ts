import { NextRequest, NextResponse } from "next/server";
import {
    GetObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { bucket, bucketName } from "@/lib/r2";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key: segments } = await params;
        const key = segments.join("/");

        const getMeta = request.nextUrl.searchParams.has("meta");

        if (getMeta) {
            const result = await bucket.send(
                new HeadObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                })
            );

            return NextResponse.json({
                key,
                comment: result.Metadata?.comment,
                contributor: result.Metadata?.contributor,
                type: result.Metadata?.type,
                source: result.Metadata?.source,
                mimeType: result.ContentType,
                sizeBytes: result.ContentLength,
                createdAt: result.LastModified,
            });
        }

        const result = await bucket.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: key,
            })
        );

        if (!result.Body) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return new NextResponse(
            result.Body.transformToWebStream(),
            {
                headers: {
                    "Content-Type": result.ContentType ?? "application/octet-stream",
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                    ...(result.ContentLength !== undefined && {
                        "Content-Length": String(result.ContentLength),
                    }),
                },
            }
        );

    } catch (error) {
        console.error("R2 fetch error:", error);

        return new NextResponse("File not found", {
            status: 404,
        });
    }
}