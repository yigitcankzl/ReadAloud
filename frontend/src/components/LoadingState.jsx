const steps = [
  'Fetching page content...',
  'Optimizing for audio...',
  'Generating natural voice...',
];

export default function LoadingState({ currentStep }) {
  return (
    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 mt-6">
      <div className="space-y-4">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isComplete = stepNum < currentStep;

          return (
            <div key={stepNum} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  isComplete
                    ? 'bg-[#14B8A6] text-white'
                    : isActive
                      ? 'bg-[#14B8A6] text-white animate-pulse'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isComplete ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-lg ${
                  isActive ? 'text-gray-900 font-medium' : isComplete ? 'text-gray-500' : 'text-gray-300'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <svg className="animate-spin h-5 w-5 text-[#14B8A6] ml-auto" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
