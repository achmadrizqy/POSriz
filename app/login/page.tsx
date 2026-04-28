"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/pos";
  const isError = searchParams.get("error") === "forbidden";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(isError ? "Akses ditolak. Anda tidak memiliki izin." : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Username atau password salah.");
      return;
    }

    router.push(redirect);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-2xl">R</span>
            </div>
            <h1 className="text-4xl font-black text-white">
              POS<span className="text-green-400">riz</span>
            </h1>
          </div>
          <p className="text-slate-400 text-base">
            {redirect.startsWith("/admin") ? "Login Admin / Back Office" : "Login Kasir"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-base font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-base font-semibold text-slate-300">Username</label>
              <input
                type="text"
                autoFocus
                autoComplete="username"
                className="w-full bg-slate-700 border-2 border-slate-600 text-white text-xl px-4 py-3 rounded-xl outline-none focus:border-green-500 transition-colors placeholder:text-slate-500"
                placeholder="Masukkan username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-base font-semibold text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full bg-slate-700 border-2 border-slate-600 text-white text-xl px-4 py-3 pr-12 rounded-xl outline-none focus:border-green-500 transition-colors placeholder:text-slate-500"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:text-slate-400 text-white py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {isLoading ? (
                <span className="animate-pulse">Masuk...</span>
              ) : (
                <><LogIn className="w-5 h-5" /> Masuk</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-slate-600 text-sm">
          <a href="/" className="hover:text-slate-400 transition-colors">← Kembali ke halaman utama</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
