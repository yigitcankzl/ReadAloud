import { Globe, Sparkles, Mic2, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const steps = [
  {
    label: 'Fetching page content',
    description: 'Reading the article text...',
    icon: Globe,
  },
  {
    label: 'Optimizing for audio',
    description: 'AI is preparing the script...',
    icon: Sparkles,
  },
  {
    label: 'Generating natural voice',
    description: 'Creating your podcast audio...',
    icon: Mic2,
  },
];

export default function LoadingState({ currentStep }) {
  return (
    <Card className="mt-6 border-border/60 shadow-sm">
      <CardContent className="py-6 px-6">
        <div className="space-y-4">
          {steps.map((step, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isComplete = stepNum < currentStep;
            const isPending = stepNum > currentStep;
            const Icon = step.icon;

            return (
              <div
                key={stepNum}
                className={cn(
                  'flex items-center gap-4 rounded-xl p-3 transition-all duration-300',
                  isActive && 'bg-[#14B8A6]/5',
                  isComplete && 'opacity-60',
                  isPending && 'opacity-30'
                )}
              >
                {/* Step indicator */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                    isComplete
                      ? 'bg-[#14B8A6] text-white'
                      : isActive
                        ? 'bg-[#14B8A6]/10 text-[#14B8A6] ring-2 ring-[#14B8A6]/30'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  {isActive && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Spinner for active step */}
                {isActive && (
                  <Loader2 className="w-4 h-4 text-[#14B8A6] animate-spin shrink-0" />
                )}

                {/* Checkmark for complete */}
                {isComplete && (
                  <span className="text-xs text-[#14B8A6] font-medium shrink-0">Done</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-5 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-[#14B8A6] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Step {currentStep} of {steps.length}
        </p>
      </CardContent>
    </Card>
  );
}
