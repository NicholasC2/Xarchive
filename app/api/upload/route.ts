import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { bucket, bucketName } from "@/lib/r2";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth/server";
import { AudioSource, sources } from "@/lib/db/constants/sources";
import { MediaType, mediaTypes } from "@/lib/db/constants/mediaType";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if(!session?.user) {
            return NextResponse.json(
                { error: "You need to be logged in to upload files" },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const folder = formData.get("folder")?.toString();
        const comment = formData.get("comment")?.toString();
        var mediaType = formData.get("mediaType")?.toString();
        var source = formData.get("source")?.toString();

        if (!sources.includes(source as AudioSource)) {
            source = "Unknown"
        }

        if (!mediaTypes.includes(source as MediaType)) {
            mediaType = "None";
        }

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        const extension = file.name.split(".").pop();
        let key = `${folder}/${randomUUID()}.${extension}`;

        if(folder == "pfp") {
            key = `pfp/${session.user.id}`
        }

        await bucket.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: Buffer.from(await file.arrayBuffer()),
                ContentType: file.type,

                Metadata: {
                    comment: comment ?? "",
                    contributor: session.user.id,
                    type: mediaType ?? "None",
                    source: source ?? "Unknown",
                },
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