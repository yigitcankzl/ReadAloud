import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import LoadingState from './components/LoadingState';
import ResultPanel from './components/ResultPanel';
import { Card, CardContent } from './components/ui/card';
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

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    getVoices()
      .then((data) => {
        if (data.success && data.voices) {
          setVoices(data.voices);
        }
      })
      .catch(() => {});
  }, []);

  async function handleConvert(url, language, voiceId, mode) {
    setIsLoading(true);
    setLoadingStep(1);
    setResult(null);
    setError(null);

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 3000);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 8000);

    try {
      const data = await convertUrl(url, language, voiceId, mode);
      if (data.success) {
        setResult(data);
      } else {
        setError(ERROR_MESSAGES[data.error_code] || data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not connect to the server. Please try again.');
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

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 3000);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 8000);

    try {
      const data = await convertPdf(file, language, voiceId, mode);
      if (data.success) {
        setResult(data);
      } else {
        setError(ERROR_MESSAGES[data.error_code] || data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not connect to the server. Please try again.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col relative overflow-hidden">
      {/* Teal glow orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#14B8A6]/[0.07] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#14B8A6]/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-[40%] right-[20%] w-[300px] h-[300px] bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 relative z-10">
        {/* Main input card */}
        <div className="relative rounded-2xl overflow-hidden mb-4">
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl" />
          <div className="relative border border-white/[0.06] rounded-2xl p-6">
            <UrlInput
              onSubmit={handleConvert}
              onPdfSubmit={handlePdfConvert}
              isLoading={isLoading}
              voices={voices}
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && <LoadingState currentStep={loadingStep} />}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && <ResultPanel result={result} />}
      </main>

      <footer className="text-center py-6 text-xs text-white/20">
        Built with love for{' '}
        <span className="font-semibold bg-gradient-to-r from-[#14B8A6] to-emerald-500 bg-clip-text text-transparent">
          MidNight Hackers 2026
        </span>
      </footer>
    </div>
  );
}
