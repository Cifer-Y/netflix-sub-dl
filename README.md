# Netflix Subtitle Downloader

Chrome extension to download Netflix subtitles as SRT files.

## How it works

1. Intercepts Netflix's network requests to capture subtitle data (TTML/WebVTT)
2. Shows a floating **SUB** button on Netflix pages
3. Click to see captured subtitles and download as SRT or raw format

## Install

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select this folder
4. Go to Netflix and play a video

## Usage

- A red **SUB** button appears on the bottom right of Netflix pages
- Play a video — subtitles are captured automatically as they load
- Click the button to see available subtitles
- **SRT** — download as standard SRT format
- **Raw** — download the original TTML/WebVTT file

## Supported formats

- TTML / DFXP (Netflix's primary subtitle format)
- WebVTT
