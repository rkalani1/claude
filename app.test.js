/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('readChoice', () => {
  let app;
  let buttons;
  let urlParamsStore;

  beforeEach(() => {
    jest.resetModules();

    // We can intercept URLSearchParams since app.js does: const urlParams = new URLSearchParams(window.location.search);
    urlParamsStore = new Map();

    const OriginalURLSearchParams = global.URLSearchParams;
    global.URLSearchParams = jest.fn().mockImplementation(() => {
      return {
        get: (key) => urlParamsStore.get(key) || null,
        has: (key) => urlParamsStore.has(key),
        set: (key, value) => urlParamsStore.set(key, value),
        toString: () => Array.from(urlParamsStore.entries()).map(([k, v]) => `${k}=${v}`).join('&')
      };
    });

    const localStorageMock = (function() {
      let store = {};
      return {
        getItem: function(key) {
          return store[key] || null;
        },
        setItem: function(key, value) {
          store[key] = value.toString();
        },
        clear: function() {
          store = {};
        }
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });

    // Mock replaceState to avoid jsdom navigation errors
    Object.defineProperty(window.history, 'replaceState', {
      value: jest.fn(),
      writable: true
    });

    const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
    document.body.innerHTML = html;

    app = require('./app.js');
    buttons = Array.from(document.querySelectorAll('.surface-btn')).slice(0, 2);
  });

  afterEach(() => {
    global.URLSearchParams = URLSearchParams; // Restore original
  });

  it('returns fallback when no URL or storage value exists', () => {
    expect(app.readChoice('myKey', buttons, 'data-surface', 'fallback')).toBe('fallback');
  });

  it('returns URL value when it exists and is valid', () => {
    urlParamsStore.set('myKey', 'chat');

    const chatBtn = document.querySelector('[data-surface="chat"]');
    expect(app.readChoice('myKey', [chatBtn], 'data-surface', 'fallback')).toBe('chat');
  });

  it('returns fallback when URL value exists but is not valid', () => {
    urlParamsStore.set('myKey', 'invalid_surface');

    const chatBtn = document.querySelector('[data-surface="chat"]');
    expect(app.readChoice('myKey', [chatBtn], 'data-surface', 'fallback')).toBe('fallback');
  });

  it('returns storage value when valid and no URL value exists', () => {
    window.localStorage.setItem('learnClaude:myKey', 'chat');

    const chatBtn = document.querySelector('[data-surface="chat"]');
    expect(app.readChoice('myKey', [chatBtn], 'data-surface', 'fallback')).toBe('chat');
  });

  it('returns fallback when storage value exists but is not valid', () => {
    window.localStorage.setItem('learnClaude:myKey', 'invalid_surface');

    const chatBtn = document.querySelector('[data-surface="chat"]');
    expect(app.readChoice('myKey', [chatBtn], 'data-surface', 'fallback')).toBe('fallback');
  });

  it('prioritizes URL value over storage value if both are valid', () => {
    urlParamsStore.set('myKey', 'project');
    window.localStorage.setItem('learnClaude:myKey', 'chat');

    const chatBtn = document.querySelector('[data-surface="chat"]');
    const projectBtn = document.querySelector('[data-surface="project"]');

    expect(app.readChoice('myKey', [chatBtn, projectBtn], 'data-surface', 'fallback')).toBe('project');
  });
});
