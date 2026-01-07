import {
  Outlet,
  // useLocation
} from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/shared/Sidebar";
import DashboardHeader from "@/shared/DashboardHeader";
// import ChatBot from '@/pages/dashboard/ChatBot';

export default function AppLayout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile/tablet overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop: false => 2/10, true => 1/11
  // const location = useLocation();
  return (
    <div className="h-screen overflow-x-hidden">
      {/* Mobile & Tablet Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Layout - Grid */}
      <div className="hidden lg:grid lg:grid-cols-12 h-full">
        {/* Desktop Sidebar */}
        <div
          className={`sticky top-0 ${
            sidebarCollapsed ? "col-span-1" : "col-span-2"
          } h-[97.5vh] m-3 overflow-y-auto overflow-x-hidden`}
        >
          {/* Smooth feel (transform no-op but keeps timing consistent) */}
          <div className="h-full transition-all duration-300 ease-in-out will-change-transform">
            <Sidebar
              onClose={() => setSidebarOpen(false)}
              onToggle={() => setSidebarCollapsed((v) => !v)}
              desktopHidden={sidebarCollapsed} // collapsed => icons only
            />
          </div>
        </div>

        {/* Desktop Main Content */}
        <main
          className={`${
            sidebarCollapsed ? "col-span-11" : "col-span-10"
          } h-full overflow-y-auto overflow-x-hidden transition-[grid-column] duration-300`}
        >
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-6">
              <DashboardHeader />
              <div className="mt-8">
                <Outlet />
              </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-auto">
              <div className="text-center text-sm text-gray-600">
                <p>
                  © {new Date().getFullYear()} {t("footer.copyright")}
                </p>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Mobile & Tablet Layout - Flexbox */}
      <div className="lg:hidden h-full flex flex-col overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        <div
          className={`
            fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-white shadow-lg transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <Sidebar
            onClose={() => setSidebarOpen(false)}
            onToggle={() => setSidebarOpen(false)} // arrow also closes overlay
            desktopHidden={false}
          />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-4 sm:p-6">
              <DashboardHeader />
              <div className="mt-6 sm:mt-8">
                <Outlet />
              </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 mt-auto">
              <div className="text-center text-sm text-gray-600">
                <p>
                  © {new Date().getFullYear()} {t("footer.copyright")}
                </p>
              </div>
            </footer>
          </div>
        </main>
      </div>
      {/* {!location.pathname.includes('/chat') && (
        <div className='absolute bottom-6 right-10'>
          <ChatBot></ChatBot>
        </div>
      )} */}
    </div>
  );
}
