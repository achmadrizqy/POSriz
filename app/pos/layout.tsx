import Link from "next/link";
import StokBadge from "../components/StokBadge";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LogoutButton from "../components/LogoutButton";

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?redirect=/pos");

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="w-60 bg-slate-900 text-white flex flex-col shadow-2xl shrink-0">
        <div className="px-6 py-7 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
              K
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide text-white leading-none">KASIR</h1>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">POS Toko Rizqy</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          <NavItem href="/pos" emoji="🛒" label="Transaksi" />
          <NavItem href="/pos/stok-kritis" emoji="🔔" label="Stok Kritis" badge={<StokBadge />} />
        </nav>

        <div className="px-4 py-4 border-t border-slate-700/60 space-y-3">
          <div className="px-2">
            <p className="text-xs text-slate-500">Login sebagai</p>
            <p className="text-sm font-bold text-slate-300 capitalize">{(session.user as any).username}</p>
            <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              {(session.user as any).role}
            </span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, emoji, label, badge }: { href: string; emoji: string; label: string; badge?: React.ReactNode }) {
  return (
    <li className="list-none">
      <Link href={href} className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white text-lg font-semibold transition-all">
        <span className="text-2xl leading-none">{emoji}</span>
        <span className="flex-1">{label}</span>
        {badge}
      </Link>
    </li>
  );
}
