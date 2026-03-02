# ChatGPTab

https://github.com/user-attachments/assets/f2e3cb7c-05e9-4372-9a71-0668c88b1a14

A Chrome extension that adds buttons for all your open browser tabs under the ChatGPT input field. Click any tab button to paste that tab's content as markdown directly into ChatGPT.

Built this extension to avoid having to cmd+a, cmd+v every time I wanted to give LLM context on my tabs. Also provides higher quality responses because content is injected as markdown and hidden links are retained.

Built in 42:21.

## What it does

- Shows a button for each open browser tab below the ChatGPT text input
- Clicking a button fetches that tab's HTML content
- Converts the HTML to clean markdown
- Pastes the markdown into ChatGPT with context
- Preserves any existing text in the input field

## Installation

1. Download or clone this folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the folder containing this extension
6. Visit ChatGPT - the tab buttons will appear under the text input

## Configuration

The character limit for markdown content can be adjusted in `constants.js` - currently set to 80,000 characters. if you get "input too large" make it higher. 

mit licensed

yes i know my html-to-markdown api key is here dont abuse please and thank you 
