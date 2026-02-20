import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VinoLytics Dashboard",
  description: "Inventory Analytics & Demand Forecasting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <div className="min-h-screen flex flex-col">
          {/* Top Navigation Bar */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🍷</span>
                  <span className="font-bold text-xl text-slate-800 tracking-tight">
                    VinoLytics <span className="text-slate-500 font-normal">Dashboard</span>
                  </span>
                </div>
                {/* TODO: Add user profile dropdown or dark mode toggle here later */}
                <div className="text-sm font-medium text-slate-500">
                  Phase 6 MVP
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          
          {/* Simple Footer */}
          <footer className="bg-white border-t border-slate-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} VinoLytics. Internal Use Only.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
