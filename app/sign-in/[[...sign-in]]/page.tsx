import { SignIn } from "@clerk/nextjs";

// Clerk uses a catch-all route ([[...sign-in]]) so it can handle all of its
// internal sub-paths (e.g. OAuth callbacks, factor verification) under /sign-in.
export default function SignInPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <SignIn />
    </main>
  );
}
