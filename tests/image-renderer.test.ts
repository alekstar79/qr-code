import { describe, it, expect } from 'vitest'
import { ImageRenderer } from '../src/image-renderer'

// Keep the original createElementNS function with the correct this binding
const originalCreateElementNS = document.createElementNS.bind(document)

// Overriding createElementNS for SVG, keeping the correct types
document.createElementNS = ((namespace: string, tagName: string) => {
  if (namespace === 'http://www.w3.org/2000/svg' && tagName === 'svg') {
    return originalCreateElementNS(namespace, tagName)
  }
  return originalCreateElementNS(namespace, tagName)
}) as typeof document.createElementNS

// Create a simple test matrix
const testMatrix = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1]
]

const modsize = 10
const margin = 2

describe('ImageRenderer', () => {
  it('should render PNG format correctly', () => {
    const renderer = new ImageRenderer(testMatrix, modsize, margin)
    const result = renderer.render('PNG')

    expect(result).toBeInstanceOf(HTMLCanvasElement)
    const canvas = result as HTMLCanvasElement
    expect(canvas.width).toBe(70)
    expect(canvas.height).toBe(70)
  })

  it('should render SVG format correctly', () => {
    const renderer = new ImageRenderer(testMatrix, modsize, margin)
    const result = renderer.render('SVG')

    expect(result).toBeInstanceOf(SVGElement)
    expect(result.innerHTML).toContain('rect')
  })

  it('should render HTML format correctly', () => {
    const renderer = new ImageRenderer(testMatrix, modsize, margin)
    const result = renderer.render('HTML')

    expect(result).toBeInstanceOf(HTMLDivElement)
    const div = result as HTMLDivElement
    expect(div.className).toBe('qrcode')
    expect(div.style.getPropertyValue('--qr-total-modules')).toBe('7')
    expect(div.innerHTML).toContain('div')
  })

  it('should render NONE format correctly', () => {
    const renderer = new ImageRenderer(testMatrix, modsize, margin)
    const result = renderer.render('NONE')

    expect(result).toBeInstanceOf(HTMLDivElement)
  })

  it('should render default format (PNG) correctly', () => {
    const renderer = new ImageRenderer(testMatrix, modsize, margin)
    const result = renderer.render('' as any)

    expect(result).toBeInstanceOf(HTMLCanvasElement)
  })
})
