
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

const mockIntersectionObserver = () => {
  class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = IntersectionObserver;
};

const loadApp = (query = '') => {
  window.history.replaceState(null, '', `/${query}`);
  document.documentElement.innerHTML = html.toString();
  mockIntersectionObserver();
  jest.resetModules();
  return require('./app');
};

describe('App', () => {
  let app;

  beforeEach(() => {
    document.documentElement.innerHTML = html.toString();
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
    jest.resetModules();

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    mockIntersectionObserver();

    app = require('./app');
  });

  describe('hasChoice', () => {
    test('returns true when a button has matching attribute value', () => {
      const button1 = document.createElement('button');
      button1.setAttribute('data-surface', 'chat');

      const button2 = document.createElement('button');
      button2.setAttribute('data-surface', 'project');

      const buttons = [button1, button2];

      expect(app.hasChoice(buttons, 'data-surface', 'chat')).toBe(true);
      expect(app.hasChoice(buttons, 'data-surface', 'office')).toBe(false);
    });
  });

  describe('setSurfaceFilter', () => {
    test('updates button and card visibility correctly', () => {
      const filterButton = document.querySelector('[data-surface-filter="office"]');

      app.setSurfaceFilter('office');

      expect(filterButton.classList.contains('is-active')).toBe(true);

      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        const groups = (card.getAttribute('data-surface-group') || '').split(/\s+/);
        if (groups.includes('office')) {
          expect(card.hidden).toBe(false);
        } else {
          expect(card.hidden).toBe(true);
        }
      });
    });
  });

  describe('readChoice', () => {
    test('returns fallback if neither URL nor storage has valid choice', () => {
      const button = document.createElement('button');
      button.setAttribute('data-test', 'valid');
      expect(app.readChoice('testKey', [button], 'data-test', 'fallback')).toBe('fallback');
    });

    test('returns valid value from URL query', () => {
      const queriedApp = loadApp('?surface=project');
      const buttons = Array.from(document.querySelectorAll('[data-surface]'));

      expect(queriedApp.readChoice('surface', buttons, 'data-surface', 'fallback')).toBe('project');
    });

    test('returns valid value from localStorage when URL is absent', () => {
      window.localStorage.setItem('learnClaude:surface', 'chat');
      const storedApp = loadApp('');
      const buttons = Array.from(document.querySelectorAll('[data-surface]'));

      expect(storedApp.readChoice('surface', buttons, 'data-surface', 'fallback')).toBe('chat');
    });

    test('returns fallback for invalid URL and storage values', () => {
      window.localStorage.setItem('learnClaude:surface', 'invalid-storage');
      const queriedApp = loadApp('?surface=invalid-url');
      const buttons = Array.from(document.querySelectorAll('[data-surface]'));

      expect(queriedApp.readChoice('surface', buttons, 'data-surface', 'fallback')).toBe('fallback');
    });

    test('prioritizes valid URL value over valid storage value', () => {
      window.localStorage.setItem('learnClaude:surface', 'chat');
      const queriedApp = loadApp('?surface=project');
      const buttons = Array.from(document.querySelectorAll('[data-surface]'));

      expect(queriedApp.readChoice('surface', buttons, 'data-surface', 'fallback')).toBe('project');
    });
  });

  describe('buildOptimizedPrompt', () => {
    test('updates output textarea based on selected values', () => {
      const roughPrompt = document.getElementById('rough-prompt');
      roughPrompt.value = 'Help me write an email.';

      const chatButton = document.querySelector('button[data-surface="chat"]');
      const emailButton = document.querySelector('button[data-output="email"]');

      chatButton.click();
      emailButton.click();

      const optimizedPrompt = document.getElementById('optimized-prompt');
      expect(optimizedPrompt.value).toContain('Help me write an email.');
      expect(optimizedPrompt.value).toContain('Use Sonnet 4.6 for everyday chat.');
    });
  });

  describe('copyTextFallback', () => {
    test('creates textarea and executes copy command', () => {
      document.execCommand = jest.fn().mockReturnValue(true);

      const result = app.copyTextFallback('test copy text', null);

      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(result).toBe(true);
      expect(document.querySelector('textarea[readonly="true"]')).toBeNull();
    });

    test('selects target and cleans up when fallback copy returns false', () => {
      document.execCommand = jest.fn().mockReturnValue(false);
      const target = {
        focus: jest.fn(),
        select: jest.fn(),
      };

      const result = app.copyTextFallback('test copy text', target);

      expect(result).toBe(false);
      expect(target.focus).toHaveBeenCalled();
      expect(target.select).toHaveBeenCalled();
      expect(document.querySelector('textarea[readonly="true"]')).toBeNull();
    });

    test('cleans up and returns false when execCommand throws', () => {
      const error = new Error('copy failed');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      document.execCommand = jest.fn(() => {
        throw error;
      });

      const result = app.copyTextFallback('test copy text', null);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Fallback copy failed', error);
      expect(document.querySelector('textarea[readonly="true"]')).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('copyText', () => {
    test('uses navigator.clipboard when available', async () => {
      window.isSecureContext = true;
      const writeTextMock = jest.fn().mockResolvedValue(true);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const result = await app.copyText('secure copy text', null);

      expect(writeTextMock).toHaveBeenCalledWith('secure copy text');
      expect(result).toBe(true);
    });

    test('falls back when navigator.clipboard.writeText rejects', async () => {
      window.isSecureContext = true;
      const error = new Error('clipboard denied');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      document.execCommand = jest.fn().mockReturnValue(true);
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockRejectedValue(error),
        },
      });

      const result = await app.copyText('secure copy text', null);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('secure copy text');
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(consoleSpy).toHaveBeenCalledWith('Clipboard API failed, trying fallback', error);
      expect(result).toBe(true);
      consoleSpy.mockRestore();
    });

    test('uses fallback directly when navigator.clipboard is unavailable', async () => {
      window.isSecureContext = true;
      document.execCommand = jest.fn().mockReturnValue(true);
      Object.assign(navigator, { clipboard: undefined });

      const result = await app.copyText('fallback copy text', null);

      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(result).toBe(true);
    });
  });
});

describe('Export Prompts', () => {
  let app;
  beforeEach(() => {
    jest.resetModules();
    app = require('./app');

    // Create DOM structure for export testing
    document.body.innerHTML = `
      <article>
        <h3>Card 1</h3>
        <textarea readonly id="t1" aria-label="First Prompt">Prompt 1</textarea>
      </article>
      <li>
        <textarea readonly id="t2" aria-label="Second Prompt">Prompt 2</textarea>
      </li>
    `;

    // Mock Blob and URL
    global.Blob = jest.fn();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  test('generates markdown from textareas and downloads file', () => {
    // Override window.setTimeout
    jest.useFakeTimers();

    // We also need to mock appendChild and click on the download link
    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    app.exportPrompts();

    expect(global.Blob).toHaveBeenCalled();
    const blobContent = global.Blob.mock.calls[0][0][0];
    expect(blobContent).toContain('## Card 1');
    expect(blobContent).toContain('Prompt 1');
    expect(blobContent).toContain('## Second Prompt');
    expect(blobContent).toContain('Prompt 2');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    jest.runAllTimers();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('copyTemplate', () => {
  let app;
  beforeEach(() => {
    jest.resetModules();
    app = require('./app');

    // Mock showToast
    window.showToast = jest.fn();

    document.body.innerHTML = `
      <textarea id="target-textarea">Template Text</textarea>
      <button id="copy-button">Copy</button>
    `;

    // Mock navigator clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(true),
      },
    });
    window.isSecureContext = true;
  });

  test('copies template text and updates button', async () => {
    const button = document.getElementById('copy-button');

    await app.copyTemplate('target-textarea', button, 'Custom Success');

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Template Text');
    expect(button.textContent).toBe('Copied');
  });
});
