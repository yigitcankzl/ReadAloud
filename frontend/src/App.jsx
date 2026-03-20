import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Keyboard } from 'lucide-react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import LoadingState from './components/LoadingState';
import ResultPanel from './components/ResultPanel';
import { convertUrl, convertPdf, getVoices } from './api/client';

const ERROR_MESSAGES = {
  INVALID_URL: 'Please enter a valid URL starting with http:// or https://',
  FETCH_FAILED: 'Could not fetch this page. Please check the URL and try again.',
  INVALID_CONTENT: 'This URL does not point to a readable web page.',
  CONTENT_TOO_SHORT: "This page doesn't have enough text content to convert.",
  AI_ERROR: 'AI processing failed. Please try again.',
  TTS_ERROR: 'Voice generation failed. Please try again.',
  INVALID_PDF: 'Please upload a valid PDF file.',
  PDF_ERROR: 'Could not process this PDF file.',
  PDF_TOO_LARGE: 'PDF file is too large (max 20MB).',
};

// Keyboard shortcut definitions for the help panel
const SHORTCUTS = [
  { keys: ['Ctrl', 'Enter'], description: 'Convert (submit from anywhere)' },
  { keys: ['Ctrl', 'V'], description: 'Auto-paste URL when input is focused' },
  { keys: ['Space'], description: 'Play / Pause audio' },
  { keys: ['Esc'], description: 'Dismiss error or clear input' },
];

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [voices, setVoices] = useState([]);
  const [announcement, setAnnouncement] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Ref forwarded to UrlInput so keyboard shortcuts can interact with it
  const urlInputRef = useRef(null);
  // Ref for the submit button inside UrlInput's form — we trigger it via formRef
  const formRef = useRef(null);

  // Check for ?url= query parameter (bookmarklet support)
  const [autoUrl, setAutoUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('url') || '';
  });

  useEffect(() => {
    getVoices()
      .then((data) => {
        if (data.success && data.voices) {
          setVoices(data.voices);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-convert if ?url= is present
  useEffect(() => {
    if (autoUrl && !isLoading && !result) {
      handleConvert(autoUrl, 'en', undefined, 'full');
      setAutoUrl('');
      // Clean URL bar
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [autoUrl, voices]);

  // Helper: announce a message to screen readers via a live region
  function announce(message) {
    setAnnouncement('');
    // Small delay ensures the DOM change is detected even if same string
    requestAnimationFrame(() => setAnnouncement(message));
  }

  async function handleConvert(url, language, voiceId, mode) {
    setIsLoading(true);
    setLoadingStep(1);
    setResult(null);
    setError(null);
    announce('Conversion started. Please wait.');

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 3000);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 8000);

    try {
      const data = await convertUrl(url, language, voiceId, mode);
      if (data.success) {
        setResult(data);
        announce(`Conversion complete. "${data.title}" is ready to play.`);
      } else {
        const msg = ERROR_MESSAGES[data.error_code] || data.error || 'Something went wrong. Please try again.';
        setError(msg);
        announce(`Error: ${msg}`);
      }
    } catch {
      const msg = 'Could not connect to the server. Please try again.';
      setError(msg);
      announce(`Error: ${msg}`);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
    }
  }

  async function handlePdfConvert(file, language, voiceId, mode) {
    setIsLoading(true);
    setLoadingStep(1);
    setResult(null);
    setError(null);
    announce('PDF conversion started. Please wait.');

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 3000);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 8000);

    try {
      const data = await convertPdf(file, language, voiceId, mode);
      if (data.success) {
        setResult(data);
        announce(`Conversion complete. "${data.title}" is ready to play.`);
      } else {
        const msg = ERROR_MESSAGES[data.error_code] || data.error || 'Something went wrong. Please try again.';
        setError(msg);
        announce(`Error: ${msg}`);
      }
    } catch {
      const msg = 'Could not connect to the server. Please try again.';
      setError(msg);
      announce(`Error: ${msg}`);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Global keyboard shortcuts
  // -----------------------------------------------------------------------
  const handleGlobalKeyDown = useCallback(
    (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isInInput = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;

      // Ctrl+Enter → submit the conversion form from anywhere
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        // Find and click the submit button inside the form
        const submitBtn = document.querySelector('form[aria-label="Convert content to audio"] button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
        }
        return;
      }

      // Escape → clear error or clear the URL input
      if (e.key === 'Escape') {
        if (error) {
          setError(null);
          announce('Error dismissed.');
          return;
        }
        if (urlInputRef.current && urlInputRef.current.value) {
          // We can't directly mutate the controlled state inside UrlInput from here,
          // so we focus the input and let the user act — the input will receive the Escape key.
          urlInputRef.current.focus();
        }
        return;
      }

      // Space → play/pause audio (only when NOT typing in an input)
      if (e.key === ' ' && !isInInput && result) {
        e.preventDefault();
        // Find the play/pause button in the audio player
        const playBtn = document.querySelector('[aria-label="Play audio"], [aria-label="Pause audio"]');
        if (playBtn) {
          playBtn.click();
        }
        return;
      }
    },
    [error, result]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col relative overflow-hidden">
      {/* Screen-reader live announcement region */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>

      {/* Teal glow orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#14B8A6]/[0.07] rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#14B8A6]/[0.04] rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="fixed top-[40%] right-[20%] w-[300px] h-[300px] bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

      <Header />

      <main
        id="main-content"
        className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 relative z-10"
        aria-label="Main content"
      >
        {/* Main input card */}
        <div className="relative rounded-2xl overflow-hidden mb-4">
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl" />
          <div className="relative border border-white/[0.06] rounded-2xl p-6">
            <UrlInput
              onSubmit={handleConvert}
              onPdfSubmit={handlePdfConvert}
              isLoading={isLoading}
              voices={voices}
              urlInputRef={urlInputRef}
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && <LoadingState currentStep={loadingStep} />}

        {/* Error */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && <ResultPanel result={result} />}
      </main>

      {/* Footer with keyboard shortcuts */}
      <footer className="relative text-center py-6 text-xs text-white/20" role="contentinfo">
        <p>
          Built by{' '}
          <span className="font-semibold text-white/40">Yigitcan Kizil</span>
          {' '}for{' '}
          <span className="font-semibold bg-gradient-to-r from-[#14B8A6] to-emerald-500 bg-clip-text text-transparent">
            MidNight Hackers 2026
          </span>
        </p>

        {/* Keyboard shortcuts toggle */}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setShowShortcuts((v) => !v)}
            aria-expanded={showShortcuts}
            aria-controls="keyboard-shortcuts-panel"
            className="inline-flex items-center gap-1.5 text-white/20 hover:text-white/50 transition-colors text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60 rounded px-1"
          >
            <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
            Keyboard shortcuts
          </button>
        </div>

        {/* Shortcuts panel */}
        {showShortcuts && (
          <div
            id="keyboard-shortcuts-panel"
            role="region"
            aria-label="Keyboard shortcuts"
            className="mt-3 mx-auto max-w-sm bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-left animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">
              Keyboard Shortcuts
            </h2>
            <ul className="space-y-1.5" aria-label="Available keyboard shortcuts">
              {SHORTCUTS.map(({ keys, description }) => (
                <li key={keys.join('+')} className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-white/30">{description}</span>
                  <span className="flex items-center gap-0.5 shrink-0" aria-label={keys.join(' + ')}>
                    {keys.map((k, i) => (
                      <span key={k} className="flex items-center gap-0.5">
                        <kbd className="kbd">{k}</kbd>
                        {i < keys.length - 1 && (
                          <span className="text-white/20 text-[10px]" aria-hidden="true">+</span>
                        )}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </footer>
    </div>
  );
}
