import Link from "next/link";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <Link className="site-footer-brand" href="/">Xarchive</Link>
      <p>A community-built archive for music and its history.</p>
      <nav aria-label="Footer navigation"><Link href="/search">Explore</Link><Link href="/download">Bulk download</Link><Link href="/contribute">Contribute</Link></nav>
      <span>Listen closer. Keep the record.</span>
    </footer>
  );
}
