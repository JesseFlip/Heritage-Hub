import EventDetail from "@/components/EventDetail";
import { getSampleEvents } from "@/lib/events";

/**
 * Static export needs every dynamic path known at build time. We pre-render
 * a page for each bundled community event; slugs added later via Supabase
 * (organizer submissions) are served through the GitHub Pages 404 fallback
 * (see src/app/not-found.tsx), which re-mounts the app at "/" and opens the
 * event by slug client-side instead.
 */
export async function generateStaticParams() {
  return getSampleEvents().map((e) => ({ slug: e.slug }));
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EventDetail key={slug} slug={slug} />;
}
