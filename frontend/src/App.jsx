import { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto p-6">
        <UrlInput
          onSubmit={handleConvert}
          onPdfSubmit={handlePdfConvert}
          isLoading={isLoading}
          voices={voices}
        />

        {isLoading && <LoadingState currentStep={loadingStep} />}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
            {error}
          </div>
        )}

        {result && <ResultPanel result={result} />}
      </main>

      <footer className="text-center py-6 text-sm text-gray-400 mt-auto">
        Built for MidNight Hackers 2026
      </footer>
    </div>
  );
}
