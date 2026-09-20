// Workspace Learning Platform Data Store

window.LMSData = {
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
    activityMap: generateActivityMap()
  },

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
      instructorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
      progress: 68,
      status: "in-progress",
      saved: true,
      rating: 4.9,
      studentsCount: "2,410",
      duration: "14h 30m",
      description: "Architect high-performance design systems, fluid responsive interfaces, and custom micro-interactions using native CSS, View Transitions, and modern component states.",
      modules: [
        {
          title: "Module 1: Foundations of Spatial Typography & Color Systems",
          lessons: [
            { id: "les-101", title: "1.1 Design Token Architecture & HSL Variables", duration: "18m", type: "video", completed: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
            { id: "les-102", title: "1.2 Fluid Typography Scale & Dynamic Line Heights", duration: "24m", type: "video", completed: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" }
          ]
        },
        {
          title: "Module 2: Building Fluid Layout Engines",
          lessons: [
            { id: "les-103", title: "2.1 Container Queries & Modern Grid Systems", duration: "32m", type: "video", completed: false, active: true, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
            { id: "les-104", title: "2.2 Subgrid & Complex Alignment Patterns", duration: "28m", type: "video", completed: false, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
            { id: "les-105", title: "2.3 Hands-on Lab: Resilient Card Components", duration: "45m", type: "assignment", completed: false }
          ]
        },
        {
          title: "Module 3: Micro-Interactions & Motion Choreography",
          lessons: [
            { id: "les-106", title: "3.1 View Transitions API & Smooth State Changes", duration: "35m", type: "video", completed: false },
            { id: "les-107", title: "3.2 Scroll-Driven Animations & Timeline Controls", duration: "40m", type: "video", completed: false }
          ]
        }
      ]
    },
    {
      id: "course-102",
      title: "Fullstack AI Application Architecture",
      category: "Engineering & AI",
      instructor: "Marcus Vance",
      instructorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
      progress: 42,
      status: "in-progress",
      saved: true,
      rating: 4.95,
      studentsCount: "3,890",
      duration: "22h 10m",
      description: "Build scalable autonomous agent platforms, streaming LLM backends, vector embeddings, and real-time stateful web applications.",
      modules: [
        {
          title: "Module 1: Agentic Orchestration Fundamentals",
          lessons: [
            { id: "les-201", title: "1.1 Prompt Pipelines & Structured Tool Calling", duration: "30m", type: "video", completed: true },
            { id: "les-202", title: "1.2 Streaming SSE and Realtime UI Updates", duration: "25m", type: "video", completed: true }
          ]
        }
      ]
    },
    {
      id: "course-103",
      title: "High-Scale Distributed Systems & Cloud Patterns",
      category: "Engineering & AI",
      instructor: "Dr. Sarah Chen",
      instructorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
      progress: 100,
      status: "completed",
      saved: false,
      rating: 5.0,
      studentsCount: "1,520",
      duration: "18h 45m",
      description: "Master event-driven architecture, partition strategies, consensus algorithms, and fault tolerance in high-throughput cloud environments."
    },
    {
      id: "course-104",
      title: "Product Strategy & Metric-Driven UX Growth",
      category: "Product & Strategy",
      instructor: "Julian Thorne",
      instructorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
      progress: 100,
      status: "completed",
      saved: true,
      rating: 4.88,
      studentsCount: "1,940",
      duration: "11h 20m",
      description: "Turn user data into high-converting product features, run rigorous experimentation loops, and define north-star metrics."
    },
    {
      id: "course-105",
      title: "Advanced TypeScript & Type-Safe SDK Engineering",
      category: "Engineering & AI",
      instructor: "Kaelen Voss",
      instructorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
      thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
      progress: 0,
      status: "saved",
      saved: true,
      rating: 4.92,
      studentsCount: "4,120",
      duration: "16h 15m",
      description: "Deep dive into conditional types, mapped types, template literal types, AST transformations, and zero-overhead runtime validation."
    }
  ],

  upcomingLiveClasses: [
    {
      id: "live-1",
      title: "Live Design Review: Component APIs & Accessibility Audits",
      host: "Elena Rostova",
      hostAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
      date: "Today",
      time: "4:00 PM EST",
      startTimeISO: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      attendees: 142,
      status: "starting-soon",
      tags: ["Live Workshop", "Design Systems"],
      meetingLink: "#"
    },
    {
      id: "live-2",
      title: "Building Real-Time RAG Systems with Vector Indexing",
      host: "Marcus Vance",
      hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      date: "Tomorrow",
      time: "2:00 PM EST",
      attendees: 289,
      status: "scheduled",
      tags: ["AI Engineering", "Q&A"],
      meetingLink: "#"
    },
    {
      id: "live-3",
      title: "Cohort Office Hours: Portfolio Feedback & Code Reviews",
      host: "Julian Thorne",
      hostAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
      date: "Sep 24, 2026",
      time: "11:00 AM EST",
      attendees: 94,
      status: "scheduled",
      tags: ["Office Hours", "Mentorship"],
      meetingLink: "#"
    }
  ],

  pastRecordings: [
    {
      id: "rec-101",
      title: "Designing for High-Density Workspaces: Lessons from Linear & Notion",
      speaker: "Elena Rostova",
      duration: "58 mins",
      views: "1.4k views",
      date: "Sep 15, 2026",
      tags: ["UI/UX", "Workspace Design"]
    },
    {
      id: "rec-102",
      title: "Zero-Latency Optimizations in Web Applications",
      speaker: "Marcus Vance",
      duration: "1h 12m",
      views: "2.1k views",
      date: "Sep 08, 2026",
      tags: ["Performance", "Architecture"]
    }
  ],

  communityThreads: [
    {
      id: "th-1",
      channel: "#ui-ux-design",
      author: "Sophia Sterling",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      title: "How are you handling focus rings in dark mode design systems with dynamic glow?",
      content: "I've been experimenting with box-shadow vs native outline with outline-offset for dark theme UI components. outline plays nicer with high-contrast accessibility, but CSS custom properties with color-mix() create incredible ambient focus glows!",
      upvotes: 34,
      commentsCount: 12,
      timeAgo: "2 hours ago",
      pinned: true,
      tags: ["Accessibility", "CSS Tokens"]
    },
    {
      id: "th-2",
      channel: "#fullstack-cohort",
      author: "David Chen",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      title: "Feedback Request: Interactive Canvas Node Graph for Course Workflows",
      content: "Hey cohort! Just finished my project submission for Module 2. Built an SVG interactive node graph that visualizes skill dependency trees. Check out the demo and let me know your thoughts on UX responsiveness!",
      upvotes: 28,
      commentsCount: 9,
      timeAgo: "5 hours ago",
      pinned: false,
      tags: ["Project Feedback", "SVG"]
    },
    {
      id: "th-3",
      channel: "#announcements",
      author: "Elena Rostova (Instructor)",
      authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
      title: "🎉 New Module Released: View Transitions & Fluid Page Router in Module 3",
      content: "We just uploaded 3 new video lessons and code playgrounds covering multi-page view transitions, shared element animations, and smooth workspace state restoration.",
      upvotes: 89,
      commentsCount: 24,
      timeAgo: "1 day ago",
      pinned: true,
      tags: ["Course Update"]
    }
  ],

  assignments: [
    {
      id: "asg-1",
      title: "Design System Tokens & Theme Switcher Architecture",
      courseTitle: "Advanced UI Design & Systems",
      dueDate: "Sep 25, 2026",
      daysLeft: 5,
      status: "in-review",
      score: null,
      gradeStatus: "Submitted (Under Review)",
      submissionDetails: {
        submittedAt: "Sep 18, 2026, 11:30 PM",
        repoUrl: "https://github.com/alexmorgan/design-system-tokens",
        liveDemoUrl: "https://tokens-preview.vercel.app",
        notes: "Implemented dark/light palette mapping using CSS custom variables with zero runtime CSS-in-JS overhead."
      },
      rubric: [
        { item: "Semantic Naming & Structure", passed: true, comment: "Excellent use of primitive vs component tokens." },
        { item: "Accessibility Contrast Metrics", passed: true, comment: "Passes WCAG AAA compliance." },
        { item: "Interactive Documentation", passed: null, comment: "Instructor review pending." }
      ]
    },
    {
      id: "asg-2",
      title: "Container Queries & Resilient Layout Playground",
      courseTitle: "Advanced UI Design & Systems",
      dueDate: "Oct 02, 2026",
      daysLeft: 12,
      status: "to-do",
      score: null,
      gradeStatus: "Not Submitted",
      submissionDetails: null
    },
    {
      id: "asg-3",
      title: "Distributed Cache & Event Sourcing Benchmark",
      courseTitle: "High-Scale Distributed Systems & Cloud Patterns",
      dueDate: "Aug 20, 2026",
      daysLeft: 0,
      status: "completed",
      score: "98 / 100",
      gradeStatus: "Graded - Distinction",
      instructorFeedback: "Outstanding design document and benchmark results! Your fallback strategy during partition events was exceptionally thorough.",
      submissionDetails: {
        submittedAt: "Aug 18, 2026",
        repoUrl: "https://github.com/alexmorgan/distributed-event-bus",
        liveDemoUrl: "https://event-bus-demo.fly.dev"
      }
    }
  ],

  certificates: [
    {
      id: "cert-8891",
      title: "Certified Systems Architect in Distributed Cloud Engineering",
      issuedBy: "Apex Learning Workspace & Engineering Guild",
      issueDate: "August 20, 2026",
      credentialId: "APX-8891-DC-2026",
      verifyUrl: "https://workspace-learning.app/verify/APX-8891-DC-2026",
      grade: "Distinction (Top 2%)",
      skills: ["Distributed Systems", "Raft Consensus", "Kafka Event Streams", "Redis Caching"],
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "cert-7724",
      title: "Executive Product Strategy & Growth Engineering",
      issuedBy: "Apex Learning Workspace",
      issueDate: "June 14, 2026",
      credentialId: "APX-7724-PS-2026",
      verifyUrl: "https://workspace-learning.app/verify/APX-7724-PS-2026",
      grade: "High Honors",
      skills: ["Product Analytics", "Experimentation", "UX Funnels", "Cohort Retention"],
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "cert-6512",
      title: "Advanced React Architecture & Performance",
      issuedBy: "Apex Learning Workspace",
      issueDate: "April 02, 2026",
      credentialId: "APX-6512-RA-2026",
      verifyUrl: "https://workspace-learning.app/verify/APX-6512-RA-2026",
      grade: "Honors",
      skills: ["Server Components", "State Management", "Bundle Optimization"],
      thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400"
    }
  ],

  userNotes: {
    "les-103": `# Module 2.1 Notes - Container Queries

- Container queries allow components to respond to their parent container's width rather than the viewport size.
- Syntax:
\`\`\`css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card-layout {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
\`\`\`
- Key advantage: Components become truly modular and can be dropped into sidebars, main columns, or modals without breaking design integrity!
- Key takeaway from Elena's video: Avoid arbitrary breakpoints! Base container queries on the component's internal content bounds.`
  }
};

function generateActivityMap() {
  const map = [];
  for (let i = 0; i < 364; i++) {
    const randomVal = Math.random();
    let level = 0;
    if (randomVal > 0.4) level = 1;
    if (randomVal > 0.7) level = 2;
    if (randomVal > 0.88) level = 3;
    if (randomVal > 0.95) level = 4;
    map.push(level);
  }
  return map;
}
