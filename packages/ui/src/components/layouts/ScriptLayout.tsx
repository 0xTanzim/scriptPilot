import React, { ReactNode } from 'react';

interface ScriptLayoutProps {
  children: ReactNode;
  mode: 'popup' | 'fullscreen';
}

/**
 * Layout Component - Provides consistent container styling
 * Implements Container Pattern for responsive design
 */
export const ScriptLayout: React.FC<ScriptLayoutProps> = ({
  children,
  mode,
}) => {
  const containerClass =
    mode === 'popup'
      ? 'w-full h-[500px] flex flex-col bg-background text-foreground'
      : 'min-h-screen w-full flex flex-col bg-background text-foreground';

  return <div className={containerClass}>{children}</div>;
};

export default ScriptLayout;
