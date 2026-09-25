# Team Coordinators Showcase

This isolated module powers the dedicated **Event Coordinators** showcase page for Anveshan 2026.

## Structure
- `src/team coordinatiors/TeamCoordinatorsPage.tsx`: Main showcase page
- `src/team coordinatiors/components/`: Reusable components
  - `ProfileCard.tsx`: Circular photo container with purple glowing border, yellow name, white role label
  - `TeamCategory.tsx`: Category grouping (TY COORDINATOR, SY COORDINATOR, MEMBERS) with responsive mobile-friendly grid
  - `TeamSection.tsx`: Major event sections (The Killer's Trail, Logic Lamps, Promptify, Japanese Fuji Core)
  - `TeamNavbar.tsx`: Sticky navigation header with Anveshan logo and section anchor links
- `src/team coordinatiors/data/teamData.ts`: Fully data-driven configuration for easily updating member names, roles, and profile photo paths
- `src/team coordinatiors/assets/`: Assets including `fuji_pagoda.jpg` for the Japanese Section 4 background

## How to Add Photos
To add actual profile photos for any member:
1. Place the photo in `public/assets/team/` or `src/team coordinatiors/assets/`
2. In `src/team coordinatiors/data/teamData.ts`, add the `image` field to the member:
   ```ts
   { id: 'kt-ty-1', name: 'Shagun', role: 'TY Coordinator', image: '/assets/team/shagun.jpg' }
   ```
   If no image is specified, an elegant circular placeholder with avatar silhouette and warm ambient lighting is automatically rendered.

## Direct URL Access
- `http://localhost:3000/team`
- `http://localhost:3000/?team`
- `http://localhost:3000/team-coordinators`
