'use client';

import { Trash2, History, PlusCircle, X } from 'lucide-react';

interface SidebarProps {
    t: any;
    history: any[];
    onSelect: (report: string, url: string) => void;
    onDelete: (id: number) => void;
    onClearAll: () => void;
}

export function Sidebar({ t, history, onSelect, onDelete, onClearAll }: SidebarProps) {
    return (
        <div className="w-64 h-full bg-white dark:bg-[#111114] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                        <History size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={onClearAll}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all group"
                >
                    <PlusCircle size={14} className="text-slate-400 group-hover:text-indigo-500" />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">New Session</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-50">
                        <History size={24} className="mb-2 text-slate-300" />
                        <p className="text-[9px] font-bold uppercase tracking-tighter">No history yet</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="group relative flex items-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                onClick={() => onSelect(item.report, item.jobUrl)}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">
                                        {item.title}
                                    </p>
                                    <p className="text-[9px] text-slate-400 truncate mt-0.5">
                                        {item.jobUrl}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(item.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}