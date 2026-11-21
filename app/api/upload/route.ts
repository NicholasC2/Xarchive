import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { bucket, bucketName } from "@/lib/r2";
import { auth } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if(!session) {
            return NextResponse.json(
                { error: "You need to be logged in to upload media." },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        const key = `media/${crypto.randomUUID()}`

        await bucket.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: Buffer.from(await file.arrayBuffer()),
                ContentType: file.type
            })
        );

        return NextResponse.json({
            success: true,
            key,
        }, { status: 201 });
    } catch (error) {
        console.error("Upload error:", error);

        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}