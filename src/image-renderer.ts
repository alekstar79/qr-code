import { ImageFormat } from './types.ts'

export class ImageRenderer {
  private readonly matrix: (number | null)[][]
  private readonly modsize: number // This is now primarily for download, CSS handles display
  private readonly margin: number  // This is now handled by generating extra grid cells

  constructor(matrix: (number | null)[][], modsize: number, margin: number) {
    this.matrix = matrix
    this.modsize = modsize
    this.margin = margin
  }

  public render(format: ImageFormat): HTMLElement | HTMLCanvasElement {
    switch (format) {
      case 'PNG':
        return this.renderPNG()
      case 'SVG':
        return this.renderSVG() as unknown as HTMLElement
      case 'HTML':
        return this.renderHTML()
      case 'NONE':
        // Return an empty div for NONE case to maintain type consistency
        return document.createElement('div')
    }
  }

  private renderPNG(): HTMLCanvasElement {
    const matrix = this.matrix
    const matrixSize = this.matrix.length
    const modsize = this.modsize
    const margin = this.margin
    const canvasSize = modsize * (matrixSize + 2 * margin)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = canvasSize
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not get canvas context')
    }

    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvasSize, canvasSize)
    context.fillStyle = '#000'

    for (let y = 0; y < matrixSize; ++y) {
      for (let x = 0; x < matrixSize; ++x) {
        if (matrix[y][x]) {
          context.fillRect(modsize * (margin + x), modsize * (margin + y), modsize, modsize)
        }
      }
    }

    return canvas
  }

  private renderSVG(): SVGElement {
    const result = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const matrix = this.matrix
    const matrixSize = this.matrix.length
    const modsize = this.modsize
    const margin = this.margin
    const svgSize = modsize * (matrixSize + 2 * margin)
    const svg = [
      '<style>.bg{fill:#FFF}.fg{fill:#000}</style>',
      `<rect class="bg" x="0" y="0" width="${svgSize}" height="${svgSize}"/>`
    ]

    const svgCommon = ` class="fg" width="${modsize}" height="${modsize}"/>`

    result.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`)
    result.setAttribute('style', 'shape-rendering:crispEdges')

    let yo = margin * modsize
    for (let y = 0; y < matrixSize; ++y) {
      let xo = margin * modsize

      for (let x = 0; x < matrixSize; ++x) {
        if (matrix[y][x]) {
          svg.push(`<rect x="${xo}" y="${yo}"${svgCommon}`)
        }
        xo += modsize
      }
      yo += modsize
    }

    result.innerHTML = svg.join('')

    return result
  }

  /**
   * Renders the QR code as an HTML div using CSS Grid.
   * This avoids the issues with table scaling and inline styles.
   */
  private renderHTML(): HTMLElement {
    const qrCodeDiv = document.createElement('div')
    qrCodeDiv.className = 'qrcode' // This will be our grid container

    const matrix = this.matrix
    const matrixSize = this.matrix.length
    const margin = this.margin

    // Calculate the total size of the grid (matrix + 2*margin)
    const totalGridSize = matrixSize + 2 * margin
    qrCodeDiv.style.setProperty('--qr-total-modules', totalGridSize.toString())

    const modules: string[] = []
    for (let y = 0; y < totalGridSize; ++y) {
      for (let x = 0; x < totalGridSize; ++x) {
        // Check if the current cell is within the actual QR code matrix or in the margin
        const isMatrixCell = y >= margin && y < (margin + matrixSize) &&
                             x >= margin && x < (margin + matrixSize)

        let isBlack = false
        if (isMatrixCell) {
          // Get the value from the actual matrix
          isBlack = matrix[y - margin][x - margin] === 1
        }
        // Cells outside the matrix (in the margin) are always white

        modules.push(
          `<div class="qr-module ${isBlack ? 'black' : 'white'}"></div>`
        )
      }
    }

    qrCodeDiv.innerHTML = modules.join('')

    return qrCodeDiv
  }
}
