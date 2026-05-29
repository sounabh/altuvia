// ─── SCHOOL GUIDES ─────────────────────────────────────────────────────────

export const schools = [
  {
    slug: "wharton",
    name: "The Wharton School",
    completeness: 96,
    updatedAt: "Apr 2026",
    acceptance: "8.9%",
    classSize: 877,
    avgGmat: 733,
    avgSalary: "$170k",
    avgWorkExp: "5.0 yrs",
    internationalPct: "32%",
    teachingMethod: "Flexible / lecture",
    essayCount: 2,
    interviewFormat: "Admissions committee",
    location: "Philadelphia, PA",
    duration: "2 years",
    description:
      "One of the world's top MBA programmes, known for finance, entrepreneurship, and a large, collaborative class.",
  },
  {
    slug: "insead",
    name: "INSEAD",
    completeness: 92,
    updatedAt: "Apr 2026",
    acceptance: "32%",
    classSize: 1040,
    avgGmat: 710,
    avgSalary: "$120k",
    avgWorkExp: "5.8 yrs",
    internationalPct: "92%",
    teachingMethod: "Case + project",
    essayCount: 4,
    interviewFormat: "Alumni blind",
    location: "Fontainebleau / Singapore",
    duration: "10 months",
    description:
      "The world's most international business school with campuses in Europe and Asia, known for its accelerated 10-month programme.",
  },
  {
    slug: "lbs",
    name: "London Business School",
    completeness: 88,
    updatedAt: "Mar 2026",
    acceptance: "21%",
    classSize: 510,
    avgGmat: 708,
    avgSalary: "£100k",
    avgWorkExp: "5.5 yrs",
    internationalPct: "90%",
    teachingMethod: "Case + lecture",
    essayCount: 3,
    interviewFormat: "Admissions committee",
    location: "London, UK",
    duration: "15–21 months",
    description:
      "Europe's premier business school in the heart of London, offering a flexible 15-to-21-month MBA with a diverse global cohort.",
  },
  {
    slug: "mit-sloan",
    name: "MIT Sloan",
    completeness: 90,
    updatedAt: "Apr 2026",
    acceptance: "14.4%",
    classSize: 408,
    avgGmat: 730,
    avgSalary: "$165k",
    avgWorkExp: "5.3 yrs",
    internationalPct: "40%",
    teachingMethod: "Action learning",
    essayCount: 2,
    interviewFormat: "Admissions committee",
    location: "Cambridge, MA",
    duration: "2 years",
    description:
      "MIT Sloan is renowned for its action-learning approach, technology focus, and deep ties to MIT's engineering and science ecosystem.",
  },
  {
    slug: "hec-paris",
    name: "HEC Paris",
    completeness: 84,
    updatedAt: "Mar 2026",
    acceptance: "23%",
    classSize: 280,
    avgGmat: 690,
    avgSalary: "€90k",
    avgWorkExp: "5.5 yrs",
    internationalPct: "75%",
    teachingMethod: "Case + lecture",
    essayCount: 3,
    interviewFormat: "Panel",
    location: "Paris, France",
    duration: "16 months",
    description:
      "France's top business school, with a strong European network and specialisations in luxury, entrepreneurship, and finance.",
  },
  {
    slug: "kellogg",
    name: "Kellogg",
    completeness: 91,
    updatedAt: "Apr 2026",
    acceptance: "24%",
    classSize: 529,
    avgGmat: 728,
    avgSalary: "$170k",
    avgWorkExp: "5.2 yrs",
    internationalPct: "35%",
    teachingMethod: "Collaborative / case",
    essayCount: 2,
    interviewFormat: "Alumni",
    location: "Evanston, IL",
    duration: "2 years",
    description:
      "Northwestern's Kellogg School is celebrated for marketing, teamwork culture, and its highly collaborative student community.",
  },
  {
    slug: "iese",
    name: "IESE",
    completeness: 78,
    updatedAt: "Feb 2026",
    acceptance: "25%",
    classSize: 320,
    avgGmat: 680,
    avgSalary: "€85k",
    avgWorkExp: "5.7 yrs",
    internationalPct: "80%",
    teachingMethod: "Pure case method",
    essayCount: 3,
    interviewFormat: "Panel",
    location: "Barcelona, Spain",
    duration: "19 months",
    description:
      "IESE uses 100% case-method teaching and boasts one of the strongest alumni networks in Europe, spanning 120 countries.",
  },
  {
    slug: "columbia",
    name: "Columbia Business School",
    completeness: 87,
    updatedAt: "Apr 2026",
    acceptance: "17%",
    classSize: 760,
    avgGmat: 729,
    avgSalary: "$175k",
    avgWorkExp: "5.0 yrs",
    internationalPct: "45%",
    teachingMethod: "Case + lecture",
    essayCount: 3,
    interviewFormat: "Alumni blind",
    location: "New York, NY",
    duration: "2 years",
    description:
      "Located in New York City, CBS offers unmatched access to finance, media, and tech firms, with rolling Early Decision admissions.",
  },
];

// ─── ESSAY WORKSHOP ─────────────────────────────────────────────────────────

export const essaySections = [
  {
    type: "course",
    tag: "6-PART MINI-COURSE",
    title: "Essay Fundamentals",
    description: "~45 minutes total · 0 of 6 completed",
    totalMin: 45,
    lessons: [
      { id: 1, title: "Finding your story", durationMin: 8 },
      { id: 2, title: "Structuring MBA essays — goals, leadership, failure, values", durationMin: 9 },
      { id: 3, title: "Show don't tell — concrete techniques", durationMin: 7 },
      { id: 4, title: "Writing to word limits", durationMin: 6 },
      { id: 5, title: "Common mistakes", durationMin: 8 },
      { id: 6, title: "Self-review checklist", durationMin: 7 },
    ],
  },
  {
    type: "tool",
    tag: "TOOL · REFERENCE",
    title: "Prompt Decoder",
    description: "Decode every essay archetype — what they're asking and how to answer.",
    archetypes: [
      { id: "goals", label: "Goals", pendingCount: 2 },
      { id: "why-school", label: "Why this school", pendingCount: 1 },
      { id: "leadership", label: "Leadership", pendingCount: 1 },
      { id: "values", label: "Values / What matters", pendingCount: 1 },
      { id: "failure", label: "Failure / Challenge", pendingCount: 1 },
      { id: "optional", label: "Optional / Additional", pendingCount: 1 },
    ],
  },
  {
    type: "interactive",
    tag: "INTERACTIVE TOOL",
    title: "Essay Timeline Planner",
    description:
      "Working backwards from your R1 deadline, we'll build a writing schedule and push it to your Calendar.",
    ctaLabel: "Open planner",
  },
];

// ─── INTERVIEW PREP ──────────────────────────────────────────────────────────

export const interviewCategories = [
  { id: "behavioral",     label: "Behavioral",       count: 48, color: "#4F46E5" },
  { id: "why-school",     label: "Why this School",  count: 22, color: "#7C3AED" },
  { id: "goals",          label: "Goals / Career",   count: 31, color: "#059669" },
  { id: "leadership",     label: "Leadership",       count: 26, color: "#D97706" },
  { id: "teamwork",       label: "Teamwork",         count: 19, color: "#DC2626" },
  { id: "ethical",        label: "Ethical Dilemmas", count: 14, color: "#2563EB" },
  { id: "personal",       label: "Personal / Fun",   count: 12, color: "#DB2777" },
  { id: "current-events", label: "Current Events",   count: 8,  color: "#7C3AED" },
];

export const topInterviewQuestions = [
  {
    id: "q1",
    question: "Walk me through your CV.",
    category: "Behavioral",
    commonAt: ["Wharton", "INSEAD", "LBS", "Kellogg"],
  },
  {
    id: "q2",
    question: "Why an MBA, why now, and why Wharton specifically?",
    category: "Why this School",
    commonAt: ["Wharton"],
  },
  {
    id: "q3",
    question: "Tell me about a time you failed and what you learned.",
    category: "Behavioral",
    commonAt: ["INSEAD", "MIT Sloan", "Kellogg"],
  },
  {
    id: "q4",
    question: "Describe a time you led a team through a difficult decision.",
    category: "Leadership",
    commonAt: ["Wharton", "Kellogg", "LBS"],
  },
  {
    id: "q5",
    question: "What's a recent business news story you found interesting and why?",
    category: "Current Events",
    commonAt: ["LBS", "HBS"],
  },
];

export const interviewFormatGuides = [
  {
    id: "blind-alumni",
    title: "The Blind Alumni Interview",
    description:
      "Common at INSEAD and Columbia. The alumnus hasn't read your application — how to handle that.",
  },
  {
    id: "adcom",
    title: "The Admissions Committee Interview",
    description:
      "Common at Wharton and LBS. The interviewer has your full file. What changes.",
  },
];

// ─── APPLICATION PLAYBOOKS ───────────────────────────────────────────────────

export const playbooks = [
  {
    id: "12-month",
    badge: "FLAGSHIP",
    title: "The 12-Month MBA Application Playbook",
    description: "Month-by-month from decision to submit.",
    steps: 38,
    months: 12,
  },
  {
    id: "career-switcher",
    badge: "SPECIALIZED",
    title: "Career Switcher Playbook",
    description: "Extra steps for non-traditional backgrounds.",
    steps: 22,
    months: 8,
  },
  {
    id: "reapplicant",
    badge: "SPECIALIZED",
    title: "Reapplicant Playbook",
    description: "What to change after a Round 1 ding.",
    steps: 18,
    months: 6,
  },
  {
    id: "scholarship",
    badge: "SPECIALIZED",
    title: "Scholarship Application Playbook",
    description: "Timelines, extra essays, and financial aid forms.",
    steps: 14,
    months: 4,
  },
  {
    id: "european",
    badge: "REGIONAL",
    title: "European Schools Playbook",
    description: "LBS, INSEAD, HEC Paris — key differences vs. US process.",
    steps: 20,
    months: 9,
  },
  {
    id: "gmat-prep",
    badge: "TOOL",
    title: "GMAT / GRE Prep Tracker",
    description: "Score targets, study schedule, and practice test log.",
    steps: 12,
    months: 3,
  },
];

// ─── Q&A FORUM ───────────────────────────────────────────────────────────────

export const forumCategories = [
  "Essays",
  "Interviews",
  "School Selection",
  "GMAT/GRE",
  "Recommendations",
  "Scholarships",
];

export const forumQuestions = [
  {
    id: "fq1",
    title: 'How specific should "Why Wharton" actually be?',
    body: "My consultant keeps saying I need to name specific clubs and courses but the essay is only 350 words. How specific is too specific?",
    upvotes: 47,
    answers: 6,
    topAnswerer: "Priya Shah",
    topAnswererSchool: "Wharton '23",
    category: "Essays",
    schoolTag: "Wharton",
    postedAt: "3 days ago",
    isAlumniAnswered: true,
  },
  {
    id: "fq2",
    title: "Does INSEAD really care about a third language?",
    body: 'I speak English and Mandarin fluently. Is my "exit language" requirement going to be a problem if I haven\'t started yet?',
    upvotes: 38,
    answers: 11,
    topAnswerer: "Arjun Mehta",
    topAnswererSchool: "INSEAD '22",
    category: "School Selection",
    schoolTag: "INSEAD",
    postedAt: "1 week ago",
    isAlumniAnswered: true,
  },
  {
    id: "fq3",
    title: "Recommender said yes — but is asking me to draft it for them. OK?",
    body: "This feels wrong but I've heard it's common.",
    upvotes: 92,
    answers: 14,
    category: "Recommendations",
    postedAt: "2 weeks ago",
    isAlumniAnswered: false,
  },
  {
    id: "fq4",
    title: "Applying with a 700 GMAT to Wharton — realistic?",
    body: "My profile is strong (consulting, nonprofit board, 3.9 GPA) but GMAT is 700. Should I retake or apply?",
    upvotes: 61,
    answers: 9,
    topAnswerer: "Marcus Lee",
    topAnswererSchool: "Wharton '24",
    category: "GMAT/GRE",
    schoolTag: "Wharton",
    postedAt: "4 days ago",
    isAlumniAnswered: true,
  },
  {
    id: "fq5",
    title: "LBS vs Kellogg for consulting — which alumni network is stronger?",
    body: "Targeting MBB post-MBA, based in London long-term. Torn between LBS (home turf) and Kellogg (US brand).",
    upvotes: 55,
    answers: 8,
    category: "School Selection",
    postedAt: "5 days ago",
    isAlumniAnswered: false,
  },
  {
    id: "fq6",
    title: "Does the HEC scholarship essay matter for funding decisions?",
    body: "I applied for the Merit Fellowship. Anyone know how much weight the extra essay carries vs GMAT/profile?",
    upvotes: 29,
    answers: 4,
    category: "Scholarships",
    schoolTag: "HEC Paris",
    postedAt: "1 week ago",
    isAlumniAnswered: false,
  },
];

// ─── MY SAVED ────────────────────────────────────────────────────────────────

export const savedItems = [
  {
    id: "sv1",
    type: "School Guide",
    title: "The Wharton School",
    subtitle: "Updated Apr 2026",
  },
  {
    id: "sv2",
    type: "Essay Workshop",
    title: "Show, don't tell — concrete techniques",
    subtitle: "Part 3 of Essay Fundamentals",
  },
  {
    id: "sv3",
    type: "Q&A",
    title: 'How specific should "Why Wharton" actually be?',
    subtitle: "47 upvotes · 6 answers · alumni-answered",
  },
  {
    id: "sv4",
    type: "Comparison",
    title: "Wharton vs INSEAD vs LBS",
    subtitle: "Saved May 14",
  },
];

// ─── SCHOOL COMPARE ──────────────────────────────────────────────────────────

export const compareDimensions = [
  { key: "acceptance",      label: "Acceptance rate" },
  { key: "classSize",       label: "Class size" },
  { key: "avgGmat",         label: "Avg GMAT" },
  { key: "avgSalary",       label: "Median salary post" },
  { key: "avgWorkExp",      label: "Avg work experience" },
  { key: "internationalPct",label: "International %" },
  { key: "teachingMethod",  label: "Teaching method" },
  { key: "essayCount",      label: "Essay count" },
  { key: "interviewFormat", label: "Interview format" },
];

// ─── LEARN NAV ───────────────────────────────────────────────────────────────

// lib/learnData.js

export const learnNavItems = [
  {
    href: "/dashboard/learn",
    label: "Overview",
    icon: "grid",
  },
  {
    href: "/dashboard/learn/school-guides",
    label: "School Guides",
    icon: "book",
  },
  {
    href: "/dashboard/learn/essay-workshop",
    label: "Essay Workshop",
    icon: "edit",
  },
  {
    href: "/dashboard/learn/interview-prep",
    label: "Interview Prep",
    icon: "user",
  },
  {
    href: "/dashboard/learn/application-playbooks",
    label: "Application Playbooks",
    icon: "clipboard",
  },
  {
    href: "/dashboard/learn/school-compare",
    label: "School Compare",
    icon: "bar-chart",
  },
  {
    href: "/dashboard/learn/qa-forum",
    label: "Q&A Forum",
    icon: "help-circle",
  },
  {
    href: "/dashboard/learn/my-saved",
    label: "My Saved",
    icon: "bookmark",
  },
];