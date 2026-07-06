
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

  describe('setActiveChoice', () => {
    test('toggles is-active class and aria-pressed attribute correctly', () => {
      const button1 = document.createElement('button');
      button1.setAttribute('data-choice', 'choiceA');
      button1.setAttribute('aria-pressed', 'false');

      const button2 = document.createElement('button');
      button2.setAttribute('data-choice', 'choiceB');
      button2.setAttribute('aria-pressed', 'false');

      const button3 = document.createElement('button');
      button3.setAttribute('data-choice', 'choiceC');
      button3.classList.add('is-active');
      button3.setAttribute('aria-pressed', 'true');

      const buttons = [button1, button2, button3];

      app.setActiveChoice(buttons, 'data-choice', 'choiceB');

      expect(button1.classList.contains('is-active')).toBe(false);
      expect(button1.getAttribute('aria-pressed')).toBe('false');

      expect(button2.classList.contains('is-active')).toBe(true);
      expect(button2.getAttribute('aria-pressed')).toBe('true');

      expect(button3.classList.contains('is-active')).toBe(false);
      expect(button3.getAttribute('aria-pressed')).toBe('false');
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

  describe('setMission', () => {
    test('updates DOM and state with valid mission', () => {
      const missionTitle = document.getElementById('mission-output-title');
      const missionPrompt = document.getElementById('mission-prompt');

      app.setMission('document');

      expect(missionTitle.textContent).toBe('Document');
      expect(missionPrompt.value).toContain('Help me improve this document.');

      const activeButton = document.querySelector('button[data-mission="document"]');
      expect(activeButton.classList.contains('is-active')).toBe(true);

      expect(window.localStorage.getItem('learnClaude:mission')).toBe('document');
    });

    test('falls back to email when invalid mission is provided', () => {
      const missionTitle = document.getElementById('mission-output-title');
      const missionPrompt = document.getElementById('mission-prompt');

      app.setMission('invalid-mission');

      expect(missionTitle.textContent).toBe('Email or message');
      expect(missionPrompt.value).toContain('I need to write an email or message.');

      expect(window.localStorage.getItem('learnClaude:mission')).toBe('email');
    });

    test('does not persist state when persist is false', () => {
      window.localStorage.clear();
      app.setMission('document', { persist: false });

      expect(window.localStorage.getItem('learnClaude:mission')).toBeNull();
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

  describe('showToast', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('adds is-visible class and sets text content', () => {
      const toast = document.getElementById('toast');
      app.showToast('Test Message');

      expect(toast.textContent).toBe('Test Message');
      expect(toast.classList.contains('is-visible')).toBe(true);
    });

    test('removes is-visible class after 1800ms', () => {
      const toast = document.getElementById('toast');
      app.showToast('Test Message');

      expect(toast.classList.contains('is-visible')).toBe(true);

      jest.advanceTimersByTime(1799);
      expect(toast.classList.contains('is-visible')).toBe(true);

      jest.advanceTimersByTime(1);
      expect(toast.classList.contains('is-visible')).toBe(false);
    });

    test('clears previous timeout if called again before timeout completes', () => {
      const toast = document.getElementById('toast');
      app.showToast('First Message');

      jest.advanceTimersByTime(1000);

      app.showToast('Second Message');
      expect(toast.textContent).toBe('Second Message');

      // Advance by 800ms more. If the first timeout wasn't cleared, it would hide now.
      jest.advanceTimersByTime(800);
      expect(toast.classList.contains('is-visible')).toBe(true);

      // Advance by another 1000ms to complete the second timeout
      jest.advanceTimersByTime(1000);
      expect(toast.classList.contains('is-visible')).toBe(false);
    });

    test('does nothing if toast element does not exist', () => {
      const originalToast = document.getElementById('toast');
      originalToast.parentNode.removeChild(originalToast);

      // Should not throw
      expect(() => {
        app.showToast('Test Message');
      }).not.toThrow();
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
