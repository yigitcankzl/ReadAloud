import { Headphones, Sparkles, Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="relative pt-16 pb-10" role="banner">
      {/* GitHub link */}
      <a
        href="https://github.com/yigitcankzl/ReadAloud"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View ReadAloud source code on GitHub (opens in new tab)"
        className="absolute top-6 right-6 text-white/20 hover:text-white/60 transition-colors"
      >
        <Github className="w-6 h-6" aria-hidden="true" />
      </a>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Logo */}
        <div
          className="flex items-center justify-center gap-3 mb-4"
          aria-hidden="true"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-emerald-500 flex items-center justify-center shadow-lg shadow-[#14B8A6]/25 animate-pulse-glow">
            <Headphones className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
          Read<span className="text-[#14B8A6]">Aloud</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-white/40 max-w-md mx-auto mb-6">
          Access any content. Just listen.
        </p>

        {/* Feature pills */}
        <div
          className="flex items-center justify-center gap-2 flex-wrap"
          aria-label="Features"
          role="list"
        >
          {['AI-Powered', 'Natural Voices', '100% Free'].map((tag) => (
            <span
              key={tag}
              role="listitem"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-white/40"
            >
              <Sparkles className="w-3 h-3 text-[#14B8A6]" aria-hidden="true" />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
