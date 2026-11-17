"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password, options: { data: { full_name: name.trim() } },
      });
      if (error) { setMessage("Could not create the account. Check your details or try signing in."); return; }
      if (data.session) { router.push("/dashboard"); return; }
      setMessage("Check your email for confirmation. Once confirmed, sign in to continue.");
    } catch { setMessage("Could not reach the service. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#F5F3EE] px-6">
    <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-lg">
      <h1 className="text-3xl font-semibold">Create your ZOYA account</h1>
      <p className="mt-3 text-gray-600">Submit properties for review and manage your profile.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">Display name<input className="w-full rounded border p-3" required maxLength={120} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
        <label className="block">Email<input className="w-full rounded border p-3" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
        <label className="block">Password<input className="w-full rounded border p-3" type="password" required minLength={12} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /></label>
        <p className="text-sm text-gray-600">Use at least 12 characters.</p>
        <button disabled={busy} className="w-full rounded bg-black p-3 text-white">{busy ? "Creating account…" : "Create account"}</button>
        <p role="status">{message}</p>
      </form>
      <Link className="mt-5 block underline" href="/login">Already registered? Sign in</Link>
    </div>
  </main>;
}
