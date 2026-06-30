const { copyTextFallback } = require('./app.js');

describe('copyTextFallback', () => {
  let originalExecCommand;

  beforeEach(() => {
    originalExecCommand = document.execCommand;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.execCommand = originalExecCommand;
    jest.restoreAllMocks();
  });

  test('copies text successfully and removes textarea', () => {
    document.execCommand = jest.fn().mockReturnValue(true);

    const result = copyTextFallback('test text');

    expect(result).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    // Verify textarea was added then removed
    expect(document.body.childNodes.length).toBe(0);
  });

  test('falls back to selecting target on copy failure', () => {
    document.execCommand = jest.fn().mockReturnValue(false);

    const mockTarget = {
      focus: jest.fn(),
      select: jest.fn(),
    };

    const result = copyTextFallback('test text', mockTarget);

    expect(result).toBe(false);
    expect(mockTarget.focus).toHaveBeenCalled();
    expect(mockTarget.select).toHaveBeenCalled();
    expect(document.body.childNodes.length).toBe(0);
  });

  test('handles execCommand throwing an error and removes textarea', () => {
    const error = new Error('Copy failed');
    document.execCommand = jest.fn().mockImplementation(() => {
      throw error;
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = copyTextFallback('test text');

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Fallback copy failed', error);
    // Verify textarea is removed even on error
    expect(document.body.childNodes.length).toBe(0);
  });
});
