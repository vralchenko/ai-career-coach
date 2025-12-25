'use client';

import React from 'react';
import { Copy, Sparkles, FileSearch, FileDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface OutputAreaProps {
    report: string;
    loading: boolean;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    onCopy: () => void;
    onDownloadPdf: () => void;
    t: any;
}

export const OutputArea: React.FC<OutputAreaProps> = ({
                                                          report, loading, scrollRef, onCopy, onDownloadPdf, t
                                                      }) => {
    return (
        <div className="bg-white dark:bg-[#111114] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-[#16161a]">
                <div className="flex items-center gap-2">
                    <FileSearch size={16} className="text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {t.analysisResult}
          </span>
                </div>
                <div className="flex items-center gap-2">
                    {report && (
                        <>
                            <button onClick={onCopy} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border dark:border-slate-700 text-[10px] font-bold uppercase hover:border-indigo-500 transition-all shadow-sm">
                                <Copy size={12} /> {t.copyReport}
                            </button>
                            <button onClick={onDownloadPdf} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-bold uppercase hover:bg-indigo-700 transition-all shadow-md">
                                <FileDown size={12} /> {t.downloadPdf}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar" ref={scrollRef}>
                {!report && !loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-40">
                        <Sparkles size={40} />
                        <p className="text-xs font-bold uppercase tracking-widest">{t.waitingForInput}</p>
                    </div>
                ) : (
                    <div className="max-w-none text-slate-900 dark:text-slate-200">
                        <ReactMarkdown
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight mb-4 mt-2 border-b pb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-xl font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-tight mb-2 mt-6 flex items-center gap-2" {...props} />,
                                p: ({node, ...props}) => <p className="leading-relaxed mb-3 text-sm" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm" {...props} />,
                                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-black text-indigo-600 dark:text-indigo-400" {...props} />,
                            }}
                        >
                            {report}
                        </ReactMarkdown>
                        {loading && <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse" />}
                    </div>
                )}
            </div>
        </div>
    );
};