import { useState, useRef } from 'react';

export default function UrlInput({ onSubmit, onPdfSubmit, isLoading, voices }) {
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [voiceId, setVoiceId] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'url') {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setError('Please enter a valid URL starting with http:// or https://');
        return;
      }
      onSubmit(url, language, voiceId || undefined);
    } else {
      if (!pdfFile) {
        setError('Please select a PDF file');
        return;
      }
      onPdfSubmit(pdfFile, language, voiceId || undefined);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
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
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => { setMode('url'); setError(''); }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            mode === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          disabled={isLoading}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => { setMode('pdf'); setError(''); }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            mode === 'pdf'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          disabled={isLoading}
        >
          PDF
        </button>
      </div>

      <div>
        {mode === 'url' ? (
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any article URL here..."
            className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-[#14B8A6] focus:outline-none transition-colors"
            disabled={isLoading}
          />
        ) : (
          <div
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`w-full px-5 py-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
              pdfFile
                ? 'border-[#14B8A6] bg-teal-50'
                : 'border-gray-300 hover:border-[#14B8A6] hover:bg-gray-50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <svg className="w-6 h-6 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-700 font-medium">{pdfFile.name}</span>
                <span className="text-gray-400 text-sm">({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-500">Click to select a PDF file</p>
                <p className="text-gray-400 text-sm mt-1">Max 20MB</p>
              </div>
            )}
          </div>
        )}
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
          disabled={isLoading || (mode === 'url' ? !url : !pdfFile)}
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
