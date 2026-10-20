"use client";

import { ArrowUpRight, Disc3, UserRoundPlus, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ArchiveEntryRow from "@/app/peices/archive-entry-row";
import "./profile-view.css";

type Person = { id: string; username: string; imageUrl: string | null };
type Entry = { id: string; kind: "song" | "album" | "artist" | "collective"; title: string; artists: string[]; aka: string[]; bio: string; source: string | null; fileUrl: string | null; mediaUrl: string | null; collective: string | null; releaseYear: number | null; tracklist: string[] };
type ProfileData = { profile: Person & { bio: string; followers: number; following: number; isFollowing: boolean }; entries: Entry[]; followers: Person[]; following: Person[]; artists: { id: string; title: string }[]; viewerId: string | null };
type View = "entries" | "followers" | "following";

export default function PublicProfile() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ProfileData | null>(null);
  const [view, setView] = useState<View>("entries");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/profiles/${encodeURIComponent(params.id)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load this profile.");
        return result as ProfileData;
      })
      .then((result) => { if (active) setData(result); })
      .catch((reason: Error) => { if (active) setMessage(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  async function toggleFollow() {
    if (!data) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/profiles/${encodeURIComponent(data.profile.id)}/follow`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow: !data.profile.isFollowing }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update follow.");
      const profileResponse = await fetch(`/api/profiles/${encodeURIComponent(data.profile.id)}`);
      const profileResult = await profileResponse.json();
      if (!profileResponse.ok) throw new Error(profileResult.error || "Could not refresh this profile.");
      setData(profileResult);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not update follow.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="public-profile-page"><p className="profile-loading">Loading profile…</p></main>;
  if (!data) return <main className="public-profile-page"><p className="profile-error">{message || "Profile not found."}</p></main>;

  const ownProfile = data.viewerId === data.profile.id;
  const people = view === "followers" ? data.followers : data.following;
  const artistIds = Object.fromEntries(data.artists.map((artist) => [artist.title.toLowerCase(), artist.id]));

  return (
    <main className="public-profile-page">
      <div className="public-profile-heading">
        <div className="public-avatar">{data.profile.imageUrl ? <Image src={data.profile.imageUrl} alt="" width={96} height={96} unoptimized /> : <span>{data.profile.username.slice(0, 1).toUpperCase()}</span>}</div>
        <div className="public-profile-details">
          <p className="eyebrow">ARCHIVE CONTRIBUTOR</p>
          <h1>{data.profile.username}</h1>
          {data.profile.bio && <p className="public-bio">{data.profile.bio}</p>}
          <div className="social-counts">
            <button onClick={() => setView("followers")}><strong>{data.profile.followers}</strong> followers</button>
            <button onClick={() => setView("following")}><strong>{data.profile.following}</strong> following</button>
          </div>
        </div>
        {ownProfile ? <Link className="edit-profile-link" href="/account">Edit profile <ArrowUpRight size={14} /></Link> : data.viewerId ? <button className={`follow-button ${data.profile.isFollowing ? "following" : ""}`} onClick={toggleFollow} disabled={busy}><UserRoundPlus size={15} />{busy ? "Saving…" : data.profile.isFollowing ? "Following" : "Follow"}</button> : <Link className="follow-button" href="/login"><UserRoundPlus size={15} />Sign in to follow</Link>}
      </div>

      {message && <p className="profile-feedback" role="status">{message}</p>}
      <div className="profile-content-tabs" role="group" aria-label="Profile sections">
        <button className={view === "entries" ? "active" : ""} onClick={() => setView("entries")}>Contributions <span>{data.entries.length}</span></button>
        <button className={view === "followers" ? "active" : ""} onClick={() => setView("followers")}>Followers <span>{data.profile.followers}</span></button>
        <button className={view === "following" ? "active" : ""} onClick={() => setView("following")}>Following <span>{data.profile.following}</span></button>
      </div>

      {view === "entries" ? (
        data.entries.length ? <div className="profile-entry-list">{data.entries.map((entry) => <ArchiveEntryRow key={entry.id} entry={{ ...entry, artistIds }} />)}</div> : <div className="profile-empty"><Disc3 size={22} /><p>No contributions yet.</p></div>
      ) : people.length ? (
        <div className="people-list">{people.map((person) => <Link className="person-row" key={person.id} href={`/profile/${encodeURIComponent(person.id)}`}><span className="person-avatar">{person.imageUrl ? <Image src={person.imageUrl} alt="" width={38} height={38} unoptimized /> : person.username.slice(0, 1).toUpperCase()}</span><strong>{person.username}</strong><ArrowUpRight size={15} /></Link>)}</div>
      ) : (
        <div className="profile-empty"><Users size={22} /><p>{view === "followers" ? "No followers yet." : "Not following anyone yet."}</p></div>
      )}
    </main>
  );
}