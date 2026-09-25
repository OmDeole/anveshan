import React, { useState } from 'react';
import { User } from 'lucide-react';
import { TeamMember } from '../data/teamData';

interface ProfileCardProps {
  member: TeamMember;
  size?: 'normal' | 'large';
}

/**
 * Reusable Circular Profile Card Component
 * Matches Image 1:
 * - Circular image container with purple/violet glowing border
 * - Name in bright yellow/lime (#eef050 / #facc15)
 * - Role in clean white
 * - Effortless photo replacement: supply member.image or defaults to elegant placeholder
 */
export const ProfileCard: React.FC<ProfileCardProps> = ({ member, size = 'normal' }) => {
  const [imgError, setImgError] = useState<boolean>(false);

  // Generate consistent pleasant warm gradient for avatar placeholder
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const circleDimension =
    size === 'large'
      ? 'w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40'
      : 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32';

  const CardWrapper = member.link ? 'a' : 'div';
  const wrapperProps = member.link
    ? {
        href: member.link,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'flex flex-col items-center text-center group transition-all duration-300 select-none cursor-pointer',
      }
    : {
        className: 'flex flex-col items-center text-center group transition-all duration-300 select-none',
      };

  return (
    <CardWrapper {...(wrapperProps as any)}>
      {/* 1. Circular Image Container with Sakura Pink Border & Glow */}
      <div
        className={`relative ${circleDimension} rounded-full p-[3px] bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-300 sakura-ring-glow transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_0_32px_rgba(244,114,182,0.8)] cursor-pointer`}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-[#150413] relative flex items-center justify-center border border-pink-400/50 shadow-inner">
          {member.image && !imgError ? (
            <img
              src={member.image}
              alt={member.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            /* Attractive circular placeholder with warm sunset sakura ambient glow matching Image 2 */
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#300c24] via-[#1a0614] to-[#090207] relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,113,133,0.35)_0%,rgba(244,114,182,0.2)_50%,transparent_80%)]" />
              <User className="w-1/2 h-1/2 text-pink-300/80 group-hover:text-amber-200 transition-colors duration-300" />
              {initials && (
                <span className="text-[10px] font-mono tracking-widest text-pink-200/90 font-bold mt-1">
                  {initials}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Member Name in Vivid Yellow/Lime */}
      <h4 className="mt-2.5 sm:mt-3 text-sm sm:text-base font-bold text-[#eef050] tracking-wide group-hover:text-[#fef08a] transition-colors">
        {member.name}
      </h4>

      {/* 3. Role: Do not repeat generic TY / SY coordinator below circles */}
      {member.role &&
        !member.role.toLowerCase().includes('coordinator') &&
        !member.role.toLowerCase().includes('member') && (
          <p className="text-xs sm:text-[13px] text-zinc-300 font-medium tracking-wider mt-0.5">
            {member.role}
          </p>
        )}
    </CardWrapper>
  );
};
