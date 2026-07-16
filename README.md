# QCUX - UX 线框图设计工具

一个基于 Electron + React + TypeScript 的 UX 线框图快速原型设计工具。

## 功能

- 交互设计：管理多个界面、设置界面间跳转关系
- 界面设计：添加 Object / Text / Button 元素，编辑属性
- 导出为独立 HTML 网页

## 环境要求

- Node.js >= 18
- npm >= 9

## 安装

```bash
npm install
```

> 如果网络较慢，可设置代理后安装：
> ```bash
> npm config set proxy http://your-proxy:port
> npm config set https-proxy http://your-proxy:port
> npm install
> ```

## 调试

### 网页模式调试（推荐）

在浏览器中运行，方便使用 DevTools 调试：

```bash
npm run dev
```

浏览器打开 `http://localhost:5173/`。

此模式下：
- React、Zustand 状态、Canvas 渲染均可通过浏览器 DevTools 调试
- 文件操作（打开/保存/导出）通过浏览器下载 API fallback 实现
- 不支持原生文件对话框（需 Electron 环境）

### Electron 桌面模式调试

完整的 Electron 桌面应用体验：

```bash
npm run electron:dev
```

此模式下：
- 自动打开 Electron 窗口
- 支持原生文件对话框
- 如遇 `Missing X server` 错误，说明当前环境无图形界面，请使用网页模式

### 调试技巧

- React 组件：安装 React DevTools 浏览器扩展
- Zustand Store 状态：在浏览器 Console 中通过 `window.__uiStore.getState()` 和 `window.__projectStore.getState()` 查看
- Canvas 渲染：在浏览器 DevTools 中检查 `<canvas>` 元素

## 构建

### 构建生产版本

```bash
npm run build
```

产物输出到 `dist/` 目录，可直接用静态服务器部署：

```bash
cd dist && python3 -m http.server 8080
```

### 打包 Electron 桌面应用

```bash
npm run electron:build
```

产物输出到 `release/` 目录。**仅构建当前平台**的程序：
- Linux 上构建 → `release/*.AppImage`
- macOS 上构建 → `release/*.dmg`
- Windows 上构建 → `release/*.exe`

如需在 Linux 上交叉编译 Windows 版本，可使用 Docker：

```bash
docker run --rm -ti \
  --env ELECTRON_CACHE="/root/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
  -v ${PWD}:/project \
  -v ${PWD##*/}-node-modules:/project/node_modules \
  -v ~/.cache/electron:/root/.cache/electron \
  -v ~/.cache/electron-builder:/root/.cache/electron-builder \
  electronuserland/builder:wine \
  /bin/bash -c "npm install && npm run electron:build"
```

可在 `electron-builder.yml` 中修改打包配置和平台目标。

## 项目结构

```
qcux/
├── electron/            # Electron 主进程
│   ├── main.ts          # 窗口管理、IPC
│   └── preload.ts       # 预加载脚本
├── src/
│   ├── main.tsx         # React 入口
│   ├── App.tsx          # 根组件
│   ├── types/           # TypeScript 类型定义
│   ├── store/           # Zustand 状态管理
│   ├── canvas/          # Canvas 渲染引擎
│   │   └── renderers/   # 各类渲染器
│   ├── views/           # 视图组件
│   │   ├── InteractionView/
│   │   └── PageDesignView/
│   └── utils/           # 工具函数
├── ARCHITECTURE.md      # 架构设计文档
├── USER_GUIDE.md        # 用户使用文档
└── brief.md             # 需求文档
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron |
| UI 框架 | React 18 |
| 状态管理 | Zustand |
| 画布渲染 | HTML5 Canvas API |
| 构建工具 | Vite |
| 打包工具 | electron-builder |
| 语言 | TypeScript |
