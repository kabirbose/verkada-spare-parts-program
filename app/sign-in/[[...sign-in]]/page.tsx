import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <SignIn />
    </main>
  );
}
