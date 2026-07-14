import { create } from 'zustand';
import type { Viewport } from '@/types/project';
import { clamp } from '@/utils/geometry';
import { MIN_SCALE, MAX_SCALE, SCALE_STEP } from '@/utils/constants';

interface ViewportStore {
  interactionViewport: Viewport;
  pageDesignViewport: Viewport;

  zoom: (view: 'interaction' | 'pageDesign', delta: number, centerX: number, centerY: number) => void;
  pan: (view: 'interaction' | 'pageDesign', dx: number, dy: number) => void;
  setViewport: (view: 'interaction' | 'pageDesign', viewport: Partial<Viewport>) => void;
  resetViewport: (view: 'interaction' | 'pageDesign') => void;
}

export const useViewportStore = create<ViewportStore>((set, get) => ({
  interactionViewport: { scale: 0.5, offsetX: 0, offsetY: 0 },
  pageDesignViewport: { scale: 1, offsetX: 0, offsetY: 0 },

  zoom: (view, delta, centerX, centerY) => {
    const current = view === 'interaction' ? get().interactionViewport : get().pageDesignViewport;
    // delta>0 表示滚轮向下 → 缩小；delta<0 表示滚轮向上 → 放大
    const factor = delta > 0 ? (1 - SCALE_STEP) : (1 + SCALE_STEP);
    const newScale = clamp(current.scale * factor, MIN_SCALE, MAX_SCALE);

    // 以鼠标位置为中心缩放
    const newOffsetX = centerX - (centerX - current.offsetX) * (newScale / current.scale);
    const newOffsetY = centerY - (centerY - current.offsetY) * (newScale / current.scale);

    const newViewport = { scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
    if (view === 'interaction') {
      set({ interactionViewport: newViewport });
    } else {
      set({ pageDesignViewport: newViewport });
    }
  },

  pan: (view, dx, dy) => {
    const current = view === 'interaction' ? get().interactionViewport : get().pageDesignViewport;
    const newViewport = {
      ...current,
      offsetX: current.offsetX + dx,
      offsetY: current.offsetY + dy,
    };
    if (view === 'interaction') {
      set({ interactionViewport: newViewport });
    } else {
      set({ pageDesignViewport: newViewport });
    }
  },

  setViewport: (view, partial) => {
    const current = view === 'interaction' ? get().interactionViewport : get().pageDesignViewport;
    if (view === 'interaction') {
      set({ interactionViewport: { ...current, ...partial } });
    } else {
      set({ pageDesignViewport: { ...current, ...partial } });
    }
  },

  resetViewport: (view) => {
    if (view === 'interaction') {
      set({ interactionViewport: { scale: 0.5, offsetX: 0, offsetY: 0 } });
    } else {
      set({ pageDesignViewport: { scale: 1, offsetX: 0, offsetY: 0 } });
    }
  },
}));


