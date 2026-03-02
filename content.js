function pasteIntoChatGPT(text, existingContent) {
  const textarea = document.querySelector('textarea#prompt-textarea, div#prompt-textarea');

  if (!textarea) {
    console.error('Could not find ChatGPT input field');
    return;
  }

  // Combine tab content with existing text
  const combinedText = existingContent ? text + '\n\n' + existingContent : text;

  // For div-based input (contenteditable)
  if (textarea.tagName === 'DIV') {
    textarea.focus();

    // Clear and set new content
    textarea.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = combinedText;
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
    textarea.value = combinedText;

    // Trigger React's onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(textarea, combinedText);

    // Dispatch input event
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Move cursor to end
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}

function injectButtons() {
  try {
    var rid;
    try { rid = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id; } catch (_) {}
    if (!rid) return;
  } catch (_) { return; }

  try {
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

  function safeSendMessage(msg, cb) {
    function done(r) { try { cb(r); } catch (_) {} }
    try {
      var valid = false;
      try { valid = typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id; } catch (_) {}
      if (!valid) { done(null); return; }
      chrome.runtime.sendMessage(msg, function(response) {
        try {
          var ok = false;
          try { ok = typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id; } catch (_) {}
          done(ok ? response : null);
        } catch (_) { done(null); }
      });
    } catch (_) {
      done(null);
    }
  }

  safeSendMessage({ action: 'getTabs' }, (tabs) => {
    if (!tabs) return;

    tabs.forEach((tab) => {
      if (!tab.url) return;
      if (tab.url.includes('chatgpt.com')) return;
      if (/^(chrome|edge|about|extension):\/\//.test(tab.url)) return;

      const button = document.createElement('button');
      button.textContent = tab.title || 'Untitled';
      button.className = 'tab-button';
      button.title = tab.url;

      button.addEventListener('click', (e) => {
        e.preventDefault();

        // Add loading state
        button.disabled = true;
        button.style.opacity = '0.5';

        safeSendMessage({ action: 'getTabContent', tabId: tab.id }, async (response) => {
          if (!response) {
            button.disabled = false;
            button.style.opacity = '1';
            return;
          }
          if (response.error) {
            console.error('Cannot read tab:', response.error);
            button.disabled = false;
            button.style.opacity = '1';
            return;
          }
          if (!response.html) {
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

            let markdown;
            try {
              markdown = (typeof html2md === 'function' ? html2md(cleanedHtml) : cleanedHtml) || '';
            } catch (convErr) {
              markdown = cleanedHtml;
            }
            let truncatedMarkdown = markdown.substring(0, CHAR_THRESHOLD);

            // Clean up the markdown
            truncatedMarkdown = truncatedMarkdown
              .replace(/https?:\/\//g, '')  // Remove https:// and http://
              .replace(/\n{3,}/g, '\n\n');   // Replace 3+ newlines with 2

            // Get existing content from the input field
            const inputField = document.querySelector('textarea#prompt-textarea, div#prompt-textarea');
            let existingContent = '';

            if (inputField) {
              if (inputField.tagName === 'DIV') {
                existingContent = inputField.textContent || '';
              } else {
                existingContent = inputField.value || '';
              }
            }

            // Format with tab content wrapper
            const tabContent = `<tab_content>
${truncatedMarkdown}
</tab_content>

Please use this content as relevant context for answering their question or completing their request:
---`;

            pasteIntoChatGPT(tabContent, existingContent);

          } catch (error) {
            if (response?.html) pasteIntoChatGPT(response.html);
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
  } catch (_) {}
}

function refreshButtons() {
  try {
    const existingContainer = document.getElementById('custom-tab-buttons');
    if (existingContainer) existingContainer.remove();
    injectButtons();
  } catch (_) {}
}

const observer = new MutationObserver(function() {
  try {
    if (!document.getElementById('custom-tab-buttons')) injectButtons();
  } catch (_) {}
});

try {
  observer.observe(document.body, { childList: true, subtree: true });
} catch (_) {}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { try { injectButtons(); } catch (_) {} });
} else {
  setTimeout(function() { try { injectButtons(); } catch (_) {} }, 1000);
}

try {
  chrome.runtime.onMessage.addListener(function(request) {
    if (request.action === 'tabsUpdated') refreshButtons();
  });
  setInterval(refreshButtons, 5000);
} catch (_) {}