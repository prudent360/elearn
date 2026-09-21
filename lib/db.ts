import { initialData, Course, CurrentUser, Assignment, CommunityThread, Lesson, Module } from './data';

// Persistent in-memory data store for API routes
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  headline: string;
  avatar: string;
  password?: string;
  streakDays: number;
  level: string;
  hoursLearned: number;
  coursesCompleted: number;
  certificatesCount: number;
  skills: { name: string; level: number }[];
  achievements: { id: number; title: string; desc: string; icon: string; date: string }[];
  activityMap: number[];
  weeklyGoalHours: number;
  weeklyStats: { day: string; minutes: number; date: string }[];
  categoryBreakdown: { category: string; hours: number; percentage: number; color: string }[];
  recentSessions: { id: string; date: string; courseTitle: string; lessonTitle: string; duration: string; xp: number }[];
}

interface DatabaseState {
  users: UserRecord[];
  courses: Course[];
  assignments: Assignment[];
  communityThreads: CommunityThread[];
  userNotes: Record<string, Record<string, string>>; // userId -> (lessonId -> text)
  enrollments: Record<string, string[]>; // userId -> courseId[]
  completedLessons: Record<string, string[]>; // userId -> lessonId[]
}

const defaultUsers: UserRecord[] = [
  {
    id: 'user-alex',
    name: initialData.currentUser.name,
    email: 'alex.morgan@tekskillup.com',
    role: 'student',
    headline: initialData.currentUser.role,
    avatar: initialData.currentUser.avatar,
    password: 'password123',
    streakDays: initialData.currentUser.streakDays,
    level: initialData.currentUser.level,
    hoursLearned: initialData.currentUser.hoursLearned,
    coursesCompleted: initialData.currentUser.coursesCompleted,
    certificatesCount: initialData.currentUser.certificatesCount,
    skills: initialData.currentUser.skills,
    achievements: initialData.currentUser.achievements,
    activityMap: initialData.currentUser.activityMap,
    weeklyGoalHours: initialData.currentUser.weeklyGoalHours,
    weeklyStats: initialData.currentUser.weeklyStats,
    categoryBreakdown: initialData.currentUser.categoryBreakdown,
    recentSessions: initialData.currentUser.recentSessions
  },
  {
    id: 'user-elena',
    name: 'Elena Rostova',
    email: 'elena@tekskillup.com',
    role: 'instructor',
    headline: 'Principal Design Architect @ Vercel & Lead Instructor',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    password: 'password123',
    streakDays: 45,
    level: 'Master Instructor',
    hoursLearned: 320,
    coursesCompleted: 18,
    certificatesCount: 12,
    skills: [
      { name: 'Design Systems', level: 98 },
      { name: 'CSS Architecture', level: 95 }
    ],
    achievements: [
      { id: 10, title: 'Master Educator', desc: 'Taught over 5,000+ students', icon: '🌟', date: 'Sep 2026' }
    ],
    activityMap: Array.from({ length: 364 }, () => Math.floor(Math.random() * 4)),
    weeklyGoalHours: 15,
    weeklyStats: [
      { day: 'Mon', minutes: 120, date: 'Sep 14' },
      { day: 'Tue', minutes: 90, date: 'Sep 15' },
      { day: 'Wed', minutes: 150, date: 'Sep 16' },
      { day: 'Thu', minutes: 110, date: 'Sep 17' },
      { day: 'Fri', minutes: 180, date: 'Sep 18' },
      { day: 'Sat', minutes: 40, date: 'Sep 19' },
      { day: 'Sun', minutes: 60, date: 'Sep 20' }
    ],
    categoryBreakdown: [
      { category: 'UI/UX & Design', hours: 60, percentage: 70, color: 'var(--accent-primary)' },
      { category: 'Engineering & AI', hours: 25, percentage: 30, color: 'var(--accent-secondary)' }
    ],
    recentSessions: []
  },
  {
    id: 'user-admin',
    name: 'Admin Workspace',
    email: 'admin@tekskillup.com',
    role: 'admin',
    headline: 'Tekskillup Academy Platform Administrator',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    password: 'password123',
    streakDays: 60,
    level: 'Platform Superadmin',
    hoursLearned: 150,
    coursesCompleted: 10,
    certificatesCount: 8,
    skills: [{ name: 'Platform Operations', level: 100 }],
    achievements: [],
    activityMap: Array.from({ length: 364 }, () => 2),
    weeklyGoalHours: 20,
    weeklyStats: [],
    categoryBreakdown: [],
    recentSessions: []
  }
];

// Global singleton db state
const globalDb: DatabaseState = (globalThis as any).__TEKSKILLUP_DB__ || {
  users: defaultUsers,
  courses: initialData.courses,
  assignments: initialData.assignments,
  communityThreads: initialData.communityThreads,
  userNotes: {
    'user-alex': initialData.userNotes
  },
  enrollments: {
    'user-alex': ['course-101', 'course-102', 'course-103', 'course-104']
  },
  completedLessons: {
    'user-alex': ['les-101', 'les-102', 'les-201', 'les-202', 'les-301', 'les-401']
  }
};

(globalThis as any).__TEKSKILLUP_DB__ = globalDb;

export const db = {
  // Users
  getUserById(id: string): UserRecord | undefined {
    return globalDb.users.find(u => u.id === id);
  },
  getUserByEmail(email: string): UserRecord | undefined {
    return globalDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  createUser(user: UserRecord): UserRecord {
    globalDb.users.push(user);
    return user;
  },
  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const idx = globalDb.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    globalDb.users[idx] = { ...globalDb.users[idx], ...updates };
    return globalDb.users[idx];
  },

  // Courses
  getCourses(): Course[] {
    return globalDb.courses;
  },
  getCourseById(id: string): Course | undefined {
    return globalDb.courses.find(c => c.id === id);
  },
  createCourse(course: Course): Course {
    globalDb.courses.push(course);
    return course;
  },
  updateCourse(id: string, updates: Partial<Course>): Course | undefined {
    const idx = globalDb.courses.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    globalDb.courses[idx] = { ...globalDb.courses[idx], ...updates };
    return globalDb.courses[idx];
  },

  // Enrollments
  getEnrollments(userId: string): string[] {
    return globalDb.enrollments[userId] || [];
  },
  enrollUser(userId: string, courseId: string): string[] {
    if (!globalDb.enrollments[userId]) globalDb.enrollments[userId] = [];
    if (!globalDb.enrollments[userId].includes(courseId)) {
      globalDb.enrollments[userId].push(courseId);
    }
    return globalDb.enrollments[userId];
  },

  // Completed Lessons
  getCompletedLessons(userId: string): string[] {
    return globalDb.completedLessons[userId] || [];
  },
  toggleLessonComplete(userId: string, lessonId: string): { lessonId: string; completed: boolean } {
    if (!globalDb.completedLessons[userId]) globalDb.completedLessons[userId] = [];
    const list = globalDb.completedLessons[userId];
    const index = list.indexOf(lessonId);
    let completed = false;
    if (index >= 0) {
      list.splice(index, 1);
      completed = false;
    } else {
      list.push(lessonId);
      completed = true;
    }
    return { lessonId, completed };
  },

  // Notes
  getUserNotes(userId: string): Record<string, string> {
    return globalDb.userNotes[userId] || {};
  },
  saveUserNote(userId: string, lessonId: string, note: string): Record<string, string> {
    if (!globalDb.userNotes[userId]) globalDb.userNotes[userId] = {};
    globalDb.userNotes[userId][lessonId] = note;
    return globalDb.userNotes[userId];
  },

  // Assignments
  getAssignments(): Assignment[] {
    return globalDb.assignments;
  },
  getAssignmentById(id: string): Assignment | undefined {
    return globalDb.assignments.find(a => a.id === id);
  },
  submitAssignment(id: string, details: { repoUrl: string; liveDemoUrl: string; studentName: string }): Assignment | undefined {
    const asg = globalDb.assignments.find(a => a.id === id);
    if (!asg) return undefined;
    asg.status = 'in-review';
    asg.studentName = details.studentName;
    asg.submissionDetails = {
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      repoUrl: details.repoUrl,
      liveDemoUrl: details.liveDemoUrl
    };
    return asg;
  },
  gradeAssignment(id: string, grade: { score: string; feedback: string; rubric: { item: string; passed: boolean }[] }): Assignment | undefined {
    const asg = globalDb.assignments.find(a => a.id === id);
    if (!asg) return undefined;
    asg.status = 'completed';
    asg.score = grade.score;
    asg.gradeStatus = 'Graded';
    asg.instructorFeedback = grade.feedback;
    asg.rubric = grade.rubric;
    return asg;
  },

  // Community Threads
  getCommunityThreads(): CommunityThread[] {
    return globalDb.communityThreads;
  },
  createCommunityThread(thread: CommunityThread): CommunityThread {
    globalDb.communityThreads.unshift(thread);
    return thread;
  },
  upvoteThread(threadId: string): CommunityThread | undefined {
    const t = globalDb.communityThreads.find(item => item.id === threadId);
    if (!t) return undefined;
    t.upvotes += 1;
    return t;
  }
};
