/**
 * @jest-environment jsdom
 */

const app = require('./app');

describe('copyText', () => {
  let originalClipboard;
  let originalIsSecureContext;
  let originalExecCommand;
  let consoleErrorSpy;

  beforeEach(() => {
    // Save original values
    originalClipboard = global.navigator.clipboard;
    originalIsSecureContext = global.window.isSecureContext;
    originalExecCommand = document.execCommand;

    // Reset globals
    global.window.isSecureContext = true;

    // Mock DOM API
    document.execCommand = jest.fn().mockReturnValue(true);

    // Mock console.error to avoid noise in test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(global.navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true
    });
    global.window.isSecureContext = originalIsSecureContext;
    document.execCommand = originalExecCommand;
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  test('uses navigator.clipboard.writeText on happy path', async () => {
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(global.navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true
    });

    const target = document.createElement('div');
    const result = await app.copyText('test text', target);

    expect(mockWriteText).toHaveBeenCalledWith('test text');
    expect(result).toBe(true);
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  test('falls back to document.execCommand when navigator.clipboard.writeText rejects', async () => {
    const error = new Error('Clipboard write failed');
    const mockWriteText = jest.fn().mockRejectedValue(error);
    Object.defineProperty(global.navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true
    });

    const target = document.createElement('div');
    const result = await app.copyText('test text', target);

    expect(mockWriteText).toHaveBeenCalledWith('test text');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Clipboard API failed, trying fallback', error);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(result).toBe(true); // document.execCommand mocked to return true
  });

  test('falls back directly when navigator.clipboard is not available', async () => {
    Object.defineProperty(global.navigator, 'clipboard', {
      value: undefined,
      configurable: true
    });

    const target = document.createElement('div');
    const result = await app.copyText('test text', target);

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(result).toBe(true);
  });
});
