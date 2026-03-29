// Main world script - intercepts fetch/XHR to capture subtitle responses
(function () {
  'use strict';

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      if (isSubtitleUrl(url)) {
        const clone = response.clone();
        const text = await clone.text();
        if (isSubtitleContent(text)) {
          notify(url, text);
        }
      }
    } catch (e) {
      // Ignore errors from non-text responses
    }

    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._nsdUrl = typeof url === 'string' ? url : url?.toString() || '';
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (this._nsdUrl && isSubtitleUrl(this._nsdUrl)) {
      this.addEventListener('load', function () {
        try {
          if (isSubtitleContent(this.responseText)) {
            notify(this._nsdUrl, this.responseText);
          }
        } catch (e) {
          // Ignore
        }
      });
    }
    return originalSend.apply(this, args);
  };

  function isSubtitleUrl(url) {
    return (
      url.includes('nflxvideo.net') ||
      url.includes('.ttml') ||
      url.includes('.dfxp') ||
      url.includes('.vtt') ||
      url.includes('subtitles')
    );
  }

  function isSubtitleContent(text) {
    if (!text || text.length < 50) return false;
    return text.includes('<tt') || text.includes('WEBVTT') || text.includes('<?xml');
  }

  function notify(url, content) {
    window.postMessage({ type: '__NSD__', payload: { url, content } }, '*');
  }
})();
