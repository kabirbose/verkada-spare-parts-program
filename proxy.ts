import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// ── Public routes ──────────────────────────────────────────────────────────
// /sign-in and its catch-all sub-paths must remain public.
// Without this, unauthenticated requests loop: / → /sign-in → /sign-in → …
const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

// ── Auth enforcement ───────────────────────────────────────────────────────
// Every route that is not explicitly public is protected. Unauthenticated
// visitors are redirected to /sign-in automatically by auth.protect().
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

// ── Matcher ────────────────────────────────────────────────────────────────
// Run on all application paths and API routes; skip Next.js internals and
// static assets so they are never blocked by auth.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jte?|svgz?|ttf|otf|woff2?|png|jpe?g|gif|webp|ico)).*)",
    "/(api|trpc)(.*)",
  ],
};
