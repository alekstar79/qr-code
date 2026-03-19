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

describe('demo tooltips', () => {
  beforeAll(async () => {
    Object.defineProperty(navigator, 'language', { value: 'en', configurable: true })

    document.body.innerHTML = `
      <div id="app">
        <h1></h1>
      </div>

      <textarea id="text-input">hello</textarea>
      <select id="mode-select">
        <option value="-1" selected data-i18n="autoOption">Auto</option>
        <option value="1" data-i18n="numericalOption">Numerical</option>
        <option value="2" data-i18n="alphanumericOption">Alphanumeric</option>
        <option value="4" data-i18n="binaryOption">Binary (UTF8)</option>
      </select>
      <select id="eccl-select">
        <option value="-1" data-i18n="autoOption">Auto</option>
        <option value="1" data-i18n="ecclLOption">Low (L)</option>
        <option value="0" data-i18n="ecclMOption">Medium (M)</option>
        <option value="3" data-i18n="ecclQOption">Quartile (Q)</option>
        <option value="2" selected data-i18n="ecclHOption">High (H)</option>
      </select>
      <input id="version-input" type="number" value="-1" />
      <input id="mask-input" type="number" value="-1" />
      <select id="image-format-select">
        <option value="SVG" selected data-i18n="svgOption">SVG</option>
        <option value="PNG" data-i18n="pngOption">PNG</option>
        <option value="HTML" data-i18n="htmlOption">HTML</option>
      </select>
      <input id="modsize-input" type="number" value="8" />
      <input id="margin-input" type="number" value="4" />

      <button id="generate-btn">Generate</button>
      <div id="qr-code-container"></div>
      <div id="error-container"></div>
      <button id="download-btn" class="hidden">Download</button>

      <button id="lang-en" class="lang-button active">EN</button>
      <button id="lang-ru" class="lang-button">RU</button>

      <label for="text-input">
        Text
        <span class="tooltip-trigger" data-tooltip-key="textInput" role="button" tabindex="0" aria-expanded="false">?</span>
      </label>
    `

    // Import after DOM is ready (main.ts is executed on import).
    await import('../src/main')
  })

  it('should NOT hide tooltip on click inside tooltip-content', () => {
    const trigger = document.querySelector('.tooltip-trigger[data-tooltip-key="textInput"]') as HTMLElement
    expect(trigger).toBeTruthy()

    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    const tooltipContent = trigger.querySelector('.tooltip-content') as HTMLElement
    expect(tooltipContent).toBeTruthy()
    expect(tooltipContent.classList.contains('active')).toBe(true)

    // Click on the tooltip itself; it must stay visible.
    tooltipContent.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(tooltipContent.classList.contains('active')).toBe(true)
  })

  it('should hide tooltip on click outside', () => {
    const trigger = document.querySelector('.tooltip-trigger[data-tooltip-key="textInput"]') as HTMLElement
    const tooltipContent = trigger.querySelector('.tooltip-content') as HTMLElement
    expect(tooltipContent).toBeTruthy()

    // Ensure it's visible first (do not toggle it off if it is already open).
    if (!tooltipContent.classList.contains('active')) {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }
    expect(tooltipContent.classList.contains('active')).toBe(true)

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(tooltipContent.classList.contains('active')).toBe(false)
  })
})

