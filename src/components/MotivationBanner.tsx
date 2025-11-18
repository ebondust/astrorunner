import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import type { MotivationalMessage } from '@/lib/services';

interface MotivationBannerProps {
  motivation: MotivationalMessage | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  error?: string | null;
}

export function MotivationBanner({
  motivation,
  onRegenerate,
  isRegenerating = false,
  error = null
}: MotivationBannerProps) {
  if (!motivation) return null;

  // Color scheme based on tone
  const toneColors = {
    encouraging: 'bg-blue-50 border-blue-200 text-blue-900',
    celebratory: 'bg-green-50 border-green-200 text-green-900',
    challenging: 'bg-orange-50 border-orange-200 text-orange-900',
  };

  return (
    <div className="container mx-auto px-4 pt-4 pb-4">
      <Card
        className={`p-4 border-2 transition-all ${toneColors[motivation.tone]} ${
          onRegenerate ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
        }`}
        onClick={onRegenerate}
        role={onRegenerate ? 'button' : undefined}
        tabIndex={onRegenerate ? 0 : undefined}
        onKeyDown={(e) => {
          if (onRegenerate && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onRegenerate();
          }
        }}
        aria-label={onRegenerate ? 'Click to generate new motivation' : undefined}
      >
        <div className="flex items-center gap-3">
          {isRegenerating ? (
            <RefreshCw className="w-5 h-5 flex-shrink-0 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">
              {motivation.message}
            </p>
            <p className="text-xs opacity-70 mt-1">
              {isRegenerating ? 'Generating...' : 'AI-powered motivation • Click to refresh'}
            </p>
          </div>
          {error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Error generating motivation"
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-50">
                  <p className="max-w-xs">{error}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </Card>
    </div>
  );
}
