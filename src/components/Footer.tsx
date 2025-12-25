'use client';

import React from 'react';

export const Footer = () => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50 w-full py-4 px-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md">
            <div className="max-w-6xl mx-auto text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    © 2025-2026 Viktor Ralchenko. All rights reserved.
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest font-bold">
                    Empowering your professional journey with AI
                </p>
            </div>
        </footer>
    );
};