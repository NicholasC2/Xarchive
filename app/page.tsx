import ArchiveHome from "./peices/archive-home";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  return <ArchiveHome initialQuery={q} />;
}
