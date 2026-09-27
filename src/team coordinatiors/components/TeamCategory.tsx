import React from 'react';
import { TeamCategory as TeamCategoryType } from '../data/teamData';
import { ProfileCard } from './ProfileCard';

interface TeamCategoryProps {
  category: TeamCategoryType;
}

/**
 * TeamCategory Component
 * Groups members under a role heading (TY COORDINATOR, SY COORDINATOR, MEMBERS)
 * Matches Image 1 layout:
 * - Clean bold uppercase category tag
 * - Centered vertical hierarchy
 * - Responsive grid: 2 columns on mobile, fluid multi-column on desktop
 */
export const TeamCategory: React.FC<TeamCategoryProps> = ({ category }) => {
  const memberCount = category.members.length;

  // Determine dynamic responsive layout grid based on member count
  const getGridClasses = () => {
    if (memberCount === 1) {
      return 'flex justify-center';
    }
    if (memberCount === 2) {
      return 'flex flex-wrap justify-center gap-8 sm:gap-14';
    }
    if (memberCount === 3) {
      return 'grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10 justify-items-center max-w-3xl mx-auto';
    }
    if (memberCount === 4) {
      return 'grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 justify-items-center max-w-4xl mx-auto';
    }
    if (memberCount === 5) {
      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8 justify-items-center max-w-5xl mx-auto';
    }
    // 6 or more members
    return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5 sm:gap-6 md:gap-7 justify-items-center max-w-5xl mx-auto';
  };

  return (
    <div className="w-full my-8 sm:my-12">
      {/* Category Heading (TY COORDINATOR / SY COORDINATOR / MEMBERS) with increased font size and pinkish sakura styling */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 mb-8 sm:mb-10">
        <div className="h-[1.5px] w-12 sm:w-28 bg-gradient-to-r from-transparent via-pink-400/60 to-rose-400" />
        <h3 className="text-base sm:text-lg md:text-xl font-extrabold tracking-[0.22em] sm:tracking-[0.28em] text-white uppercase font-sans px-5 sm:px-8 py-2 sm:py-2.5 rounded-full bg-[#180514]/85 border border-pink-400/50 shadow-[0_0_25px_rgba(244,114,182,0.4)] backdrop-blur-md">
          {category.title}
        </h3>
        <div className="h-[1.5px] w-12 sm:w-28 bg-gradient-to-l from-transparent via-pink-400/60 to-rose-400" />
      </div>

      {/* Profiles Grid */}
      <div className={getGridClasses()}>
        {category.members.map((member) => (
          <ProfileCard
            key={member.id}
            member={member}
            size={category.title.includes('COORDINATOR') && memberCount <= 3 ? 'large' : 'normal'}
          />
        ))}
      </div>
    </div>
  );
};
