/**
 * @jest-environment jsdom
 */

// Mock the DOM elements required by app.js so that the IIFE runs successfully
document.body.innerHTML = `
  <input id="rough-prompt" />
  <input id="optimized-prompt" />
  <h1 id="mission-output-title"></h1>
  <div id="mission-surface"></div>
  <button id="mission-next"></button>
  <textarea id="mission-prompt"></textarea>
  <button id="fix-next"></button>
  <textarea id="fix-prompt"></textarea>
  <button id="copy-btn"></button>
  <button id="theme-toggle"></button>
`;

const { hasChoice } = require('./app.js');

describe('hasChoice', () => {
  it('should return true if any button has the specified attribute with the matching value', () => {
    const btn1 = document.createElement('button');
    btn1.setAttribute('data-test', 'value1');
    const btn2 = document.createElement('button');
    btn2.setAttribute('data-test', 'value2');
    const btn3 = document.createElement('button');
    btn3.setAttribute('data-test', 'value3');

    const buttons = [btn1, btn2, btn3];

    expect(hasChoice(buttons, 'data-test', 'value2')).toBe(true);
  });

  it('should return false if no button has the matching value', () => {
    const btn1 = document.createElement('button');
    btn1.setAttribute('data-test', 'value1');
    const btn2 = document.createElement('button');
    btn2.setAttribute('data-test', 'value2');

    const buttons = [btn1, btn2];

    expect(hasChoice(buttons, 'data-test', 'missing')).toBe(false);
  });

  it('should return false if no button has the attribute', () => {
    const btn1 = document.createElement('button');
    btn1.setAttribute('data-other', 'value1');

    const buttons = [btn1];

    expect(hasChoice(buttons, 'data-test', 'value1')).toBe(false);
  });

  it('should return false for an empty NodeList/Array', () => {
    expect(hasChoice([], 'data-test', 'value1')).toBe(false);
  });
});
