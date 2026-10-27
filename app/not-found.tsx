import Link from "next/link";
import "./pieces/error.css";

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="message">
        <h1 className="code">404</h1>
        <h1>Not found</h1>
      </div>
      <Link href="/">Return Home</Link>
    </main>
  );
}