"use client";

import { ArrowLeft, ImagePlus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import "./profile.css";

type ProfileLink = { label: string; url: string; icon: string };
type Profile = { username: string; bio: string; imageUrl: string | null; links: ProfileLink[] };

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read image."));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile>({ username: "", bio: "", imageUrl: null, links: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profiles/me").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sign in to edit your profile.");
      const profileLinks = Array.isArray(data.profile?.links) ? data.profile.links.map((link: { label?: string; url?: string; icon?: string }) => ({ label: typeof link.label === "string" ? link.label : "", url: typeof link.url === "string" ? link.url : "", icon: typeof link.icon === "string" ? link.icon : "website" })) : [];
      setProfile({ username: data.profile.username ?? "", bio: data.profile.bio ?? "", imageUrl: data.profile.imageUrl ?? null, links: profileLinks });
    }).catch((reason: Error) => setMessage(reason.message)).finally(() => setLoading(false));
  }, []);

  function updateProfileLink(index: number, patch: Partial<ProfileLink>) {
    setProfile((current) => ({ ...current, links: current.links.map((link, linkIndex) => linkIndex === index ? { ...link, ...patch } : link) }));
  }

  function addProfileLink() {
    setProfile((current) => ({ ...current, links: [...current.links, { label: "", url: "", icon: "website" }] }));
  }

  function removeProfileLink(index: number) {
    setProfile((current) => ({ ...current, links: current.links.filter((_, linkIndex) => linkIndex !== index) }));
  }

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage("Profile images must be 2 MB or smaller.");
        return;
      }
      setMessage("");
      const imageUrl = await fileAsDataUrl(file);
      setProfile((current) => ({ ...current, imageUrl }));
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, links: profile.links.filter((link) => link.label.trim() && link.url.trim()) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your profile.");
      setMessage("Profile saved.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="profile-edit-page"><p className="profile-loading">Loading profile…</p></main>;

  return (
    <main className="profile-edit-page">
      <Link className="back-link" href="/"><ArrowLeft size={15} /> Back to archive</Link>
      {profile.username ? (
        <div className="profile-edit-layout">
          <form className="profile-edit-form" onSubmit={save}>
            <div className="profile-edit-heading"><h2>Edit profile</h2><span>PUBLIC PROFILE</span></div>
            <label className="profile-photo-picker" htmlFor="profile-photo">
              {profile.imageUrl ? <Image src={profile.imageUrl} alt="Profile preview" width={58} height={58} unoptimized /> : <span className="profile-photo-placeholder"><ImagePlus size={21} /></span>}
              <span><strong>Profile photo</strong><small>PNG, JPG, GIF, or WebP · up to 2 MB</small></span>
              <input id="profile-photo" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={chooseImage} />
            </label>
            {profile.imageUrl && <button className="remove-photo" type="button" onClick={() => setProfile((current) => ({ ...current, imageUrl: null }))}><Trash2 size={14} /> Remove photo</button>}
            <label className="field-label" htmlFor="profile-name">Display name</label>
            <input id="profile-name" value={profile.username} maxLength={50} required onChange={(event) => setProfile((current) => ({ ...current, username: event.target.value }))} />
            <label className="field-label" htmlFor="profile-bio">About you<span>{profile.bio.length}/500</span></label>
            <textarea id="profile-bio" rows={5} maxLength={500} value={profile.bio} placeholder="What do you listen for?" onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))} />
            <div className="profile-links-section">
              <div className="profile-links-header">
                <span>Links</span>
                <button type="button" onClick={addProfileLink}>Add link</button>
              </div>
              {profile.links.map((link, index) => (
                <div key={`${link.label}-${index}`} className="profile-link-row">
                  <input value={link.label} placeholder="Spotify" onChange={(event) => updateProfileLink(index, { label: event.target.value })} />
                  <input value={link.url} placeholder="https://example.com" onChange={(event) => updateProfileLink(index, { url: event.target.value })} />
                  <select value={link.icon} onChange={(event) => updateProfileLink(index, { icon: event.target.value })}>
                    <option value="website">Website</option>
                    <option value="spotify">Spotify</option>
                    <option value="soundcloud">SoundCloud</option>
                    <option value="youtube">YouTube</option>
                    <option value="bandcamp">Bandcamp</option>
                    <option value="apple-music">Apple Music</option>
                    <option value="instagram">Instagram</option>
                    <option value="x">X / Twitter</option>
                  </select>
                  <button type="button" className="profile-link-remove" onClick={() => removeProfileLink(index)}>Remove</button>
                </div>
              ))}
            </div>
            {message && <p className={message === "Profile saved." ? "profile-message profile-success" : "profile-message"} role="status">{message}</p>}
            <button className="profile-save" type="submit" disabled={busy}><Save size={15} />{busy ? "Saving…" : "Save profile"}</button>
          </form>
        </div>
      ) : (
        <section className="profile-signin"><p>{message}</p><Link href="/login">Log in <ArrowLeft size={14} /></Link></section>
      )}
    </main>
  );
}