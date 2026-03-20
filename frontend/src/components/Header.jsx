import { Headphones } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-[#1E3A5F] text-white py-10 px-6 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -top-8 -right-8 w-64 h-64 rounded-full bg-white" />
        <div className="absolute -bottom-12 -left-12 w-80 h-80 rounded-full bg-white" />
      </div>

      <div className="max-w-3xl mx-auto text-center relative">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#14B8A6] flex items-center justify-center shadow-lg">
            <Headphones className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">ReadAloud</h1>
        </div>
        <p className="text-blue-200 text-lg font-light">
          Turn any web page or PDF into a podcast
        </p>
        <div className="flex items-center justify-center gap-6 mt-5 text-xs text-blue-300 font-medium uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
            AI Powered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
            Natural Voice
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
            Free to Use
          </span>
        </div>
      </div>
    </header>
  );
}
