import { Headphones } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#14B8A6] flex items-center justify-center">
            <Headphones className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">ReadAloud</span>
        </div>
        <p className="text-sm text-muted-foreground hidden sm:block">
          Turn any page into a podcast
        </p>
      </div>
    </header>
  );
}
