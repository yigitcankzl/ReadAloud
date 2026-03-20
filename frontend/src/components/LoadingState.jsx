import { Globe, Sparkles, Mic2, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { label: 'Fetching content', description: 'Reading the page...', icon: Globe },
  { label: 'AI optimization', description: 'Preparing script...', icon: Sparkles },
  { label: 'Generating voice', description: 'Creating audio...', icon: Mic2 },
];

export default function LoadingState({ currentStep }) {
  const progress = ((currentStep - 1) / steps.length) * 100 + (100 / steps.length / 2);
  const activeStep = steps[currentStep - 1];

  return (
    <div
      className="mt-6 relative rounded-2xl overflow-hidden"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Converting: Step ${currentStep} of ${steps.length} — ${activeStep?.label}. ${activeStep?.description}`}
    >
      <div className="absolute inset-0 bg-white/[0.03]" />
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#14B8A6]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="relative border border-white/[0.06] rounded-2xl">
        {/* Progress bar */}
        <div
          className="h-0.5 bg-white/[0.04] overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Conversion progress: ${Math.round(progress)}%`}
        >
          <div
            className="h-full bg-gradient-to-r from-[#14B8A6] to-emerald-400 transition-all duration-1000 ease-out relative shimmer"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="py-8 px-6">
          {/* Screen-reader step announcement (hidden visually) */}
          <p className="sr-only" aria-live="assertive">
            Step {currentStep} of {steps.length}: {activeStep?.label} — {activeStep?.description}
          </p>

          <ol
            className="flex items-center gap-4"
            aria-label="Conversion steps"
          >
            {steps.map((step, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === currentStep;
              const isComplete = stepNum < currentStep;
              const Icon = step.icon;

              let stepStatus = 'pending';
              if (isComplete) stepStatus = 'complete';
              if (isActive) stepStatus = 'active';

              return (
                <li
                  key={stepNum}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Step ${stepNum}: ${step.label} — ${stepStatus}`}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-3 transition-all duration-500',
                    isActive && 'scale-105',
                    !isActive && !isComplete && 'opacity-20',
                  )}
                >
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500',
                      isComplete
                        ? 'bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/20'
                        : isActive
                          ? 'bg-gradient-to-br from-[#14B8A6] to-emerald-500 text-white shadow-xl shadow-[#14B8A6]/20'
                          : 'bg-white/[0.04] text-white/20 border border-white/[0.06]'
                    )}
                    aria-hidden="true"
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : isActive ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center" aria-hidden="true">
                    <p className={cn(
                      'text-xs font-semibold',
                      isActive ? 'text-white' : isComplete ? 'text-[#14B8A6]/80' : 'text-white/20'
                    )}>
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-[10px] text-white/40 mt-0.5">{step.description}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
