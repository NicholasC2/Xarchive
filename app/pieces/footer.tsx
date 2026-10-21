import Link from "next/link";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <Link className="site-footer-brand" href="/">Xarchive</Link>
      <p>Cool archive site</p>
    </footer>
  );
}
