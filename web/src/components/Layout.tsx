import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--page-bg)]">
      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden
        />
      )}

      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* min-w-0 lets wide content (tables) scroll instead of forcing overflow */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar (hidden on lg+) */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-[var(--sidebar-bg)] border-b border-[var(--border)] flex-shrink-0">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="p-2 -ml-2 rounded-lg text-[var(--text-main)] hover:bg-[var(--hover-bg)] transition"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="" className="w-6 h-6 rounded object-contain bg-white" />
            <span className="font-bold text-sm text-[var(--text-main)]">TimeLogic</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
