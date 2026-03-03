# ChatGPTab Privacy Policy

**Last updated:** March 2025

## Overview

ChatGPTab is a browser extension that lets you paste the visible content of another browser tab into the ChatGPT input field. This privacy policy describes what data the extension can access and how it is used.

## Single Purpose

The extension has one purpose: to allow you to paste content from any open tab into the ChatGPT prompt box on chatgpt.com or chat.openai.com. No other functionality is provided.

## What Data We Access

- **Tab list:** The extension uses the Chrome `tabs` permission to show buttons for your open tabs (title and URL) on the ChatGPT page so you can choose which tab’s content to paste. This information is only used to display the buttons and is not stored, logged, or sent to any server.

- **Tab content:** When you click a tab button, the extension runs a script in that tab to read its current HTML. That content is converted to plain text/markdown in memory and pasted into the ChatGPT input field. Content is processed only on your device and is not stored or transmitted to us or any third party except when you submit the prompt to OpenAI (ChatGPT) yourself.

## What We Do Not Do

- We do **not** collect, store, or transmit any personal data.
- We do **not** sell or transfer user data to third parties.
- We do **not** use or transfer user data for purposes unrelated to the extension’s single purpose.
- We do **not** use or transfer user data for creditworthiness or lending.
- All processing happens locally in your browser; no data is sent to our servers (we do not operate any server for this extension).

## Permissions

- **tabs:** Used only to list open tabs and show them as buttons so you can select which tab’s content to paste.
- **scripting:** Used only to run a one-time script in the tab you click to read its HTML for conversion and pasting.
- **Host access (chatgpt.com / chat.openai.com):** Required to add the tab buttons and paste content into the ChatGPT input on those pages.
- **Host access (<all_urls>):** Required so that when you click a tab button, the extension can read that tab’s content regardless of which site it is (the tab could be any website you have open).

## Contact

If you have questions about this privacy policy or the extension, please open an issue or contact the developer via the extension’s listing or repository.
