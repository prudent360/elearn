// Tekskillup Academy Data Store for Next.js

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'assignment' | 'reading';
  completed: boolean;
  videoUrl?: string;
  overview?: string;
  exercise?: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  instructorRole?: string;
  instructorAvatar?: string;
  thumbnail: string;
  progress: number;
  status: 'in-progress' | 'completed' | 'available';
  saved: boolean;
  rating: number;
  studentsCount?: string;
  duration: string;
  description: string;
  level: string;
  art: string;
  symbol: string;
  modules: Module[];
  access?: 'free' | 'pro';
  outcomes?: string[];
  requirements?: string[];
}

export interface Assignment {
  id: string;
  title: string;
  courseTitle: string;
  status: 'to-do' | 'in-review' | 'completed';
  dueDate?: string;
  submittedDate?: string;
  score?: string;
  rubric?: { item: string; passed: boolean }[];
  instructorFeedback?: string;
  studentName?: string;
  gradeStatus?: string;
  submissionDetails?: {
    submittedAt: string;
    repoUrl: string;
    liveDemoUrl: string;
  };
}

export interface Certificate {
  id: string;
  title: string;
  issuedBy: string;
  issueDate: string;
  credentialId: string;
  verifyUrl: string;
  grade: string;
  skills: string[];
  thumbnail: string;
}

export interface CommunityThread {
  id: string;
  channel: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  timeAgo: string;
  upvotes: number;
  commentsCount: number;
  pinned?: boolean;
}

export interface LiveClass {
  meetingUrl?: string;
  id: string;
  title: string;
  host: string;
  hostAvatar: string;
  date: string;
  time: string;
  status: 'starting-soon' | 'upcoming';
  attendees: string;
}

export interface PastRecording {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  views: string;
}

export interface UserSkill {
  name: string;
  level: number;
}

export interface Achievement {
  id: number;
  title: string;
  desc: string;
  icon: string;
  date: string;
}

export interface WeeklyStat {
  day: string;
  minutes: number;
  date: string;
}

export interface CategoryBreakdown {
  category: string;
  hours: number;
  percentage: number;
  color: string;
}

export interface RecentSession {
  id: string;
  date: string;
  courseTitle: string;
  lessonTitle: string;
  duration: string;
  xp: number;
}

export interface CurrentUser {
  name: string;
  role: string;
  avatar: string;
  streakDays: number;
  level: string;
  hoursLearned: number;
  coursesCompleted: number;
  certificatesCount: number;
  skills: UserSkill[];
  achievements: Achievement[];
  activityMap: number[];
  weeklyGoalHours: number;
  weeklyStats: WeeklyStat[];
  categoryBreakdown: CategoryBreakdown[];
  recentSessions: RecentSession[];
}

export const initialData = {
  currentUser: {
    name: "Alex Morgan",
    role: "Senior Product Designer & Learner",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    streakDays: 14,
    level: "Pro Scholar",
    hoursLearned: 84.5,
    coursesCompleted: 6,
    certificatesCount: 4,
    skills: [
      { name: "UI/UX System Design", level: 92 },
      { name: "React & Next.js Architecture", level: 85 },
      { name: "TypeScript Core", level: 78 },
      { name: "Design Tokens & Motion", level: 90 },
      { name: "Product Strategy", level: 72 }
    ],
    achievements: [
      { id: 1, title: "14-Day Streak", desc: "Learned every day for 2 straight weeks", icon: "🔥", date: "Yesterday" },
      { id: 2, title: "Masterclass Titan", desc: "Attended 10 live interactive masterclasses", icon: "⚡", date: "Sep 12, 2026" },
      { id: 3, title: "Code & Craft", desc: "Submitted 5 peer-reviewed projects with top rubric score", icon: "💎", date: "Aug 28, 2026" },
      { id: 4, title: "Top Community Voice", desc: "Received 50+ upvotes on discussion threads", icon: "🏆", date: "Aug 15, 2026" }
    ],
    activityMap: Array.from({ length: 364 }, () => {
      const r = Math.random();
      return r > 0.95 ? 4 : r > 0.88 ? 3 : r > 0.7 ? 2 : r > 0.4 ? 1 : 0;
    }),
    weeklyGoalHours: 12,
    weeklyStats: [
      { day: "Mon", minutes: 75, date: "Sep 14" },
      { day: "Tue", minutes: 110, date: "Sep 15" },
      { day: "Wed", minutes: 45, date: "Sep 16" },
      { day: "Thu", minutes: 90, date: "Sep 17" },
      { day: "Fri", minutes: 130, date: "Sep 18" },
      { day: "Sat", minutes: 60, date: "Sep 19" },
      { day: "Sun", minutes: 85, date: "Sep 20" }
    ],
    categoryBreakdown: [
      { category: "UI/UX & Design", hours: 42.0, percentage: 50, color: "var(--accent-primary)" },
      { category: "Engineering & AI", hours: 26.5, percentage: 31, color: "var(--accent-secondary)" },
      { category: "Product & Strategy", hours: 16.0, percentage: 19, color: "var(--accent-warning)" }
    ],
    recentSessions: [
      { id: "s-1", date: "Today, 2:15 PM", courseTitle: "Advanced UI Design & Systems", lessonTitle: "2.1 Container Queries & Modern Grid Systems", duration: "32 mins", xp: 120 },
      { id: "s-2", date: "Yesterday, 6:40 PM", courseTitle: "Fullstack AI Application Architecture", lessonTitle: "1.2 Vector Embeddings & Similarity Search", duration: "45 mins", xp: 150 },
      { id: "s-3", date: "Sep 18, 10:30 AM", courseTitle: "Advanced UI Design & Systems", lessonTitle: "1.2 Fluid Typography Scale & Dynamic Line Heights", duration: "24 mins", xp: 90 },
      { id: "s-4", date: "Sep 17, 4:00 PM", courseTitle: "Design Systems & Token Pipelines", lessonTitle: "3.1 Automated Token Export with Style Dictionary", duration: "50 mins", xp: 180 },
      { id: "s-5", date: "Sep 16, 8:20 PM", courseTitle: "Executive Product Strategy", lessonTitle: "2.3 Cohort Analysis & Retention Frameworks", duration: "35 mins", xp: 110 }
    ]
  } as CurrentUser,

  continueCourse: {
    id: "course-101",
    title: "Advanced UI Design & Systems",
    instructor: "Elena Rostova",
    instructorRole: "Principal Design Architect @ Vercel",
    instructorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    currentModuleIndex: 1,
    currentLessonId: "les-103",
    progress: 68,
    totalModules: 5,
    totalLessons: 24,
    completedLessonsCount: 16,
    nextUpText: "Module 2: Building Fluid Layout Engines with Container Queries"
  },

  courses: [
    {
      id: "course-101",
      title: "Advanced UI Design & Systems",
      category: "UI/UX & Design",
      instructor: "Elena Rostova",
      instructorRole: "Principal Design Architect @ Vercel",
      instructorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
      progress: 68,
      status: "in-progress",
      saved: true,
      rating: 4.9,
      studentsCount: "2,410",
      duration: "14h 30m",
      level: "Advanced",
      art: "violet",
      symbol: "layers",
      description: "Architect high-performance design systems, fluid responsive interfaces, and custom micro-interactions using native CSS, View Transitions, and modern component states.",
      outcomes: [
        "Design Token Architecture & Design System Tokens",
        "Fluid Typography Scale & Container Queries",
        "View Transitions API & Micro-interaction choreography"
      ],
      requirements: [
        "Solid understanding of HTML5 and CSS fundamentals",
        "Familiarity with component-driven design"
      ],
      modules: [
        {
          title: "Module 1: Foundations of Spatial Typography & Color Systems",
          lessons: [
            { id: "les-101", title: "1.1 Design Token Architecture & HSL Variables", duration: "18m", type: "video", completed: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", overview: "Learn how to structure design tokens in plain CSS using custom properties and HSL color functions for theme-ability.", exercise: "Create a 5-step HSL color ramp with primary, surface, and border variations." },
            { id: "les-102", title: "1.2 Fluid Typography Scale & Dynamic Line Heights", duration: "24m", type: "video", completed: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", overview: "Use CSS clamp() and rem units to generate fluid font scaling that works without breakpoint jumps.", exercise: "Build a fluid header scale with clamp(1.5rem, 4vw, 3rem)." }
          ]
        },
        {
          title: "Module 2: Building Fluid Layout Engines",
          lessons: [
            { id: "les-103", title: "2.1 Container Queries & Modern Grid Systems", duration: "32m", type: "video", completed: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", overview: "Container queries allow components to adapt based on their parent container's width rather than viewport size.", exercise: "Convert a card component to use container-type: inline-size." },
            { id: "les-104", title: "2.2 Subgrid & Complex Alignment Patterns", duration: "28m", type: "video", completed: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", overview: "Align nested elements across multi-column grids using grid-template-rows: subgrid.", exercise: "Build a pricing table with perfectly aligned button footers." },
            { id: "les-105", title: "2.3 Hands-on Lab: Resilient Card Components", duration: "45m", type: "assignment", completed: false, overview: "Put container queries and subgrid into practice in a production component.", exercise: "Submit your finished card CSS code for peer evaluation." }
          ]
        },
        {
          title: "Module 3: Micro-Interactions & Motion Choreography",
          lessons: [
            { id: "les-106", title: "3.1 View Transitions API & Smooth State Changes", duration: "35m", type: "video", completed: false, overview: "Animate state changes smoothly between DOM updates using document.startViewTransition().", exercise: "Add a view transition to card expand actions." },
            { id: "les-107", title: "3.2 Scroll-Driven Animations & Timeline Controls", duration: "40m", type: "video", completed: false, overview: "Create performant scroll progress indicators without JavaScript scroll listeners.", exercise: "Build a top page scroll progress bar using animation-timeline: scroll()." }
          ]
        }
      ]
    },
    {
      id: "course-102",
      title: "Fullstack AI Application Architecture",
      category: "Engineering & AI",
      instructor: "Marcus Vance",
      instructorRole: "Lead AI Engineer @ Anthropic Guild",
      instructorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
      progress: 42,
      status: "in-progress",
      saved: true,
      rating: 4.95,
      studentsCount: "3,890",
      duration: "22h 10m",
      level: "Advanced",
      art: "peach",
      symbol: "cpu",
      description: "Build scalable autonomous agent platforms, streaming LLM backends, vector embeddings, and real-time stateful web applications.",
      outcomes: ["LLM Streaming & Function Calling", "Vector Embeddings & RAG Systems", "Autonomous Agent Orchestration"],
      requirements: ["TypeScript core proficiency", "Basic backend API concepts"],
      modules: [
        {
          title: "Module 1: Agentic Patterns & Memory Systems",
          lessons: [
            { id: "les-201", title: "1.1 Prompt Decomposition & Tool Dispatching", duration: "30m", type: "video", completed: true, overview: "Deconstruct multi-step prompts into structured tool calls.", exercise: "Implement a schema validator for agent function calls." },
            { id: "les-202", title: "1.2 Vector Embeddings & Similarity Search", duration: "45m", type: "video", completed: true, overview: "Generate vector embeddings and search nearest neighbors.", exercise: "Build a mini semantic search engine using cosine similarity." }
          ]
        }
      ]
    },
    {
      id: "course-103",
      title: "Design Systems & Token Pipelines",
      category: "UI/UX & Design",
      instructor: "Elena Rostova",
      instructorRole: "Principal Design Architect @ Vercel",
      thumbnail: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800",
      progress: 100,
      status: "completed",
      saved: false,
      rating: 4.85,
      studentsCount: "1,920",
      duration: "10h 15m",
      level: "Advanced",
      art: "blue",
      symbol: "cloud",
      description: "Automate design token sync from Figma to CSS Variables, Tailwind, and React components.",
      outcomes: ["Figma Token API Integration", "Style Dictionary Build Workflows"],
      requirements: ["Basic CSS and JSON knowledge"],
      modules: [
        {
          title: "Module 1: Design Tokens Foundation",
          lessons: [
            { id: "les-301", title: "1.1 Token Architecture & Naming Conventions", duration: "20m", type: "video", completed: true, overview: "Define W3C design token standards.", exercise: "Structure your global token hierarchy." }
          ]
        }
      ]
    },
    {
      id: "course-104",
      title: "Executive Product Strategy",
      category: "Product & Strategy",
      instructor: "Julian Thorne",
      instructorRole: "VP of Product @ Linear",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
      progress: 15,
      status: "in-progress",
      saved: true,
      rating: 4.78,
      studentsCount: "1,450",
      duration: "12h 45m",
      level: "Intermediate",
      art: "mint",
      symbol: "chart-no-axes-combined",
      description: "Learn how top tech products prioritize features, measure cohort retention, and scale value delivery.",
      outcomes: ["Cohort Retention Analysis", "Opportunity Solution Trees"],
      requirements: ["Interest in product management"],
      modules: [
        {
          title: "Module 1: Product Fundamentals",
          lessons: [
            { id: "les-401", title: "1.1 Defining Core Value Metrics", duration: "25m", type: "video", completed: true, overview: "Connect feature output to real customer retention metrics.", exercise: "Map out your north star metric for a SaaS product." }
          ]
        }
      ]
    }
  ] as Course[],

  communityThreads: [
    {
      id: "t-1",
      channel: "#ui-ux-design",
      title: "How are you handling fluid font scaling with container queries?",
      content: "I've been experimenting with clamp() inside container queries for responsive card headers. Does anyone have a preferred formula for smooth scaling across nested column spans?",
      author: "Sarah Chen",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
      timeAgo: "2 hours ago",
      upvotes: 24,
      commentsCount: 8,
      pinned: true
    },
    {
      id: "t-2",
      channel: "#fullstack-cohort",
      title: "Feedback on Event-Driven Architecture assignment submission",
      content: "Just submitted my distributed event bus project for Module 3! Would love any peer feedback on the Raft partition handling implementation.",
      author: "Marcus Vance",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      timeAgo: "5 hours ago",
      upvotes: 19,
      commentsCount: 12
    }
  ] as CommunityThread[],

  upcomingLiveClasses: [
    {
      id: "live-1",
      title: "Fluid Layout Engines & Container Queries Live Workshop",
      host: "Elena Rostova",
      hostAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
      date: "TODAY",
      time: "4:00 PM EST",
      status: "starting-soon",
      attendees: "142 Learners"
    },
    {
      id: "live-2",
      title: "LLM Agent Tooling & Function Calling Deep Dive",
      host: "Marcus Vance",
      hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      date: "TOMORROW",
      time: "2:00 PM EST",
      status: "upcoming",
      attendees: "210 Learners"
    }
  ] as LiveClass[],

  pastRecordings: [
    { id: "rec-1", title: "Mastering Design Tokens in Multi-Brand Systems", speaker: "Elena Rostova", duration: "1h 12m", views: "1.4k views" },
    { id: "rec-2", title: "Building Production RAG Pipelines with Vector Embeddings", speaker: "Marcus Vance", duration: "1h 45m", views: "2.1k views" }
  ] as PastRecording[],

  assignments: [
    {
      id: "asg-1",
      title: "Build a Container-Query Powered Product Card Component",
      courseTitle: "Advanced UI Design & Systems",
      status: "to-do",
      dueDate: "Sep 24, 2026",
      rubric: [
        { item: "Uses container-type: inline-size", passed: true },
        { item: "Provides fluid typography using clamp()", passed: false },
        { item: "Includes hover micro-interactions", passed: false }
      ]
    },
    {
      id: "asg-2",
      title: "Distributed Event Bus & Raft Partition Simulation",
      courseTitle: "Fullstack AI Application Architecture",
      status: "in-review",
      submittedDate: "Sep 18, 2026",
      studentName: "Alex Morgan",
      rubric: [
        { item: "Raft leader election test suite passes", passed: true },
        { item: "Partition recovery under high throughput", passed: true }
      ],
      submissionDetails: {
        submittedAt: "Aug 18, 2026",
        repoUrl: "https://github.com/alexmorgan/distributed-event-bus",
        liveDemoUrl: "https://event-bus-demo.fly.dev"
      }
    },
    {
      id: "asg-3",
      title: "Design System Token Pipeline Architecture",
      courseTitle: "Design Systems & Token Pipelines",
      status: "completed",
      score: "98/100 (Distinction)",
      gradeStatus: "Graded - Distinction",
      instructorFeedback: "Outstanding design document and benchmark results! Your fallback strategy during partition events was exceptionally thorough.",
      rubric: [
        { item: "Style Dictionary token export configured", passed: true },
        { item: "Theme switcher CSS variables validated", passed: true }
      ]
    }
  ] as Assignment[],

  certificates: [
    {
      id: "cert-8891",
      title: "Certified Systems Architect in Distributed Cloud Engineering",
      issuedBy: "Tekskillup Academy & Engineering Guild",
      issueDate: "August 20, 2026",
      credentialId: "TSU-8891-DC-2026",
      verifyUrl: "https://workspace-learning.app/verify/TSU-8891-DC-2026",
      grade: "Distinction (Top 2%)",
      skills: ["Distributed Systems", "Raft Consensus", "Kafka Event Streams", "Redis Caching"],
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "cert-7724",
      title: "Executive Product Strategy & Growth Engineering",
      issuedBy: "Tekskillup Academy",
      issueDate: "June 14, 2026",
      credentialId: "TSU-7724-PS-2026",
      verifyUrl: "https://workspace-learning.app/verify/TSU-7724-PS-2026",
      grade: "High Honors",
      skills: ["Product Analytics", "Experimentation", "UX Funnels", "Cohort Retention"],
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400"
    }
  ] as Certificate[],

  userNotes: {
    "les-103": `# Module 2.1 Notes - Container Queries\n\n- Container queries allow components to respond to their parent container's width rather than viewport size.\n- Key advantage: Components become truly modular and can be dropped into sidebars, main columns, or modals without breaking design integrity!`
  } as Record<string, string>
};
