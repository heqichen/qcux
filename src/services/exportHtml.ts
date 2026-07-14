import type { ProjectFile } from '@/types/project';

export function generateExportHTML(project: ProjectFile): string {
  const pagesJson = JSON.stringify(project.pages);
  const landingPage = project.pages.find((page) => page.isLandingPage) || project.pages[0];
  const linksJson = JSON.stringify(project.links.map((link) => ({
    ...link,
    transition: link.transition ?? 'instant',
  })));

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${project.metadata.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%}
body{font-family:sans-serif;overflow:hidden;background:#dbe4f0;color:#0f172a}
#app{width:100%;height:100%}
.mock-shell{display:flex;flex-direction:column;width:100%;height:100%}
.mock-header{height:64px;min-height:64px;display:flex;align-items:center;justify-content:center;padding:0 24px;background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.95));border-bottom:1px solid rgba(148,163,184,0.4);box-shadow:0 10px 30px rgba(148,163,184,0.2)}
.mock-title{font-size:18px;font-weight:600;letter-spacing:0.02em;color:#0f172a;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mock-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:32px;background:
  radial-gradient(circle at 20% 20%, rgba(255,255,255,0.85), transparent 28%),
  radial-gradient(circle at 80% 18%, rgba(191,219,254,0.8), transparent 24%),
  radial-gradient(circle at 50% 100%, rgba(196,181,253,0.28), transparent 30%),
  linear-gradient(135deg, #eef4fb 0%, #d7e3f4 55%, #edf2f8 100%);
  overflow:hidden}
.page-frame{position:relative;flex:0 0 auto;border:1px solid rgba(148,163,184,0.55);background:#ffffff;box-shadow:0 24px 60px rgba(71,85,105,0.22), 0 0 0 12px rgba(255,255,255,0.3);overflow:hidden}
.transition-viewport{position:relative;flex:0 0 auto;overflow:hidden;border-radius:4px}
.transition-scale-layer{position:absolute;top:0;left:0;transform-origin:top left}
.element{position:absolute}
.object{border:1px solid #666;background:#fff}
.object::after{content:attr(data-name);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:14px;color:#333}
.text{border:1px dashed #999;background:#fafafa}
.button{display:flex;align-items:center;justify-content:center;border:2px solid #888;background:#e0e0e0;cursor:pointer;text-decoration:underline}
</style>
</head>
<body>
<div id="app"></div>
<script>
var pages = ${pagesJson};
var landingId = "${landingPage?.id || ''}";
var links = ${linksJson};
var currentPageId = landingId;
var isTransitioning = false;

function ensureLayout() {
  var app = document.getElementById('app');
  if (!app) {
    return null;
  }

  if (!app.firstChild) {
    app.innerHTML = '<div class="mock-shell"><header class="mock-header"><div id="mock-title" class="mock-title"></div></header><main id="mock-stage" class="mock-stage"></main></div>';
  }

  return {
    title: document.getElementById('mock-title'),
    stage: document.getElementById('mock-stage')
  };
}

function getPageScale(page, stage) {
  var stageRect = stage.getBoundingClientRect();
  var availableWidth = Math.max(stageRect.width - 32, 0);
  var availableHeight = Math.max(stageRect.height - 32, 0);
  if (!availableWidth || !availableHeight) {
    return 1;
  }

  var widthScale = availableWidth / page.width;
  var heightScale = availableHeight / page.height;
  return Math.min(1, widthScale, heightScale);
}

function getViewportScale(width, height, stage) {
  var stageRect = stage.getBoundingClientRect();
  var availableWidth = Math.max(stageRect.width - 32, 0);
  var availableHeight = Math.max(stageRect.height - 32, 0);
  if (!availableWidth || !availableHeight) {
    return 1;
  }

  return Math.min(1, availableWidth / width, availableHeight / height);
}

function createPageFrame(page, ownerPageId) {
  var container = document.createElement('div');
  container.className = 'page-frame';
  container.style.width = page.width + 'px';
  container.style.height = page.height + 'px';

  page.elements.sort(function(a, b) { return a.zIndex - b.zIndex; }).forEach(function(el) {
    var div = document.createElement('div');
    div.className = 'element ' + el.type;
    div.style.left = el.x + 'px';
    div.style.top = el.y + 'px';
    div.style.width = el.width + 'px';
    div.style.height = el.height + 'px';

    if (el.type === 'object') {
      div.setAttribute('data-name', el.name);
    } else if (el.type === 'text') {
      div.textContent = el.content;
      div.style.fontSize = el.fontSize + 'px';
    } else if (el.type === 'button') {
      div.textContent = el.content;
      div.style.fontSize = el.fontSize + 'px';
    }

    var link = links.find(function(l) {
      return l.sourcePageId === ownerPageId && l.sourceElementId === el.id;
    });
    if (link) {
      div.style.cursor = 'pointer';
      div.addEventListener('click', function() {
        if (!isTransitioning) {
          navigateByLink(ownerPageId, link);
        }
      });
    }

    container.appendChild(div);
  });

  return container;
}

function getTransitionConfig(transition) {
  switch (transition) {
    case 'slide-right':
      return { axis: 'x', targetStartX: 1, targetStartY: 0, currentEndX: -1, currentEndY: 0 };
    case 'slide-left':
      return { axis: 'x', targetStartX: -1, targetStartY: 0, currentEndX: 1, currentEndY: 0 };
    case 'slide-up':
      return { axis: 'y', targetStartX: 0, targetStartY: -1, currentEndX: 0, currentEndY: 1 };
    case 'slide-down':
      return { axis: 'y', targetStartX: 0, targetStartY: 1, currentEndX: 0, currentEndY: -1 };
    default:
      return null;
  }
}

function setFrameTranslate(frame, translateX, translateY) {
  frame.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px)';
}

function playTransition(fromPage, toPage, transition) {
  var layout = ensureLayout();
  if (!layout || !layout.stage || !layout.title) return;

  var config = getTransitionConfig(transition);
  if (!config) {
    renderPage(toPage.id);
    return;
  }

  isTransitioning = true;

  var viewportWidth = Math.max(fromPage.width, toPage.width);
  var viewportHeight = Math.max(fromPage.height, toPage.height);
  var scale = getViewportScale(viewportWidth, viewportHeight, layout.stage);

  var viewport = document.createElement('div');
  viewport.className = 'transition-viewport';
  viewport.style.width = viewportWidth * scale + 'px';
  viewport.style.height = viewportHeight * scale + 'px';

  var scaleLayer = document.createElement('div');
  scaleLayer.className = 'transition-scale-layer';
  scaleLayer.style.width = viewportWidth + 'px';
  scaleLayer.style.height = viewportHeight + 'px';
  scaleLayer.style.transform = 'scale(' + scale + ')';

  var currentFrame = createPageFrame(fromPage, fromPage.id);
  var targetFrame = createPageFrame(toPage, toPage.id);

  currentFrame.style.position = 'absolute';
  currentFrame.style.left = (viewportWidth - fromPage.width) / 2 + 'px';
  currentFrame.style.top = (viewportHeight - fromPage.height) / 2 + 'px';
  currentFrame.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease';

  targetFrame.style.position = 'absolute';
  targetFrame.style.left = (viewportWidth - toPage.width) / 2 + 'px';
  targetFrame.style.top = (viewportHeight - toPage.height) / 2 + 'px';
  targetFrame.style.transition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease';
  targetFrame.style.zIndex = '2';

  setFrameTranslate(currentFrame, 0, 0);
  setFrameTranslate(targetFrame, config.targetStartX * viewportWidth, config.targetStartY * viewportHeight);
  targetFrame.style.opacity = '0.96';

  scaleLayer.appendChild(currentFrame);
  scaleLayer.appendChild(targetFrame);
  viewport.appendChild(scaleLayer);

  layout.title.textContent = fromPage.title || '${project.metadata.name}';
  layout.stage.innerHTML = '';
  layout.stage.appendChild(viewport);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      setFrameTranslate(currentFrame, config.currentEndX * viewportWidth, config.currentEndY * viewportHeight);
      currentFrame.style.opacity = '0.72';
      setFrameTranslate(targetFrame, 0, 0);
      targetFrame.style.opacity = '1';
    });
  });

  window.setTimeout(function() {
    isTransitioning = false;
    renderPage(toPage.id);
  }, 460);
}

function navigateByLink(fromPageId, link) {
  var currentPage = pages.find(function(page) { return page.id === fromPageId; });
  var targetPage = pages.find(function(page) { return page.id === link.targetPageId; });
  if (!currentPage || !targetPage) {
    return;
  }

  var transition = link.transition || 'instant';
  if (transition === 'instant') {
    renderPage(targetPage.id);
    return;
  }

  playTransition(currentPage, targetPage, transition);
}

function renderPage(pageId) {
  currentPageId = pageId;
  var page = pages.find(function(p) { return p.id === pageId; });
  if (!page) return;

  var layout = ensureLayout();
  if (!layout || !layout.stage || !layout.title) return;

  layout.title.textContent = page.title || '${project.metadata.name}';
  layout.stage.innerHTML = '';

  var scale = getPageScale(page, layout.stage);

  var container = createPageFrame(page, page.id);
  container.style.transform = 'scale(' + scale + ')';
  container.style.transformOrigin = 'center center';

  layout.stage.appendChild(container);
}

renderPage(landingId);
window.addEventListener('resize', function() {
  if (currentPageId) {
    renderPage(currentPageId);
  }
});
</script>
</body>
</html>`;
}