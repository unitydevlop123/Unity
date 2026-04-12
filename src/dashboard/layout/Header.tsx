import React from 'react';
import { Search, Bell, Power, Zap, Activity } from 'lucide-react';

interface HeaderProps {
  onClose: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClose }) => {
  return (
    <header className="db-header px-10">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter leading-none">GHOST CORE</h1>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Admin Protocol v4.0</span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-6 border-l border-white/10 pl-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">System Load</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400">12%</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Network Latency</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-400">24ms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="db-header-actions">
        <div className="hidden md:flex items-center gap-4 mr-6">
          <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all border border-white/5">
            <Bell size={18} />
          </button>
          <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all border border-white/5">
            <Activity size={18} />
          </button>
        </div>

        <button 
          onClick={onClose}
          className="db-btn-primary !py-3 !px-6 !rounded-2xl !text-[10px] !shadow-red-500/20"
        >
          <Power size={14} />
          Terminate Session
        </button>
      </div>
    </header>
  );
};

export default Header;
