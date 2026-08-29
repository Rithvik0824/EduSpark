import { NotesSummaryResult, ConceptGraphData, ConceptGraphNode, ConceptGraphLink } from '../types';

/**
 * Builds an immediate, highly connected ConceptGraphData object directly from NotesSummaryResult
 */
export function buildConceptGraphFromSummary(summary: NotesSummaryResult): ConceptGraphData {
  const rootTitle = summary.title || summary.subject || 'Core Topic';
  const subjectName = summary.subject || 'General Study';

  const nodes: ConceptGraphNode[] = [];
  const links: ConceptGraphLink[] = [];

  // 1. Root Node
  const rootId = 'root-node';
  nodes.push({
    id: rootId,
    label: rootTitle,
    type: 'root',
    description: summary.detailedSummary
      ? summary.detailedSummary.slice(0, 160) + '...'
      : `Master concept node for ${rootTitle}`,
    group: 1,
    val: 30,
  });

  // Helper function to check word overlap
  const hasWordOverlap = (str1: string, str2: string): boolean => {
    const words1 = str1.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const words2 = str2.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    return words1.some((w) => words2.includes(w));
  };

  // 2. Core Takeaways / Key Concepts from shortSummary (up to 4)
  const conceptNodeIds: string[] = [];
  (summary.shortSummary || []).slice(0, 4).forEach((point, idx) => {
    const cId = `concept-${idx + 1}`;
    // Extract short label from point (first 4-6 words)
    const words = point.split(' ');
    const label = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');

    nodes.push({
      id: cId,
      label,
      type: 'concept',
      description: point,
      group: 2,
      val: 22,
    });
    conceptNodeIds.push(cId);

    // Link from Root -> Concept
    links.push({
      source: rootId,
      target: cId,
      relationship: 'key concept',
      value: 3,
    });
  });

  // Link consecutive concepts together as a flow
  for (let i = 0; i < conceptNodeIds.length - 1; i++) {
    links.push({
      source: conceptNodeIds[i],
      target: conceptNodeIds[i + 1],
      relationship: 'leads to',
      value: 2,
    });
  }

  // 3. Definitions
  const defNodeIds: string[] = [];
  (summary.definitions || []).slice(0, 5).forEach((def, idx) => {
    const dId = `def-${idx + 1}`;
    nodes.push({
      id: dId,
      label: def.term,
      type: 'definition',
      description: def.definition,
      extraInfo: def.teluguMeaning ? `Telugu: ${def.teluguMeaning}` : undefined,
      group: 3,
      val: 18,
    });
    defNodeIds.push(dId);

    // Link to root
    links.push({
      source: rootId,
      target: dId,
      relationship: 'defines',
      value: 2.5,
    });

    // Cross-link to related concepts if word overlap
    conceptNodeIds.forEach((cId) => {
      const cNode = nodes.find((n) => n.id === cId);
      if (cNode && hasWordOverlap(cNode.description || '', def.term + ' ' + def.definition)) {
        links.push({
          source: cId,
          target: dId,
          relationship: 'explained by',
          value: 1.5,
        });
      }
    });
  });

  // 4. Formulas / Laws
  const formulaNodeIds: string[] = [];
  (summary.formulas || []).slice(0, 4).forEach((form, idx) => {
    const fId = `formula-${idx + 1}`;
    nodes.push({
      id: fId,
      label: form.name || form.formula,
      type: 'formula',
      description: form.explanation,
      extraInfo: `Equation: ${form.formula}`,
      group: 4,
      val: 20,
    });
    formulaNodeIds.push(fId);

    // Link to root
    links.push({
      source: rootId,
      target: fId,
      relationship: 'calculates',
      value: 2.5,
    });

    // Cross link to definitions that match formula variables
    defNodeIds.forEach((dId) => {
      const dNode = nodes.find((n) => n.id === dId);
      if (dNode && hasWordOverlap(dNode.label + ' ' + (dNode.description || ''), form.name + ' ' + form.explanation)) {
        links.push({
          source: dId,
          target: fId,
          relationship: 'governed by',
          value: 2,
        });
      }
    });
  });

  // 5. Key Dates / Events
  (summary.keyDates || []).slice(0, 3).forEach((kd, idx) => {
    const kId = `event-${idx + 1}`;
    nodes.push({
      id: kId,
      label: kd.dateOrPeriod ? `${kd.dateOrPeriod}: ${kd.event.slice(0, 20)}...` : kd.event.slice(0, 25),
      type: 'event',
      description: `${kd.event} — ${kd.significance}`,
      extraInfo: kd.dateOrPeriod ? `Timeline: ${kd.dateOrPeriod}` : undefined,
      group: 5,
      val: 16,
    });

    links.push({
      source: rootId,
      target: kId,
      relationship: 'timeline milestone',
      value: 2,
    });
  });

  // 6. Exam Hotspots / Q&A Nodes
  (summary.examReadyQA || []).slice(0, 3).forEach((qa, idx) => {
    const qId = `exam-${idx + 1}`;
    nodes.push({
      id: qId,
      label: qa.question.length > 30 ? qa.question.slice(0, 28) + '...' : qa.question,
      type: 'exam_qa',
      description: `Model Answer: ${qa.modelAnswer.slice(0, 180)}...`,
      extraInfo: qa.scoringTip ? `Scoring Tip (${qa.marks} Marks): ${qa.scoringTip}` : `${qa.marks} Marks Question`,
      group: 6,
      val: 19,
    });

    links.push({
      source: rootId,
      target: qId,
      relationship: 'exam hotspot',
      value: 2.5,
    });

    // Link to matching formula or definition
    [...defNodeIds, ...formulaNodeIds].forEach((targetId) => {
      const targetNode = nodes.find((n) => n.id === targetId);
      if (targetNode && hasWordOverlap(targetNode.label + ' ' + (targetNode.description || ''), qa.question)) {
        links.push({
          source: qId,
          target: targetId,
          relationship: 'tests concept',
          value: 2,
        });
      }
    });
  });

  return {
    title: rootTitle,
    subject: subjectName,
    summaryInsights: `Interconnected force-directed concept structure for ${rootTitle} linking ${nodes.length} core definitions, laws, and exam targets.`,
    nodes,
    links,
  };
}
