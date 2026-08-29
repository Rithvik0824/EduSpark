import {
  NotesSummaryResult,
  QuizData,
  AssignmentEvaluationResult,
  SingleAnswerEvaluation,
  StructuredChatMessage,
  RecommendedResourcesResponse,
  ResourceCategory,
  StudyRoadmap,
  ConceptGraphData,
} from '../types';

export async function summarizeNotes(params: {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
  pdfBase64?: string;
  pdfMimeType?: string;
  subject?: string;
  classLevel?: string;
  customPrompt?: string;
}): Promise<NotesSummaryResult> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function generateQuiz(params: {
  topicOrNotes: string;
  subject?: string;
  classLevel?: string;
  difficulty?: 'Mix' | 'Easy' | 'Medium' | 'Hard';
}): Promise<QuizData> {
  const response = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function evaluateAssignment(params: {
  questionPaperText?: string;
  questionPaperImageBase64?: string;
  questionPaperMimeType?: string;
  answerSheetText?: string;
  answerSheetImageBase64?: string;
  answerSheetMimeType?: string;
  answerSheetPdfBase64?: string;
  answerSheetPdfMimeType?: string;
  subject?: string;
  classLevel?: string;
  customCriteria?: string;
}): Promise<AssignmentEvaluationResult> {
  const response = await fetch('/api/evaluate-assignment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function evaluateSingleAnswer(params: {
  question: string;
  studentAnswer: string;
  maxMarks?: number;
  modelAnswer?: string;
  rubric?: string[];
}): Promise<SingleAnswerEvaluation> {
  const response = await fetch('/api/evaluate-single-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function sendChatMessage(params: {
  message: string;
  history?: Array<{ role: string; content: string }>;
}): Promise<{ isGreeting?: boolean; text?: string; structured: NonNullable<StructuredChatMessage['structured']> }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function fetchRecommendedResources(params: {
  subject: string;
  topic?: string;
  classLevel?: string;
  keywords?: string;
  categoryFilter?: ResourceCategory;
}): Promise<RecommendedResourcesResponse> {
  const response = await fetch('/api/recommended-resources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function generateStudyRoadmap(params: {
  subject: string;
  topic: string;
  classLevel?: string;
  notesContext?: string;
  targetFocus?: 'comprehensive' | 'exam_cram' | 'conceptual_deep_dive';
}): Promise<StudyRoadmap> {
  const response = await fetch('/api/generate-roadmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function fetchConceptGraph(params: {
  title: string;
  subject?: string;
  summaryContext?: string;
  definitions?: any[];
  formulas?: any[];
  keyDates?: any[];
  examQA?: any[];
}): Promise<ConceptGraphData> {
  const response = await fetch('/api/generate-concept-graph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

