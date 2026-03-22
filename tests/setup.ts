import { beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import * as fs from 'fs'
import * as path from 'path'

// Read the HTML file and remove the CSS link to prevent 404 errors in jsdom
const html = fs
  .readFileSync(path.resolve(__dirname, '../index.html'), 'utf8')
  .replace(/<link rel="stylesheet".*>/, '') // Use regex for robustness

let dom: JSDOM

beforeEach(() => {
  vi.resetModules()

  dom = new JSDOM(html, {
    url: 'http://localhost',
    runScripts: 'dangerously',
    resources: 'usable',
  })

  const { window } = dom

  // Mock missing JSDOM APIs
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock canvas getContext
  window.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: [] })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: [] })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  })) as any

  // Set up the global environment
  global.window = window as unknown as Window & typeof globalThis
  global.document = window.document
  global.navigator = window.navigator
  global.getComputedStyle = window.getComputedStyle
  global.localStorage = window.localStorage
  global.MouseEvent = window.MouseEvent
  global.KeyboardEvent = window.KeyboardEvent
  global.HTMLElement = window.HTMLElement
  global.HTMLCanvasElement = window.HTMLCanvasElement
  global.SVGElement = window.SVGElement
  global.HTMLDivElement = window.HTMLDivElement
})

afterEach(() => {
  dom.window.close()
  vi.restoreAllMocks()
})
