'use client';

import { Upload, Link as LinkIcon, Sparkles, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface InputSectionProps {
    file: File | null;
    setFile: (file: File | null) => void;
    setResumeText: (text: string) => void;
    jobUrl: string;
    setJobUrl: (url: string) => void;
    loading: boolean;
    onStart: () => void;
    t: any;
}

export function InputSection({ file, setFile, setResumeText, jobUrl, setJobUrl, loading, onStart, t }: InputSectionProps) {

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);

        if (selectedFile) {
            try {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                    useWorkerFetch: true,
                    isEvalSupported: false,
                });

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
                console.error("PDF parsing error:", error);
                setResumeText('');
            }
        } else {
            setResumeText('');
        }
    };

    return (
        <section className="flex flex-col gap-4 lg:gap-6">
            <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon size={18} />
                </div>
                <input
                    type="text"
                    placeholder={t.jobUrlPlaceholder}
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="w-full h-14 bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-3xl pl-12 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white shadow-sm"
                />
                {jobUrl && (
                    <button
                        onClick={() => setJobUrl('')}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                    <label className={`
                        flex items-center justify-center h-14 w-full 
                        rounded-2xl lg:rounded-3xl border-2 border-dashed transition-all cursor-pointer
                        ${file
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111114] hover:border-indigo-500'}
                    `}>
                        <div className="flex items-center gap-3 px-4 pr-10 overflow-hidden">
                            <Upload className={`w-5 h-5 flex-shrink-0 ${file ? 'text-emerald-500' : 'text-slate-400'}`} />
                            <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-slate-500 truncate">
                                {file ? file.name : t.uploadResume}
                            </p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={handleFileChange}
                        />
                    </label>
                    {file && (
                        <button
                            onClick={(e) => { e.preventDefault(); setFile(null); setResumeText(''); }}
                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                <button
                    onClick={onStart}
                    disabled={loading || !file || !jobUrl}
                    className={`
                        h-14 rounded-2xl lg:rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] lg:text-xs
                        flex items-center justify-center gap-3 transition-all
                        ${loading || !file || !jobUrl
                        ? 'bg-slate-100 dark:bg-[#1a1a20] text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 active:scale-95'}
                    `}
                >
                    <Sparkles size={18} className={loading ? "animate-spin" : ""} />
                    {loading ? t.analyzing : t.analyzeBtn}
                </button>
            </div>
        </section>
    );
}