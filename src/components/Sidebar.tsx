'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink, X } from 'lucide-react';

interface HistoryItem {
    id: number;
    date: string;
    title: string;
    url: string;
    report: string;
}

interface SidebarProps {
    onSelect: (report: string, url: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const loadHistory = () => {
        const saved = localStorage.getItem('analysis_history');
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    };

    useEffect(() => {
        loadHistory();
        window.addEventListener('history_updated', loadHistory);
        return () => window.removeEventListener('history_updated', loadHistory);
    }, []);

    const deleteItem = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const updated = history.filter(item => item.id !== id);
        localStorage.setItem('analysis_history', JSON.stringify(updated));
        setHistory(updated);
    };

    const clearHistory = () => {
        localStorage.removeItem('analysis_history');
        setHistory([]);
    };

    return (
        <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d0d0f] flex flex-col h-full transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">History</span>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={clearHistory}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 opacity-20 italic text-sm">
                        No history yet
                    </div>
                ) : (
                    history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item.report, item.url)}
                            className="group relative p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#141417] hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer transition-all hover:shadow-md"
                        >
                            <button
                                onClick={(e) => deleteItem(e, item.id)}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white dark:bg-[#1e1e24] text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all border border-slate-200 dark:border-slate-700 shadow-sm z-10"
                            >
                                <X size={12} />
                            </button>

                            <div className="pr-6">
                                <span className="text-[10px] text-slate-400 block mb-1 font-medium">{item.date}</span>
                                <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-tight uppercase tracking-tight mb-2">
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
                                    <ExternalLink size={10} />
                                    <span className="text-[10px] font-bold truncate opacity-80">
                    {item.url.replace('https://', '').split('/')[0]}
                  </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};