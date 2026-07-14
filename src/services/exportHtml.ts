import type { ProjectFile } from '@/types/project';

export function generateExportHTML(project: ProjectFile): string {
  const pagesJson = JSON.stringify(project.pages);
  const landingPage = project.pages.find((page) => page.isLandingPage) || project.pages[0];

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
var links = ${JSON.stringify(project.links)};
var currentPageId = landingId;

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

function renderPage(pageId) {
  currentPageId = pageId;
  var page = pages.find(function(p) { return p.id === pageId; });
  if (!page) return;

  var layout = ensureLayout();
  if (!layout || !layout.stage || !layout.title) return;

  layout.title.textContent = page.title || '${project.metadata.name}';
  layout.stage.innerHTML = '';

  var scale = getPageScale(page, layout.stage);

  var container = document.createElement('div');
  container.className = 'page-frame';
  container.style.width = page.width + 'px';
  container.style.height = page.height + 'px';
  container.style.transform = 'scale(' + scale + ')';
  container.style.transformOrigin = 'center center';

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
      return l.sourcePageId === pageId && l.sourceElementId === el.id;
    });
    if (link) {
      div.style.cursor = 'pointer';
      div.addEventListener('click', function() {
        renderPage(link.targetPageId);
      });
    }

    container.appendChild(div);
  });

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