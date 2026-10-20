import Link from "next/link";

export default function ArtistNames({ names, artistIds }: { names: string[]; artistIds: Record<string, string> }) {
  return <>{names.map((name, index) => {
    const id = artistIds[name.toLowerCase()];
    return <span key={`${name}-${index}`}>{id ? <Link className="artist-name-link" href={`/artists/${encodeURIComponent(id)}`}>{name}</Link> : name}{index < names.length - 1 ? ", " : ""}</span>;
  })}</>;
}