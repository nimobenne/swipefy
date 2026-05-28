"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/50 transition-colors"
        title={session.user?.email ?? "Account"}
      >
        {session.user?.image ? (
          <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
            {session.user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-white text-sm font-semibold truncate">{session.user?.name}</p>
            <p className="text-subtext text-xs truncate mt-0.5">{session.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-4 py-3 text-sm text-remove hover:bg-white/5 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
