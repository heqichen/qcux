# QCUX 架构设计文档

## 1. 概述

QCUX 是一个 UX 线框图设计工具，基于 Electron 构建的桌面应用。用户可以在交互设计界面中管理页面及其跳转关系，在界面设计界面中编辑每个页面的 UI 元素，并可将项目导出为独立的交互式网页。

### 1.1 技术栈

| 层级 | 技术选型 |
|------|----------|
| 桌面框架 | Electron |
| 前端框架 | React 18+ |
| 状态管理 | Zustand |
| 画布渲染 | HTML5 Canvas API |
| 构建工具 | Vite + electron-builder |
| 语言 | TypeScript (strict mode) |

---

## 2. 项目结构

```
qcux/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 主进程入口，窗口管理
│   ├── preload.ts               # 预加载脚本，暴露 IPC 接口
│   └── ipc/                     # IPC 通信处理
│       └── fileHandlers.ts      # 文件读写、导出处理
├── src/                         # 渲染进程 (React)
│   ├── main.tsx                 # React 入口
│   ├── App.tsx                  # 根组件，路由/视图切换
│   ├── types/                   # 类型定义
│   │   ├── project.ts           # 项目数据模型
│   │   ├── element.ts           # 元素类型定义
│   │   └── ui.ts                # UI 状态类型
│   ├── store/                   # Zustand 状态管理
│   │   ├── projectStore.ts      # 项目核心数据 store
│   │   ├── uiStore.ts           # UI 交互状态 store
│   │   └── viewportStore.ts     # 视口状态 store
│   ├── views/                   # 主视图
│   │   ├── InteractionView/     # 交互设计界面
│   │   │   ├── InteractionView.tsx
│   │   │   ├── InteractionToolbar.tsx
│   │   │   ├── InteractionToolbox.tsx
│   │   │   └── AddPageDialog.tsx
│   │   └── PageDesignView/      # 界面设计界面
│   │       ├── PageDesignView.tsx
│   │       ├── PageDesignToolbar.tsx
│   │       └── PageDesignToolbox.tsx
│   ├── canvas/                  # Canvas 渲染引擎
│   │   ├── InteractionCanvas.ts # 交互画布渲染
│   │   ├── PageDesignCanvas.ts  # 页面设计画布渲染
│   │   ├── hitTest.ts           # 碰撞检测工具
│   │   ├── viewport.ts          # 视口变换 (缩放/平移)
│   │   └── renderers/           # 各类型元素渲染器
│   │       ├── pageRenderer.ts
│   │       ├── objectRenderer.ts
│   │       ├── textRenderer.ts
│   │       ├── buttonRenderer.ts
│   │       ├── linkRenderer.ts
│   │       └── selectionRenderer.ts
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useCanvas.ts         # Canvas 初始化与生命周期
│   │   ├── useViewport.ts       # 视口交互 (缩放/平移)
│   │   └── useDragDrop.ts       # 拖拽交互
│   ├── services/                # 业务逻辑层
│   │   ├── projectService.ts    # 项目 CRUD 操作
│   │   ├── exportService.ts     # 项目导出逻辑
│   │   └── fileService.ts       # 文件读写 (通过 IPC)
│   └── utils/                   # 工具函数
│       ├── id.ts                # ID 生成
│       ├── geometry.ts          # 几何计算
│       └── constants.ts         # 常量定义
├── export-template/             # 导出网页模板
│   └── template.html            # 独立网页模板
├── assets/                      # 静态资源
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.yml
└── ARCHITECTURE.md
```

---

## 3. 数据模型

### 3.1 项目文件格式 (JSON)

```typescript
// 存储于 .qcux.json 文件
interface ProjectFile {
  version: string;          // 文件格式版本号，如 "1.0"
  metadata: {
    name: string;
    createdAt: string;      // ISO 8601
    modifiedAt: string;
  };
  pages: Page[];
  links: Link[];
}
```

### 3.2 页面 (Page)

```typescript
interface Page {
  id: string;               // UUID
  title: string;            // 界面标题
  width: number;            // 默认 1920
  height: number;           // 默认 1080
  x: number;                // 在交互画布上的 X 坐标
  y: number;                // 在交互画布上的 Y 坐标
  isLandingPage: boolean;   // 是否为入口页面
  elements: Element[];      // 页面内的 UI 元素
}
```

### 3.3 元素 (Element) - 联合类型

```typescript
interface BaseElement {
  id: string;               // UUID
  type: ElementType;
  x: number;                // 相对页面的 X 坐标
  y: number;                // 相对页面的 Y 坐标
  width: number;            // 元素宽度
  height: number;           // 元素高度
  zIndex: number;           // 层级，新元素最高
}

type ElementType = 'object' | 'text' | 'button';

interface ObjectElement extends BaseElement {
  type: 'object';
  name: string;             // 物件名称，默认 "object"
}

interface TextElement extends BaseElement {
  type: 'text';
  content: string;          // 文字内容，默认 "TEXT"
  fontSize: number;         // 字体大小，默认 16
}

interface ButtonElement extends BaseElement {
  type: 'button';
  content: string;          // 按钮文字，默认 "Button"
  fontSize: number;         // 字体大小，默认 16
}

type Element = ObjectElement | TextElement | ButtonElement;
```

### 3.4 交互链接 (Link)

```typescript
interface Link {
  id: string;
  sourcePageId: string;     // 源页面 ID
  sourceElementId: string;  // 触发交互的元素 ID
  targetPageId: string;     // 目标页面 ID
}
```

### 3.5 运行时 UI 状态

```typescript
interface UIState {
  currentView: 'interaction' | 'pageDesign';
  currentPageId: string | null;
  isAddPageDialogOpen: boolean;
  isLinkCreationMode: boolean;
  linkSourceElementId: string | null;
}

interface ProjectStoreState {
  project: ProjectFile;
  projectPath: string | null; // Electron 中为真实路径，网页模式中通常为导入文件名或 null
  isDirty: boolean;           // 仅在持久化项目数据发生变化后置为 true
}
```

---

## 4. 组件架构

### 4.1 组件树

```
<App>
  ├── <InteractionView>              (currentView === 'interaction')
  │   ├── <InteractionToolbar>
  │   │   ├── [打开项目]
  │   │   ├── [保存项目]
  │   │   ├── [导出]
  │   │   ├── [新增界面]
  │   │   ├── [删除界面]             (disabled 当无选中)
  │   │   └── [设置 Landing Page]    (disabled 当无选中)
  │   ├── <InteractionCanvas />      (HTML5 Canvas)
  │   └── <InteractionToolbox>
  │       ├── [显示全局]
  │       └── [添加交互]             (visible 当有选中页面)
  │
  ├── <PageDesignView>               (currentView === 'pageDesign')
  │   ├── <PageDesignToolbar>
  │   │   ├── [添加物件]
  │   │   ├── [添加文字]
  │   │   ├── [添加按钮]
  │   │   └── [退出到交互设计界面]
  │   ├── <PageDesignCanvas />       (HTML5 Canvas)
  │   └── <PageDesignToolbox>        (内容根据选中元素类型变化)
  │       ├── <ObjectProperties />
  │       ├── <TextProperties />
  │       └── <ButtonProperties />
  │
  ├── <AddPageDialog />              (模态框)
  └── <ElementListDialog />          (添加交互时选择元素)
```

### 4.2 视图切换逻辑

```
打开程序 → InteractionView（默认，新建空项目）
         ↓ 点击"新增界面" → 弹出 AddPageDialog → 确定 → 跳转 PageDesignView
         ↓ 双击已有界面 → 跳转 PageDesignView
PageDesignView → 点击"退出" → 返回 InteractionView
```

---

## 5. 状态管理 (Zustand)

### 5.1 Store 设计

#### projectStore - 项目核心数据

```typescript
interface ProjectStore {
  // 状态
  project: ProjectFile | null;
  projectPath: string | null;

  // 页面操作
  addPage: (title: string, width: number, height: number) => Page;
  removePage: (pageId: string) => void;
  updatePagePosition: (pageId: string, x: number, y: number) => void;
  setLandingPage: (pageId: string) => void;

  // 元素操作
  addElement: (pageId: string, element: Omit<Element, 'id' | 'zIndex'>) => Element;
  removeElement: (pageId: string, elementId: string) => void;
  updateElement: (pageId: string, elementId: string, updates: Partial<Element>) => void;

  // 链接操作
  addLink: (sourcePageId: string, sourceElementId: string, targetPageId: string) => void;
  removeLink: (linkId: string) => void;

  // 项目操作
  newProject: () => void;
  loadProject: (data: ProjectFile, path: string) => void;
  getSerializedProject: () => ProjectFile;
}
```

#### uiStore - UI 交互状态

```typescript
interface UIStore {
  currentView: 'interaction' | 'pageDesign';
  currentPageId: string | null;
  selectedPageId: string | null;
  selectedElementId: string | null;
  isDirty: boolean;
  isAddPageDialogOpen: boolean;
  isLinkCreationMode: boolean;
  linkSourcePageId: string | null;
  linkSourceElementId: string | null;

  navigateToInteraction: () => void;
  navigateToPageDesign: (pageId: string) => void;
  selectPage: (pageId: string | null) => void;
  selectElement: (elementId: string | null) => void;
  openAddPageDialog: () => void;
  closeAddPageDialog: () => void;
  startLinkCreation: (pageId: string, elementId: string) => void;
  cancelLinkCreation: () => void;
}
```

#### viewportStore - 视口状态

```typescript
interface ViewportStore {
  interactionViewport: Viewport;
  pageDesignViewport: Viewport;

  zoom: (view: 'interaction' | 'pageDesign', delta: number, centerX: number, centerY: number) => void;
  pan: (view: 'interaction' | 'pageDesign', dx: number, dy: number) => void;
  fitAll: () => void;        // 显示全局
  fitPage: (page: Page) => void;  // 最大化居中单个页面
}

interface Viewport {
  scale: number;    // 缩放比例 (0.1 ~ 5.0)
  offsetX: number;
  offsetY: number;
}
```

---

## 6. Canvas 渲染引擎

### 6.1 整体架构

```
渲染循环 (requestAnimationFrame)
  │
  ├── 1. 清除画布
  ├── 2. 应用视口变换 (ctx.setTransform)
  ├── 3. 按 z-order 渲染所有对象
  │     ├── InteractionCanvas: pages → links → selection
  │     └── PageDesignCanvas: pageBg → elements → selectionHandles
  └── 4. 恢复变换
```

### 6.2 坐标系统

```
屏幕坐标 (screen) ──[视口变换]──→ 世界坐标 (world)
                                     │
                                     ├── 页面坐标 (page local)
                                     │     └── 元素坐标 (element local)
                                     │
屏幕坐标 → 世界坐标: world = (screen - offset) / scale
世界坐标 → 屏幕坐标: screen = world * scale + offset
```

### 6.3 InteractionCanvas 渲染

```
渲染顺序:
1. 背景网格
2. 各页面缩略图（裁剪到页面尺寸）
   - 页面背景色填充
   - 页面内元素缩略渲染
   - 页面边框
   - 选中页面高亮边框
3. 页面标题文字（缩略图上方居中）
4. Landing Page 标识
5. 交互链接线（红色折线箭头）
6. 拖动中的临时箭头（创建链接时）
```

### 6.4 PageDesignCanvas 渲染

```
渲染顺序:
1. 画布背景
2. 页面边界框
3. 所有元素（按 zIndex 升序）
   - ObjectElement: 填充矩形 + 对角线 + 居中名称
   - TextElement: 文字内容
   - ButtonElement: 填充矩形 + 带下划线文字
4. 选中元素的 8 个拖拽手柄（四角 + 四边中点）
```

### 6.5 碰撞检测 (Hit Testing)

```
坐标逆向变换: screen → world → 判断点是否在对象 bounding box 内
优先级: zIndex 最高的先命中
考虑视口缩放: distance 需除以 scale
```

---

## 7. 交互流程

### 7.1 交互设计界面交互

```
鼠标左键点击页面缩略图 → 选中该页面（高亮边框）
鼠标左键点击空白区域 → 取消选中
鼠标左键拖拽页面 → 移动页面位置
鼠标滚轮 → 以鼠标位置为中心缩放
鼠标中键拖拽 → 平移画布
双击页面缩略图 → 进入界面设计界面
点击"显示全局" → 计算所有页面包围盒，最大化居中
```

### 7.2 界面设计界面交互

```
鼠标左键点击元素 → 选中该元素（显示 8 个手柄）
鼠标左键点击空白 → 取消选中
鼠标左键拖拽元素 → 移动元素位置
鼠标左键拖拽手柄 → 调整元素尺寸
鼠标滚轮 → 缩放画布
鼠标中键拖拽 → 平移画布
```

### 7.3 添加交互链接流程

```
1. 在交互设计界面选中一个页面
2. Toolbox 显示"添加交互"按钮 → 点击
3. 弹出该页面元素列表对话框
4. 选中一个元素 → 进入链接创建模式
5. 鼠标从该页面出发出现临时箭头
6. 点击另一个页面 → 创建链接（红色折线箭头）
7. 点击空白或按 ESC → 取消链接创建
```

---

## 8. Electron 架构

### 8.1 进程模型

```
┌─────────────────────────────────────────┐
│              Main Process               │
│  ┌───────────────────────────────────┐  │
│  │  BrowserWindow 管理               │  │
│  │  窗口菜单、标题栏                 │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  IPC Handlers                     │  │
│  │  - 文件对话框 (打开/保存)         │  │
│  │  - 文件读写                       │  │
│  │  - 导出 HTML                      │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ IPC (contextBridge)
┌──────────────▼──────────────────────────┐
│           Renderer Process              │
│  ┌───────────────────────────────────┐  │
│  │  React App                        │  │
│  │  - Canvas 渲染                    │  │
│  │  - UI 交互                        │  │
│  │  - 状态管理                       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 8.2 IPC 接口设计

```typescript
// preload.ts 暴露给渲染进程的 API
interface ElectronAPI {
  // 文件操作
  openProject: () => Promise<{ data: ProjectFile; path: string } | null>;
  saveProject: (path: string, data: ProjectFile) => Promise<boolean>;
  saveProjectAs: (data: ProjectFile) => Promise<string | null>;

  // 导出
  exportHTML: (html: string) => Promise<boolean>;

  // 对话框
  showSaveDialog: () => Promise<string | null>;
  showOpenDialog: () => Promise<string | null>;
}
```

---

## 9. 导出服务

### 9.1 导出逻辑

将项目数据生成为单个自包含 HTML 文件：

```typescript
// exportService.ts
function generateExportHTML(project: ProjectFile): string {
  // 1. 内联所有页面数据为 JSON
  // 2. 渲染每个页面的 HTML/CSS
  // 3. 生成 JS 切换逻辑
  // 4. 注入模板
  return html;
}
```

### 9.2 导出 HTML 行为

- 初始显示 landing page
- 点击有链接的元素时，切换到对应页面
- 所有页面通过 CSS `display: none/block` 切换
- 完全离线可用，无外部依赖

---

## 10. 关键算法

### 10.1 "显示全局" 算法

```
输入: 所有页面的位置和尺寸
1. 计算所有页面的包围盒 (minX, minY, maxX, maxY)
2. 计算包围盒中心点和尺寸
3. 计算使包围盒适配窗口的缩放比例:
   scale = min(canvasWidth / bboxWidth, canvasHeight / bboxHeight)
4. 设置视口偏移使包围盒居中:
   offsetX = (canvasWidth - bboxWidth * scale) / 2 - minX * scale
   offsetY = (canvasHeight - bboxHeight * scale) / 2 - minY * scale
```

### 10.2 折线箭头渲染

```
从源元素中心出发 → 起点绘制圆圈 → 根据源点和目标页面的相对位置，自动选择目标页面的最近侧边
若主要位移是水平，则箭头从左侧或右侧进入目标页面；若主要位移是垂直，则箭头从上侧或下侧进入目标页面
使用 ctx.lineTo 绘制折线，ctx.fill 绘制箭头三角形，起点圆圈与线条同步高亮
```

### 10.3 zIndex 管理

```
新元素 zIndex = max(allElements.zIndex) + 1
删除元素不影响其他元素的 zIndex
拖拽排序不改变 zIndex（保持创建顺序）
```

---

## 11. 文件流程图

```
启动应用
  │
  ├── 用户打开已有项目
  │     └── Main Process: 文件对话框 → 读取 JSON → IPC 发送到 Renderer
  │           └── projectStore.loadProject()
  │
  ├── 用户保存项目
  │     ├── 有已保存路径 → 直接写入
  │     └── 无路径 → Main Process: 保存对话框 → 写入 JSON
  │           └── 保存成功后 projectStore.markProjectSaved()，清除 isDirty
  │
  └── 用户导出
        └── exportService.generateExportHTML() → Main Process: 写入 .html 文件
```

补充说明：

- Renderer 会基于 `projectPath` 和 `isDirty` 同步窗口标题，格式为 `路径或 Untitled` + 可选未保存标记 `•`
- Electron 模式支持“已有路径则直接覆盖保存”的标准桌面逻辑
- 网页模式下保存仍然通过浏览器下载实现，因此不会获得稳定的真实磁盘路径

---

## 12. 开发计划 (建议)

| 阶段 | 内容 | 预计产出 |
|------|------|----------|
| P0 | 项目脚手架、数据模型、Zustand Store | 可运行的空 Electron 应用 |
| P1 | PageDesignView + Canvas 渲染 + 元素操作 | 可编辑单个页面 |
| P2 | InteractionView + Canvas 渲染 + 页面管理 | 可管理多页面 |
| P3 | 交互链接创建与渲染 | 可添加页面跳转 |
| P4 | 文件读写、导出 HTML | 可保存/加载/导出 |
| P5 | Electron 打包、窗口菜单、发布 | 可独立运行的桌面应用 |

---

## 13. 附录：默认值汇总

| 属性 | 默认值 |
|------|--------|
| 页面宽度 | 1920 |
| 页面高度 | 1080 |
| Object 名称 | "object" |
| Text 内容 | "TEXT" |
| Button 内容 | "Button" |
| Text 字体大小 | 16 |
| Button 字体大小 | 16 |
| Landing Page | 第一个创建的页面 |
