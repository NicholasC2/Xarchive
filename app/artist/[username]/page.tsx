"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NotFound from "@/app/not-found";

export default function ArtistPage() {
  const { username } = useParams<{ username: string }>();
  const [artist, setArtist] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadArtist() {
      try {
        const response = await fetch(
          `/api/artist/${encodeURIComponent(username)}`,
          { signal: controller.signal }
        );

        if (response.status === 404) {
          setNotFound(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch artist");
        }

        setArtist(await response.json());
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      }
    }

    loadArtist();

    return () => controller.abort();
  }, [username]);

  if (notFound) return <NotFound />;
  if (!artist) return <></>;

  return <div>{artist.name}</div>;
}