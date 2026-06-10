'use client';

import Link from 'next/link';

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  version: string;
  playCount?: number;
  comingSoon?: boolean;
  category: string;
}

export default function GameCard({
  title,
  description,
  icon,
  href,
  version,
  playCount = 0,
  comingSoon = false,
  category,
}: GameCardProps) {
  const content = (
    <div
      className={`
        bg-white border border-gray-300 p-4 flex flex-col gap-3
        hover:border-blue-400 hover:shadow-md transition-all duration-150
        ${comingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        relative group
      `}
    >
      {comingSoon && (
        <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-0.5 font-medium">
          준비 중
        </div>
      )}

      {/* Icon + Title */}
      <div className="flex items-start gap-3">
        <div className="text-3xl w-10 flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-800 leading-tight">{title}</h3>
          <p className="text-xs text-blue-600 font-mono mt-0.5">{version}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{category}</span>
        {!comingSoon && (
          <span className="text-xs text-gray-400">
            {playCount > 0 ? `${playCount.toLocaleString()}회 사용됨` : '사용 기록 없음'}
          </span>
        )}
      </div>

      {!comingSoon && (
        <div className="absolute inset-0 border-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );

  if (comingSoon) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
