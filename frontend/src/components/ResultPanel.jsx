import { useState } from 'react';
import { Headphones, BookOpen, AlertTriangle, FileAudio2 } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { getAudioUrl } from '../api/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function ResultPanel({ result }) {
  const [activeTab, setActiveTab] = useState('listen');
  const audioUrl = getAudioUrl(result.job_id);

  return (
    <div className="mt-6 space-y-4">
      {/* Result header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
          <FileAudio2 className="w-4 h-4 text-[#14B8A6]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Conversion Complete</h2>
          <p className="text-xs text-muted-foreground">
            {result.word_count?.toLocaleString()} words processed
          </p>
        </div>
        {result.truncated && (
          <Badge
            variant="outline"
            className="ml-auto text-amber-600 border-amber-200 bg-amber-50 gap-1"
          >
            <AlertTriangle className="w-3 h-3" />
            Truncated to 5,000 words
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-11 bg-muted/60 p-1 rounded-xl gap-1">
          <TabsTrigger
            value="listen"
            className="flex-1 h-9 gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium"
          >
            <Headphones className="w-4 h-4" />
            Listen
          </TabsTrigger>
          <TabsTrigger
            value="read"
            className="flex-1 h-9 gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium"
          >
            <BookOpen className="w-4 h-4" />
            Read Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listen" className="mt-4 space-y-3">
          <AudioPlayer audioUrl={audioUrl} title={result.title} />
          <p className="text-xs text-center text-muted-foreground">
            Powered by {result.provider === 'elevenlabs' ? 'ElevenLabs' : 'Kokoro TTS'}
          </p>
        </TabsContent>

        <TabsContent value="read" className="mt-4">
          <Card className="border-border/60">
            <CardContent className="py-5 px-6 max-h-[420px] overflow-y-auto">
              <div className="prose prose-sm prose-gray max-w-none whitespace-pre-line leading-relaxed text-foreground">
                {result.optimized_text}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
