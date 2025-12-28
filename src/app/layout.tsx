import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'AI Career Coach',
    description: 'Analyze your resume against job descriptions',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0a0a0c] overflow-hidden">
                <div className="flex-grow overflow-hidden">
                    {children}
                </div>
                <Footer />
            </div>
        </ThemeProvider>
        </body>
        </html>
    );
}