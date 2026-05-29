"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLoginAction } from "@/app/actions/auth";
import { Lock } from "lucide-react";

export default function ClientLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await adminLoginAction(password);
    if (res.success) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(res.error || "Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-white px-4 min-h-screen">
      <div className="w-full max-w-md bg-white rounded-xl border border-brand-hairline p-8 shadow-xs">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-md bg-brand-soft border border-brand-hairline flex items-center justify-center text-brand-primary mx-auto mb-4">
            <Lock className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-brand-primary">Espace Administration</h1>
          <p className="text-slate-500 text-xs mt-1">Veuillez vous authentifier pour accéder à la console</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-center">
              <span className="text-rose-800 text-xs font-semibold">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="pass" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Mot de passe admin
            </label>
            <input
              type="password"
              id="pass"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3.5 rounded-md border border-brand-hairline bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-brand-primary transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-brand-primary hover:bg-brand-primary-active disabled:opacity-50 text-white font-bold text-xs tracking-tight rounded-md transition duration-200"
          >
            {loading ? "Vérification..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
