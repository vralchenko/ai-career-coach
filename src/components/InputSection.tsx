import React from 'react';
import { Upload, Link as LinkIcon, X, FileText } from 'lucide-react';

interface InputSectionProps {
    file: File | null;
    setFile: (file: File | null) => void;
    jobUrl: string;
    setJobUrl: (url: string) => void;
    loading: boolean;
    onStart: () => void;
    t: any;
}

export const InputSection: React.FC<InputSectionProps> = ({
                                                              file, setFile, jobUrl, setJobUrl, loading, onStart
                                                          }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative group overflow-hidden">
                {file && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="absolute top-4 right-4 z-20 p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
                <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`flex flex-col items-center justify-center gap-3 py-4 border-2 border-dashed rounded-2xl transition-colors ${file ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 group-hover:border-indigo-500'}`}>
                    {file ? <FileText className="w-8 h-8 text-emerald-500" /> : <Upload className="w-8 h-8 text-slate-400" />}
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter px-4 text-center truncate w-full">
            {file ? file.name : 'Upload Resume (PDF)'}
          </span>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                <div className="relative flex items-center">
                    <LinkIcon className="absolute left-4 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Job URL..."
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                    />
                    {jobUrl && (
                        <button
                            onClick={() => setJobUrl('')}
                            className="absolute right-4 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <button
                    onClick={onStart}
                    disabled={loading || !file || !jobUrl}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                >
                    {loading ? 'Analyzing...' : 'Analyze Now'}
                </button>
            </div>
        </div>
    );
};