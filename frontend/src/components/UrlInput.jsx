import { useState, useRef, useMemo, useCallback, useId } from 'react';
import { Link2, FileText, Upload, Loader2, Mic2, Sparkles, Headphones, Clipboard } from 'lucide-react';
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

function isValidUrl(str) {
  return str.startsWith('http://') || str.startsWith('https://');
}

export default function UrlInput({ onSubmit, onPdfSubmit, isLoading, voices, urlInputRef }) {
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [provider, setProvider] = useState('kokoro');
  const [voiceId, setVoiceId] = useState('');
  const [outputMode, setOutputMode] = useState('full');
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  const [clipboardStatus, setClipboardStatus] = useState('idle'); // 'idle' | 'reading' | 'pasted' | 'error'
  const fileInputRef = useRef(null);
  const errorId = useId();
  const urlInputId = useId();

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
      if (!isValidUrl(url)) {
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

  // Clipboard paste logic
  const handlePasteFromClipboard = useCallback(async () => {
    if (!navigator.clipboard?.readText) {
      setError('Clipboard access is not supported in your browser.');
      return;
    }
    setClipboardStatus('reading');
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (trimmed) {
        setUrl(trimmed);
        setError('');
        if (isValidUrl(trimmed)) {
          setPasteHint(true);
          setTimeout(() => setPasteHint(false), 4000);
        }
        // Focus the URL input after paste
        urlInputRef?.current?.focus();
      }
      setClipboardStatus('pasted');
      setTimeout(() => setClipboardStatus('idle'), 2000);
    } catch {
      setClipboardStatus('error');
      setError('Could not read clipboard. Please allow clipboard access or paste manually.');
      setTimeout(() => setClipboardStatus('idle'), 3000);
    }
  }, [urlInputRef]);

  function handleUrlChange(e) {
    const val = e.target.value;
    setUrl(val);
    if (isValidUrl(val)) {
      setPasteHint(true);
      setTimeout(() => setPasteHint(false), 3000);
    } else {
      setPasteHint(false);
    }
  }

  const canSubmit = mode === 'url' ? !!url : !!pdfFile;

  const darkTrigger = 'h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.06] focus:border-[#14B8A6]/50 focus:ring-[#14B8A6]/20 [&_svg]:text-white/30';
  const darkContent = 'bg-slate-800 border-white/[0.08] text-white shadow-xl shadow-black/40';
  const darkItem = 'text-white/70 focus:bg-white/[0.08] focus:text-white';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-label="Convert content to audio"
      noValidate
    >
      {/* URL / PDF Tab Switcher */}
      <div
        className="flex gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]"
        role="tablist"
        aria-label="Input mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'url'}
          aria-controls="panel-url"
          id="tab-url"
          onClick={() => { setMode('url'); setError(''); setPasteHint(false); }}
          disabled={isLoading}
          className={cn(
            'flex-1 h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200',
            mode === 'url'
              ? 'bg-white/[0.08] text-white shadow-sm border border-white/[0.08]'
              : 'text-white/40 hover:text-white/60'
          )}
        >
          <Link2 className="w-4 h-4" aria-hidden="true" />
          Web URL
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'pdf'}
          aria-controls="panel-pdf"
          id="tab-pdf"
          onClick={() => { setMode('pdf'); setError(''); setPasteHint(false); }}
          disabled={isLoading}
          className={cn(
            'flex-1 h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200',
            mode === 'pdf'
              ? 'bg-white/[0.08] text-white shadow-sm border border-white/[0.08]'
              : 'text-white/40 hover:text-white/60'
          )}
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          PDF File
        </button>
      </div>

      {/* URL Input panel */}
      <div
        id="panel-url"
        role="tabpanel"
        aria-labelledby="tab-url"
        hidden={mode !== 'url'}
      >
        {mode === 'url' && (
          <div className="space-y-2">
            {/* Input row with Paste button */}
            <div className="flex gap-2 items-stretch">
              <div className="relative flex-1">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" aria-hidden="true" />
                <Input
                  id={urlInputId}
                  ref={urlInputRef}
                  type="url"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="Paste any URL here..."
                  aria-label="Web page URL to convert"
                  aria-describedby={error ? errorId : pasteHint ? 'paste-hint' : undefined}
                  aria-invalid={!!error}
                  autoComplete="url"
                  className="pl-12 h-14 text-base rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus-visible:border-[#14B8A6]/50 focus-visible:ring-[#14B8A6]/20 focus-visible:ring-[3px]"
                  disabled={isLoading}
                />
              </div>

              {/* Paste from Clipboard button */}
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                disabled={isLoading || clipboardStatus === 'reading'}
                aria-label={
                  clipboardStatus === 'reading'
                    ? 'Reading clipboard...'
                    : clipboardStatus === 'pasted'
                    ? 'Pasted from clipboard'
                    : 'Paste URL from clipboard'
                }
                aria-live="polite"
                title="Paste from Clipboard (or press Ctrl+V when input is focused)"
                className={cn(
                  'h-14 px-3.5 rounded-xl border transition-all duration-200 flex items-center gap-1.5 text-xs font-medium shrink-0',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60',
                  clipboardStatus === 'pasted'
                    ? 'bg-[#14B8A6]/15 border-[#14B8A6]/40 text-[#14B8A6]'
                    : clipboardStatus === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:bg-white/[0.07] hover:text-white/70 hover:border-white/[0.15]'
                )}
              >
                {clipboardStatus === 'reading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Clipboard className="w-4 h-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {clipboardStatus === 'pasted' ? 'Pasted!' : 'Paste'}
                </span>
              </button>
            </div>

            {/* Press-Enter hint */}
            {pasteHint && url && isValidUrl(url) && (
              <p
                id="paste-hint"
                role="status"
                aria-live="polite"
                className="text-xs text-[#14B8A6]/70 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <span aria-hidden="true">
                  <kbd className="kbd">Enter</kbd>
                </span>
                <span className="sr-only">Press Enter or</span>{' '}
                Press Enter to convert — or click Convert to Audio below
              </p>
            )}
          </div>
        )}
      </div>

      {/* PDF Upload panel */}
      <div
        id="panel-pdf"
        role="tabpanel"
        aria-labelledby="tab-pdf"
        hidden={mode !== 'pdf'}
      >
        {mode === 'pdf' && (
          <div
            onClick={() => !isLoading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            role="button"
            tabIndex={isLoading ? -1 : 0}
            aria-label={
              pdfFile
                ? `Selected PDF: ${pdfFile.name}, ${(pdfFile.size / 1024 / 1024).toFixed(1)} MB. Click to change.`
                : 'Upload PDF file. Click or drag and drop a PDF here.'
            }
            aria-disabled={isLoading}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={cn(
              'w-full px-5 py-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60',
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
              aria-hidden="true"
              tabIndex={-1}
            />
            {pdfFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center" aria-hidden="true">
                  <FileText className="w-5 h-5 text-[#14B8A6]" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{pdfFile.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove selected PDF: ${pdfFile.name}`}
                  className="ml-2 text-xs text-white/30 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 rounded"
                  onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-1" aria-hidden="true">
                  <Upload className="w-6 h-6 text-white/30" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-white/70">
                  Drop your PDF here or click to browse
                </p>
                <p className="text-xs text-white/30">PDF files up to 20MB</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation error */}
      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="text-sm text-red-400 flex items-center gap-1.5 -mt-1"
        >
          <span className="w-1 h-1 rounded-full bg-red-400 inline-block" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* Options Row */}
      <div className="flex flex-col sm:flex-row gap-3" role="group" aria-label="Conversion options">
        {/* Output Mode */}
        <Select value={outputMode} onValueChange={setOutputMode} disabled={isLoading}>
          <SelectTrigger
            className={cn(darkTrigger, 'min-w-[140px]')}
            aria-label={`Output mode: ${outputMode === 'full' ? 'Full Read' : 'Summary'}`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white/30" aria-hidden="true" />
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
            <SelectTrigger
              className={cn(darkTrigger, 'min-w-[160px]')}
              aria-label={`Voice provider: ${provider === 'kokoro' ? 'Kokoro (Free)' : 'ElevenLabs'}`}
            >
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
            <SelectTrigger
              className={cn(darkTrigger, 'flex-1')}
              aria-label="Select voice"
            >
              <div className="flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-white/30" aria-hidden="true" />
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
          aria-label={isLoading ? 'Converting, please wait...' : 'Convert to audio'}
          aria-busy={isLoading}
          className={cn(
            'h-11 px-8 rounded-xl font-semibold sm:min-w-[180px]',
            'bg-gradient-to-r from-[#14B8A6] to-emerald-500 text-white shadow-lg shadow-[#14B8A6]/20',
            'hover:shadow-xl hover:shadow-[#14B8A6]/30 hover:scale-[1.02]',
            'transition-all duration-200'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Converting...
            </>
          ) : (
            <>
              <Headphones className="w-4 h-4" aria-hidden="true" />
              Convert to Audio
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
