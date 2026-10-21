"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArchiveEntrySummary } from "./archive-entry-row";
import "./archive-comments.css";

type Comment = { id: string; body: string; audioFileId: string | null; createdAt: string; creatorName: string | null };

export default function ArchiveComments({ entry }: { entry: ArchiveEntrySummary }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [audioFileId, setAudioFileId] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/archive/${encodeURIComponent(entry.id)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load comments.");
        setComments(result.comments);
      })
      .catch((reason: Error) => setMessage(reason.message));
  }, [entry.id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/archive/${encodeURIComponent(entry.id)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, audioFileId: audioFileId || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your comment.");
      setComments((current) => [result.comment, ...current]);
      setBody("");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not save your comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="archive-comments">
      <h2>Comments <span>{comments.length}</span></h2>
      <form onSubmit={submit}>
        {entry.audioFiles?.length ? (
          <label>Comment on
            <select value={audioFileId} onChange={(event) => setAudioFileId(event.target.value)}>
              <option value="">Song</option>
              {entry.audioFiles.map((file) => <option key={file.id} value={file.id}>{file.fileName}</option>)}
            </select>
          </label>
        ) : null}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder="Share context or a note…" required />
        {message && <p role="alert">{message}</p>}
        <button type="submit" disabled={busy}>{busy ? "Posting…" : "Post comment"}</button>
      </form>
      {comments.length ? <div className="archive-comment-list">{comments.map((comment) => <article key={comment.id}>
        <div><strong>{comment.creatorName || "Listener"}</strong><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString()}</time></div>
        {comment.audioFileId && <small>{entry.audioFiles?.find((file) => file.id === comment.audioFileId)?.fileName ?? "Audio version"}</small>}
        <p>{comment.body}</p>
      </article>)}</div> : <p className="archive-comments-empty">No comments yet.</p>}
    </section>
  );
}
