import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { getAudioUrl } from '../api/client';
import { Badge } from '@/components/ui/badge';

export default function ResultPanel({ result }) {
  const [showText, setShowText] = useState(false);
  const audioUrl = getAudioUrl(result.job_id);

  return (
    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success banner */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.03]" />
        <div className="relative flex items-center gap-3 border border-white/[0.06] rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#14B8A6] to-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-[#14B8A6]/20">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">{result.title}</h2>
            <p className="text-xs text-white/40">
              {result.word_count?.toLocaleString()} words processed
            </p>
          </div>
          {result.truncated && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1 shrink-0">
              <AlertTriangle className="w-3 h-3" />
              Truncated
            </Badge>
          )}
        </div>
      </div>

      {/* Audio Player */}
      <AudioPlayer audioUrl={audioUrl} title={result.title} />

      {/* Transcript - collapsible */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.03]" />
        <div className="relative border border-white/[0.06] rounded-xl">
          <button
            onClick={() => setShowText(!showText)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-sm font-medium text-white/60">Read transcript</span>
            {showText ? (
              <ChevronUp className="w-4 h-4 text-white/30" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/30" />
            )}
          </button>
          {showText && (
            <div className="px-5 pb-5 border-t border-white/[0.04]">
              <div className="max-h-[400px] overflow-y-auto mt-3 text-sm whitespace-pre-line leading-relaxed text-white/60">
                {result.optimized_text}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
