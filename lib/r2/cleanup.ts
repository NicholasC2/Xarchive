import {
    ListObjectsV2Command,
    DeleteObjectsCommand
} from "@aws-sdk/client-s3";

import { bucket, bucketName } from "../r2";
import { db } from "../db";

export async function cleanupR2() {
    const referenced = new Set<string>();

    const artists = await db.query.artists.findMany();
    const albums = await db.query.albums.findMany();
    const songs = await db.query.songs.findMany();

    for (const entry of [...artists, ...albums, ...songs]) {
        for (const media of entry.media) {
            referenced.add(media.url);
        }
    }

    let continuationToken: string | undefined;

    const now = Date.now();
    const gracePeriod = 24 * 60 * 60 * 1000;

    let deleted = 0;

    do {
        const response = await bucket.send(
            new ListObjectsV2Command({
                Bucket: bucketName,
                ContinuationToken: continuationToken,
                Prefix: "media/"
            })
        );

        const objectsToDelete = (response.Contents ?? [])
            .filter(object => {
                if (!object.Key || !object.LastModified) return false;

                const isReferenced = referenced.has(object.Key);
                const isOldEnough = now - object.LastModified.getTime() > gracePeriod;

                return !isReferenced && isOldEnough;
            });

        if (objectsToDelete.length > 0) {
            await bucket.send(
                new DeleteObjectsCommand({
                    Bucket: bucketName,
                    Delete: {
                        Objects: objectsToDelete.map(object => ({
                            Key: object.Key!
                        }))
                    }
                })
            );

            deleted += objectsToDelete.length;
        }

        continuationToken = response.NextContinuationToken;

    } while (continuationToken);

    return { deleted };
}