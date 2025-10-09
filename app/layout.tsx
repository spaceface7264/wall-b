import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wall-B",
  description: "Wall-B - A modern bouldering community app with real-time chat, gym database, and social features",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#181C21",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Wall-B - Comprehensive CSS Framework */
            * { 
              box-sizing: border-box; 
              margin: 0; 
              padding: 0; 
            }
            
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #181C21; 
              color: #ffffff; 
              line-height: 1.6;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }

            /* ===== RESPONSIVE BREAKPOINTS ===== */
            @media (min-width: 640px) { .sm\\:block { display: block; } .sm\\:hidden { display: none; } }
            @media (min-width: 768px) { .md\\:block { display: block; } .md\\:hidden { display: none; } }
            @media (min-width: 1024px) { .lg\\:block { display: block; } .lg\\:hidden { display: none; } }
            @media (min-width: 1280px) { .xl\\:block { display: block; } .xl\\:hidden { display: none; } }

            /* ===== LAYOUT UTILITIES ===== */
            .block { display: block; }
            .inline-block { display: inline-block; }
            .inline { display: inline; }
            .flex { display: flex; }
            .inline-flex { display: inline-flex; }
            .grid { display: grid; }
            .hidden { display: none; }
            .table { display: table; }
            .table-cell { display: table-cell; }
            .table-row { display: table-row; }

            /* ===== FLEXBOX UTILITIES ===== */
            .flex-row { flex-direction: row; }
            .flex-col { flex-direction: column; }
            .flex-wrap { flex-wrap: wrap; }
            .flex-nowrap { flex-wrap: nowrap; }
            .items-start { align-items: flex-start; }
            .items-end { align-items: flex-end; }
            .items-center { align-items: center; }
            .items-baseline { align-items: baseline; }
            .items-stretch { align-items: stretch; }
            .justify-start { justify-content: flex-start; }
            .justify-end { justify-content: flex-end; }
            .justify-center { justify-content: center; }
            .justify-between { justify-content: space-between; }
            .justify-around { justify-content: space-around; }
            .justify-evenly { justify-content: space-evenly; }
            .flex-1 { flex: 1 1 0%; }
            .flex-auto { flex: 1 1 auto; }
            .flex-initial { flex: 0 1 auto; }
            .flex-none { flex: none; }
            .flex-grow { flex-grow: 1; }
            .flex-shrink { flex-shrink: 1; }
            .flex-shrink-0 { flex-shrink: 0; }

            /* ===== GRID UTILITIES ===== */
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
            .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
            .col-span-1 { grid-column: span 1 / span 1; }
            .col-span-2 { grid-column: span 2 / span 2; }
            .col-span-3 { grid-column: span 3 / span 3; }
            .col-span-4 { grid-column: span 4 / span 4; }
            .col-span-6 { grid-column: span 6 / span 6; }
            .col-span-12 { grid-column: span 12 / span 12; }
            .gap-1 { gap: 0.25rem; }
            .gap-2 { gap: 0.5rem; }
            .gap-3 { gap: 0.75rem; }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }
            .gap-8 { gap: 2rem; }

            /* ===== SPACING UTILITIES ===== */
            .p-0 { padding: 0; }
            .p-1 { padding: 0.25rem; }
            .p-2 { padding: 0.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .p-6 { padding: 1.5rem; }
            .p-8 { padding: 2rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
            .pt-2 { padding-top: 0.5rem; }
            .pt-4 { padding-top: 1rem; }
            .pb-2 { padding-bottom: 0.5rem; }
            .pb-4 { padding-bottom: 1rem; }
            .pl-2 { padding-left: 0.5rem; }
            .pl-4 { padding-left: 1rem; }
            .pr-2 { padding-right: 0.5rem; }
            .pr-4 { padding-right: 1rem; }

            .m-0 { margin: 0; }
            .m-1 { margin: 0.25rem; }
            .m-2 { margin: 0.5rem; }
            .m-3 { margin: 0.75rem; }
            .m-4 { margin: 1rem; }
            .m-6 { margin: 1.5rem; }
            .m-8 { margin: 2rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .mx-2 { margin-left: 0.5rem; margin-right: 0.5rem; }
            .mx-4 { margin-left: 1rem; margin-right: 1rem; }
            .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
            .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-6 { margin-top: 1.5rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .ml-2 { margin-left: 0.5rem; }
            .ml-4 { margin-left: 1rem; }
            .mr-2 { margin-right: 0.5rem; }
            .mr-4 { margin-right: 1rem; }

            /* ===== SIZING UTILITIES ===== */
            .w-full { width: 100%; }
            .w-auto { width: auto; }
            .w-4 { width: 1rem; }
            .w-6 { width: 1.5rem; }
            .w-8 { width: 2rem; }
            .w-12 { width: 3rem; }
            .w-16 { width: 4rem; }
            .w-20 { width: 5rem; }
            .w-24 { width: 6rem; }
            .w-32 { width: 8rem; }
            .w-48 { width: 12rem; }
            .w-64 { width: 16rem; }
            .w-1\\/2 { width: 50%; }
            .w-1\\/3 { width: 33.333333%; }
            .w-2\\/3 { width: 66.666667%; }
            .w-1\\/4 { width: 25%; }
            .w-3\\/4 { width: 75%; }

            .h-full { height: 100%; }
            .h-auto { height: auto; }
            .h-4 { height: 1rem; }
            .h-6 { height: 1.5rem; }
            .h-8 { height: 2rem; }
            .h-12 { height: 3rem; }
            .h-16 { height: 4rem; }
            .h-20 { height: 5rem; }
            .h-24 { height: 6rem; }
            .h-32 { height: 8rem; }
            .h-48 { height: 12rem; }
            .h-64 { height: 16rem; }
            .h-screen { height: 100vh; }
            .min-h-screen { min-height: 100vh; }
            .max-h-screen { max-height: 100vh; }

            /* ===== TYPOGRAPHY UTILITIES ===== */
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-base { font-size: 1rem; line-height: 1.5rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
            .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
            .text-5xl { font-size: 3rem; line-height: 1; }
            .text-6xl { font-size: 3.75rem; line-height: 1; }

            .font-thin { font-weight: 100; }
            .font-light { font-weight: 300; }
            .font-normal { font-weight: 400; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .font-extrabold { font-weight: 800; }
            .font-black { font-weight: 900; }

            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-justify { text-align: justify; }

            .uppercase { text-transform: uppercase; }
            .lowercase { text-transform: lowercase; }
            .capitalize { text-transform: capitalize; }
            .normal-case { text-transform: none; }

            .underline { text-decoration: underline; }
            .line-through { text-decoration: line-through; }
            .no-underline { text-decoration: none; }

            .truncate { 
              overflow: hidden; 
              text-overflow: ellipsis; 
              white-space: nowrap; 
            }
            .line-clamp-1 { 
              overflow: hidden; 
              display: -webkit-box; 
              -webkit-box-orient: vertical; 
              -webkit-line-clamp: 1; 
            }
            .line-clamp-2 { 
              overflow: hidden; 
              display: -webkit-box; 
              -webkit-box-orient: vertical; 
              -webkit-line-clamp: 2; 
            }
            .line-clamp-3 { 
              overflow: hidden; 
              display: -webkit-box; 
              -webkit-box-orient: vertical; 
              -webkit-line-clamp: 3; 
            }

            /* ===== COLOR UTILITIES ===== */
            .text-white { color: #ffffff; }
            .text-gray-100 { color: #f3f4f6; }
            .text-gray-200 { color: #e5e7eb; }
            .text-gray-300 { color: #d1d5db; }
            .text-gray-400 { color: #9ca3af; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-900 { color: #111827; }
            .text-blue-400 { color: #60a5fa; }
            .text-blue-500 { color: #3b82f6; }
            .text-blue-600 { color: #2563eb; }
            .text-indigo-400 { color: #818cf8; }
            .text-indigo-500 { color: #6366f1; }
            .text-indigo-600 { color: #4f46e5; }
            .text-green-400 { color: #4ade80; }
            .text-green-500 { color: #22c55e; }
            .text-green-600 { color: #16a34a; }
            .text-red-400 { color: #f87171; }
            .text-red-500 { color: #ef4444; }
            .text-red-600 { color: #dc2626; }
            .text-yellow-400 { color: #facc15; }
            .text-yellow-500 { color: #eab308; }
            .text-yellow-600 { color: #ca8a04; }
            .text-purple-400 { color: #c084fc; }
            .text-purple-500 { color: #a855f7; }
            .text-purple-600 { color: #9333ea; }

            .bg-transparent { background-color: transparent; }
            .bg-white { background-color: #ffffff; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-gray-200 { background-color: #e5e7eb; }
            .bg-gray-300 { background-color: #d1d5db; }
            .bg-gray-400 { background-color: #9ca3af; }
            .bg-gray-500 { background-color: #6b7280; }
            .bg-gray-600 { background-color: #4b5563; }
            .bg-gray-700 { background-color: #374151; }
            .bg-gray-800 { background-color: #1f2937; }
            .bg-gray-900 { background-color: #111827; }
            .bg-blue-500 { background-color: #3b82f6; }
            .bg-blue-600 { background-color: #2563eb; }
            .bg-indigo-500 { background-color: #6366f1; }
            .bg-indigo-600 { background-color: #4f46e5; }
            .bg-green-500 { background-color: #22c55e; }
            .bg-green-600 { background-color: #16a34a; }
            .bg-red-500 { background-color: #ef4444; }
            .bg-red-600 { background-color: #dc2626; }
            .bg-yellow-500 { background-color: #eab308; }
            .bg-yellow-600 { background-color: #ca8a04; }
            .bg-purple-500 { background-color: #a855f7; }
            .bg-purple-600 { background-color: #9333ea; }

            /* ===== BORDER UTILITIES ===== */
            .border { border-width: 1px; }
            .border-0 { border-width: 0; }
            .border-2 { border-width: 2px; }
            .border-4 { border-width: 4px; }
            .border-t { border-top-width: 1px; }
            .border-r { border-right-width: 1px; }
            .border-b { border-bottom-width: 1px; }
            .border-l { border-left-width: 1px; }

            .border-transparent { border-color: transparent; }
            .border-white { border-color: #ffffff; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-gray-400 { border-color: #9ca3af; }
            .border-gray-500 { border-color: #6b7280; }
            .border-gray-600 { border-color: #4b5563; }
            .border-gray-700 { border-color: #374151; }
            .border-blue-500 { border-color: #3b82f6; }
            .border-blue-600 { border-color: #2563eb; }
            .border-indigo-500 { border-color: #6366f1; }
            .border-indigo-600 { border-color: #4f46e5; }
            .border-green-500 { border-color: #22c55e; }
            .border-green-600 { border-color: #16a34a; }
            .border-red-500 { border-color: #ef4444; }
            .border-red-600 { border-color: #dc2626; }

            .border-t-transparent { border-top-color: transparent; }
            .border-r-transparent { border-right-color: transparent; }
            .border-b-transparent { border-bottom-color: transparent; }
            .border-l-transparent { border-left-color: transparent; }

            .rounded-none { border-radius: 0; }
            .rounded-sm { border-radius: 0.125rem; }
            .rounded { border-radius: 0.25rem; }
            .rounded-md { border-radius: 0.375rem; }
            .rounded-lg { border-radius: 0.5rem; }
            .rounded-xl { border-radius: 0.75rem; }
            .rounded-2xl { border-radius: 1rem; }
            .rounded-3xl { border-radius: 1.5rem; }
            .rounded-full { border-radius: 9999px; }

            /* ===== SHADOW UTILITIES ===== */
            .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
            .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
            .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
            .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
            .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
            .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
            .shadow-none { box-shadow: none; }

            /* ===== POSITION UTILITIES ===== */
            .static { position: static; }
            .fixed { position: fixed; }
            .absolute { position: absolute; }
            .relative { position: relative; }
            .sticky { position: sticky; }

            .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
            .top-0 { top: 0; }
            .right-0 { right: 0; }
            .bottom-0 { bottom: 0; }
            .left-0 { left: 0; }
            .top-2 { top: 0.5rem; }
            .right-2 { right: 0.5rem; }
            .bottom-2 { bottom: 0.5rem; }
            .left-2 { left: 0.5rem; }
            .top-4 { top: 1rem; }
            .right-4 { right: 1rem; }
            .bottom-4 { bottom: 1rem; }
            .left-4 { left: 1rem; }

            .z-0 { z-index: 0; }
            .z-10 { z-index: 10; }
            .z-20 { z-index: 20; }
            .z-30 { z-index: 30; }
            .z-40 { z-index: 40; }
            .z-50 { z-index: 50; }

            /* ===== OVERFLOW UTILITIES ===== */
            .overflow-auto { overflow: auto; }
            .overflow-hidden { overflow: hidden; }
            .overflow-visible { overflow: visible; }
            .overflow-scroll { overflow: scroll; }
            .overflow-x-auto { overflow-x: auto; }
            .overflow-y-auto { overflow-y: auto; }
            .overflow-x-hidden { overflow-x: hidden; }
            .overflow-y-hidden { overflow-y: hidden; }

            /* ===== OPACITY UTILITIES ===== */
            .opacity-0 { opacity: 0; }
            .opacity-25 { opacity: 0.25; }
            .opacity-50 { opacity: 0.5; }
            .opacity-75 { opacity: 0.75; }
            .opacity-100 { opacity: 1; }

            /* ===== CURSOR UTILITIES ===== */
            .cursor-auto { cursor: auto; }
            .cursor-default { cursor: default; }
            .cursor-pointer { cursor: pointer; }
            .cursor-wait { cursor: wait; }
            .cursor-text { cursor: text; }
            .cursor-move { cursor: move; }
            .cursor-help { cursor: help; }
            .cursor-not-allowed { cursor: not-allowed; }

            /* ===== SELECT UTILITIES ===== */
            .select-none { user-select: none; }
            .select-text { user-select: text; }
            .select-all { user-select: all; }
            .select-auto { user-select: auto; }

            /* ===== POINTER EVENTS UTILITIES ===== */
            .pointer-events-none { pointer-events: none; }
            .pointer-events-auto { pointer-events: auto; }

            /* ===== VISIBILITY UTILITIES ===== */
            .visible { visibility: visible; }
            .invisible { visibility: hidden; }

            /* ===== ENHANCED CARD COMPONENTS ===== */
            .mobile-card {
              background: linear-gradient(135deg, #1b1d21 0%, #2a2d33 100%);
              border-radius: 16px;
              padding: 20px;
              margin-bottom: 16px;
              border: 1px solid rgba(55, 65, 81, 0.3);
              box-shadow: 
                0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06),
                0 0 0 1px rgba(255, 255, 255, 0.05);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              overflow: hidden;
            }

            .mobile-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
            }

            .mobile-card:hover {
              transform: translateY(-2px);
              box-shadow: 
                0 10px 25px -3px rgba(0, 0, 0, 0.2),
                0 4px 6px -2px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(59, 130, 246, 0.2);
              border-color: rgba(59, 130, 246, 0.4);
            }

            .mobile-card:active {
              transform: translateY(0);
              transition: transform 0.1s ease;
            }

            .mobile-card-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 16px;
              position: relative;
            }

            .mobile-card-title {
              font-size: 24px;
              font-weight: 700;
              color: #ffffff;
              margin: 0 0 8px 0;
              letter-spacing: -0.025em;
              line-height: 1.2;
            }

            .mobile-card-subtitle {
              font-size: 14px;
              color: #9ca3af;
              margin: 0;
              line-height: 1.4;
            }

            .mobile-card-content {
              font-size: 14px;
              line-height: 1.6;
              color: #d1d5db;
              margin: 0;
            }

            .mobile-card-actions {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: 16px;
              padding-top: 16px;
              border-top: 1px solid rgba(55, 65, 81, 0.3);
            }

            /* ===== BUTTON COMPONENTS ===== */
            .mobile-btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 12px 24px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 14px;
              line-height: 1.4;
              text-decoration: none;
              border: none;
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              overflow: hidden;
              min-height: 44px;
            }

            .mobile-btn:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            .mobile-btn-primary {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: #ffffff;
              box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
            }

            .mobile-btn-primary:hover:not(:disabled) {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.4);
              transform: translateY(-1px);
            }

            .mobile-btn-secondary {
              background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
              color: #ffffff;
              border: 1px solid rgba(75, 85, 99, 0.3);
            }

            .mobile-btn-secondary:hover:not(:disabled) {
              background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
              transform: translateY(-1px);
            }

            .mobile-btn-outline {
              background: transparent;
              color: #3b82f6;
              border: 2px solid #3b82f6;
            }

            .mobile-btn-outline:hover:not(:disabled) {
              background: #3b82f6;
              color: #ffffff;
            }

            .mobile-btn-ghost {
              background: transparent;
              color: #9ca3af;
              border: 1px solid transparent;
            }

            .mobile-btn-ghost:hover:not(:disabled) {
              background: rgba(55, 65, 81, 0.3);
              color: #ffffff;
            }

            .mobile-btn-sm {
              padding: 8px 16px;
              font-size: 12px;
              min-height: 36px;
            }

            .mobile-btn-lg {
              padding: 16px 32px;
              font-size: 16px;
              min-height: 52px;
            }

            /* ===== FORM COMPONENTS ===== */
            .mobile-input {
              width: 100%;
              padding: 12px 16px;
              border: 2px solid rgba(55, 65, 81, 0.3);
              border-radius: 12px;
              background: rgba(31, 41, 55, 0.5);
              color: #ffffff;
              font-size: 14px;
              line-height: 1.4;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              min-height: 44px;
            }

            .mobile-input:focus {
              outline: none;
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              background: rgba(31, 41, 55, 0.8);
            }

            .mobile-input::placeholder {
              color: #9ca3af;
            }

            .mobile-textarea {
              width: 100%;
              padding: 12px 16px;
              border: 2px solid rgba(55, 65, 81, 0.3);
              border-radius: 12px;
              background: rgba(31, 41, 55, 0.5);
              color: #ffffff;
              font-size: 14px;
              line-height: 1.4;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              resize: vertical;
              min-height: 100px;
            }

            .mobile-textarea:focus {
              outline: none;
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              background: rgba(31, 41, 55, 0.8);
            }

            .mobile-select {
              width: 100%;
              padding: 12px 16px;
              border: 2px solid rgba(55, 65, 81, 0.3);
              border-radius: 12px;
              background: rgba(31, 41, 55, 0.5);
              color: #ffffff;
              font-size: 14px;
              line-height: 1.4;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              min-height: 44px;
              cursor: pointer;
            }

            .mobile-select:focus {
              outline: none;
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              background: rgba(31, 41, 55, 0.8);
            }

            .mobile-select option {
              background: #1f2937;
              color: #ffffff;
            }

            /* ===== LOADING STATES ===== */
            .mobile-loading {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 20px;
              border: 2px solid rgba(59, 130, 246, 0.3);
              border-top: 2px solid #3b82f6;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }

            .mobile-loading-sm {
              width: 16px;
              height: 16px;
              border-width: 1.5px;
            }

            .mobile-loading-lg {
              width: 24px;
              height: 24px;
              border-width: 3px;
            }

            /* ===== SKELETON LOADING ===== */
            .mobile-skeleton {
              background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
              background-size: 200% 100%;
              animation: skeleton-loading 1.5s infinite;
              border-radius: 8px;
            }

            .mobile-skeleton-text {
              height: 16px;
              margin-bottom: 8px;
            }

            .mobile-skeleton-text:last-child {
              margin-bottom: 0;
            }

            .mobile-skeleton-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
            }

            .mobile-skeleton-card {
              height: 120px;
              border-radius: 12px;
            }

            /* ===== ANIMATIONS ===== */
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            @keyframes skeleton-loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }

            @keyframes fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }

            @keyframes slide-in-right {
              from { opacity: 0; transform: translateX(20px); }
              to { opacity: 1; transform: translateX(0); }
            }

            @keyframes slide-in-left {
              from { opacity: 0; transform: translateX(-20px); }
              to { opacity: 1; transform: translateX(0); }
            }

            @keyframes scale-in {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }

            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }

            .animate-fade-in { animation: fade-in 0.3s ease-out; }
            .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
            .animate-slide-in-left { animation: slide-in-left 0.3s ease-out; }
            .animate-scale-in { animation: scale-in 0.2s ease-out; }
            .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            .animate-spin { animation: spin 1s linear infinite; }

            /* ===== UTILITY CLASSES ===== */
            .minimal-flex { display: flex; align-items: center; }
            .minimal-flex-center { display: flex; align-items: center; justify-content: center; }
            .minimal-icon { width: 16px; height: 16px; flex-shrink: 0; }
            .mobile-subheading { font-size: 18px; font-weight: 600; color: #ffffff; }
            .mobile-text-xs { font-size: 12px; line-height: 1.4; }
            .mobile-text-sm { font-size: 14px; line-height: 1.4; }
            .mobile-text-base { font-size: 16px; line-height: 1.5; }
            .mobile-text-lg { font-size: 18px; line-height: 1.5; }
            .mobile-text-xl { font-size: 20px; line-height: 1.5; }

            /* ===== INTERACTIVE STATES ===== */
            .card-interactive {
              cursor: pointer;
              user-select: none;
            }

            .card-interactive:hover {
              transform: translateY(-2px);
            }

            .card-interactive:active {
              transform: translateY(0);
            }

            .card-glow {
              box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.1);
            }

            .card-glow:hover {
              box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
            }

            /* ===== RESPONSIVE UTILITIES ===== */
            @media (max-width: 639px) {
              .mobile-card { padding: 16px; }
              .mobile-card-title { font-size: 20px; }
              .mobile-btn { padding: 10px 20px; font-size: 13px; }
              .mobile-input, .mobile-textarea, .mobile-select { padding: 10px 14px; font-size: 13px; }
            }

            @media (min-width: 640px) {
              .sm\\:mobile-card { padding: 20px; }
              .sm\\:mobile-card-title { font-size: 24px; }
            }

            @media (min-width: 768px) {
              .md\\:mobile-card { padding: 24px; }
              .md\\:mobile-card-title { font-size: 28px; }
            }

            @media (min-width: 1024px) {
              .lg\\:mobile-card { padding: 28px; }
              .lg\\:mobile-card-title { font-size: 32px; }
            }
          `
        }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
