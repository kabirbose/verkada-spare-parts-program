import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// The sign-in page must be public — otherwise unauthenticated users get
// redirected to /sign-in, which redirects to /sign-in, infinitely.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jte?|svgz?|ttf|otf|woff2?|png|jpe?g|gif|webp|ico)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
