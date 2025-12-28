'use client';

import { Upload, Link as LinkIcon, Sparkles, X, FileText } from 'lucide-react';
import { useState } from 'react';

interface InputSectionProps {
    file: File | null;
    setFile: (file: File | null) => void;
    setResumeText: (text: string) => void;
    jobUrl: string;
    setJobUrl: (url: string) => void;
    loading: boolean;
    onStart: () => void;
    onTailor: () => void;
    t: any;
}

export function InputSection({ file, setFile, setResumeText, jobUrl, setJobUrl, loading, onStart, onTailor, t }: InputSectionProps) {
    const [isParsing, setIsParsing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (selectedFile && typeof window !== 'undefined') {
            setIsParsing(true);
            try {
                const pdfjs = await import('pdfjs-dist');
                pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                const arrayBuffer = await selectedFile.arrayBuffer();
                const loadingTask = pdfjs.getDocument({ data: arrayBuffer, useWorkerFetch: true, isEvalSupported: false });
                const pdf = await loadingTask.promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const strings = content.items.map((item: any) => item.str);
                    fullText += strings.join(' ') + '\n';
                }
                setResumeText(fullText);
            } catch (error) {
                setResumeText('');
            } finally {
                setIsParsing(false);
            }
        } else {
            setResumeText('');
        }
    };

    return (
        <section className="flex flex-col gap-1.5 w-full">
            <div className="relative w-full group overflow-hidden px-0.5">
                <div className="absolute inset-y-0 left-2.5 pl-3 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon size={14} />
                </div>
                <input
                    type="text"
                    placeholder={t.jobUrlPlaceholder}
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="w-full h-10 bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-lg lg:rounded-xl pl-10 pr-10 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none transition-all dark:text-white shadow-sm"
                />
                {jobUrl && (
                    <button onClick={() => setJobUrl('')} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 px-0.5">
                <div className="relative w-full">
                    <label className={`flex items-center justify-center h-10 w-full rounded-lg lg:rounded-xl border border-dashed transition-all cursor-pointer ${file ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111114] hover:border-indigo-500'}`}>
                        <div className="flex items-center gap-2 px-3 pr-8 overflow-hidden">
                            <Upload className={`w-3.5 h-3.5 flex-shrink-0 ${file ? 'text-emerald-500' : 'text-slate-400'}`} />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 truncate">{isParsing ? "Reading..." : (file ? file.name : t.uploadResume)}</p>
                        </div>
                        <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                    </label>
                    {file && (
                        <button onClick={(e) => { e.preventDefault(); setFile(null); setResumeText(''); }} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <button
                    onClick={onStart}
                    disabled={loading || !file || !jobUrl || isParsing}
                    className={`h-10 rounded-lg lg:rounded-xl font-black uppercase tracking-[0.1em] text-[9px] flex items-center justify-center gap-2 transition-all ${loading || !file || !jobUrl || isParsing ? 'bg-slate-100 dark:bg-[#1a1a20] text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-95'}`}
                >
                    <Sparkles size={14} />
                    {loading ? "..." : t.analyzeBtn}
                </button>

                <button
                    onClick={onTailor}
                    disabled={loading || !file || !jobUrl || isParsing}
                    className={`h-10 rounded-lg lg:rounded-xl font-black uppercase tracking-[0.1em] text-[9px] flex items-center justify-center gap-2 transition-all ${loading || !file || !jobUrl || isParsing ? 'bg-slate-100 dark:bg-[#1a1a20] text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95'}`}
                >
                    <FileText size={14} />
                    {loading ? "..." : "Tailor CV"}
                </button>
            </div>
        </section>
    );
}