import { useState } from 'react';

export default function UrlInput({ onSubmit, isLoading, voices }) {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [voiceId, setVoiceId] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    onSubmit(url, language, voiceId || undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste any article URL here..."
          className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-[#14B8A6] focus:outline-none transition-colors"
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#14B8A6] focus:outline-none bg-white"
          disabled={isLoading}
        >
          <option value="en">English</option>
          <option value="tr">Turkish</option>
        </select>

        {voices && voices.length > 0 && (
          <select
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#14B8A6] focus:outline-none bg-white"
            disabled={isLoading}
          >
            <option value="">Default Voice</option>
            {voices.map((v) => (
              <option key={v.voice_id} value={v.voice_id}>
                {v.name}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          disabled={isLoading || !url}
          className="flex-1 sm:flex-none px-8 py-3 bg-[#14B8A6] text-white font-semibold rounded-xl hover:bg-[#0D9488] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Converting...
            </span>
          ) : (
            'Convert to Audio'
          )}
        </button>
      </div>
    </form>
  );
}
