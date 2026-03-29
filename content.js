// Content script (isolated world) - UI and download logic
(function () {
  'use strict';

  const subtitles = [];
  let panel = null;
  let button = null;

  window.addEventListener('message', (event) => {
    if (event.data?.type !== '__NSD__') return;

    const { url, content } = event.data.payload;
    if (subtitles.some((s) => s.url === url)) return;

    const lang = detectLanguage(content);
    subtitles.push({ url, content, lang, timestamp: Date.now() });
    updateButton();
    console.log(`[NSD] Captured: ${lang} (${(content.length / 1024).toFixed(1)}KB)`);
  });

  function detectLanguage(content) {
    const match =
      content.match(/xml:lang="([^"]+)"/) || content.match(/\slang="([^"]+)"/);
    return match ? match[1] : 'unknown';
  }

  function createButton() {
    button = document.createElement('div');
    button.id = 'nsd-button';
    button.textContent = 'SUB';
    button.title = 'Netflix Subtitle Downloader';
    button.addEventListener('click', togglePanel);
    document.body.appendChild(button);
  }

  function createPanel() {
    panel = document.createElement('div');
    panel.id = 'nsd-panel';
    panel.innerHTML = `
      <div class="nsd-header">
        <span>Subtitles Found</span>
        <span class="nsd-close">&times;</span>
      </div>
      <div class="nsd-list"></div>
      <div class="nsd-footer">Play a video to capture subtitles</div>
    `;
    panel.querySelector('.nsd-close').addEventListener('click', () => {
      panel.classList.remove('nsd-visible');
    });
    document.body.appendChild(panel);
  }

  function togglePanel() {
    if (!panel) createPanel();
    updatePanel();
    panel.classList.toggle('nsd-visible');
  }

  function updateButton() {
    if (!button) createButton();
    button.dataset.count = subtitles.length;
    button.classList.add('nsd-has-subs');
  }

  function updatePanel() {
    if (!panel) return;
    const list = panel.querySelector('.nsd-list');
    const footer = panel.querySelector('.nsd-footer');

    if (subtitles.length === 0) {
      list.innerHTML =
        '<div class="nsd-empty">No subtitles detected yet.<br>Start playing a video.</div>';
      footer.style.display = 'block';
      return;
    }

    footer.style.display = 'none';
    list.innerHTML = subtitles
      .map(
        (sub, i) => `
      <div class="nsd-item">
        <span class="nsd-lang">${sub.lang}</span>
        <span class="nsd-size">${(sub.content.length / 1024).toFixed(1)}KB</span>
        <button class="nsd-btn nsd-btn-srt" data-index="${i}">SRT</button>
        <button class="nsd-btn nsd-btn-raw" data-index="${i}">Raw</button>
      </div>
    `
      )
      .join('');

    list.querySelectorAll('.nsd-btn-srt').forEach((btn) => {
      btn.addEventListener('click', () => downloadSRT(parseInt(btn.dataset.index)));
    });
    list.querySelectorAll('.nsd-btn-raw').forEach((btn) => {
      btn.addEventListener('click', () => downloadRaw(parseInt(btn.dataset.index)));
    });
  }

  function downloadSRT(index) {
    const sub = subtitles[index];
    if (!sub) return;

    const srt = window.__NSD_Parser.toSRT(sub.content);
    if (!srt) {
      alert('Failed to parse subtitle format');
      return;
    }

    const title = getVideoTitle();
    download(`${title}.${sub.lang}.srt`, srt);
  }

  function downloadRaw(index) {
    const sub = subtitles[index];
    if (!sub) return;

    const title = getVideoTitle();
    const ext = sub.content.includes('WEBVTT') ? 'vtt' : 'ttml';
    download(`${title}.${sub.lang}.${ext}`, sub.content);
  }

  function download(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getVideoTitle() {
    const el =
      document.querySelector('[data-uia="video-title"]') ||
      document.querySelector('.video-title h4') ||
      document.querySelector('.ellipsize-text');
    let title = el?.textContent?.trim() || 'netflix-subtitle';
    return title.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 100);
  }

  // Create button on Netflix pages
  if (window.location.hostname.includes('netflix.com')) {
    createButton();
  }
})();
