const API_BASE = import.meta.env.VITE_API_URL || '';

export async function convertUrl(url, language, voiceId) {
  const response = await fetch(`${API_BASE}/api/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, language, voice_id: voiceId }),
  });
  return response.json();
}

export function getAudioUrl(jobId) {
  return `${API_BASE}/api/audio/${jobId}`;
}

export async function getVoices() {
  const response = await fetch(`${API_BASE}/api/voices`);
  return response.json();
}
