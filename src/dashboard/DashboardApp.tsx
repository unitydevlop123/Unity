import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, Wallet, Gamepad2, 
  HardDrive, Settings, Power 
} from 'lucide-react';
import Header from './layout/Header';
import OverviewPage from './overview/OverviewPage';
import UsersPage from './users/UsersPage';
import FinancePage from './finance/FinancePage';
import GamesPage from './games/GamesPage';
import StoragePage from './storage/StoragePage';
import SettingsPage from './settings/SettingsPage';
import './DashboardApp.css';

interface DashboardAppProps {
  onClose: () => void;
}

const DashboardApp: React.FC<DashboardAppProps> = ({ onClose }) => {
  const [activePage, setActivePage] = useState('overview');
  const [isCompact, setIsCompact] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'text-red-500' },
    { id: 'users', label: 'Users', icon: Users, color: 'text-blue-500' },
    { id: 'finance', label: 'Finance', icon: Wallet, color: 'text-emerald-500' },
    { id: 'games', label: 'Games', icon: Gamepad2, color: 'text-purple-500' },
    { id: 'storage', label: 'Storage', icon: HardDrive, color: 'text-amber-500' },
    { id: 'settings', label: 'System', icon: Settings, color: 'text-zinc-400' },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage isCompact={isCompact} />;
      case 'users':
        return <UsersPage isCompact={isCompact} />;
      case 'finance':
        return <FinancePage isCompact={isCompact} />;
      case 'games':
        return <GamesPage isCompact={isCompact} />;
      case 'storage':
        return <StoragePage isCompact={isCompact} />;
      case 'settings':
        return <SettingsPage isCompact={isCompact} onToggleCompact={() => setIsCompact(!isCompact)} />;
      default:
        return <OverviewPage isCompact={isCompact} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="db-root"
    >
      <div className="db-main">
        <Header onClose={onClose} />
        <main className="db-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pointer-events-none">
        <nav className="db-bottom-nav pointer-events-auto max-w-3xl mx-auto shadow-2xl shadow-black/50">
          <div className="db-nav-scroll-container">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`db-nav-item group ${activePage === item.id ? 'active' : ''}`}
              >
                <div className="relative">
                  <item.icon size={20} className={`transition-all duration-300 ${activePage === item.id ? item.color : 'text-white/40 group-hover:text-white/60'}`} />
                  {activePage === item.id && (
                    <motion.div 
                      layoutId="nav-glow"
                      className={`absolute inset-0 blur-lg opacity-50 ${item.color.replace('text', 'bg')}`}
                    />
                  )}
                </div>
                <span className="db-nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />
      </div>
    </motion.div>
  );
};

export default DashboardApp;
