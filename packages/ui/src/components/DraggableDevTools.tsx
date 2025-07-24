import { Script } from '@scriptpilot/types';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface DraggableDevToolsProps {
  mode: string;
  scripts: Script[];
  currentUrl: string;
  onReset: () => void;
}

export const DraggableDevTools: React.FC<DraggableDevToolsProps> = ({
  mode,
  scripts,
  currentUrl,
  onReset,
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('dev-tools-position');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('dev-tools-position', JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - offsetRef.current.x;
        const newY = e.clientY - offsetRef.current.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - 300; // approximate width
        const maxY = window.innerHeight - 200; // approximate height

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={dragRef}
      className={`fixed z-50 max-w-xs select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
      }}
    >
      {/* Header - Draggable */}
      <div
        className='bg-blue-500/90 backdrop-blur text-white px-3 py-2 rounded-t-md text-xs font-medium flex items-center justify-between hover:bg-blue-600/90 transition-colors'
        onMouseDown={handleMouseDown}
      >
        <span className='flex items-center gap-1'>
          🚀 ScriptPilot Dev Tools
          <span className='text-blue-200 text-[10px]'>({mode})</span>
        </span>
        <div className='flex items-center gap-1'>
          <button
            className='hover:bg-blue-700 w-4 h-4 rounded text-[10px] flex items-center justify-center'
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '↓' : '↑'}
          </button>
          <button
            className='hover:bg-blue-700 w-4 h-4 rounded text-[10px] flex items-center justify-center'
            onClick={() => setPosition({ x: 20, y: 20 })}
            title='Reset Position'
          >
            ⌂
          </button>
        </div>
      </div>

      {/* Content - Collapsible */}
      {!isCollapsed && (
        <div className='bg-gray-800/90 backdrop-blur text-white px-3 py-2 rounded-b-md text-xs space-y-2'>
          <div className='grid grid-cols-2 gap-2 text-[10px]'>
            <div>
              <span className='text-gray-400'>Mode:</span>
              <div className='font-mono text-green-400 truncate'>{mode}</div>
            </div>
            <div>
              <span className='text-gray-400'>Scripts:</span>
              <div className='font-mono text-blue-400'>{scripts.length}</div>
            </div>
          </div>

          <div>
            <span className='text-gray-400 text-[10px]'>URL:</span>
            <div className='font-mono text-yellow-400 text-[10px] truncate'>
              {currentUrl}
            </div>
          </div>

          <div className='flex gap-2'>
            <button
              onClick={onReset}
              className='bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] flex-1 transition-colors'
              title='Reset to mock data'
            >
              🔄 Reset
            </button>
            <button
              onClick={() => console.log('Scripts:', scripts)}
              className='bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-[10px] flex-1 transition-colors'
              title='Log scripts to console'
            >
              📋 Log
            </button>
          </div>

          <div className='text-[10px] text-gray-400 border-t border-gray-600 pt-1 mt-2'>
            💡 Drag me around! Position saved automatically.
          </div>
        </div>
      )}
    </div>
  );
};

export default DraggableDevTools;
