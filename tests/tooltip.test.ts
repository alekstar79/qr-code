import { describe, it, expect, vi, beforeEach } from 'vitest'

const makeQRCodeMock = vi.fn()

vi.mock('../src/index', () => ({
  makeQRCode: makeQRCodeMock
}))

describe('demo tooltips', () => {
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

  it('should toggle tooltip with keyboard (Enter and Space)', () => {
    const trigger = document.querySelector('.tooltip-trigger[data-tooltip-key="textInput"]') as HTMLElement
    const tooltipContent = trigger.querySelector('.tooltip-content') as HTMLElement
    expect(tooltipContent).toBeTruthy()

    // Open with Enter
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(tooltipContent.classList.contains('active')).toBe(true)

    // Close with Space
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(tooltipContent.classList.contains('active')).toBe(false)
  })

  it('should toggle tooltip on trigger click', () => {
    const trigger = document.querySelector('.tooltip-trigger[data-tooltip-key="textInput"]') as HTMLElement
    const tooltipContent = trigger.querySelector('.tooltip-content') as HTMLElement
    expect(tooltipContent).toBeTruthy()

    // Open
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(tooltipContent.classList.contains('active')).toBe(true)

    // Close
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(tooltipContent.classList.contains('active')).toBe(false)
  })

  it('should switch between tooltips, closing the previous one', () => {
    const trigger1 = document.querySelector('.tooltip-trigger[data-tooltip-key="textInput"]') as HTMLElement
    const tooltipContent1 = trigger1.querySelector('.tooltip-content') as HTMLElement
    const trigger2 = document.querySelector('.tooltip-trigger[data-tooltip-key="modeSelect"]') as HTMLElement
    const tooltipContent2 = trigger2.querySelector('.tooltip-content') as HTMLElement

    // Open first tooltip
    trigger1.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(tooltipContent1.classList.contains('active')).toBe(true)
    expect(tooltipContent2.classList.contains('active')).toBe(false)

    // Open second tooltip, first should close
    trigger2.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(tooltipContent1.classList.contains('active')).toBe(false)
    expect(tooltipContent2.classList.contains('active')).toBe(true)
  })
})
