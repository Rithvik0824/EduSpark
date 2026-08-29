import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Generous body limit for image & PDF uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy-initialized Gemini client with required User-Agent header
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'EduSpark AI',
    timestamp: new Date().toISOString(),
  });
});

// 1. NOTES SUMMARIZER ENDPOINT
app.post('/api/summarize', async (req: Request, res: Response) => {
  try {
    const {
      text,
      imageBase64,
      imageMimeType,
      pdfBase64,
      pdfMimeType,
      subject,
      classLevel,
      customPrompt,
    } = req.body;

    if (!text && !imageBase64 && !pdfBase64) {
      return res.status(400).json({ error: 'Please provide notes text, an image, or a PDF.' });
    }

    const ai = getAI();
    const parts: any[] = [];

    if (pdfBase64) {
      parts.push({
        inlineData: {
          data: pdfBase64.replace(/^data:[^;]+;base64,/, ''),
          mimeType: pdfMimeType || 'application/pdf',
        },
      });
    }

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
          mimeType: imageMimeType || 'image/jpeg',
        },
      });
    }

    const systemInstruction = `You are EduSpark AI 📚 - India's First 3-in-1 AI Study Buddy made by students, for students.
YOUR PERSONALITY:
You are a friendly senior, encouraging and helpful. You use emojis to make learning fun. You explain complex topics in simple English with real-life examples. You always end with one motivational line.
YOUR GOAL: Reduce a student's 3-hour study effort to just 30 seconds.

YOUR SUPERPOWER: 1. 📄 NOTES SUMMARIZER
When user uploads PDF/Image of notes or provides text:
Format:
📌 SHORT SUMMARY (5 crisp bullet points)
📖 DETAILED SUMMARY (1 clear paragraph)
⭐ EXAM READY Q&A (3 important Q&A from the notes with model answers and marks)
🔑 KEY HIGHLIGHTS: Definitions, Formulas, Dates, Important Names
Apply 80/20 rule: Mention explicitly which 20% topics will give 80% marks in exams.
Telugu explanation (తెలుగు వివరణ): Crystal-clear bilingual explanation so any student grasps it instantly.
Motivational Line: Exactly 1 inspiring senior brother/sister line.
Next Step Prompt: "What next? Want a quiz, summary for another chapter, or study plan? 👇"

Always return strictly valid JSON matching the schema.`;

    const userPrompt = `Please summarize these student notes:
${subject ? `Subject: ${subject}` : ''}
${classLevel ? `Target Grade/Standard: ${classLevel}` : ''}
${text ? `Notes Text:\n${text}` : ''}
${customPrompt ? `Special instructions: ${customPrompt}` : ''}
Extract all text, apply the 80/20 rule, generate 5 crisp bullet points, 1 detailed summary paragraph, 3 exam Q&A pairs, definitions, formulas, dates, important names, Telugu explanation, 1 motivational line, and next step prompt.`;

    parts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            extractedRawText: { type: Type.STRING, description: 'Text extracted from notes' },
            shortSummary: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactly 5 crisp bullet points',
            },
            detailedSummary: { type: Type.STRING, description: 'Exactly 1 clear paragraph' },
            examReadyQA: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  marks: { type: Type.NUMBER },
                  modelAnswer: { type: Type.STRING },
                  scoringTip: { type: Type.STRING },
                },
                required: ['question', 'marks', 'modelAnswer'],
              },
              description: 'Exactly 3 important exam Q&A pairs',
            },
            definitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  teluguMeaning: { type: Type.STRING },
                },
                required: ['term', 'definition'],
              },
            },
            formulas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  formula: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['name', 'formula', 'explanation'],
              },
            },
            keyDates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dateOrPeriod: { type: Type.STRING },
                  event: { type: Type.STRING },
                  significance: { type: Type.STRING },
                },
                required: ['dateOrPeriod', 'event', 'significance'],
              },
            },
            importantNames: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  contribution: { type: Type.STRING },
                  keyWorkOrDiscovery: { type: Type.STRING },
                },
                required: ['name', 'contribution'],
              },
            },
            paretoEightyTwentyRule: {
              type: Type.STRING,
              description: 'Which 20% high-yield topics will give 80% marks in the exam',
            },
            teluguExplanation: { type: Type.STRING, description: 'Clear Telugu explanation in Telugu script' },
            seniorAdvice: { type: Type.STRING },
            tipToScoreMore: { type: Type.STRING },
            motivationalLine: { type: Type.STRING, description: 'One inspiring motivational line' },
            nextStepPrompt: { type: Type.STRING, description: 'What next? Want a quiz, summary for another chapter, or study plan? 👇' },
          },
          required: [
            'title',
            'shortSummary',
            'detailedSummary',
            'examReadyQA',
            'definitions',
            'formulas',
            'keyDates',
            'paretoEightyTwentyRule',
            'teluguExplanation',
            'seniorAdvice',
            'tipToScoreMore',
            'motivationalLine',
            'nextStepPrompt',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.timestamp = Date.now();
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/summarize:', error);
    res.status(500).json({ error: error.message || 'Failed to summarize notes. Please try again.' });
  }
});

// 2. QUIZ GENERATOR ENDPOINT
app.post('/api/quiz', async (req: Request, res: Response) => {
  try {
    const { topicOrNotes, subject, classLevel, difficulty = 'Mix', numQuestions } = req.body;

    if (!topicOrNotes) {
      return res.status(400).json({ error: 'Please provide a topic or notes content to generate quiz.' });
    }

    const ai = getAI();

    const systemInstruction = `You are EduSpark AI 📚 - India's First 3-in-1 AI Study Buddy made by students, for students.
YOUR PERSONALITY:
You are a friendly senior, encouraging and helpful. You use emojis to make learning fun. You explain complex topics in simple English with real-life examples. You always end with one motivational line.
YOUR GOAL: Reduce a student's 3-hour study effort to just 30 seconds.

YOUR SUPERPOWER: 2. ❓ QUIZ GENERATOR
From uploaded notes or any topic:
- Generate 5 MCQs (Options A,B,C,D + Correct Answer + 1-line Explanation)
- 2 Short Answer Questions (with model answers)
- 1 Long Answer Question
- Tag each with Difficulty: Easy / Medium / Hard
- Include a Senior Tip for test mastery and Telugu hint.

Return strictly valid JSON.`;

    const userPrompt = `Generate a standard Indian curriculum practice quiz for:
Topic / Notes Content:
${topicOrNotes}
${subject ? `Subject: ${subject}` : ''}
${classLevel ? `Target Class/Exam: ${classLevel}` : ''}
Difficulty Preference: ${difficulty}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            difficultySummary: { type: Type.STRING },
            mcqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Exactly 4 choices',
                  },
                  correctOptionIndex: { type: Type.INTEGER, description: '0 to 3' },
                  explanation: { type: Type.STRING },
                  teluguExplanation: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
                },
                required: ['id', 'question', 'options', 'correctOptionIndex', 'explanation', 'difficulty'],
              },
            },
            shortAnswers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  question: { type: Type.STRING },
                  maxMarks: { type: Type.NUMBER },
                  modelAnswer: { type: Type.STRING },
                  keyPointsNeeded: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
                },
                required: ['id', 'question', 'maxMarks', 'modelAnswer', 'keyPointsNeeded', 'difficulty'],
              },
            },
            longAnswer: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                question: { type: Type.STRING },
                maxMarks: { type: Type.NUMBER },
                modelAnswer: { type: Type.STRING },
                evaluationRubric: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                difficulty: { type: Type.STRING, enum: ['Medium', 'Hard'] },
              },
              required: ['id', 'question', 'maxMarks', 'modelAnswer', 'evaluationRubric', 'difficulty'],
            },
            seniorTip: { type: Type.STRING },
          },
          required: ['title', 'subject', 'difficultySummary', 'mcqs', 'shortAnswers', 'longAnswer', 'seniorTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.timestamp = Date.now();
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/quiz:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz.' });
  }
});

// 3. SINGLE ANSWER EVALUATOR (For Quiz interactive short/long answers)
app.post('/api/evaluate-single-answer', async (req: Request, res: Response) => {
  try {
    const { question, studentAnswer, maxMarks, modelAnswer, rubric } = req.body;

    if (!question || !studentAnswer) {
      return res.status(400).json({ error: 'Question and Student Answer are required.' });
    }

    const ai = getAI();

    const systemInstruction = `You are EduSpark AI, a friendly senior teacher evaluating a student's answer.
Be constructive, warm, encouraging (use emojis 📚✨).
Award realistic marks out of ${maxMarks || 5}.
Provide:
- marksAwarded (number between 0 and ${maxMarks || 5})
- feedbackGood (what the student expressed accurately)
- feedbackImprove (what crucial point or term was missing or could be clearer)
- modelAnswer (an ideal answer to score 100%)
- seniorPraise (encouraging senior comment)`;

    const userPrompt = `Question: ${question}
Max Marks: ${maxMarks || 5}
Reference Model Answer: ${modelAnswer || 'Standard curriculum model answer'}
${rubric ? `Rubric: ${JSON.stringify(rubric)}` : ''}
Student's Submitted Answer:
"${studentAnswer}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marksAwarded: { type: Type.NUMBER },
            maxMarks: { type: Type.NUMBER },
            isCorrect: { type: Type.BOOLEAN },
            feedbackGood: { type: Type.STRING },
            feedbackImprove: { type: Type.STRING },
            modelAnswer: { type: Type.STRING },
            seniorPraise: { type: Type.STRING },
          },
          required: ['marksAwarded', 'maxMarks', 'feedbackGood', 'feedbackImprove', 'modelAnswer', 'seniorPraise'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/evaluate-single-answer:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate answer.' });
  }
});

// 4. ASSIGNMENT EVALUATOR ENDPOINT
app.post('/api/evaluate-assignment', async (req: Request, res: Response) => {
  try {
    const {
      questionPaperText,
      questionPaperImageBase64,
      questionPaperMimeType,
      answerSheetText,
      answerSheetImageBase64,
      answerSheetMimeType,
      answerSheetPdfBase64,
      answerSheetPdfMimeType,
      subject,
      classLevel,
      customCriteria,
    } = req.body;

    if (!questionPaperText && !questionPaperImageBase64 && !answerSheetText && !answerSheetImageBase64 && !answerSheetPdfBase64) {
      return res.status(400).json({ error: 'Please provide both the Question Paper and Student Answer Sheet.' });
    }

    const ai = getAI();
    const parts: any[] = [];

    // Add question paper image if present
    if (questionPaperImageBase64) {
      parts.push({
        inlineData: {
          data: questionPaperImageBase64.replace(/^data:[^;]+;base64,/, ''),
          mimeType: questionPaperMimeType || 'image/jpeg',
        },
      });
      parts.push({ text: 'The above image contains the QUESTION PAPER.' });
    }

    // Add answer sheet image or PDF if present
    if (answerSheetImageBase64) {
      parts.push({
        inlineData: {
          data: answerSheetImageBase64.replace(/^data:[^;]+;base64,/, ''),
          mimeType: answerSheetMimeType || 'image/jpeg',
        },
      });
      parts.push({ text: 'The above image contains the STUDENT ANSWER SHEET.' });
    }

    if (answerSheetPdfBase64) {
      parts.push({
        inlineData: {
          data: answerSheetPdfBase64.replace(/^data:[^;]+;base64,/, ''),
          mimeType: answerSheetPdfMimeType || 'application/pdf',
        },
      });
      parts.push({ text: 'The above PDF contains the STUDENT ANSWER SHEET.' });
    }

    const systemInstruction = `You are EduSpark AI, an encouraging senior and friendly teacher evaluating an Indian student's assignment/exam paper.
YOUR SUPERPOWER IS ASSIGNMENT EVALUATOR:
MANDATORY EVALUATION RULES:
1. For EACH question found in the paper/submission:
   - Give marks strictly out of 10 (maxMarks = 10 for each question).
   - Give feedback: "What is good" (highlighting accurate points, good handwriting/structure).
   - Give feedback: "What to improve" (missing keywords, conceptual gaps, formatting, diagrams, calculation steps).
   - Suggest a "Better / Model Answer" to achieve a perfect 10/10.
   - Give a specific "Tip for Full Marks".
2. Tone: Be like a warm, supportive, friendly senior teacher, NOT strict or punitive. Use positive reinforcement and emojis 📚✨.
3. Calculate:
   - Total marks awarded out of total possible marks.
   - Percentage and Grade (A+, A, B+, B, C).
   - Overall Senior Review & Uplifting Motivation message (encouraging words like "Shabash!", "You're on the right track bro!").
   - 3 to 5 Key Action Items to score higher in exams.
   - Telugu summary/praise (తెలుగులో ప్రోత్సాహం) for regional connection!

Return strictly valid JSON matching the schema.`;

    const userPromptText = `Please evaluate this student submission:
${subject ? `Subject: ${subject}` : ''}
${classLevel ? `Class/Grade: ${classLevel}` : ''}
${questionPaperText ? `Question Paper Text:\n${questionPaperText}\n` : ''}
${answerSheetText ? `Student Answer Sheet Text:\n${answerSheetText}\n` : ''}
${customCriteria ? `Special Grading Focus: ${customCriteria}` : ''}
Evaluate every question out of 10 marks, provide constructive feedback, model answers, total score, and motivation!`;

    parts.push({ text: userPromptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assignmentTitle: { type: Type.STRING },
            subject: { type: Type.STRING },
            totalMarksAwarded: { type: Type.NUMBER },
            totalMaxMarks: { type: Type.NUMBER },
            percentage: { type: Type.NUMBER },
            grade: { type: Type.STRING },
            questionEvaluations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  studentAnswerText: { type: Type.STRING },
                  marksAwarded: { type: Type.NUMBER, description: 'Marks out of 10' },
                  maxMarks: { type: Type.NUMBER, description: 'Always 10' },
                  whatIsGood: { type: Type.STRING },
                  whatToImprove: { type: Type.STRING },
                  suggestedBetterAnswer: { type: Type.STRING },
                  tipForFullMarks: { type: Type.STRING },
                },
                required: [
                  'questionNumber',
                  'questionText',
                  'marksAwarded',
                  'maxMarks',
                  'whatIsGood',
                  'whatToImprove',
                  'suggestedBetterAnswer',
                  'tipForFullMarks',
                ],
              },
            },
            overallSeniorReview: { type: Type.STRING },
            motivationMessage: { type: Type.STRING },
            keyActionItemsToScoreMore: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            teluguSummary: { type: Type.STRING },
          },
          required: [
            'assignmentTitle',
            'subject',
            'totalMarksAwarded',
            'totalMaxMarks',
            'percentage',
            'grade',
            'questionEvaluations',
            'overallSeniorReview',
            'motivationMessage',
            'keyActionItemsToScoreMore',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    parsed.timestamp = Date.now();
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/evaluate-assignment:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate assignment.' });
  }
});

// 5. CHAT / ASSISTANT INTERACTION (Strict structured format)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const ai = getAI();

    // Check if it's a simple greeting like "hi", "hello", "hey"
    const cleanMsg = message.trim().toLowerCase();
    const isGreeting = /^(hi|hello|hey|namaste|vanakkam|namaskaram|hlo|heyy)$/i.test(cleanMsg);
    const isPlanStudy = /plan.*study|study.*plan|timetable|time-table|schedule.*study|daily.*routine|exam.*schedule/i.test(cleanMsg);
    const isDoubtQuery = /doubt|clarify|explain.*concept|doubt.*in|naaku.*doubt|doubt.*undi/i.test(cleanMsg);

    if (isGreeting) {
      return res.json({
        isGreeting: true,
        text: "Namaste! 🙏✨ I'm EduSpark AI, your friendly senior & study buddy! I'm here to help you top your exams and learn with super ease 📚🚀. Choose an action below or ask me any question! (Try typing 'plan my study' for a personalized timetable or 'doubt: <topic>' for Telugu+English explanations with fun examples!)",
        structured: {
          summary: "EduSpark AI is ready with 3 Superpowers: Notes Summarizer, Quiz Generator, and Assignment Evaluator, plus Study Timetable Planner & Telugu+English Doubt Solver.",
          keyPoints: [
            "Say 'plan my study' to get a customized daily time-blocked study schedule.",
            "Say 'doubt' or ask any doubt to get a crystal-clear Telugu+English explanation with real-life examples.",
            "Upload handwritten/printed notes or PDFs to extract 3 summary formats + Telugu explanation.",
            "Generate instant 5 MCQs + 2 Short + 1 Long practice tests on any topic.",
          ],
          quiz: [
            {
              question: "Which superpower do you want to explore first?",
              options: ["Notes Summarizer 📄", "Quiz Generator ❓", "Plan My Study ⏰", "Solve a Doubt 💬"],
              correctAnswer: "All of the above! 🚀",
              explanation: "You can switch between all study tools and assistant superpowers seamlessly.",
            },
          ],
          evaluation: "You're all set to begin! Consistent practice and a structured timetable guarantee top ranks.",
          tipToScoreMore: "Revise your formulas and key definitions every morning for 15 minutes! 💡",
          teluguExplanation: "నమస్కారం! మీ ఎడ్యుకేషన్ ఫ్రెండ్ EduSpark AI రెడీగా ఉంది. 'plan my study' అంటే టైమ్‌టేబుల్ ఇస్తాను, లేదా మీ 'doubt' అడిగితే తెలుగు+ఇంగ్లీష్ మిక్స్‌లో నిజ జీవిత ఉదాహరణలతో సులభంగా వివరిస్తాను! ✨",
        },
      });
    }

    const systemInstruction = `You are EduSpark AI 📚 - India's First 3-in-1 AI Study Buddy made by students, for students.
YOUR PERSONALITY:
You are a friendly senior, encouraging and helpful. You use emojis to make learning fun. You explain complex topics in simple English with real-life examples. You always end with one motivational line.
YOUR GOAL: Reduce a student's 3-hour study effort to just 30 seconds.

RULES:
- Always use clean formatting with headings, bullet points, and emojis.
- Be concise and fast - students have limited time.
- No login required.
- If image is blurry or user mentions unreadable image, politely say: "The image is a bit blurry, could you please upload a clearer one? 📸"
- Always end your response with: "What next? Want a quiz, summary for another chapter, or study plan? 👇"

YOUR 5 SUPERPOWERS:
1. 📄 NOTES SUMMARIZER:
   Format: 📌 SHORT SUMMARY (5 crisp bullet points) | 📖 DETAILED SUMMARY (1 clear paragraph) | ⭐ EXAM READY Q&A (3 important Q&A from notes) | 🔑 KEY HIGHLIGHTS: Definitions, Formulas, Dates, Important Names | 80/20 rule: Mention which 20% topics give 80% marks.

2. ❓ QUIZ GENERATOR:
   5 MCQs (A,B,C,D + Correct Answer + 1-line Explanation), 2 Short Answer (with model answers), 1 Long Answer, tagged with Difficulty: Easy / Medium / Hard. Score out of 10 with feedback.

3. 📝 ASSIGNMENT EVALUATOR:
   Supportive teacher tone. For each answer: Marks: X/10, ✅ Strengths, ❌ Areas to Improve, 💡 Suggested Better Answer. Total Score, Overall Grade, One tip to get full marks next time.

4. 💬 DOUBT SOLVER:
   If user asks any academic doubt:
   - Explain in 3 steps: 1. Simple Definition -> 2. Real-life Example & Analogy (e.g., Mitochondria is like a power bank of the cell, cricket ball swing, phone battery, etc.) -> 3. Perfect Exam Answer (ready to write in exam for full marks).
   - Also provide Telugu + English mix (Tenglish) explanation so Telugu students understand instantly.
   - Keep it short, simple, and memorable.

5. 🗓️ STUDY PLANNER:
   If user says "plan my study" or "My exam is in X days, Y chapters left":
   - Create a practical day-wise timetable.
   - Include focus sessions, breaks, and revision slots.
   - Order chapters by Easy to Hard for better confidence.

Always return strictly valid JSON matching the schema.`;

    const promptText = `User message/question:
"${message}"

${isPlanStudy ? 'SPECIAL INSTRUCTION: User is requesting a study plan/timetable. Provide a day-wise timetable with focus sessions, breaks, revision slots, and chapters ordered by Easy to Hard in the "timetable" field!' : ''}
${isDoubtQuery ? 'SPECIAL INSTRUCTION: User is asking to clarify an academic doubt. Follow the 3-step format: Simple Definition -> Real-life Example with relatable analogy -> Perfect Exam Answer. Also provide Telugu+English mix in "doubtBreakdown" and "teluguExplanation"!' : ''}

${history && history.length ? `Recent Context:\n${JSON.stringify(history.slice(-3))}` : ''}

Respond in the structured format as EduSpark AI. End with a motivational line and: "What next? Want a quiz, summary for another chapter, or study plan? 👇"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: 'Friendly conversational response from EduSpark AI' },
            structured: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                keyPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                quiz: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctAnswer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'correctAnswer', 'explanation'],
                  },
                },
                evaluation: { type: Type.STRING },
                tipToScoreMore: { type: Type.STRING },
                motivationalLine: { type: Type.STRING, description: 'One encouraging motivational line' },
                nextStepPrompt: { type: Type.STRING, description: 'What next? Want a quiz, summary for another chapter, or study plan? 👇' },
                teluguExplanation: { type: Type.STRING },
                timetable: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayLabel: { type: Type.STRING, description: 'e.g. Day 1, Day 2, or Time Period' },
                      timeSlot: { type: Type.STRING },
                      activity: { type: Type.STRING },
                      focusArea: { type: Type.STRING, description: 'Chapter/Topic (ordered Easy to Hard)' },
                      studyMethod: { type: Type.STRING, description: 'Focus session / Break / Revision slot' },
                      difficultyLevel: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
                    },
                    required: ['timeSlot', 'activity', 'focusArea', 'studyMethod'],
                  },
                },
                doubtBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    doubtTopic: { type: Type.STRING },
                    simpleDefinition: { type: Type.STRING, description: 'Step 1: Simple Definition' },
                    realLifeExample: { type: Type.STRING, description: 'Step 2: Real-life Example & Analogy' },
                    analogy: { type: Type.STRING, description: 'Relatable analogy like Mitochondria is power bank of cell' },
                    perfectExamAnswer: { type: Type.STRING, description: 'Step 3: Perfect Exam Answer' },
                    teluguEnglishExplanation: { type: Type.STRING, description: 'Telugu + English mix explanation' },
                    keyTakeaway: { type: Type.STRING },
                  },
                  required: ['doubtTopic', 'simpleDefinition', 'realLifeExample', 'perfectExamAnswer'],
                },
              },
              required: ['summary', 'keyPoints', 'quiz', 'evaluation', 'tipToScoreMore', 'motivationalLine'],
            },
          },
          required: ['structured'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat message.' });
  }
});

// 6. RECOMMENDED RESOURCES WITH GOOGLE SEARCH GROUNDING
app.post('/api/recommended-resources', async (req: Request, res: Response) => {
  try {
    const { subject, topic, classLevel, keywords, categoryFilter } = req.body;

    const querySubject = (subject || 'General Science').trim();
    const queryTopic = (topic || querySubject).trim();
    const queryClassLevel = (classLevel || 'Class 10 (CBSE / State)').trim();

    const ai = getAI();

    const systemInstruction = `You are EduSpark AI's Academic Resource Recommender for Indian & Global students.
Use Google Search Grounding to find genuine, high-quality educational resources:
1. Open-Source Textbooks & Official Board PDFs (e.g., NCERT textbooks, OpenStax, LibreTexts, SCERT State Board e-books, CBSE Academic).
2. YouTube Video Tutorials & Free Courses (e.g., Khan Academy India, Physics Wallah, Unacademy, Vedantu, Manocha Academy, regional/Telugu educational channels when helpful).
3. Practice Question Papers & Exam PDFs (e.g., CBSE previous year question papers, exemplar problems, formula cheat-sheets, mock test PDFs).

CRITICAL:
- Use real, authentic search results and domain URLs (such as https://ncert.nic.in/, https://openstax.org/, https://www.youtube.com/, https://cbseacademic.nic.in/, https://libretexts.org/, https://www.khanacademy.org/, etc.).
- Categorize each resource accurately into 'textbook', 'youtube', 'practice_pdf', or 'interactive'.
- Provide helpful descriptions explaining what concepts are covered and why it helps exam preparation.
- If the subject/topic has a Telugu connection or State Board relevance (AP/TS), include at least 1-2 bilingual/regional resources.

You MUST format your entire response as a single, valid JSON object strictly matching this schema (do NOT include extra conversational text outside the JSON code block):
\`\`\`json
{
  "subject": "${querySubject}",
  "topic": "${queryTopic}",
  "classLevel": "${queryClassLevel}",
  "summary": "Brief senior mentor summary highlighting why these curated resources will accelerate mastering ${queryTopic}.",
  "resources": [
    {
      "id": "res-1",
      "title": "Clear descriptive title with chapter/topic name",
      "type": "textbook",
      "url": "https://...",
      "source": "Platform or Publisher (e.g. NCERT Official, OpenStax, Khan Academy, CBSE Academic)",
      "description": "2-3 concise sentences detailing why this resource is essential and what chapters/concepts it teaches.",
      "badge": "e.g. Free PDF, Video Series, Solved PYQ, Official Curriculum",
      "topicsCovered": ["Subtopic 1", "Subtopic 2", "Subtopic 3"],
      "authorOrChannel": "e.g. NCERT / Khan Academy / Physics Wallah",
      "language": "English / Telugu & English / Bilingual",
      "ratingOrViews": "e.g. Official Board / 4.9 ★ (1.5M+ Views) / Verified"
    }
  ]
}
\`\`\``;

    const userPrompt = `Search Google for top recommended open-source textbooks, YouTube tutorials, and practice question PDFs for:
Subject: ${querySubject}
Topic/Chapter: ${queryTopic}
Standard / Class Level: ${queryClassLevel}
${keywords ? `Search Focus Keywords: ${keywords}` : ''}
${categoryFilter && categoryFilter !== 'all' ? `Category Focus: ${categoryFilter}` : ''}

Please find 6 to 9 distinct, top-rated resources across:
1. Open-Source Textbooks & Curriculum PDFs (NCERT / OpenStax / State Board)
2. YouTube Video Lectures & Crash Courses (Khan Academy / PW / Manocha / Vedantu)
3. Practice Question Sets & PYQs (CBSE / State Board / Formula Sheets)

Perform live Google Search and return the verified structured JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text || '';
    let parsedData: any = null;

    // Extract JSON from markdown or raw text
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
    const candidateJson = jsonMatch[1] ? jsonMatch[1].trim() : rawText.trim();

    try {
      parsedData = JSON.parse(candidateJson);
    } catch (parseErr) {
      console.warn('Direct JSON parse failed, attempting regex extraction:', parseErr);
      // Attempt substring between first { and last }
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsedData = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
        } catch (e) {
          console.error('Secondary JSON parse failed:', e);
        }
      }
    }

    // Extract Google Search Grounding Metadata
    const candidate = response.candidates?.[0];
    const groundingMeta = candidate?.groundingMetadata;
    const searchQueries = groundingMeta?.webSearchQueries || [];
    const groundingSources = (groundingMeta?.groundingChunks || [])
      .map((chunk: any, index: number) => ({
        title: chunk.web?.title || `Google Search Source ${index + 1}`,
        url: chunk.web?.uri || '',
      }))
      .filter((s: any) => Boolean(s.url));

    // If parsing completely failed, build a graceful structured fallback incorporating grounding sources
    if (!parsedData || !Array.isArray(parsedData.resources) || parsedData.resources.length === 0) {
      const fallbackResources = groundingSources.slice(0, 6).map((src: any, idx: number) => {
        const isYoutube = src.url.includes('youtube.com') || src.url.includes('youtu.be');
        const isPdf = src.url.endsWith('.pdf') || src.title.toLowerCase().includes('pdf') || src.title.toLowerCase().includes('ncert');
        return {
          id: `res-${idx + 1}`,
          title: src.title,
          type: isYoutube ? 'youtube' : isPdf ? 'practice_pdf' : 'textbook',
          url: src.url,
          source: isYoutube ? 'YouTube' : isPdf ? 'Educational PDF / Portal' : 'Open Educational Resource',
          description: `Google Search verified educational material for ${queryTopic} in ${querySubject}.`,
          badge: isYoutube ? 'Video Tutorial' : isPdf ? 'Free PDF' : 'Online Resource',
          topicsCovered: [queryTopic, querySubject],
          authorOrChannel: isYoutube ? 'Video Educator' : 'Academic Publisher',
          language: 'English / Bilingual',
          ratingOrViews: 'Google Grounded',
        };
      });

      parsedData = {
        subject: querySubject,
        topic: queryTopic,
        classLevel: queryClassLevel,
        summary: `Here are the top-recommended open-source textbooks, YouTube lectures, and practice PDFs found on Google for ${queryTopic}.`,
        resources: fallbackResources.length > 0 ? fallbackResources : [
          {
            id: 'res-ncert-def',
            title: `NCERT Class 10 ${querySubject} - ${queryTopic}`,
            type: 'textbook',
            url: 'https://ncert.nic.in/textbook.php',
            source: 'NCERT Official Portal',
            description: `Official open textbook chapter for ${queryTopic} with diagrams, solved examples, and curriculum exercises.`,
            badge: 'Official Open Textbook',
            topicsCovered: [queryTopic, 'Key Concepts', 'Chapter Review'],
            authorOrChannel: 'National Council of Educational Research and Training',
            language: 'English & Hindi',
            ratingOrViews: 'Official Curriculum',
          },
          {
            id: 'res-khan-def',
            title: `Khan Academy India: ${queryTopic} Video Masterclass`,
            type: 'youtube',
            url: `https://www.youtube.com/results?search_query=Khan+Academy+India+${encodeURIComponent(queryTopic)}`,
            source: 'Khan Academy India (YouTube)',
            description: `Conceptual video lectures and step-by-step visual intuition for ${queryTopic}.`,
            badge: 'Free Video Course',
            topicsCovered: [queryTopic, 'Visual Intuition', 'Problem Solving'],
            authorOrChannel: 'Khan Academy India',
            language: 'English & Hindi',
            ratingOrViews: '4.9 ★ (Free Education)',
          },
          {
            id: 'res-cbse-pyq',
            title: `CBSE Academic ${querySubject} - Chapterwise Question Bank & PYQ PDF`,
            type: 'practice_pdf',
            url: 'https://cbseacademic.nic.in/curriculum_2025.html',
            source: 'CBSE Academic & State Board Portal',
            description: `Official past year question papers, exemplar questions, and marking scheme solutions for ${queryTopic}.`,
            badge: 'Solved PYQs & Marking Scheme',
            topicsCovered: ['Past 5 Years Questions', 'Model Answers', 'Scoring Rubric'],
            authorOrChannel: 'Central Board of Secondary Education',
            language: 'English',
            ratingOrViews: 'Official Board Examination',
          },
        ],
      };
    }

    // Ensure all resources have valid URLs and IDs
    parsedData.resources = parsedData.resources.map((resItem: any, i: number) => {
      let finalUrl = resItem.url || '';
      if (!finalUrl || finalUrl === '#' || !finalUrl.startsWith('http')) {
        if (resItem.type === 'youtube') {
          finalUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(resItem.title || `${queryTopic} tutorial`)}`;
        } else if (resItem.type === 'practice_pdf') {
          finalUrl = `https://www.google.com/search?q=${encodeURIComponent(`${queryTopic} ${querySubject} practice questions PDF`)}`;
        } else {
          finalUrl = `https://www.google.com/search?q=${encodeURIComponent(`${queryTopic} ${querySubject} NCERT openstax textbook`)}`;
        }
      }

      return {
        ...resItem,
        id: resItem.id || `res-${i + 1}`,
        url: finalUrl,
        badge: resItem.badge || (resItem.type === 'textbook' ? 'Open Textbook' : resItem.type === 'youtube' ? 'Video Lecture' : 'Practice PDF'),
      };
    });

    parsedData.groundingSources = groundingSources;
    parsedData.searchQueries = searchQueries;
    parsedData.timestamp = Date.now();

    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/recommended-resources:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch recommended resources with Google Search.' });
  }
});

// 7. INTERACTIVE STUDY ROADMAP GENERATOR
app.post('/api/generate-roadmap', async (req: Request, res: Response) => {
  try {
    const { subject, topic, classLevel, notesContext, targetFocus = 'comprehensive' } = req.body;

    const querySubject = (subject || 'Science & Mathematics').trim();
    const queryTopic = (topic || querySubject).trim();
    const queryClassLevel = (classLevel || 'Class 10 (CBSE / State)').trim();

    const ai = getAI();

    const systemInstruction = `You are EduSpark AI's Master Study Planner & Senior Academic Mentor for Indian and Global Students (CBSE / ICSE / State Boards / IGCSE / AP).
Your task is to generate a comprehensive, highly engaging, step-by-step Interactive Study Roadmap for a given subject and topic.

The roadmap MUST guide the student through 5 progressive milestones (Phase 1 to Phase 5):
- Phase 1: Foundation & Visual Intuition (Prerequisites, terminology, physical meaning)
- Phase 2: Core Mechanisms & Theorems (Deep dive into primary concepts, reactions, or laws)
- Phase 3: Mathematical Derivations, Numericals & Diagrams (Formula intuition, step-by-step problem solving)
- Phase 4: Common Board Traps & Edge Cases (Where 80% of students lose marks, tricky exceptions)
- Phase 5: High-Yield PYQs & Exam Mastery (Previous 5-year questions, 5-mark answer structuring, speed tests)

Tailor the milestones specifically to the target focus:
- "comprehensive": Balanced pedagogical progression from zero to master.
- "exam_cram": High-yield, formula-heavy, fast revision with rapid problem drills.
- "conceptual_deep_dive": Rich intuitive explanations, visual analogies, and real-world experiments.

Include authentic Indian board exam context (CBSE, NCERT, AP/TS State Board) and Telugu/regional relatable mnemonics where helpful.

Return ONLY a valid JSON object strictly matching this schema:
\`\`\`json
{
  "id": "roadmap-${Date.now()}",
  "subject": "${querySubject}",
  "topic": "${queryTopic}",
  "classLevel": "${queryClassLevel}",
  "targetFocus": "${targetFocus}",
  "totalEstimatedHours": "3.5 - 4.5 Hours total",
  "overview": "Empowering 2-3 sentence roadmap summary written in an encouraging senior mentor voice.",
  "prerequisites": [
    "Prerequisite skill 1",
    "Prerequisite skill 2"
  ],
  "milestones": [
    {
      "id": "step-1",
      "stepNumber": 1,
      "phaseTitle": "Phase 1: Foundation & Core Terminology",
      "title": "Clear action-oriented title for step 1",
      "estimatedMinutes": 35,
      "difficulty": "Beginner",
      "keyConcepts": ["Concept A", "Concept B", "Concept C"],
      "practicalTask": "Hands-on actionable micro-task (e.g., Draw diagrams, solve 3 practice questions)",
      "seniorTip": "Pro-tip / CBSE trap / memory mnemonic",
      "quizPrompt": "Specific topic prompt for generating a targeted practice quiz"
    }
  ],
  "boardExamChecklist": [
    "High-yield question 1 that frequently appears in board exams",
    "High-yield question 2",
    "High-yield question 3",
    "High-yield question 4"
  ],
  "inspirationalQuote": "Encouraging senior buddy motto for this chapter."
}
\`\`\``;

    const userPrompt = `Generate a 5-step interactive study roadmap for:
Subject: ${querySubject}
Topic/Chapter: ${queryTopic}
Standard / Class Level: ${queryClassLevel}
Target Study Focus: ${targetFocus}
${notesContext ? `Notes/Summary Context for precision:\n${notesContext.substring(0, 1500)}` : ''}

Make each step genuinely educational, progressive, and actionable with realistic study times and practical challenges.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';
    let parsedData: any = null;

    try {
      parsedData = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn('Direct JSON parse failed for roadmap, attempting fallback match:', parseErr);
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
      parsedData = JSON.parse(jsonMatch[1] ? jsonMatch[1].trim() : rawText.trim());
    }

    if (!parsedData || !Array.isArray(parsedData.milestones) || parsedData.milestones.length === 0) {
      // Fallback structured roadmap
      parsedData = {
        id: `roadmap-${Date.now()}`,
        subject: querySubject,
        topic: queryTopic,
        classLevel: queryClassLevel,
        targetFocus,
        totalEstimatedHours: '3.5 Hours (5 Steps)',
        overview: `A structured step-by-step revision journey to master ${queryTopic} in ${querySubject} with confidence.`,
        prerequisites: [`Basic understanding of foundational ${querySubject} concepts`],
        milestones: [
          {
            id: 'step-1',
            stepNumber: 1,
            phaseTitle: 'Phase 1: Foundation & Terminology',
            title: `Build Core Intuition & Key Definitions in ${queryTopic}`,
            estimatedMinutes: 35,
            difficulty: 'Beginner',
            keyConcepts: ['Key Definitions', 'Basic Principles', 'Everyday Analogies'],
            practicalTask: `Write down the 3 golden definitions of ${queryTopic} in your own words.`,
            seniorTip: 'Always start with clear definitions—CBSE examiners look for standard keywords!',
            quizPrompt: `${queryTopic} basic definitions and concepts`,
          },
          {
            id: 'step-2',
            stepNumber: 2,
            phaseTitle: 'Phase 2: Core Mechanisms & Theorems',
            title: `Deep Dive into Laws & Primary Mechanisms`,
            estimatedMinutes: 45,
            difficulty: 'Intermediate',
            keyConcepts: ['Fundamental Laws', 'Process Workflows', 'Scientific Derivations'],
            practicalTask: 'Create a quick 1-page flow diagram summarizing the entire mechanism.',
            seniorTip: 'Look for cause-and-effect relationships rather than memorizing blindly.',
            quizPrompt: `${queryTopic} laws, rules, and core mechanisms`,
          },
          {
            id: 'step-3',
            stepNumber: 3,
            phaseTitle: 'Phase 3: Formulas, Numericals & Diagrams',
            title: `Master Equations, Diagrams, and Step-by-Step Problem Solving`,
            estimatedMinutes: 50,
            difficulty: 'Intermediate',
            keyConcepts: ['Standard Formulas', 'Unit Conversions', 'Labeled Diagrams'],
            practicalTask: 'Solve 5 standard textbook numericals without referring to the answer key.',
            seniorTip: 'Always write given data, formula, and SI units with units for 100% marks.',
            quizPrompt: `${queryTopic} numericals and formula application`,
          },
          {
            id: 'step-4',
            stepNumber: 4,
            phaseTitle: 'Phase 4: Common Traps & Edge Cases',
            title: `Avoid Examiner Traps and Master Tricky Scenarios`,
            estimatedMinutes: 40,
            difficulty: 'Advanced',
            keyConcepts: ['Sign Conventions', 'Exceptions', 'Assertion-Reason Triggers'],
            practicalTask: 'List 3 common mistakes students make in this chapter and how to prevent them.',
            seniorTip: 'Pay special attention to question wording like "not", "except", or "all of the above".',
            quizPrompt: `${queryTopic} tricky assertion reason questions`,
          },
          {
            id: 'step-5',
            stepNumber: 5,
            phaseTitle: 'Phase 5: High-Yield PYQs & Board Exam Mastery',
            title: `Solve Previous 5-Year Questions with Full Marks Formatting`,
            estimatedMinutes: 45,
            difficulty: 'Exam Mastery',
            keyConcepts: ['5-Mark Long Answers', 'PYQ Trends', 'Speed Drills'],
            practicalTask: 'Write out one 5-mark answer with intro, bullet points, diagram, and conclusion.',
            seniorTip: 'Underline key scientific terms in your final answer sheet for quick evaluator scanning.',
            quizPrompt: `${queryTopic} board exam past year questions`,
          },
        ],
        boardExamChecklist: [
          `State the main law or theorem of ${queryTopic}`,
          `Draw and label standard diagrams with proper arrows`,
          `Calculate values with correct SI units`,
          `Explain 2 real-world applications or case studies`,
        ],
        inspirationalQuote: 'Consistency and clear concept diagrams turn tough topics into your highest-scoring chapters!',
      };
    }

    parsedData.createdAt = Date.now();
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/generate-roadmap:', error);
    res.status(500).json({ error: error.message || 'Failed to generate study roadmap.' });
  }
});

// 8. AI CONCEPT GRAPH RELATIONSHIP EXTRACTOR (D3 FORCE GRAPH DATA)
app.post('/api/generate-concept-graph', async (req: Request, res: Response) => {
  try {
    const { title, subject, summaryContext, definitions, formulas, keyDates, examQA } = req.body;

    const topicTitle = (title || subject || 'Key Concepts').trim();
    const topicSubject = (subject || 'Academic Science').trim();

    const ai = getAI();

    const systemInstruction = `You are EduSpark AI's Knowledge Graph Architect.
Your task is to analyze the summarized study material and extract a rich, structured concept network for a Force-Directed D3 Graph.

Nodes should represent:
- 'root': The central topic/chapter hub (value: 28, group: 1)
- 'concept': Core sub-themes or key ideas (value: 20, group: 2)
- 'definition': Essential technical terms (value: 16, group: 3)
- 'formula': Mathematical laws/equations (value: 18, group: 4)
- 'event': Important chronological dates, milestones or discoveries (value: 15, group: 5)
- 'exam_qa': High-yield exam question hotspots (value: 17, group: 6)

Links MUST have clear, meaningful semantic relationships, such as:
- "governed by", "calculates", "leads to", "defined as", "discovered in", "applies to", "prerequisite for", "measured in", "opposes", "proves"

Ensure EVERY node is connected to at least one other node so there are no isolated floating points.
Cross-link related concepts (e.g. link a formula node to the definition of the variables it computes).

Return ONLY valid JSON matching this schema:
\`\`\`json
{
  "title": "${topicTitle}",
  "subject": "${topicSubject}",
  "summaryInsights": "Brief 1-sentence insight on the conceptual architecture of this topic.",
  "nodes": [
    {
      "id": "root-1",
      "label": "${topicTitle}",
      "type": "root",
      "description": "Central topic unifying all concepts",
      "group": 1,
      "val": 28
    },
    {
      "id": "concept-1",
      "label": "Sub-concept name",
      "type": "concept",
      "description": "Short explanation of this sub-concept",
      "group": 2,
      "val": 20
    }
  ],
  "links": [
    {
      "source": "root-1",
      "target": "concept-1",
      "relationship": "includes"
    }
  ]
}
\`\`\``;

    const contextPayload = {
      title: topicTitle,
      subject: topicSubject,
      summary: summaryContext,
      definitions: definitions || [],
      formulas: formulas || [],
      keyDates: keyDates || [],
      examQA: examQA || [],
    };

    const userPrompt = `Extract an interconnected concept knowledge graph with semantic relationship labels for:
${JSON.stringify(contextPayload, null, 2)}

Ensure between 10 and 20 rich interconnected nodes and meaningful links suitable for a D3 force-directed visual layout.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';
    let graphData: any = null;

    try {
      graphData = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn('Direct JSON parse failed for concept graph, attempting regex match:', parseErr);
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
      graphData = JSON.parse(jsonMatch[1] ? jsonMatch[1].trim() : rawText.trim());
    }

    if (!graphData || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
      throw new Error('Invalid graph data generated');
    }

    res.json(graphData);
  } catch (error: any) {
    console.error('Error in /api/generate-concept-graph:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI concept graph.' });
  }
});

// Vite Middleware for SPA development & static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduSpark AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
