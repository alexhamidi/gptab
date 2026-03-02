(function() {
  function getText(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    var tag = node.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style') return '';
    var out = '';
    for (var i = 0; i < node.childNodes.length; i++) {
      out += getText(node.childNodes[i]);
    }
    return out;
  }

  function blockContent(node) {
    var out = '';
    for (var i = 0; i < node.childNodes.length; i++) {
      out += walk(node.childNodes[i]);
    }
    return out;
  }

  function inlineContent(node) {
    var out = '';
    for (var i = 0; i < node.childNodes.length; i++) {
      out += walkInline(node.childNodes[i]);
    }
    return out;
  }

  function walkInline(node) {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '').replace(/\n/g, ' ');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    var tag = node.tagName.toLowerCase();
    var inner = inlineContent(node);
    switch (tag) {
      case 'strong':
      case 'b': return '**' + inner + '**';
      case 'em':
      case 'i': return '*' + inner + '*';
      case 'code': return '`' + inner + '`';
      case 'a':
        var href = node.getAttribute('href') || '';
        return href && href !== inner ? '[' + inner + '](' + href + ')' : inner;
      case 'br': return '\n';
      default: return inner;
    }
  }

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    var tag = node.tagName.toLowerCase();
    var inner = blockContent(node);
    var trimmed = inner.replace(/\n+$/, '').replace(/^\n+/, '');

    switch (tag) {
      case 'h1': return '\n# ' + getText(node).trim() + '\n\n';
      case 'h2': return '\n## ' + getText(node).trim() + '\n\n';
      case 'h3': return '\n### ' + getText(node).trim() + '\n\n';
      case 'h4': return '\n#### ' + getText(node).trim() + '\n\n';
      case 'h5': return '\n##### ' + getText(node).trim() + '\n\n';
      case 'h6': return '\n###### ' + getText(node).trim() + '\n\n';
      case 'p': return '\n' + inlineContent(node).trim() + '\n\n';
      case 'br': return '\n';
      case 'hr': return '\n---\n\n';
      case 'blockquote': return '\n> ' + trimmed.replace(/\n/g, '\n> ') + '\n\n';
      case 'pre':
        var code = node.querySelector('code');
        var text = code ? getText(code) : getText(node);
        return '\n```\n' + text + '\n```\n\n';
      case 'code':
        if (node.parentNode && node.parentNode.tagName.toLowerCase() === 'pre') return inner;
        return '`' + getText(node) + '`';
      case 'ul':
        var ulItems = [];
        for (var u = 0; u < node.children.length; u++) {
          if (node.children[u].tagName.toLowerCase() === 'li') {
            ulItems.push('- ' + walk(node.children[u]).trim().replace(/\n/g, '\n  '));
          }
        }
        return '\n' + ulItems.join('\n') + '\n\n';
      case 'ol':
        var olItems = [];
        for (var o = 0; o < node.children.length; o++) {
          if (node.children[o].tagName.toLowerCase() === 'li') {
            olItems.push((o + 1) + '. ' + walk(node.children[o]).trim().replace(/\n/g, '\n   '));
          }
        }
        return '\n' + olItems.join('\n') + '\n\n';
      case 'li': return inlineContent(node);
      case 'div':
      case 'section':
      case 'article':
      case 'main':
      case 'header':
      case 'footer':
      case 'nav':
        return '\n' + trimmed + (trimmed ? '\n\n' : '');
      case 'table':
        var rows = node.querySelectorAll('tr');
        var tbl = [];
        for (var r = 0; r < rows.length; r++) {
          var cells = rows[r].querySelectorAll('td, th');
          var row = [];
          for (var c = 0; c < cells.length; c++) row.push(getText(cells[c]).trim());
          tbl.push('| ' + row.join(' | ') + ' |');
          if (r === 0 && rows.length > 1) tbl.push('| ' + row.map(function() { return '---'; }).join(' | ') + ' |');
        }
        return '\n' + tbl.join('\n') + '\n\n';
      case 'thead':
      case 'tbody':
      case 'tfoot':
      case 'tr':
        return inner;
      case 'td':
      case 'th':
        return inner;
      default:
        return inner;
    }
  }

  window.html2md = function(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return walk(div).replace(/\n{3,}/g, '\n\n').trim();
  };
})();
