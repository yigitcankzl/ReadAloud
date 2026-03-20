import { useState, useRef, useMemo } from 'react';
import { Link2, FileText, Upload, Loader2, Mic2, Sparkles, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

  function handleProviderChange(newProvider) {
    setProvider(newProvider);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* URL / PDF Tab Switcher */}
      <Tabs
        value={mode}
        onValueChange={(val) => { setMode(val); setError(''); }}
        className="w-full"
      >
        <TabsList className="w-full h-11 bg-muted/60 p-1 rounded-xl gap-1">
          <TabsTrigger
            value="url"
            disabled={isLoading}
            className="flex-1 h-9 gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium"
          >
            <Link2 className="w-4 h-4" />
            Web URL
          </TabsTrigger>
          <TabsTrigger
            value="pdf"
            disabled={isLoading}
            className="flex-1 h-9 gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            PDF File
          </TabsTrigger>
        </TabsList>

        {/* URL Input */}
        <TabsContent value="url" className="mt-3">
          <div className="relative">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste any article URL here..."
              className="pl-12 h-14 text-base rounded-xl border-border/60 focus-visible:border-[#14B8A6] focus-visible:ring-[#14B8A6]/20 focus-visible:ring-[3px]"
              disabled={isLoading}
            />
          </div>
        </TabsContent>

        {/* PDF Upload */}
        <TabsContent value="pdf" className="mt-3">
          <div
            onClick={() => !isLoading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'w-full px-5 py-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200',
              isDragOver
                ? 'border-[#14B8A6] bg-teal-50/60 scale-[1.01]'
                : pdfFile
                  ? 'border-[#14B8A6] bg-teal-50/40'
                  : 'border-border hover:border-[#14B8A6]/60 hover:bg-muted/40',
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
                  <p className="text-sm font-medium text-foreground">{pdfFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-1">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Drop your PDF here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">PDF files up to 20MB</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5 -mt-1">
          <span className="w-1 h-1 rounded-full bg-destructive inline-block" />
          {error}
        </p>
      )}

      {/* Options Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Output Mode */}
        <Select
          value={outputMode}
          onValueChange={setOutputMode}
          disabled={isLoading}
        >
          <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background min-w-[140px]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Read</SelectItem>
            <SelectItem value="summary">Summary</SelectItem>
          </SelectContent>
        </Select>

        {/* Provider */}
        {providers.length > 0 && (
          <Select
            value={provider}
            onValueChange={handleProviderChange}
            disabled={isLoading}
          >
            <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background min-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.includes('kokoro') && (
                <SelectItem value="kokoro">Kokoro (Free)</SelectItem>
              )}
              {providers.includes('elevenlabs') && (
                <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
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
            <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background flex-1">
              <div className="flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Default Voice" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Default Voice</SelectItem>
              {filteredVoices.map((v) => (
                <SelectItem key={v.voice_id} value={v.voice_id}>
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
          className="h-11 px-8 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 sm:min-w-[160px]"
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
