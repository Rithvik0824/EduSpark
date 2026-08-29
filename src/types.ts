export type SuperpowerTab = 'summarizer' | 'quiz' | 'evaluator' | 'chat' | 'progress';

export type ColorMode = 'dark' | 'light';

export type AccentColor = 'amber' | 'blue' | 'indigo' | 'emerald' | 'rose';

export interface QuizAttemptRecord {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  title: string;
  subject: string;
  earnedScore: number;
  maxScore: number;
  percentage: number;
  difficulty?: string;
  durationSeconds?: number;
}

export interface DailyStudyMetrics {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Mon", "Tue", "24 Oct"
  studyMinutes: number;
  quizzesTaken: number;
  averageScorePercent: number;
  notesSummarized: number;
  assignmentsEvaluated: number;
}

export interface StudentProgressData {
  totalStudyMinutes: number;
  totalQuizzesTaken: number;
  averageQuizScorePercent: number;
  totalNotesSummarized: number;
  totalAssignmentsEvaluated: number;
  studyStreakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  quizAttempts: QuizAttemptRecord[];
  dailyStudyHistory: Record<string, DailyStudyMetrics>;
}

export interface UserSettings {
  colorMode: ColorMode;
  accentColor: AccentColor;
  speechRate: number;
  speechPitch: number;
  defaultSpeechLang: 'en-IN' | 'te-IN' | 'hi-IN' | 'en-US';
  showCelebrationConfetti: boolean;
  soundEffects: boolean;
}

export interface NoteDefinition {
  term: string;
  definition: string;
  teluguMeaning?: string;
}

export interface NoteFormula {
  name: string;
  formula: string;
  explanation: string;
}

export interface NoteDateEvent {
  dateOrPeriod: string;
  event: string;
  significance: string;
}

export interface NoteImportantName {
  name: string;
  contribution?: string;
  roleOrDiscovery?: string;
  significance?: string;
  keyWorkOrDiscovery?: string;
}

export interface ExamQAPair {
  question: string;
  marks: number;
  modelAnswer: string;
  scoringTip?: string;
}

export interface NotesSummaryResult {
  title: string;
  subject?: string;
  extractedRawText?: string;
  shortSummary: string[]; // 5 crisp bullet points
  detailedSummary: string; // Comprehensive in-depth paragraph
  examReadyQA: ExamQAPair[]; // 3 important Q&A from the notes
  definitions: NoteDefinition[];
  formulas: NoteFormula[];
  keyDates: NoteDateEvent[];
  importantNames?: NoteImportantName[]; // Key Highlight: Important Names
  paretoEightyTwentyRule?: string; // 80/20 rule: Which 20% topics give 80% marks
  teluguExplanation: string; // Telugu translation and explanation
  seniorAdvice: string; // Friendly senior encouragement
  tipToScoreMore: string;
  motivationalLine?: string; // One motivational line to end with
  nextStepPrompt?: string; // What next? Want a quiz, summary for another chapter, or study plan? 👇
  timestamp: number;
}

export interface QuizMCQ {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctOptionIndex: number; // 0-3
  explanation: string;
  teluguExplanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizShortAnswer {
  id: number;
  question: string;
  maxMarks: number;
  modelAnswer: string;
  keyPointsNeeded: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizLongAnswer {
  id: number;
  question: string;
  maxMarks: number;
  modelAnswer: string;
  evaluationRubric: string[];
  difficulty: 'Medium' | 'Hard';
}

export interface QuizData {
  title: string;
  subject: string;
  difficultySummary: string;
  mcqs: QuizMCQ[];
  shortAnswers: QuizShortAnswer[];
  longAnswer: QuizLongAnswer;
  seniorTip: string;
  timestamp: number;
}

export interface SingleAnswerEvaluation {
  marksAwarded: number;
  maxMarks: number;
  isCorrect?: boolean;
  feedbackGood: string;
  feedbackImprove: string;
  modelAnswer: string;
  seniorPraise: string;
}

export interface QuestionEvaluation {
  questionNumber: string;
  questionText: string;
  studentAnswerText: string;
  marksAwarded: number;
  maxMarks: number; // 10
  whatIsGood: string;
  whatToImprove: string;
  suggestedBetterAnswer: string;
  tipForFullMarks: string;
}

export interface AssignmentEvaluationResult {
  assignmentTitle: string;
  subject: string;
  totalMarksAwarded: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  questionEvaluations: QuestionEvaluation[];
  overallSeniorReview: string;
  motivationMessage: string;
  keyActionItemsToScoreMore: string[];
  teluguSummary?: string;
  timestamp: number;
}

export interface ChatTimetableSlot {
  dayLabel?: string; // e.g. "Day 1", "Day 2", "Daily Routine"
  timeSlot: string; // e.g. "6:00 AM - 7:30 AM"
  activity: string; // e.g. "High Focus Session: Physics Numericals"
  focusArea: string; // e.g. "Chapter 1 & 2 (Easy to Hard progression)"
  studyMethod: string; // e.g. "Active Recall + 15m Break"
  difficultyLevel?: 'Easy' | 'Medium' | 'Hard';
}

export interface ChatDoubtBreakdown {
  doubtTopic: string;
  simpleDefinition: string; // Step 1: Simple Definition
  realLifeExample: string; // Step 2: Real-life Example & Analogy
  analogy?: string; // e.g. "Mitochondria is like a power bank of the cell"
  perfectExamAnswer: string; // Step 3: Perfect Exam Answer
  teluguEnglishExplanation?: string; // Bilingual Telugu + English explanation
  keyTakeaway?: string;
}

export interface StructuredChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  text?: string;
  // Mandatory structured assistant fields
  structured?: {
    summary: string;
    keyPoints: string[];
    quiz: {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }[];
    evaluation: string;
    tipToScoreMore: string;
    motivationalLine?: string; // Always end with one motivational line
    nextStepPrompt?: string; // "What next? Want a quiz, summary for another chapter, or study plan? 👇"
    teluguExplanation?: string;
    timetable?: ChatTimetableSlot[];
    doubtBreakdown?: ChatDoubtBreakdown;
  };
}

export interface SavedItem {
  id: string;
  type: 'summary' | 'quiz' | 'evaluation';
  title: string;
  subject: string;
  date: string;
  data: NotesSummaryResult | QuizData | AssignmentEvaluationResult;
}

export type ResourceCategory = 'all' | 'textbook' | 'youtube' | 'practice_pdf' | 'interactive';

export interface RecommendedResource {
  id: string;
  title: string;
  type: 'textbook' | 'youtube' | 'practice_pdf' | 'interactive';
  url: string;
  source: string;
  description: string;
  badge: string;
  topicsCovered?: string[];
  authorOrChannel?: string;
  language?: string;
  ratingOrViews?: string;
}

export interface RecommendedResourcesResponse {
  subject: string;
  topic: string;
  classLevel?: string;
  summary: string;
  resources: RecommendedResource[];
  groundingSources?: Array<{ title: string; url: string }>;
  searchQueries?: string[];
  timestamp: number;
}

export type RoadmapDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Exam Mastery';

export interface StudyRoadmapStep {
  id: string;
  stepNumber: number;
  phaseTitle: string; // e.g. "Phase 1: Foundation & Core Terminology"
  title: string;
  estimatedMinutes: number;
  difficulty: RoadmapDifficulty;
  keyConcepts: string[];
  practicalTask: string; // Actionable challenge / homework
  seniorTip: string; // CBSE trap / memory mnemonic
  quizPrompt: string; // Prompt for instant quiz generation
  isCompleted?: boolean;
}

export interface StudyRoadmap {
  id: string;
  subject: string;
  topic: string;
  classLevel?: string;
  targetFocus: 'comprehensive' | 'exam_cram' | 'conceptual_deep_dive';
  totalEstimatedHours: string;
  overview: string;
  prerequisites: string[];
  milestones: StudyRoadmapStep[];
  boardExamChecklist: string[];
  inspirationalQuote: string;
  createdAt: number;
}

export type ConceptNodeType = 'root' | 'concept' | 'definition' | 'formula' | 'event' | 'exam_qa';

export interface ConceptGraphNode {
  id: string;
  label: string;
  type: ConceptNodeType;
  description?: string;
  extraInfo?: string; // formula equation, telugu translation, date/period, scoring tip
  group?: number;
  val?: number; // visual node weight
  // D3 force simulation runtime properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ConceptGraphLink {
  source: string | ConceptGraphNode;
  target: string | ConceptGraphNode;
  relationship?: string; // semantic relation label e.g., 'defines', 'calculates', 'governed by', 'applied in'
  value?: number;
}

export interface ConceptGraphData {
  title: string;
  subject: string;
  nodes: ConceptGraphNode[];
  links: ConceptGraphLink[];
  summaryInsights?: string;
}

