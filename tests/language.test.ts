import { describe, it, expect, vi, beforeEach } from 'vitest'

const makeQRCodeMock = vi.fn()

vi.mock('../src/index', () => ({
  makeQRCode: makeQRCodeMock
}))

describe('language switching', () => {
  beforeEach(async () => {
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
      download: vi.fn(),
    }))

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
