import React from 'react';
import { SAMPLE_TOPICS, SampleTopic } from '../data/sampleCurriculum';
import { BookOpen, X, Sparkles, ArrowRight, Zap, FileText, HelpCircle, CheckSquare } from 'lucide-react';
import { SuperpowerTab } from '../types';

interface SampleNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: SampleTopic, targetSuperpower: SuperpowerTab) => void;
}

export const SampleNotesModal: React.FC<SampleNotesModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-zinc-800/90 flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800/80 flex items-center justify-between bg-[#121215]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-zinc-100 font-heading">
                Indian Curriculum Sample Topics 📚
              </h3>
              <p className="text-xs text-zinc-400">
                1-Click preloaded high-yield chapters for instant testing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topics List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {SAMPLE_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {topic.classLevel}
                    </span>
                    <span className="text-xs text-zinc-600">•</span>
                    <span className="text-xs font-semibold text-zinc-400">{topic.subject}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-zinc-100">{topic.title}</h4>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                  {topic.tag}
                </span>
              </div>

              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {topic.notesText.slice(0, 180)}...
              </p>

              {/* Action Buttons for all 3 Superpowers */}
              <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    onSelectTopic(topic, 'summarizer');
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Summarize Notes</span>
                </button>

                <button
                  onClick={() => {
                    onSelectTopic(topic, 'quiz');
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Generate Quiz</span>
                </button>

                {topic.sampleQuestionPaper && (
                  <button
                    onClick={() => {
                      onSelectTopic(topic, 'evaluator');
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Evaluate Assignment</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
