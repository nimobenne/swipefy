"use client";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/discover",
    label: "Discover",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? "currentColor" : "none"} />
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M8 21H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3m0 7v-7m0 7h8m-8-7h8m0 0h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3m0-7V9m0 12V9m0-5V3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/nominations",
    label: "Nominate",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-spotify-black border-t border-white/10 flex items-stretch safe-area-pb">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href || (href === "/nominations" && pathname === "/nominate");
        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
              active ? "text-spotify-green" : "text-subtext hover:text-white"
            }`}
          >
            {icon(active)}
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
