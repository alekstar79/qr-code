import { describe, it, expect, beforeEach, vi } from 'vitest'

const downloadMock = vi.fn()
const makeQRCodeMock = vi.fn()

// --- THE FIX ---
// Mock the module that is DIRECTLY imported by `main.ts`.
// The path is relative to the test file itself.
vi.mock('../src/index', () => ({
  makeQRCode: makeQRCodeMock,
}))

describe('QR code generation and download', () => {
  // `beforeEach` handles all setup to ensure complete test isolation.
  beforeEach(async () => {
    // 1. Reset the module cache to re-run `main.ts` from scratch.
    vi.resetModules()

    // 2. Clear and re-implement mocks for the fresh import.
    makeQRCodeMock.mockClear()
    downloadMock.mockClear()
    makeQRCodeMock.mockImplementation(() => ({
      text: 'mock',
      mode: -1,
      eccl: -1,
      version: 1,
      mask: -1,
      matrix: [],
      modsize: 4,
      margin: 4,
      error: '',
      errorSubcode: '',
      result: document.createElement('div'),
      download: downloadMock,
    }))

    // 3. Set up a fresh DOM.
    document.body.innerHTML = `
      <div id="app"><h1></h1></div>
      <textarea id="text-input">hello</textarea>
      <select id="mode-select"><option value="-1" selected>Auto</option></select>
      <select id="eccl-select"><option value="2" selected>High (H)</option></select>
      <input id="version-input" type="number" value="10" />
      <input id="mask-input" type="number" value="3" />
      <select id="image-format-select"><option value="SVG" selected>SVG</option><option value="PNG">PNG</option></select>
      <input id="modsize-input" type="number" value="8" />
      <input id="margin-input" type="number" value="4" />
      <button id="generate-btn">Generate</button>
      <div id="qr-code-container"></div>
      <div id="error-container"></div>
      <button id="download-btn" class="hidden">Download</button>
      <button id="lang-en" class="lang-button active">EN</button>
      <button id="lang-ru" class="lang-button">RU</button>
    `
    Object.defineProperty(navigator, 'language', { value: 'en', configurable: true })

    // 4. Dynamically import `main.ts`. This will now use the mocked `index.ts`
    // and trigger the initial `generate()` call.
    await import('../src/main')
  })

  it('should call makeQRCode with correct options from UI on click', () => {
    // The initial `generate()` was called during `import`. Clear the mock
    // to ensure we are only testing the click action.
    makeQRCodeMock.mockClear()

    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement
    generateBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(makeQRCodeMock).toHaveBeenCalledTimes(1)
    expect(makeQRCodeMock).toHaveBeenCalledWith('hello', {
      mode: -1,
      eccl: 2,
      version: 10,
      mask: 3,
      image: 'SVG',
      modsize: 8,
      margin: 4,
    })
  })

  it('should show an error if text is empty', () => {
    makeQRCodeMock.mockClear() // Clear from initial import.

    const textInput = document.getElementById('text-input') as HTMLTextAreaElement
    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement
    const errorContainer = document.getElementById('error-container') as HTMLDivElement

    textInput.value = ''
    generateBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(makeQRCodeMock).not.toHaveBeenCalled()
    expect(errorContainer.textContent).toBe('Error: Text cannot be empty.')
  })

  it('should display QR code on successful generation on click', () => {
    // The initial call already displayed a QR code. We want to test the click.
    makeQRCodeMock.mockClear()

    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement
    const qrCodeContainer = document.getElementById('qr-code-container') as HTMLDivElement
    const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement

    generateBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(makeQRCodeMock).toHaveBeenCalledTimes(1)
    expect(qrCodeContainer.children.length).toBe(1)
    expect(downloadBtn.classList.contains('hidden')).toBe(false)
  })

  it('should call download with correct filename and format', () => {
    // The initial `generate()` call (during import) is what makes the download
    // button visible and sets up the result. So, we DON'T clear the mocks here.
    const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement
    const imageFormatSelect = document.getElementById('image-format-select') as HTMLSelectElement

    // Verify the initial call worked.
    expect(makeQRCodeMock).toHaveBeenCalledTimes(1)
    expect(downloadBtn.classList.contains('hidden')).toBe(false)

    // Test with SVG
    imageFormatSelect.value = 'SVG'
    downloadBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(downloadMock).toHaveBeenCalledWith('qrcode.svg', 'SVG')

    // Test with PNG
    imageFormatSelect.value = 'PNG'
    downloadBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(downloadMock).toHaveBeenCalledWith('qrcode.png', 'PNG')
  })
})
