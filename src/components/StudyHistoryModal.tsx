import React from 'react';
import { SavedItem, SuperpowerTab } from '../types';
import { History, X, Trash2, FileText, HelpCircle, CheckSquare, ArrowRight, ExternalLink } from 'lucide-react';

interface StudyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onLoadItem: (item: SavedItem) => void;
}

export const StudyHistoryModal: React.FC<StudyHistoryModalProps> = ({
  isOpen,
  onClose,
  savedItems,
  onDeleteItem,
  onClearAll,
  onLoadItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-zinc-800/90 flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800/80 flex items-center justify-between bg-[#121215]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-zinc-100 font-heading">
                Saved Study Sessions 🗂️
              </h3>
              <p className="text-xs text-zinc-400">
                {savedItems.length} saved summaries, quizzes & evaluation reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedItems.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-rose-400 font-bold hover:bg-rose-950/40 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of saved items */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {savedItems.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <History className="w-12 h-12 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-300">No saved study sessions yet.</p>
              <p className="text-xs text-zinc-500">
                When you summarize notes or generate quizzes, click "Save" to keep them here!
              </p>
            </div>
          ) : (
            savedItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                      item.type === 'summary'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : item.type === 'quiz'
                        ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    }`}
                  >
                    {item.type === 'summary' ? (
                      <FileText className="w-4 h-4" />
                    ) : item.type === 'quiz' ? (
                      <HelpCircle className="w-4 h-4" />
                    ) : (
                      <CheckSquare className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
                        {item.type}
                      </span>
                      <span className="text-[10px] text-zinc-600">•</span>
                      <span className="text-[10px] text-zinc-500">{item.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100 truncate">{item.title}</h4>
                    <span className="text-xs text-zinc-400 truncate block">{item.subject}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onLoadItem(item);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 transition-colors cursor-pointer"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
