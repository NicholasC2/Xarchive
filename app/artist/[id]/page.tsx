"use client";

import NotFound from "@/app/not-found";

type Artist = {
  id: string;
  name: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArtistPage({ params }: PageProps) {
  const { id } = await params;

  const response = await (await fetch(`/api/artist/${encodeURIComponent(id)}`)).json();

  if (response.error) {
    console.log(response)
    return <NotFound />;
  }

  const artist: Artist = await response.json();

  return <></>
}
