import React, { useState } from 'react';
import { useTsosStore } from '../../lib/store';
import { GUIDANCE_ITEMS } from '../../data/guidanceData';
import { HelpCircle, Sparkles, Command, ArrowRight } from 'lucide-react';

interface GuidanceTooltipProps {
  guideKey: string;
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showIndicator?: boolean;
}

export const GuidanceTooltip: React.FC<GuidanceTooltipProps> = ({
  guideKey,
  children,
  className = '',
  position = 'top',
  showIndicator = true,
}) => {
  const { guidanceMode } = useTsosStore();
  const [isHovered, setIsHovered] = useState(false);

  const guide = GUIDANCE_ITEMS[guideKey];

  if (!guidanceMode || !guide) {
    return <>{children}</>;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {/* Subtle indicator dot when guidance mode is on */}
      {showIndicator && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#7C3AED] ring-2 ring-white animate-pulse pointer-events-none z-10"
          title="Guidance available on hover"
        />
      )}

      {/* Floating Guidance Card on Hover */}
      {isHovered && (
        <div
          className={`absolute ${getPositionClasses()} z-50 w-72 p-3 bg-[#1C1917] text-white rounded-xl shadow-2xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-1.5 pb-1.5 mb-1.5 border-b border-white/10 text-[10px]">
            <span className="flex items-center gap-1 text-[#F97316] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>TSOS Guidance</span>
            </span>
            {guide.category && (
              <span className="px-1.5 py-0.2 rounded-sm bg-white/10 text-white/80 uppercase font-mono">
                {guide.category}
              </span>
            )}
          </div>

          {/* Title & Description */}
          <div className="text-xs font-bold text-white mb-1">{guide.title}</div>
          <div className="text-[11px] text-[#A8A29E] leading-relaxed mb-2">
            {guide.description}
          </div>

          {/* Action Hint */}
          {guide.actionHint && (
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-[#DDD6FE] flex items-start gap-1 mb-1.5">
              <ArrowRight className="w-3 h-3 text-[#7C3AED] shrink-0 mt-0.5" />
              <span>{guide.actionHint}</span>
            </div>
          )}

          {/* Shortcut */}
          {guide.shortcut && (
            <div className="flex items-center justify-between text-[10px] text-white/50 pt-1">
              <span>Shortcut:</span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 text-white font-mono text-[9px] border border-white/20">
                {guide.shortcut}
              </kbd>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
