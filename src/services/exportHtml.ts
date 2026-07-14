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
body{font-family:sans-serif;overflow:hidden}
.page{display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;overflow:auto}
.page.active{display:flex;align-items:flex-start;justify-content:flex-start}
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

function renderPage(pageId) {
  var app = document.getElementById('app');
  app.innerHTML = '';
  var page = pages.find(function(p) { return p.id === pageId; });
  if (!page) return;

  var container = document.createElement('div');
  container.className = 'page active';
  container.style.width = page.width + 'px';
  container.style.height = page.height + 'px';
  container.style.position = 'relative';

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

  app.appendChild(container);
}

renderPage(landingId);
</script>
</body>
</html>`;
}