import { describe, it, expect } from 'vitest'
import { makeQRCode } from '../src'
import { QROptions } from '../src/types'

describe('makeQRCode Library API', () => {
  it('should generate a QR code with default options for a simple string', () => {
    const qr = makeQRCode('hello')
    expect(qr.text).toBe('hello')
    expect(qr.result).toBeInstanceOf(HTMLCanvasElement)
    expect(qr.error).toBe('')
    expect(qr.matrix.length).toBeGreaterThan(0)
  })

  it('should accept basic options', () => {
    const options: QROptions = {
      text: 'test options',
      modsize: 10,
      margin: 2,
    }
    const qr = makeQRCode(options)
    expect(qr.text).toBe('test options')
    expect(qr.modsize).toBe(10)
    expect(qr.margin).toBe(2)
    expect(qr.result).toBeInstanceOf(HTMLCanvasElement)
    expect(qr.error).toBe('')
  })

  it('should return an error for empty text', () => {
    const qr = makeQRCode('')
    expect(qr.error).toBe('ERR_TEXT_EMPTY')
    expect(qr.result).toBeNull()
  })

  it('should generate an SVG image when specified', () => {
    const qr = makeQRCode({ text: 'svg test', image: 'SVG' })
    expect(qr.result).toBeInstanceOf(SVGElement)
    expect(qr.error).toBe('')
  })

  it('should handle numerical mode correctly', () => {
    const qr = makeQRCode({ text: '1234567890', mode: 1 }) // Mode 1 = Numerical
    expect(qr.mode).toBe(1)
    expect(qr.error).toBe('')
    expect(qr.matrix.length).toBeGreaterThan(0)
  })

  it('should return an error for invalid text in numerical mode', () => {
    const qr = makeQRCode({ text: 'not-a-number', mode: 1 })
    expect(qr.error).toBe('ERR_INVALID_CHAR')
    expect(qr.result).toBeNull()
  })

  it('should handle high error correction level', () => {
    const qr = makeQRCode({ text: 'high eccl', eccl: 3 }) // ECCl 3 = Q
    expect(qr.eccl).toBe(3)
    expect(qr.error).toBe('')
    expect(qr.matrix.length).toBeGreaterThan(0)
  })

  it('should return an error for an invalid version', () => {
    const qr = makeQRCode({ text: 'version test', version: 99 }) // Invalid version
    expect(qr.error).toBe('ERR_VERSION_OUT_OF_RANGE')
    expect(qr.result).toBeNull()
  })
})
