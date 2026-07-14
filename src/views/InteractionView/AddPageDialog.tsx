import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH } from '@/utils/constants';
import { FieldRow } from '@/views/InteractionView/FieldRow';
import { btnStyle, dialogOverlayStyle, dialogStyle, inputStyle } from '@/views/InteractionView/styles';

export const AddPageDialog: React.FC = () => {
  const isOpen = useUIStore((state) => state.isAddPageDialogOpen);
  const closeDialog = useUIStore((state) => state.closeAddPageDialog);
  const navigateToPageDesign = useUIStore((state) => state.navigateToPageDesign);
  const addPage = useProjectStore((state) => state.addPage);

  const [title, setTitle] = useState('新界面');
  const [width, setWidth] = useState(String(DEFAULT_PAGE_WIDTH));
  const [height, setHeight] = useState(String(DEFAULT_PAGE_HEIGHT));

  const handleConfirm = () => {
    const nextWidth = Number(width) || DEFAULT_PAGE_WIDTH;
    const nextHeight = Number(height) || DEFAULT_PAGE_HEIGHT;
    const page = addPage(title || '未命名界面', nextWidth, nextHeight);
    closeDialog();
    navigateToPageDesign(page.id);
  };

  if (!isOpen) return null;

  return (
    <div style={dialogOverlayStyle} onClick={closeDialog}>
      <div style={dialogStyle} onClick={(event) => event.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px 0' }}>新增界面</h3>
        <FieldRow label="界面标题">
          <input style={inputStyle} value={title} onChange={(event) => setTitle(event.target.value)} />
        </FieldRow>
        <FieldRow label="宽度">
          <input style={inputStyle} type="number" value={width} onChange={(event) => setWidth(event.target.value)} />
        </FieldRow>
        <FieldRow label="高度">
          <input style={inputStyle} type="number" value={height} onChange={(event) => setHeight(event.target.value)} />
        </FieldRow>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button style={btnStyle} onClick={closeDialog}>取消</button>
          <button
            style={{ ...btnStyle, background: '#4A90D9', color: '#fff', borderColor: '#4A90D9' }}
            onClick={handleConfirm}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};