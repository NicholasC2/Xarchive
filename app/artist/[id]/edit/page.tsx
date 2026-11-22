"use client";

import { useParams } from "next/navigation";
import ArtistEdit from "@/app/contribute/artist-edit";

export default function ArtistPage() {
	const { id } = useParams<{ id: string }>();

	return <div className="panel">
        <ArtistEdit artistId={id} />
    </div>;
}