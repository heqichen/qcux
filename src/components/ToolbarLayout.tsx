import React, { useEffect, useRef, useState } from 'react';
import { toolbarStyle } from '@/views/InteractionView/styles';

interface ToolbarLayoutProps {
  actions: React.ReactNode;
  status: React.ReactNode;
}

export const ToolbarLayout: React.FC<ToolbarLayoutProps> = ({ actions, status }) => {
  const actionsRef = useRef<HTMLDivElement>(null);
  const [hasHiddenRightActions, setHasHiddenRightActions] = useState(false);

  useEffect(() => {
    const element = actionsRef.current;
    if (!element) return;

    const updateOverflowState = () => {
      setHasHiddenRightActions(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
    };

    updateOverflowState();

    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(element);
    window.addEventListener('resize', updateOverflowState);
    element.addEventListener('scroll', updateOverflowState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateOverflowState);
      element.removeEventListener('scroll', updateOverflowState);
    };
  }, []);

  return (
    <div style={toolbarStyle}>
      <div ref={actionsRef} style={actionsScrollerStyle}>
        <div style={actionsRowStyle}>{actions}</div>
      </div>

      <div style={trailingAreaStyle}>
        {hasHiddenRightActions && <span style={moreHintStyle}>右侧还有按钮 →</span>}
        {status}
      </div>
    </div>
  );
};

const actionsScrollerStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 'max-content',
  paddingRight: 12,
  whiteSpace: 'nowrap',
};

const trailingAreaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexShrink: 0,
  minWidth: 0,
  marginLeft: 12,
};

const moreHintStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  whiteSpace: 'nowrap',
};