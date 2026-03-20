import { useState, useRef, useMemo } from 'react';
import { Link2, FileText, Upload, Loader2, Mic2, Sparkles, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function UrlInput({ onSubmit, onPdfSubmit, isLoading, voices }) {
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [provider, setProvider] = useState('kokoro');
  const [voiceId, setVoiceId] = useState('');
  const [outputMode, setOutputMode] = useState('full');
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const providers = useMemo(() => {
    const set = new Set();
    voices.forEach((v) => set.add(v.category === 'kokoro' ? 'kokoro' : 'elevenlabs'));
    return Array.from(set);
  }, [voices]);

  const filteredVoices = useMemo(() => {
    return voices.filter((v) =>
      provider === 'kokoro' ? v.category === 'kokoro' : v.category !== 'kokoro'
    );
  }, [voices, provider]);

  function handleProviderChange(val) {
    setProvider(val);
    setVoiceId('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'url') {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setError('Please enter a valid URL starting with http:// or https://');
        return;
      }
      onSubmit(url, language, voiceId || undefined, outputMode);
    } else {
      if (!pdfFile) {
        setError('Please select a PDF file');
        return;
      }
      onPdfSubmit(pdfFile, language, voiceId || undefined, outputMode);
    }
  }

  function validateAndSetPdf(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file');
      setPdfFile(null);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('PDF file is too large (max 20MB)');
      setPdfFile(null);
      return;
    }
    setError('');
    setPdfFile(file);
  }

  function handleFileChange(e) {
    validateAndSetPdf(e.target.files[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoading) return;
    validateAndSetPdf(e.dataTransfer.files[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!isLoading) setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  const canSubmit = mode === 'url' ? !!url : !!pdfFile;

  const darkTrigger = 'h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.06] focus:border-[#14B8A6]/50 focus:ring-[#14B8A6]/20 [&_svg]:text-white/30';
  const darkContent = 'bg-slate-800 border-white/[0.08] text-white shadow-xl shadow-black/40';
  const darkItem = 'text-white/70 focus:bg-white/[0.08] focus:text-white';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* URL / PDF Tab Switcher */}
      <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
        <button
          type="button"
          onClick={() => { setMode('url'); setError(''); }}
          disabled={isLoading}
          className={cn(
            'flex-1 h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200',
            mode === 'url'
              ? 'bg-white/[0.08] text-white shadow-sm border border-white/[0.08]'
              : 'text-white/40 hover:text-white/60'
          )}
        >
          <Link2 className="w-4 h-4" />
          Web URL
        </button>
        <button
          type="button"
          onClick={() => { setMode('pdf'); setError(''); }}
          disabled={isLoading}
          className={cn(
            'flex-1 h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200',
            mode === 'pdf'
              ? 'bg-white/[0.08] text-white shadow-sm border border-white/[0.08]'
              : 'text-white/40 hover:text-white/60'
          )}
        >
          <FileText className="w-4 h-4" />
          PDF File
        </button>
      </div>

      {/* URL Input */}
      {mode === 'url' && (
        <div className="relative">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any URL here..."
            className="pl-12 h-14 text-base rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus-visible:border-[#14B8A6]/50 focus-visible:ring-[#14B8A6]/20 focus-visible:ring-[3px]"
            disabled={isLoading}
          />
        </div>
      )}

      {/* PDF Upload */}
      {mode === 'pdf' && (
        <div
          onClick={() => !isLoading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'w-full px-5 py-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200',
            isDragOver
              ? 'border-[#14B8A6] bg-[#14B8A6]/5 scale-[1.01]'
              : pdfFile
                ? 'border-[#14B8A6]/40 bg-[#14B8A6]/5'
                : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
          {pdfFile ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#14B8A6]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">{pdfFile.name}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                type="button"
                className="ml-2 text-xs text-white/30 hover:text-red-400 transition-colors"
                onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-1">
                <Upload className="w-6 h-6 text-white/30" />
              </div>
              <p className="text-sm font-medium text-white/70">
                Drop your PDF here or click to browse
              </p>
              <p className="text-xs text-white/30">PDF files up to 20MB</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1.5 -mt-1">
          <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
          {error}
        </p>
      )}

      {/* Options Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Output Mode */}
        <Select value={outputMode} onValueChange={setOutputMode} disabled={isLoading}>
          <SelectTrigger className={cn(darkTrigger, 'min-w-[140px]')}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white/30" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className={darkContent}>
            <SelectItem value="full" className={darkItem}>Full Read</SelectItem>
            <SelectItem value="summary" className={darkItem}>Summary</SelectItem>
          </SelectContent>
        </Select>

        {/* Provider */}
        {providers.length > 0 && (
          <Select value={provider} onValueChange={handleProviderChange} disabled={isLoading}>
            <SelectTrigger className={cn(darkTrigger, 'min-w-[160px]')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={darkContent}>
              {providers.includes('kokoro') && (
                <SelectItem value="kokoro" className={darkItem}>Kokoro (Free)</SelectItem>
              )}
              {providers.includes('elevenlabs') && (
                <SelectItem value="elevenlabs" className={darkItem}>ElevenLabs</SelectItem>
              )}
            </SelectContent>
          </Select>
        )}

        {/* Voice */}
        {filteredVoices.length > 0 && (
          <Select
            value={voiceId || '__default__'}
            onValueChange={(val) => setVoiceId(val === '__default__' ? '' : val)}
            disabled={isLoading}
          >
            <SelectTrigger className={cn(darkTrigger, 'flex-1')}>
              <div className="flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-white/30" />
                <SelectValue placeholder="Default Voice" />
              </div>
            </SelectTrigger>
            <SelectContent className={darkContent}>
              <SelectItem value="__default__" className={darkItem}>Default Voice</SelectItem>
              {filteredVoices.map((v) => (
                <SelectItem key={v.voice_id} value={v.voice_id} className={darkItem}>
                  {v.category === 'kokoro' ? v.name.replace('Kokoro - ', '') : v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !canSubmit}
          className={cn(
            'h-11 px-8 rounded-xl font-semibold sm:min-w-[180px]',
            'bg-gradient-to-r from-[#14B8A6] to-emerald-500 text-white shadow-lg shadow-[#14B8A6]/20',
            'hover:shadow-xl hover:shadow-[#14B8A6]/30 hover:scale-[1.02]',
            'transition-all duration-200'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <Headphones className="w-4 h-4" />
              Convert to Audio
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
