'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';
import { InputSection } from '@/components/InputSection';
import { OutputArea } from '@/components/OutputArea';
import { useTranslation } from '@/hooks/useTranslation';
import RobotIcon from '../components/RobotIcon';
import { Sun, Moon, CheckCircle, Menu, X } from 'lucide-react';

export default function Home() {
  const { t, lang, setLang } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
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
    if (!report || pdfLoading) return;
    setPdfLoading(true);
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: report, lang }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const metaMatch = report.match(/COMPANY:\s*(.*?)\s*\|\s*POSITION:\s*(.*)$/m);
        a.download = metaMatch
            ? `${metaMatch[1]}_${metaMatch[2]}.pdf`.replace(/\s+/g, '_')
            : 'Analysis_Report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleStart = async () => {
    if (!file || !jobUrl) return;
    setLoading(true);
    setReport('');
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobUrl', jobUrl);
    formData.append('language', lang);

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      if (!res.ok) return;

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
            if (trimmedLine.startsWith('data: ')) {
              try {
                const jsonString = trimmedLine.replace('data: ', '');
                const data = JSON.parse(jsonString);
                const content = data.choices[0]?.delta?.content || "";
                fullText += content;
                setReport(fullText);
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              } catch (e) {
                console.warn("Stream error", e);
              }
            }
          }
        }

        const metaMatch = fullText.match(/COMPANY:\s*(.*?)\s*\|\s*POSITION:\s*(.*)$/m);
        const historyItem = {
          id: Date.now(),
          date: new Date().toLocaleString(),
          title: metaMatch ? `${metaMatch[1]} - ${metaMatch[2]}`.toUpperCase() : t.analysisReportTitle,
          url: jobUrl,
          report: fullText
        };
        const existing = JSON.parse(localStorage.getItem('analysis_history') || '[]');
        localStorage.setItem('analysis_history', JSON.stringify([historyItem, ...existing].slice(0, 20)));
        window.dispatchEvent(new Event('history_updated'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
      <div className="flex h-screen bg-slate-50 dark:bg-[#08080a] overflow-hidden relative font-sans">
        <div className={`
          fixed inset-0 z-50 lg:relative lg:inset-auto lg:flex
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
        `}>
          <Sidebar t={t} onSelect={(rep, url) => { setReport(rep); setJobUrl(url); setIsSidebarOpen(false); }} />
          {isSidebarOpen && (
              <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white dark:bg-[#111114] rounded-full lg:hidden shadow-lg border dark:border-slate-800"
              >
                <X size={24} />
              </button>
          )}
        </div>

        {copied && (
            <div className="fixed top-4 lg:top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <CheckCircle size={14} />
              <span className="text-[10px] lg:text-xs font-bold uppercase">{t.copied}</span>
            </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 lg:p-6 custom-scrollbar relative">
          <div className="max-w-4xl mx-auto flex flex-col gap-4 lg:gap-6">
            <header className="flex justify-between items-center bg-white dark:bg-[#111114] p-3 lg:p-5 rounded-2xl lg:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 lg:gap-4">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 lg:hidden text-slate-600 dark:text-slate-400"
                >
                  <Menu size={20} />
                </button>
                <h1 className="text-base lg:text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-tight leading-none">
                  {t.brandName}
                </h1>
                {loading && <RobotIcon className="w-6 h-6 lg:w-8 lg:h-8 text-indigo-500 animate-spin" />}
              </div>

              <div className="flex items-center gap-2 lg:gap-3">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 lg:p-2.5 rounded-xl lg:rounded-2xl bg-slate-100 dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-yellow-400 shadow-sm hover:scale-105 transition-transform"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="bg-slate-100 dark:bg-[#1a1a20] border border-slate-200 dark:border-slate-700 px-2 lg:px-4 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs font-black uppercase text-slate-900 dark:text-white outline-none cursor-pointer"
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