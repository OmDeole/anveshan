export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image?: string;
  badge?: string;
  link?: string;
}

export interface TeamCategory {
  id: string;
  title: string;
  members: TeamMember[];
}

export interface TeamSectionData {
  id: string;
  title: string;
  kanji?: string;
  tagline?: string;
  backgroundType: 'gothic' | 'fuji-pagoda' | 'purple-nebula';
  backgroundImage?: string;
  categories: TeamCategory[];
}

export const TEAM_SECTIONS_DATA: TeamSectionData[] = [
  // ==================================================
  // 1. THE KILLER'S TRAIL
  // ==================================================
  {
    id: 'killers-trail',
    title: "THE KILLER'S TRAIL",
    kanji: '殺人鬼の道',
    tagline: 'Mystery & Investigation • Sanctuary Event 01',
    backgroundType: 'gothic',
    categories: [
      {
        id: 'kt-ty',
        title: 'TY COORDINATOR',
        members: [
          { id: 'kt-ty-1', name: 'Shagun', role: 'TY Coordinator', image: '/team-coordinators/images/shagun.jpg' },
          { id: 'kt-ty-2', name: 'Pankaj', role: 'TY Coordinator', image: '/team-coordinators/images/pankaj.jpg' },
          { id: 'kt-ty-3', name: 'Vinay', role: 'TY Coordinator', image: '/team-coordinators/images/vinay.jpg' },
          { id: 'kt-ty-4', name: 'Kartik', role: 'TY Coordinator', image: '/team-coordinators/images/kartik.jpg' },
        ],
      },
      {
        id: 'kt-sy',
        title: 'SY COORDINATOR',
        members: [
          { id: 'kt-sy-1', name: 'Anand', role: 'SY Coordinator', image: '/team-coordinators/images/anand.jpg' },
          { id: 'kt-sy-2', name: 'Rushikesh', role: 'SY Coordinator', image: '/team-coordinators/images/rushikesh.jpg' },
        ],
      },
      {
        id: 'kt-members',
        title: 'MEMBERS',
        members: [
          { id: 'kt-m-1', name: 'Swara', role: 'Member', image: '/team-coordinators/images/swara.jpg' },
          { id: 'kt-m-2', name: 'Abhijeet', role: 'Member', image: '/team-coordinators/images/abhijeet.jpg' },
          { id: 'kt-m-3', name: 'Shravani', role: 'Member', image: '/team-coordinators/images/shravani.jpg' },
          { id: 'kt-m-4', name: 'Nikita', role: 'Member', image: '/team-coordinators/images/nikita.jpg' },
          { id: 'kt-m-5', name: 'Riddhi', role: 'Member', image: '/team-coordinators/images/riddhi.jpg' },
          { id: 'kt-m-6', name: 'Neha', role: 'Member', image: '/team-coordinators/images/neha.jpg' },
        ],
      },
    ],
  },

  // ==================================================
  // 2. LOGIC LAMPS
  // ==================================================
  {
    id: 'logic-lamps',
    title: 'LOGIC LAMPS',
    kanji: '論理の灯火',
    tagline: 'Algorithmic Puzzles & Lantern Sanctuary • Event 02',
    backgroundType: 'gothic',
    categories: [
      {
        id: 'll-ty',
        title: 'TY COORDINATOR',
        members: [
          { id: 'll-ty-1', name: 'Soham', role: 'TY Coordinator', image: '/team-coordinators/images/soham.jpg' },
          { id: 'll-ty-2', name: 'Bhumi', role: 'TY Coordinator', image: '/team-coordinators/images/bhumi.jpg' },
          { id: 'll-ty-3', name: 'Sanskruti', role: 'TY Coordinator', image: '/team-coordinators/images/sanskruti.jpg' },
          { id: 'll-ty-4', name: 'Arvind', role: 'TY Coordinator', image: '/team-coordinators/images/arvind.jpg' },
        ],
      },
      {
        id: 'll-sy',
        title: 'SY COORDINATOR',
        members: [
          { id: 'll-sy-1', name: 'Sandip', role: 'SY Coordinator', image: '/team-coordinators/images/sandip.jpg' },
          { id: 'll-sy-2', name: 'Suraj', role: 'SY Coordinator', image: '/team-coordinators/images/suraj.jpg' },
        ],
      },
      {
        id: 'll-members',
        title: 'MEMBERS',
        members: [
          { id: 'll-m-1', name: 'Pranav', role: 'Member', image: '/team-coordinators/images/pranav.jpg' },
          { id: 'll-m-2', name: 'Pruthvi', role: 'Member', image: '/team-coordinators/images/pruthvi.jpg' },
          { id: 'll-m-3', name: 'Hitesh', role: 'Member', image: '/team-coordinators/images/hitesh.jpg' },
          { id: 'll-m-4', name: 'Prasanna', role: 'Member', image: '/team-coordinators/images/prasanna.jpg' },
          { id: 'll-m-5', name: 'Sanskruti Pandagale', role: 'Member', image: '/team-coordinators/images/sanskruti-pandagale.jpg' },
        ],
      },
    ],
  },

  // ==================================================
  // 3. PROMPTIFY
  // ==================================================
  {
    id: 'promptify',
    title: 'PROMPTIFY',
    kanji: '詠唱市場',
    tagline: 'Generative AI & Edo Night Market • Event 03',
    backgroundType: 'gothic',
    categories: [
      {
        id: 'pr-ty',
        title: 'TY COORDINATOR',
        members: [
          { id: 'pr-ty-1', name: 'Om Deole', role: 'TY Coordinator', image: '/team-coordinators/images/om-deole.png' },
          { id: 'pr-ty-2', name: 'Ayush', role: 'TY Coordinator', image: '/team-coordinators/images/ayush.png' },
          { id: 'pr-ty-3', name: 'Prajakta', role: 'TY Coordinator', image: '/team-coordinators/images/prajakta.jpg' },
        ],
      },
      {
        id: 'pr-sy',
        title: 'SY COORDINATOR',
        members: [
          { id: 'pr-sy-1', name: 'Arya Nhavkar', role: 'SY Coordinator', image: '/team-coordinators/images/arya-nhavkar.jpeg' },
          { id: 'pr-sy-2', name: 'Om Thakur', role: 'SY Coordinator', image: '/team-coordinators/images/om-thakur.jpg' },
        ],
      },
      {
        id: 'pr-members',
        title: 'MEMBERS',
        members: [
          { id: 'pr-m-1', name: 'Viren Pawar', role: 'Member', image: '/team-coordinators/images/viren-pawar.jpg' },
          { id: 'pr-m-2', name: 'Angel Sachdev', role: 'Member', image: '/team-coordinators/images/angel-sachdev.jpg' },
          { id: 'pr-m-3', name: 'Kumodini Desale', role: 'Member', image: '/team-coordinators/images/kumodini-desale.jpg' },
          { id: 'pr-m-4', name: 'Disha', role: 'Member', image: '/team-coordinators/images/disha.jpg' },
          { id: 'pr-m-5', name: 'Chanchal Varma', role: 'Member', image: '/team-coordinators/images/chanchal-varma.jpg' },
        ],
      },
    ],
  },
];
