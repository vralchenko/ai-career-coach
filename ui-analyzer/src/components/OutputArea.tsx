import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PdfService } from '@/lib/pdf.service';

export const OutputArea: React.FC<{ report: string; loading: boolean; scrollRef: React.RefObject<HTMLDivElement | null>; onCopy: () => void }> = ({ report, loading, scrollRef, onCopy }) => {
    const [matchPercent, setMatchPercent] = useState<number>(0);

    useEffect(() => {
        const scoreMatch = report.match(/Match Score:\s*(\d+)/i);
        if (scoreMatch) setMatchPercent(parseInt(scoreMatch[1]));
    }, [report]);

    if (!report && !loading) return null;

    const handleDownload = () => {
        const metaMatch = report.match(/COMPANY:\s*(.*?)\s*\|\s*POSITION:\s*(.*)$/m);
        const company = metaMatch ? metaMatch[1] : "Company";
        const position = metaMatch ? metaMatch[2] : "Position";
        PdfService.download(scrollRef.current, company, position);
    };

    const cleanReport = report
        .replace(/^#\s*COMPANY:.*$/m, '') 
        .replace(/Match Score:\s*\d+%/i, '') 
        .trim();

    return (
        <div className="bg-white dark:bg-[#111114] rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl transition-colors">
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-[#16161a]">
                <div />
                <div className="flex gap-2">
                    {!loading && report && (
                        <>
                            <button onClick={onCopy} className="text-[10px] font-bold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white uppercase tracking-wider">Copy</button>
                            <button onClick={handleDownload} className="text-[10px] font-bold bg-indigo-600 text-white px-4 py-1.5 rounded-xl hover:bg-indigo-700 uppercase tracking-wider transition-all">PDF</button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row bg-white dark:bg-[#111114]">
                {matchPercent > 0 && (
                    <div className="p-6 flex flex-col items-center justify-start border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 min-w-35">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                                <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                                        strokeDasharray={263.9}
                                        strokeDashoffset={263.9 - (263.9 * matchPercent) / 100}
                                        className="text-indigo-500 transition-all duration-500" strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-xl font-black text-slate-900 dark:text-white">{matchPercent}%</span>
                        </div>
                        <span className="text-[10px] font-black uppercase mt-3 opacity-40 text-slate-900 dark:text-white tracking-widest text-center">Match Score</span>
                    </div>
                )}

                <div ref={scrollRef} className="flex-1 p-8 custom-scrollbar max-h-175 overflow-y-auto">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h3: ({node: _node, ...props}) => <h3 className="text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-widest mt-6 mb-2" {...props} />,
                            p: ({node: _node, ...props}) => <p className="text-[13px] leading-relaxed mb-4 text-slate-700 dark:text-slate-300" {...props} />,
                            li: ({node: _node, ...props}) => <li className="text-[12px] mb-2 text-slate-700 dark:text-slate-300 list-none pl-4 border-l-2 border-indigo-500 bg-slate-50 dark:bg-white/3 py-2 rounded-r-lg break-inside-avoid" {...props} />,
                        }}
                    >
                        {cleanReport}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};