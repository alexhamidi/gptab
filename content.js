function pasteIntoChatGPT(text) {
  const textarea = document.querySelector('textarea#prompt-textarea, div#prompt-textarea');

  if (!textarea) {
    console.error('Could not find ChatGPT input field');
    return;
  }

  // For div-based input (contenteditable)
  if (textarea.tagName === 'DIV') {
    textarea.focus();

    // Clear existing content
    textarea.innerHTML = '';

    // Create paragraph element with the text
    const p = document.createElement('p');
    p.textContent = text;
    textarea.appendChild(p);

    // Trigger input event
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Move cursor to end
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(textarea);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  // For textarea-based input
  else {
    textarea.focus();
    textarea.value = text;

    // Trigger React's onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(textarea, text);

    // Dispatch input event
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function injectButtons() {
  const targetSelectors = [
    'div[id="prompt-textarea"]',
    'textarea[id="prompt-textarea"]',
    'div.relative.flex.h-full.max-w-full.flex-1',
    'form.stretch'
  ];

  let targetElement = null;
  for (const selector of targetSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      targetElement = element.closest('form') || element.parentElement;
      break;
    }
  }

  if (!targetElement || document.getElementById('custom-tab-buttons')) {
    return;
  }

  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'custom-tab-buttons';
  buttonContainer.className = 'tab-button-container';

  chrome.runtime.sendMessage({ action: 'getTabs' }, (tabs) => {
    if (!tabs) return;

    tabs.forEach((tab) => {
      // Skip ChatGPT tab
      if (tab.url && tab.url.includes('chatgpt.com')) {
        return;
      }

      const button = document.createElement('button');
      button.textContent = tab.title || 'Untitled';
      button.className = 'tab-button';
      button.title = tab.url;

      button.addEventListener('click', (e) => {
        e.preventDefault();

        // Add loading state
        button.disabled = true;
        button.style.opacity = '0.5';

        chrome.runtime.sendMessage({
          action: 'getTabContent',
          tabId: tab.id
        }, async (response) => {
          if (response.error) {
            console.error('Error getting tab content:', response.error);
            button.disabled = false;
            button.style.opacity = '1';
            return;
          }

          try {
            // Clean HTML before conversion
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = response.html;

            // Remove script tags, style tags, and comments
            const elementsToRemove = tempDiv.querySelectorAll('script, style, noscript, iframe, object, embed, svg');
            elementsToRemove.forEach(el => el.remove());

            // Remove all comments
            const walker = document.createTreeWalker(
              tempDiv,
              NodeFilter.SHOW_COMMENT,
              null,
              false
            );
            const comments = [];
            while (walker.nextNode()) {
              comments.push(walker.currentNode);
            }
            comments.forEach(comment => comment.remove());

            // Remove data attributes and inline styles
            tempDiv.querySelectorAll('*').forEach(el => {
              // Remove all data-* attributes
              for (const attr of [...el.attributes]) {
                if (attr.name.startsWith('data-') ||
                    attr.name === 'style' ||
                    attr.name === 'class' ||
                    attr.name.startsWith('aria-') ||
                    attr.name.startsWith('ng-')) {
                  el.removeAttribute(attr.name);
                }
              }
            });

            const cleanedHtml = tempDiv.innerHTML;

            const apiResponse = await fetch('https://api.html-to-markdown.com/v1/convert', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'html2md_RWnS8dPN2an_EWhmMNPTWtefPQnijeMXkFTwzrvj9P5iXLBRcYnpDQGv_EDoekhZ6Mef2r6Lkc1aGztinfDktvLEkdgR2KWRbTD25'
              },
              body: JSON.stringify({
                html: cleanedHtml
              })
            });

            const result = await apiResponse.json();
            const truncatedMarkdown = result.markdown.substring(0, 80000);

            // Format with system prompt
            const systemPrompt = `The user has pasted some context from their current browser tab to help you fulfill their query:

<tab_content>
${truncatedMarkdown}
</tab_content>

Please use this content as relevant context for answering their question or completing their request:
---

`;

            pasteIntoChatGPT(systemPrompt);

          } catch (error) {
            console.error('Error converting HTML to markdown:', error);
            pasteIntoChatGPT(response.html);
          } finally {
            button.disabled = false;
            button.style.opacity = '1';
          }
        });
      });

      buttonContainer.appendChild(button);
    });
  });

  targetElement.parentNode.insertBefore(buttonContainer, targetElement.nextSibling);
}

function refreshButtons() {
  const existingContainer = document.getElementById('custom-tab-buttons');
  if (existingContainer) {
    existingContainer.remove();
  }
  injectButtons();
}

const observer = new MutationObserver((mutations) => {
  if (!document.getElementById('custom-tab-buttons')) {
    injectButtons();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectButtons);
} else {
  setTimeout(injectButtons, 1000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'tabsUpdated') {
    refreshButtons();
  }
});

setInterval(refreshButtons, 5000);