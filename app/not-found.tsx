import Link from "next/link";
import "./not-found.css";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div>
        <span>404</span>
        <h1>Not found</h1>
        <Link href="/">Home</Link>
      </div>
    </main>
  );
}