import React from 'react';
import { Power, Zap, Battery, Cpu } from 'lucide-react';

const JTPowerDemo: React.FC = () => {
  return (
    <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 mt-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Power size={20} className="text-amber-500" />
        </div>
        <div>
          <h3 className="text-white font-medium">Power System Demo</h3>
          <p className="text-zinc-500 text-xs">Real-time system diagnostics</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-blue-400" />
            <span className="text-zinc-400 text-xs uppercase tracking-wider">Voltage</span>
          </div>
          <div className="text-white font-mono">230.4V</div>
        </div>
        
        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Battery size={14} className="text-green-400" />
            <span className="text-zinc-400 text-xs uppercase tracking-wider">Battery</span>
          </div>
          <div className="text-white font-mono">98%</div>
        </div>
        
        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={14} className="text-purple-400" />
            <span className="text-zinc-400 text-xs uppercase tracking-wider">Load</span>
          </div>
          <div className="text-white font-mono">12.5%</div>
        </div>
        
        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Power size={14} className="text-red-400" />
            <span className="text-zinc-400 text-xs uppercase tracking-wider">Uptime</span>
          </div>
          <div className="text-white font-mono">14d 2h</div>
        </div>
      </div>
    </div>
  );
};

export default JTPowerDemo;
