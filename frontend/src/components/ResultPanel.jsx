import { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import { getAudioUrl } from '../api/client';

export default function ResultPanel({ result }) {
  const [activeTab, setActiveTab] = useState('listen');

  const audioUrl = getAudioUrl(result.job_id);

  return (
    <div className="mt-6">
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('listen')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'listen'
              ? 'text-[#14B8A6] border-b-2 border-[#14B8A6]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Listen
        </button>
        <button
          onClick={() => setActiveTab('read')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'read'
              ? 'text-[#14B8A6] border-b-2 border-[#14B8A6]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Read
        </button>
      </div>

      {activeTab === 'listen' && (
        <div className="space-y-4">
          <AudioPlayer audioUrl={audioUrl} title={result.title} />
          <div className="flex items-center justify-between text-sm text-gray-500 px-1">
            <span>{result.word_count.toLocaleString()} words</span>
            {result.truncated && (
              <span className="text-amber-500">Content was truncated to 5,000 words</span>
            )}
            <span>Powered by ElevenLabs</span>
          </div>
        </div>
      )}

      {activeTab === 'read' && (
        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 max-h-96 overflow-y-auto">
          <div className="prose prose-gray max-w-none whitespace-pre-line text-left leading-relaxed">
            {result.optimized_text}
          </div>
        </div>
      )}
    </div>
  );
}
