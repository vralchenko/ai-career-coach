'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';
import { InputSection } from '@/components/InputSection';
import { OutputArea } from '@/components/OutputArea';
import { useTranslation } from '@/hooks/useTranslation';
import RobotIcon from '../components/RobotIcon';
import { Sun, Moon, CheckCircle } from 'lucide-react';

export default function Home() {
  const { t, lang, setLang } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = () => {
    if (!report) return;
    const cleanText = report
        .replace(/^#\s*COMPANY:.*$/m, '')
        .replace(/Match Score:\s*\d+%/i, '')
        .trim();

    navigator.clipboard.writeText(cleanText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPdf = async () => {
    if (!report) return;

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, lang }),
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const metaMatch = report.match(/COMPANY:\s*(.*?)\s*\|\s*POSITION:\s*(.*)$/m);
      const fileName = metaMatch
          ? `${metaMatch[1]}_${metaMatch[2]}.pdf`.replace(/\s+/g, '_')
          : 'Analysis_Report.pdf';

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Error downloading PDF:', e);
    }
  };

  const handleStart = async () => {
    if (!file || !jobUrl) return;
    setLoading(true);
    setReport('');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobUrl', jobUrl);
    formData.append('lang', lang);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullText += chunk;
          setReport(fullText);
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }

        const metaMatch = fullText.match(/COMPANY:\s*(.*?)\s*\|\s*POSITION:\s*(.*)$/m);
        const historyTitle = metaMatch
            ? `${metaMatch[1]} - ${metaMatch[2]}`
            : t.analysisReportTitle;

        const historyItem = {
          id: Date.now(),
          date: new Date().toLocaleString(),
          title: historyTitle.toUpperCase(),
          url: jobUrl,
          report: fullText
        };

        const existing = JSON.parse(localStorage.getItem('analysis_history') || '[]');
        localStorage.setItem(
            'analysis_history',
            JSON.stringify([historyItem, ...existing].slice(0, 20))
        );
        window.dispatchEvent(new Event('history_updated'));
      }
    } catch (e) {
      console.error('Analysis error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
      <div className="flex h-screen bg-slate-50 dark:bg-[#08080a] transition-colors overflow-hidden relative">
        <Sidebar t={t} onSelect={(rep, url) => { setReport(rep); setJobUrl(url); }} />

        {copied && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <CheckCircle size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">{t.copied}</span>
            </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <header className="flex justify-between items-center bg-white dark:bg-[#111114] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-black bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-tight leading-none">
                  {t.brandName}
                </h1>
                {loading && <RobotIcon className="w-8 h-8 text-indigo-500 animate-spin" />}
              </div>

              <div className="flex items-center gap-3">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-yellow-400 hover:scale-110 transition-all shadow-sm"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="bg-slate-100 dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-2xl text-xs font-black uppercase text-slate-900 dark:text-white cursor-pointer hover:border-indigo-500 shadow-sm transition-all outline-none"
                >
                  {['en', 'de', 'es', 'ru', 'uk'].map(l => (
                      <option key={l} value={l}>{l.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </header>

            <InputSection
                file={file}
                setFile={setFile}
                jobUrl={jobUrl}
                setJobUrl={setJobUrl}
                loading={loading}
                onStart={handleStart}
                t={t}
            />

            <OutputArea
                report={report}
                loading={loading}
                scrollRef={scrollRef}
                onCopy={handleCopy}
                onDownloadPdf={handleDownloadPdf}
                t={t}
            />
          </div>
        </main>
      </div>
  );
}