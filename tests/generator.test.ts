import { describe, it, expect, beforeEach, vi } from 'vitest'

const downloadMock = vi.fn()
const makeQRCodeMock = vi.fn()

vi.mock('../src/index', () => ({
  makeQRCode: makeQRCodeMock
}))

describe('QR code generation and download', () => {
  beforeEach(async () => {
    // Clear mocks before each test to have a clean slate
    makeQRCodeMock.mockClear()
    downloadMock.mockClear()

    // Set up the mock implementation *before* importing main
    // This ensures document is defined when the mock is created
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

    // Dynamically import the main script to execute it in the prepared DOM
    await import('../src/main')
  })

  it('should call makeQRCode with correct options from UI on click', () => {
    // The initial call happened in beforeEach, clear it for this test
    makeQRCodeMock.mockClear()

    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement
    const textInput = document.getElementById('text-input') as HTMLTextAreaElement
    const ecclSelect = document.getElementById('eccl-select') as HTMLSelectElement
    const versionInput = document.getElementById('version-input') as HTMLInputElement
    const maskInput = document.getElementById('mask-input') as HTMLInputElement
    const imageFormatSelect = document.getElementById('image-format-select') as HTMLSelectElement
    const modsizeInput = document.getElementById('modsize-input') as HTMLInputElement
    const marginInput = document.getElementById('margin-input') as HTMLInputElement

    // Set UI values
    textInput.value = 'new-hello'
    ecclSelect.value = '1' // M
    versionInput.value = '5'
    maskInput.value = '7'
    imageFormatSelect.value = 'PNG'
    modsizeInput.value = '10'
    marginInput.value = '2'

    generateBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(makeQRCodeMock).toHaveBeenCalledTimes(1)
    expect(makeQRCodeMock).toHaveBeenCalledWith('new-hello', {
      mode: -1, // from the select
      eccl: 1,
      version: 5,
      mask: 7,
      image: 'PNG',
      modsize: 10,
      margin: 2,
    })
  })

  it('should show an error if text is empty', () => {
    makeQRCodeMock.mockClear()
    const textInput = document.getElementById('text-input') as HTMLTextAreaElement
    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement
    const errorContainer = document.getElementById('error-container') as HTMLDivElement

    textInput.value = ''
    generateBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(makeQRCodeMock).not.toHaveBeenCalled()
    expect(errorContainer.textContent).toBe('Error: Text cannot be empty.')
  })

  it('should display QR code on successful generation on click', () => {
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
    // The initial call in beforeEach makes the button visible
    expect(makeQRCodeMock).toHaveBeenCalledTimes(1)

    const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement
    const imageFormatSelect = document.getElementById('image-format-select') as HTMLSelectElement

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
