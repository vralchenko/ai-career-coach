'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sidebar } from '@/components/Sidebar';
import { InputSection } from '@/components/InputSection';
import { OutputArea } from '@/components/OutputArea';
import { useTranslation } from '@/hooks/useTranslation';
import RobotIcon from '../components/RobotIcon';
import { Sun, Moon, Menu, Coins, Check } from 'lucide-react';

export default function Home() {
  const { t, lang } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sessionTokens, setSessionTokens] = useState<number>(0);
  const [showToast, setShowToast] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedTokens = localStorage.getItem('total_session_tokens');
    if (savedTokens) setSessionTokens(parseInt(savedTokens));
    const savedHistory = localStorage.getItem('cv_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const addToHistory = (newReport: string, url: string) => {
    const metaMatch = newReport.match(/# (.*?) \| COMPANY: (.*?) \| POSITION: (.*)$/m);
    const entry = {
      id: Date.now(),
      title: metaMatch ? `${metaMatch[2]} - ${metaMatch[3]}` : 'New Analysis',
      report: newReport,
      jobUrl: url,
      timestamp: new Date().toISOString()
    };
    const updatedHistory = [entry, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem('cv_history', JSON.stringify(updatedHistory));
  };

  const deleteHistoryItem = (id: number) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('cv_history', JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('cv_history');
    setIsConfirmOpen(false);
  };

  const handleCopy = () => {
    if (!report) return;
    const cleanText = report.replace('[USER_PHOTO_HERE]', '').trim();
    navigator.clipboard.writeText(cleanText).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    });
  };

  const handleDownloadPdf = async () => {
    if (!report || pdfLoading) return;
    setPdfLoading(true);
    try {
      let finalContent = report;
      const metaMatch = report.match(/# (.*?) \| COMPANY: (.*?) \| POSITION: (.*)$/m);
      const fileName = metaMatch
          ? `${metaMatch[1]}_${metaMatch[2]}_${metaMatch[3]}.pdf`.replace(/\s+/g, '_')
          : 'Resume.pdf';

      if (file && report.includes('[USER_PHOTO_HERE]')) {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        const photoHtml = `<img src="${base64}" style="width:150px;height:180px;object-fit:cover;border-radius:10px;margin-bottom:20px;"/>`;
        finalContent = report.replace('[USER_PHOTO_HERE]', photoHtml);
      }

      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: finalContent, lang }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
      }
    } catch (e) { console.error(e); } finally { setPdfLoading(false); }
  };

  const handleAction = async (mode: 'analyze' | 'tailor') => {
    if (!resumeText || !jobUrl) return;
    setLoading(true); setReport('');
    const formData = new FormData();
    formData.append('resume', resumeText);
    formData.append('jobUrl', jobUrl);
    formData.append('language', lang);
    formData.append('mode', mode);

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.substring(6).trim();
            if (raw === '[DONE]') {
              addToHistory(fullText, jobUrl);
              continue;
            }
            try {
              const data = JSON.parse(raw);
              if (data.choices?.[0]?.delta?.content) {
                fullText += data.choices[0].delta.content;
                setReport(fullText);
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
              if (data.usage) {
                const newTotal = sessionTokens + data.usage.total_tokens;
                setSessionTokens(newTotal);
                localStorage.setItem('total_session_tokens', newTotal.toString());
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
      <div className="flex h-full w-full bg-slate-50 dark:bg-[#08080a] overflow-hidden">
        {showToast && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <div className="bg-emerald-500 rounded-full p-1"><Check size={12} className="text-white" /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Copied to clipboard</span>
            </div>
        )}

        {isConfirmOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-black uppercase tracking-tight mb-2">Clear History?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">This action cannot be undone. All your saved sessions will be deleted.</p>
                <div className="flex gap-3">
                  <button onClick={() => setIsConfirmOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold uppercase transition-colors">Cancel</button>
                  <button onClick={clearAllHistory} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold uppercase transition-colors">Clear All</button>
                </div>
              </div>
            </div>
        )}

        <div className={`fixed inset-0 z-50 lg:relative lg:inset-auto lg:flex ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300`}>
          <Sidebar
              t={t}
              history={history}
              onSelect={(rep, url) => { setReport(rep); setJobUrl(url); setIsSidebarOpen(false); }}
              onDelete={deleteHistoryItem}
              onClearAll={() => setIsConfirmOpen(true)}
          />
        </div>
        <main className="flex-1 h-full flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-hidden p-2 lg:p-3 flex flex-col items-center w-full">
            <div className="max-w-4xl w-full flex flex-col gap-2 h-full overflow-hidden">
              <header className="flex justify-between items-center bg-white dark:bg-[#111114] p-2 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm">
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1"><Menu size={16} /></button>
                  <h1 className="text-[11px] lg:text-[12px] font-black uppercase tracking-tight">{t.brandName}</h1>
                  {loading && <RobotIcon className="w-3.5 h-3.5 animate-spin text-indigo-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <Coins size={12} className="text-amber-500" />
                    <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400">{Math.round(sessionTokens / 1000)}k used</span>
                  </div>
                  <button aria-label="Toggle Theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                  </button>
                </div>
              </header>
              <InputSection file={file} setFile={setFile} setResumeText={setResumeText} jobUrl={jobUrl} setJobUrl={setJobUrl} loading={loading} onStart={() => handleAction('analyze')} onTailor={() => handleAction('tailor')} t={t} />
              <div className="flex-1 min-h-0 overflow-hidden">
                <OutputArea
                    report={report}
                    loading={loading}
                    pdfLoading={pdfLoading}
                    scrollRef={scrollRef}
                    onCopy={handleCopy}
                    onDownloadPdf={handleDownloadPdf}
                    t={t}
                    userFile={file}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}