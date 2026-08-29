import jsPDF from 'jspdf';
import { NotesSummaryResult, QuizData, AssignmentEvaluationResult } from '../types';

interface PDFPageContext {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  currentY: number;
  pageNumber: number;
}

/**
 * Initializes a new clean A4 PDF context
 */
function initPDF(): PDFPageContext {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  return {
    doc,
    pageWidth: 210,
    pageHeight: 297,
    margin: 15,
    contentWidth: 180,
    currentY: 20,
    pageNumber: 1,
  };
}

/**
 * Auto page-break checker to ensure content does not overlap margins
 */
function checkPageBreak(ctx: PDFPageContext, requiredHeightMm: number = 15) {
  if (ctx.currentY + requiredHeightMm > ctx.pageHeight - 20) {
    drawFooter(ctx);
    ctx.doc.addPage();
    ctx.pageNumber++;
    ctx.currentY = 20;
  }
}

/**
 * Draw a clean modern header on the first page
 */
function drawMainHeader(
  ctx: PDFPageContext,
  badgeText: string,
  titleText: string,
  subtitleText: string,
  accentColor: [number, number, number] = [245, 158, 11] // Amber
) {
  const { doc, margin, contentWidth } = ctx;

  // Header background bar
  doc.setFillColor(18, 18, 22);
  doc.roundedRect(margin, ctx.currentY, contentWidth, 28, 2, 2, 'F');

  // Accent left border
  doc.setFillColor(...accentColor);
  doc.rect(margin, ctx.currentY, 3.5, 28, 'F');

  // Badge / Superpower tag
  doc.setFontSize(8);
  doc.setTextColor(...accentColor);
  doc.text(badgeText.toUpperCase(), margin + 8, ctx.currentY + 7);

  // Brand tag on right
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 210);
  doc.text('EDUSPARK AI  •  STUDY SHEET', margin + contentWidth - 55, ctx.currentY + 7);

  // Main Title
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  const truncatedTitle = titleText.length > 55 ? titleText.slice(0, 52) + '...' : titleText;
  doc.text(truncatedTitle, margin + 8, ctx.currentY + 16);

  // Subtitle / Date
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 175);
  doc.text(subtitleText, margin + 8, ctx.currentY + 23);

  ctx.currentY += 34;
}

/**
 * Draw Section Heading Banner
 */
function drawSectionHeading(
  ctx: PDFPageContext,
  title: string,
  iconSymbol: string = '◆',
  bgColor: [number, number, number] = [244, 244, 247],
  textColor: [number, number, number] = [20, 20, 25]
) {
  checkPageBreak(ctx, 15);
  const { doc, margin, contentWidth } = ctx;

  doc.setFillColor(...bgColor);
  doc.roundedRect(margin, ctx.currentY, contentWidth, 7.5, 1.2, 1.2, 'F');

  doc.setFontSize(9.5);
  doc.setTextColor(...textColor);
  doc.text(`${iconSymbol}  ${title}`, margin + 3, ctx.currentY + 5.2);

  ctx.currentY += 11;
}

/**
 * Draw Callout / Senior Advice Box
 */
function drawCalloutBox(
  ctx: PDFPageContext,
  title: string,
  bodyText: string,
  bgColor: [number, number, number] = [254, 243, 199],
  borderColor: [number, number, number] = [245, 158, 11],
  textColor: [number, number, number] = [146, 64, 14]
) {
  const { doc, margin, contentWidth } = ctx;
  const splitBody = doc.splitTextToSize(bodyText, contentWidth - 10);
  const boxHeight = splitBody.length * 4.2 + 10;

  checkPageBreak(ctx, boxHeight + 4);

  // Fill
  doc.setFillColor(...bgColor);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, ctx.currentY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

  // Title
  doc.setFontSize(8.5);
  doc.setTextColor(...textColor);
  doc.text(title, margin + 4, ctx.currentY + 5.5);

  // Body
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 35);
  doc.text(splitBody, margin + 4, ctx.currentY + 10.5);

  ctx.currentY += boxHeight + 4;
}

/**
 * Draw Page Footer
 */
function drawFooter(ctx: PDFPageContext) {
  const { doc, margin, contentWidth, pageHeight } = ctx;
  const footerY = pageHeight - 10;

  doc.setDrawColor(220, 220, 230);
  doc.line(margin, footerY - 3, margin + contentWidth, footerY - 3);

  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 145);
  doc.text(
    'EduSpark AI — Intelligent Education Assistant for Indian Students 🇮🇳',
    margin,
    footerY
  );
  doc.text(`Page ${ctx.pageNumber}`, margin + contentWidth - 15, footerY);
}

/**
 * 1. Export Notes Summary to PDF
 */
export function exportSummaryToPDF(summary: NotesSummaryResult, filename?: string) {
  const ctx = initPDF();
  const { doc, margin, contentWidth } = ctx;

  // Header
  drawMainHeader(
    ctx,
    `${summary.subject || 'Academic Notes'} • Smart Summary`,
    summary.title || 'Revision Notes',
    `Generated on ${new Date(summary.timestamp || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} • Prepared with EduSpark Senior Buddy AI`,
    [245, 158, 11] // Amber
  );

  // Senior Buddy Advice Callout
  if (summary.seniorAdvice) {
    drawCalloutBox(
      ctx,
      'SENIOR BUDDY EXAM ADVICE:',
      summary.seniorAdvice,
      [254, 243, 199],
      [245, 158, 11],
      [146, 64, 14]
    );
  }

  // 1. Short 5-Point Summary
  if (summary.shortSummary && summary.shortSummary.length > 0) {
    drawSectionHeading(ctx, '1. HIGH-YIELD 5-POINT SUMMARY (QUICK REVISION)', '⚡');
    summary.shortSummary.forEach((pt, idx) => {
      const bulletText = `${idx + 1}. ${pt}`;
      const split = doc.splitTextToSize(bulletText, contentWidth - 6);
      checkPageBreak(ctx, split.length * 4.5 + 3);

      doc.setFontSize(9);
      doc.setTextColor(35, 35, 45);
      doc.text(split, margin + 3, ctx.currentY);
      ctx.currentY += split.length * 4.5 + 2.5;
    });
    ctx.currentY += 3;
  }

  // 2. Detailed Summary
  if (summary.detailedSummary) {
    drawSectionHeading(ctx, '2. DETAILED CHAPTER NOTES & CONCEPTS', '📖');
    const paragraphs = summary.detailedSummary.split('\n\n');
    paragraphs.forEach((p) => {
      const cleanP = p.replace(/\*\*/g, '').trim();
      if (!cleanP) return;
      const split = doc.splitTextToSize(cleanP, contentWidth - 4);
      checkPageBreak(ctx, split.length * 4.5 + 3);

      doc.setFontSize(8.8);
      doc.setTextColor(40, 40, 50);
      doc.text(split, margin + 2, ctx.currentY);
      ctx.currentY += split.length * 4.5 + 3;
    });
    ctx.currentY += 2;
  }

  // 3. Key Definitions & Formulas
  const hasDefs = summary.definitions && summary.definitions.length > 0;
  const hasForms = summary.formulas && summary.formulas.length > 0;

  if (hasDefs || hasForms) {
    drawSectionHeading(ctx, '3. KEY DEFINITIONS & IMPORTANT FORMULAS', '🔬');

    if (hasDefs) {
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 30);
      doc.text('Key Definitions to Memorize:', margin + 2, ctx.currentY);
      ctx.currentY += 5;

      summary.definitions?.forEach((def) => {
        const teluguAddon = def.teluguMeaning ? ` (${def.teluguMeaning})` : '';
        const split = doc.splitTextToSize(`• ${def.term}${teluguAddon}: ${def.definition}`, contentWidth - 8);
        checkPageBreak(ctx, split.length * 4.2 + 2);

        doc.setFontSize(8.5);
        doc.setTextColor(50, 50, 60);
        doc.text(split, margin + 4, ctx.currentY);
        ctx.currentY += split.length * 4.2 + 2;
      });
      ctx.currentY += 3;
    }

    if (hasForms) {
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 30);
      doc.text('Formulas & Explanations:', margin + 2, ctx.currentY);
      ctx.currentY += 5;

      summary.formulas?.forEach((form) => {
        const split = doc.splitTextToSize(`• ${form.name}: ${form.formula} — ${form.explanation}`, contentWidth - 8);
        checkPageBreak(ctx, split.length * 4.2 + 2);

        doc.setFontSize(8.5);
        doc.setTextColor(30, 64, 175);
        doc.text(split, margin + 4, ctx.currentY);
        ctx.currentY += split.length * 4.2 + 2;
      });
      ctx.currentY += 3;
    }
  }

  // 4. Important Dates & Events (if available)
  if (summary.keyDates && summary.keyDates.length > 0) {
    drawSectionHeading(ctx, '4. KEY TIMELINES & IMPORTANT DATES', '📅');
    summary.keyDates.forEach((kd) => {
      const split = doc.splitTextToSize(`• ${kd.dateOrPeriod}: ${kd.event} — ${kd.significance}`, contentWidth - 8);
      checkPageBreak(ctx, split.length * 4.2 + 2);
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 60);
      doc.text(split, margin + 4, ctx.currentY);
      ctx.currentY += split.length * 4.2 + 2;
    });
    ctx.currentY += 3;
  }

  // 5. High-Yield Exam-Ready Q&A
  if (summary.examReadyQA && summary.examReadyQA.length > 0) {
    drawSectionHeading(ctx, '5. HIGH-YIELD EXAM-READY Q&A (MODEL ANSWERS)', '🎯');

    summary.examReadyQA.forEach((qa, idx) => {
      checkPageBreak(ctx, 22);

      // Question box
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, ctx.currentY, contentWidth, 7, 1, 1, 'F');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const marksBadge = qa.marks ? ` [${qa.marks} Marks]` : '';
      doc.text(`Q${idx + 1}. ${qa.question}${marksBadge}`, margin + 3, ctx.currentY + 5);
      ctx.currentY += 10;

      // Model Answer
      const splitAns = doc.splitTextToSize(`Ans: ${qa.modelAnswer}`, contentWidth - 8);
      checkPageBreak(ctx, splitAns.length * 4.2 + 2);
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(splitAns, margin + 4, ctx.currentY);
      ctx.currentY += splitAns.length * 4.2 + 2;

      // Scoring tip
      if (qa.scoringTip) {
        const splitTip = doc.splitTextToSize(`💡 Scoring Tip: ${qa.scoringTip}`, contentWidth - 8);
        checkPageBreak(ctx, splitTip.length * 4 + 2);
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9);
        doc.text(splitTip, margin + 4, ctx.currentY);
        ctx.currentY += splitTip.length * 4 + 3;
      }

      ctx.currentY += 2;
    });
  }

  // 6. Tip to score more
  if (summary.tipToScoreMore) {
    drawCalloutBox(
      ctx,
      'EXAMINER SECRET TO SCORE FULL MARKS:',
      summary.tipToScoreMore,
      [240, 253, 244],
      [34, 197, 94],
      [22, 101, 52]
    );
  }

  // Draw final footer
  drawFooter(ctx);

  const cleanName = (summary.title || 'EduSpark_Notes')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 35);
  doc.save(filename || `${cleanName}_Notes.pdf`);
}

/**
 * 2. Export Quiz & Question Paper to PDF
 */
export function exportQuizToPDF(quiz: QuizData, includeAnswers: boolean = true, filename?: string) {
  const ctx = initPDF();
  const { doc, margin, contentWidth } = ctx;

  const shortCount = quiz.shortAnswers ? quiz.shortAnswers.length : 0;
  const longCount = quiz.longAnswer ? 1 : 0;

  // Header
  drawMainHeader(
    ctx,
    `${quiz.subject || 'Assessment'} • Practice Worksheet`,
    quiz.title || 'Diagnostic Chapter Quiz',
    `Questions: ${quiz.mcqs?.length || 0} MCQs, ${shortCount} Short, ${longCount} Long • Difficulty: ${quiz.difficultySummary || 'Standard'}`,
    [79, 70, 229] // Indigo
  );

  // Senior Tip
  if (quiz.seniorTip) {
    drawCalloutBox(
      ctx,
      'EXAM STRATEGY & TIME MANAGEMENT:',
      quiz.seniorTip,
      [238, 242, 255],
      [99, 102, 241],
      [67, 56, 202]
    );
  }

  // SECTION A: 5 MCQs
  if (quiz.mcqs && quiz.mcqs.length > 0) {
    drawSectionHeading(ctx, 'SECTION A: MULTIPLE CHOICE QUESTIONS (1 Mark Each)', '🔘');

    quiz.mcqs.forEach((mcq, idx) => {
      checkPageBreak(ctx, 28);

      // Question
      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      const splitQ = doc.splitTextToSize(`Q${idx + 1}. ${mcq.question} (${mcq.difficulty || 'Med'})`, contentWidth - 4);
      doc.text(splitQ, margin + 2, ctx.currentY);
      ctx.currentY += splitQ.length * 4.5 + 2;

      // 4 Options
      const optionLetters = ['A', 'B', 'C', 'D'];
      mcq.options.forEach((opt, optIdx) => {
        checkPageBreak(ctx, 6);
        const isCorrect = optIdx === mcq.correctOptionIndex;
        let optPrefix = `[  ] (${optionLetters[optIdx]}) `;

        if (includeAnswers && isCorrect) {
          doc.setTextColor(16, 185, 129); // Green
          optPrefix = `[✓] (${optionLetters[optIdx]}) `;
        } else {
          doc.setTextColor(75, 85, 99);
        }

        doc.setFontSize(8.5);
        doc.text(`${optPrefix}${opt}`, margin + 5, ctx.currentY);
        ctx.currentY += 4.5;
      });

      // Explanation if enabled
      if (includeAnswers && mcq.explanation) {
        checkPageBreak(ctx, 10);
        doc.setFontSize(8);
        doc.setTextColor(124, 58, 237);
        const splitExp = doc.splitTextToSize(`Explanation: ${mcq.explanation}`, contentWidth - 10);
        doc.text(splitExp, margin + 6, ctx.currentY);
        ctx.currentY += splitExp.length * 3.8 + 2;
      }

      ctx.currentY += 3;
    });
  }

  // SECTION B: Short Answer Questions
  if (quiz.shortAnswers && quiz.shortAnswers.length > 0) {
    drawSectionHeading(ctx, 'SECTION B: SHORT ANSWER QUESTIONS (3 Marks Each)', '📝');
    quiz.shortAnswers.forEach((sq, idx) => {
      checkPageBreak(ctx, 20);

      doc.setFontSize(9);
      doc.setTextColor(17, 24, 39);
      const splitQ = doc.splitTextToSize(`Q${idx + 1}. ${sq.question} [${sq.maxMarks || 3} Marks]`, contentWidth - 4);
      doc.text(splitQ, margin + 2, ctx.currentY);
      ctx.currentY += splitQ.length * 4.5 + 2;

      if (includeAnswers && sq.modelAnswer) {
        const splitAns = doc.splitTextToSize(`Model Answer: ${sq.modelAnswer}`, contentWidth - 8);
        checkPageBreak(ctx, splitAns.length * 4 + 2);
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 81);
        doc.text(splitAns, margin + 4, ctx.currentY);
        ctx.currentY += splitAns.length * 4 + 2;

        if (sq.keyPointsNeeded && sq.keyPointsNeeded.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(124, 58, 237);
          doc.text(`Key Points Needed: ${sq.keyPointsNeeded.join(' • ')}`, margin + 4, ctx.currentY);
          ctx.currentY += 4.5;
        }
      } else {
        // Space to write
        ctx.currentY += 12;
      }
      ctx.currentY += 3;
    });
  }

  // SECTION C: Long Answer Question
  if (quiz.longAnswer) {
    drawSectionHeading(ctx, 'SECTION C: LONG ANSWER / ESSAY QUESTION (5 Marks)', '🏆');
    const lq = quiz.longAnswer;
    checkPageBreak(ctx, 25);

    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    const splitQ = doc.splitTextToSize(`Q1. ${lq.question} [${lq.maxMarks || 5} Marks]`, contentWidth - 4);
    doc.text(splitQ, margin + 2, ctx.currentY);
    ctx.currentY += splitQ.length * 4.5 + 2;

    if (includeAnswers && lq.modelAnswer) {
      const splitAns = doc.splitTextToSize(`Model Answer: ${lq.modelAnswer}`, contentWidth - 8);
      checkPageBreak(ctx, splitAns.length * 4 + 2);
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      doc.text(splitAns, margin + 4, ctx.currentY);
      ctx.currentY += splitAns.length * 4 + 2;

      if (lq.evaluationRubric && lq.evaluationRubric.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(217, 119, 6);
        doc.text(`Scoring Rubric: ${lq.evaluationRubric.join(' | ')}`, margin + 4, ctx.currentY);
        ctx.currentY += 4.5;
      }
    } else {
      ctx.currentY += 20;
    }
    ctx.currentY += 3;
  }

  drawFooter(ctx);

  const cleanName = (quiz.title || 'EduSpark_Quiz')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 35);
  doc.save(filename || `${cleanName}_QuizPaper.pdf`);
}

/**
 * 3. Export Assignment Evaluation Report to PDF
 */
export function exportEvaluationToPDF(evalResult: AssignmentEvaluationResult, filename?: string) {
  const ctx = initPDF();
  const { doc, margin, contentWidth } = ctx;

  // Header
  drawMainHeader(
    ctx,
    `${evalResult.subject} • Evaluation Report`,
    evalResult.assignmentTitle || 'Assignment Assessment Report',
    `Overall Grade: ${evalResult.grade} • Score: ${evalResult.totalMarksAwarded} / ${evalResult.totalMaxMarks} Marks (${evalResult.percentage}%)`,
    [16, 185, 129] // Emerald
  );

  // Senior Teacher Review
  if (evalResult.overallSeniorReview) {
    drawCalloutBox(
      ctx,
      'SENIOR TEACHER REVIEW:',
      evalResult.overallSeniorReview,
      [236, 253, 245],
      [16, 185, 129],
      [6, 78, 59]
    );
  }

  // Motivation Message
  if (evalResult.motivationMessage) {
    drawCalloutBox(
      ctx,
      'MOTIVATION & NEXT STEPS:',
      evalResult.motivationMessage,
      [254, 243, 199],
      [245, 158, 11],
      [146, 64, 14]
    );
  }

  // Question-by-Question breakdown
  drawSectionHeading(ctx, 'QUESTION-BY-QUESTION EVALUATION (10 Marks Each)', '📝');

  evalResult.questionEvaluations.forEach((q) => {
    checkPageBreak(ctx, 32);

    // Question header with marks
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, ctx.currentY, contentWidth, 7, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${q.questionNumber}: ${q.questionText.slice(0, 70)}...`, margin + 3, ctx.currentY + 5);

    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105);
    doc.text(`[${q.marksAwarded} / 10 Marks]`, margin + contentWidth - 32, ctx.currentY + 5);
    ctx.currentY += 9;

    // Student answer excerpt if present
    if (q.studentAnswerText) {
      const splitExcerpt = doc.splitTextToSize(`Student Answer: "${q.studentAnswerText}"`, contentWidth - 8);
      checkPageBreak(ctx, splitExcerpt.length * 3.8 + 2);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(splitExcerpt, margin + 4, ctx.currentY);
      ctx.currentY += splitExcerpt.length * 3.8 + 2;
    }

    // What's Good
    if (q.whatIsGood) {
      const splitGood = doc.splitTextToSize(`👍 What's Good: ${q.whatIsGood}`, contentWidth - 8);
      checkPageBreak(ctx, splitGood.length * 3.8 + 2);
      doc.setFontSize(8.2);
      doc.setTextColor(22, 101, 52);
      doc.text(splitGood, margin + 4, ctx.currentY);
      ctx.currentY += splitGood.length * 3.8 + 2;
    }

    // What to Improve
    if (q.whatToImprove) {
      const splitImprove = doc.splitTextToSize(`💡 What to Improve: ${q.whatToImprove}`, contentWidth - 8);
      checkPageBreak(ctx, splitImprove.length * 3.8 + 2);
      doc.setFontSize(8.2);
      doc.setTextColor(180, 83, 9);
      doc.text(splitImprove, margin + 4, ctx.currentY);
      ctx.currentY += splitImprove.length * 3.8 + 2;
    }

    // Model answer
    if (q.suggestedBetterAnswer) {
      const splitModel = doc.splitTextToSize(`⭐ Model 10/10 Answer: ${q.suggestedBetterAnswer}`, contentWidth - 8);
      checkPageBreak(ctx, splitModel.length * 3.8 + 2);
      doc.setFontSize(8.2);
      doc.setTextColor(30, 58, 138);
      doc.text(splitModel, margin + 4, ctx.currentY);
      ctx.currentY += splitModel.length * 3.8 + 2;
    }

    ctx.currentY += 3;
  });

  // Action items to boost score
  if (evalResult.keyActionItemsToScoreMore && evalResult.keyActionItemsToScoreMore.length > 0) {
    drawSectionHeading(ctx, 'TOP ACTION ITEMS TO SCORE MORE MARKS', '📈');
    evalResult.keyActionItemsToScoreMore.forEach((item, i) => {
      const split = doc.splitTextToSize(`${i + 1}. ${item}`, contentWidth - 6);
      checkPageBreak(ctx, split.length * 4 + 2);
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(split, margin + 3, ctx.currentY);
      ctx.currentY += split.length * 4 + 2;
    });
  }

  drawFooter(ctx);

  const cleanName = (evalResult.assignmentTitle || 'EduSpark_Evaluation')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 35);
  doc.save(filename || `${cleanName}_Report.pdf`);
}
