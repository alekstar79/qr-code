import { describe, it, expect, beforeAll, vi } from 'vitest'

const makeQRCodeMock = vi.fn(() => ({
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
  download: vi.fn(),
}))

vi.mock('../src/lib', () => {
  return {
    makeQRCode: makeQRCodeMock,
  }
})

describe('language switching', () => {
  beforeAll(async () => {
    Object.defineProperty(navigator, 'language', { value: 'en', configurable: true })

    document.body.innerHTML = `
      <div id="app">
        <h1></h1>
      </div>

      <textarea id="text-input">hello</textarea>
      <select id="mode-select">
        <option value="-1" selected data-i18n="autoOption">Auto</option>
      </select>
      <select id="eccl-select">
        <option value="2" selected data-i18n="ecclHOption">High (H)</option>
      </select>
      <input id="version-input" type="number" value="-1" />
      <input id="mask-input" type="number" value="-1" />
      <select id="image-format-select">
        <option value="SVG" selected data-i18n="svgOption">SVG</option>
      </select>
      <input id="modsize-input" type="number" value="8" />
      <input id="margin-input" type="number" value="4" />

      <button id="generate-btn" data-i18n="generateButton">Generate</button>
      <div id="qr-code-container"></div>
      <div id="error-container"></div>
      <button id="download-btn" class="hidden" data-i18n="downloadButton">Download</button>

      <button id="lang-en" class="lang-button active">EN</button>
      <button id="lang-ru" class="lang-button">RU</button>
    `

    await import('../src/main')
  })

  it('should switch UI to Russian and back to English', () => {
    const langRuBtn = document.getElementById('lang-ru') as HTMLButtonElement
    const langEnBtn = document.getElementById('lang-en') as HTMLButtonElement
    const appTitle = document.querySelector('#app h1') as HTMLHeadingElement
    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement

    // Switch to Russian
    langRuBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.documentElement.lang).toBe('ru')
    expect(appTitle.textContent).toBe('Генератор QR-кода')
    expect(generateBtn.textContent).toBe('Сгенерировать QR-код')
    expect(langRuBtn.classList.contains('active')).toBe(true)
    expect(langEnBtn.classList.contains('active')).toBe(false)

    // Switch back to English
    langEnBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.documentElement.lang).toBe('en')
    expect(appTitle.textContent).toBe('QR Code Generator')
    expect(generateBtn.textContent).toBe('Generate QR Code')
    expect(langEnBtn.classList.contains('active')).toBe(true)
    expect(langRuBtn.classList.contains('active')).toBe(false)
  })
})
