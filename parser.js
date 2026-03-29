// TTML/DFXP and WebVTT to SRT converter
window.__NSD_Parser = {
  toSRT(content) {
    if (content.includes('WEBVTT')) return this.vttToSRT(content);
    if (content.includes('<tt') || content.includes('<?xml')) return this.ttmlToSRT(content);
    return null;
  },

  ttmlToSRT(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const ns = 'http://www.w3.org/ns/ttml';

    let pElements = doc.getElementsByTagNameNS(ns, 'p');
    if (pElements.length === 0) {
      pElements = doc.getElementsByTagName('p');
    }

    const entries = [];
    for (let i = 0; i < pElements.length; i++) {
      const p = pElements[i];
      const begin = p.getAttribute('begin');
      const end = p.getAttribute('end');
      if (!begin || !end) continue;

      const text = this.extractText(p).trim();
      if (!text) continue;

      entries.push({
        begin: this.toSRTTime(begin),
        end: this.toSRTTime(end),
        text,
      });
    }

    return entries.map((e, i) => `${i + 1}\n${e.begin} --> ${e.end}\n${e.text}\n`).join('\n');
  },

  extractText(node) {
    let text = '';
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      } else if (child.nodeName.toLowerCase() === 'br') {
        text += '\n';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        text += this.extractText(child);
      }
    }
    return text;
  },

  vttToSRT(vtt) {
    const lines = vtt.split('\n');
    const entries = [];
    let i = 0;

    // Skip header lines until first cue
    while (i < lines.length && !lines[i].includes('-->')) i++;

    let index = 1;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.includes('-->')) {
        const parts = line.split('-->').map((s) => s.trim());
        const begin = this.vttTimeToSRT(parts[0]);
        const end = this.vttTimeToSRT(parts[1]?.split(' ')[0] || ''); // strip position metadata
        i++;

        let text = '';
        while (i < lines.length && lines[i].trim() !== '') {
          // Strip VTT tags like <c.color>, <b>, etc.
          const cleaned = lines[i].replace(/<[^>]+>/g, '').trim();
          if (cleaned) text += (text ? '\n' : '') + cleaned;
          i++;
        }
        if (text) {
          entries.push({ index: index++, begin, end, text });
        }
      }
      i++;
    }

    return entries.map((e) => `${e.index}\n${e.begin} --> ${e.end}\n${e.text}\n`).join('\n');
  },

  toSRTTime(time) {
    if (!time) return '00:00:00,000';

    // Netflix tick format (10,000 ticks = 1ms)
    if (time.endsWith('t')) {
      return this.msToSRTTime(Math.floor(parseInt(time) / 10000));
    }

    // Standard HH:MM:SS.mmm - replace last dot with comma
    return time.replace(/\.(\d{3})/, ',$1');
  },

  vttTimeToSRT(time) {
    if (!time) return '00:00:00,000';
    // VTT uses dots, SRT uses commas. Also VTT may omit hours.
    let t = time.trim();
    const parts = t.split(':');
    if (parts.length === 2) t = '00:' + t; // add missing hours
    return t.replace('.', ',');
  },

  msToSRTTime(ms) {
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    const mil = String(ms % 1000).padStart(3, '0');
    return `${h}:${m}:${s},${mil}`;
  },
};
