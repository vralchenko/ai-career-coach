'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, FileDown, Loader2, User } from 'lucide-react';

export function OutputArea({ report, loading, pdfLoading, scrollRef, onCopy, onDownloadPdf, userFile }: any) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (userFile && userFile.type.startsWith('image/')) {
            const url = URL.createObjectURL(userFile);
            setImagePreview(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [userFile]);

    const renderContent = () => {
        const parts = report.split('[USER_PHOTO_HERE]');
        return (
            <div className="prose dark:prose-invert max-w-none text-[12px] leading-relaxed font-sans">
                {report.includes('[USER_PHOTO_HERE]') && (
                    <div className="mb-4 flex justify-start">
                        <div className="w-[140px] h-[170px] bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-white dark:border-slate-700 shadow-lg overflow-hidden flex items-center justify-center relative">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-2">
                                    <User size={24} className="mx-auto mb-1 text-slate-300" />
                                    <p className="text-[7px] text-slate-400 font-bold uppercase leading-tight">Photo will be extracted</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className="markdown-content">
                    <ReactMarkdown>{parts.length > 1 ? parts[1] : parts[0]}</ReactMarkdown>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-2 px-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#16161a]">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Content View</span>
                <div className="flex gap-2">
                    <button
                        onClick={onCopy}
                        disabled={!report || loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1a1a20] hover:bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Copy size={13} className="text-slate-500 group-hover:text-indigo-500 group-disabled:text-slate-300" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 group-disabled:text-slate-400">Copy Report</span>
                    </button>
                    <button
                        onClick={onDownloadPdf}
                        disabled={!report || pdfLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-md disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                        Download
                    </button>
                </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                {loading && !report ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                        <p className="text-[9px] font-black uppercase tracking-widest animate-pulse">Processing...</p>
                    </div>
                ) : (
                    renderContent()
                )}
            </div>
        </div>
    );
}