import { Eccl, Mask, Mode } from './types'

import {
  bitsFieldDataQuantity,
  encodeBCH,
  isEccl,
  isMode,
  GF256,
  GF256_GENPOLY,
  GF256_INV,
  infoVersion,
  MASKFUNCS,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
  MODE_TERMINATOR,
  PENALTY,
  ALPHANUMERIC_MAP,
} from './constants.ts'

export class QRCodeGenerator {
  public readonly text: string
  public mode: Mode
  public eccl: Eccl
  private _version: number
  public mask: Mask

  public error = ''
  public errorSubcode = ''

  private bitsData = 0
  private qtyBlocks = 0
  private bytesCorrectionPerBlock = 0
  private genpoly: number[] = []
  private bitsFieldDataQty = 0
  private positionAlignmentPatterns: number[] = []

  private data: (string | number)[] = []
  private codewordsData: number[] = []
  private codewordsQR: number[] = []
  public matrix: (number | null)[][] = []

  constructor(text: string, mode: Mode, eccl: Eccl, version: number, mask: Mask) {
    this._version = version
    this.text = text
    this.mode = mode
    this.eccl = eccl
    this.mask = mask
  }

  public get version(): number {
    return this._version
  }

  public set version(version: number) {
    this._version = version

    if (isMode(this.mode as number) && isEccl(this.eccl as number) && version > 0 && version < 41) {
      this.fixedInfoVersion(version, this.mode as number, this.eccl as number)
    }
  }

  private get needsVerInfo(): boolean {
    return this.version > 6
  }

  private fixedInfoVersion(version: number, mode: number, eccl: number): void {
    const versionInfo = infoVersion[version] as (number[] | number[][] | number[][][])
    this.qtyBlocks = (versionInfo[1] as number[])[eccl]
    this.bytesCorrectionPerBlock = (versionInfo[0] as number[])[eccl]
    this.genpoly = GF256_GENPOLY[this.bytesCorrectionPerBlock]
    this.bitsFieldDataQty = bitsFieldDataQuantity(version, mode)
    this.positionAlignmentPatterns = versionInfo[2] as number[]

    const countDataBits = (): number => {
      let nBits = 16 * version * version + 128 * version + 64
      const qtyAP = this.positionAlignmentPatterns.length

      if (qtyAP) {
        nBits -= 25 * qtyAP * qtyAP - 10 * qtyAP - 55
      }
      if (this.needsVerInfo) {
        nBits -= 36
      }

      return nBits
    }

    this.bitsData = (countDataBits() & ~7) - 8 * this.bytesCorrectionPerBlock * this.qtyBlocks
  }

  public textToData(): void {
    const text = this.text
    const data: (string | number)[] = []

    if (this.mode === MODE_NUMERIC || this.mode === MODE_ALPHANUMERIC) {
      this.data = text.split('')
      return
    }

    for (const codePoint of text) {
      const utfCode = codePoint.codePointAt(0) as number

      if (utfCode < 128) {
        data.push(utfCode)
      } else if (utfCode > 2097151) {
        data.length = 0
        break
      } else {
        const nAddOctets = utfCode < 2048 ? 1 : utfCode < 65536 ? 2 : 3
        data.push([0xc0, 0xe0, 0xf0][nAddOctets - 1] | (utfCode >> (6 * nAddOctets)))

        for (let i = nAddOctets; i > 0; ) {
          data.push(0x80 | ((utfCode >> (6 * --i)) & 0x3f))
        }
      }
    }

    this.data = data
  }

  public dataToCodewords(): void {
    const data = this.data as (string & number)[]
    const datalen = data.length
    const mode = this.mode as number
    const maxQtyCodewordsData = this.bitsData >> 3
    const codewordsData: number[] = []

    let bits = 0
    let remaining = 8
    const pack = (x: number, n: number): void => {
      while (n > 0) {
        x &= (1 << n) - 1
        if (n < remaining) {
          bits |= x << (remaining -= n)
          n = 0;
        } else {
          bits |= x >>> (n -= remaining)
          codewordsData.push(bits)
          bits = 0
          remaining = 8
        }
      }
    }

    pack(mode, 4)
    pack(datalen, this.bitsFieldDataQty)

    switch (mode) {
      case MODE_NUMERIC:
        for (let i = 2; i < datalen; i += 3) {
          pack(+(data[i - 2] + data[i - 1] + data[i]), 10)
        }
        const rest = [0, 4, 7][datalen % 3]
        if (rest) {
          pack(+((rest === 7 ? data[datalen - 2] : '') + data[datalen - 1]), rest)
        }
        break
      case MODE_ALPHANUMERIC:
        for (let i = 1; i < datalen; i += 2) {
          pack(ALPHANUMERIC_MAP[data[i - 1]] * 45 + ALPHANUMERIC_MAP[data[i]], 11)
        }
        if (datalen % 2) {
          pack(ALPHANUMERIC_MAP[data[datalen - 1]], 6)
        }
        break
      case MODE_OCTET:
        data.forEach((x) => pack(x, 8))
        break
    }

    if (codewordsData.length < maxQtyCodewordsData - 1 || remaining === 8) {
      pack(MODE_TERMINATOR, 4)
    }

    if (remaining < 8) {
      codewordsData.push(bits)
    }

    while (codewordsData.length + 1 < maxQtyCodewordsData) {
      codewordsData.push(0xec, 0x11)
    }

    if (codewordsData.length < maxQtyCodewordsData) {
      codewordsData.push(0xec)
    }

    this.codewordsData = codewordsData
  }

  public makeCodewordsQR(): void {
    const qtyBlocks = this.qtyBlocks
    const poly = this.codewordsData
    const genpoly = this.genpoly
    const codewordsQR: number[] = []

    const makeMapBlocks = (qtyElements: number, qtyBlocks: number) => {
      const posBlocks: number[] = []
      const qtyElementsInBlock = Math.floor(qtyElements / qtyBlocks)
      const qtyBlocksWithoutAdd = qtyBlocks - (qtyElements % qtyBlocks)

      for (let j = 0, pos = 0; j < qtyBlocks + 1; j++) {
        posBlocks.push(pos)
        pos += qtyElementsInBlock + (j < qtyBlocksWithoutAdd ? 0 : 1)
      }

      return {
        pos: posBlocks,
        qtyElementsInBlock,
        qtyBlocksWithoutAdd,
      }
    }

    const calculateECC = (poly: number[], genpoly: number[]): number[] => {
      const codewords = [...poly].concat(Array(genpoly.length).fill(0))

      for (let i = 0; i < poly.length; ) {
        const quotient = GF256_INV[codewords[i++]]

        if (quotient >= 0) {
          for (let j = 0; j < genpoly.length; ++j) {
            codewords[i + j] ^= GF256[(genpoly[j] + quotient) % 255]
          }
        }
      }

      return codewords.slice(poly.length)
    }

    const mapBlocks = makeMapBlocks(poly.length, qtyBlocks)
    const blocksECC: number[][] = []

    for (let j = 0; j < qtyBlocks; ++j) {
      blocksECC.push(calculateECC(poly.slice(mapBlocks.pos[j], mapBlocks.pos[j + 1]), genpoly))
    }
    for (let i = 0; i < mapBlocks.qtyElementsInBlock; ++i) {
      for (let j = 0; j < qtyBlocks; ++j) {
        codewordsQR.push(poly[mapBlocks.pos[j] + i])
      }
    }
    for (let j = mapBlocks.qtyBlocksWithoutAdd; j < qtyBlocks; ++j) {
      codewordsQR.push(poly[mapBlocks.pos[j + 1] - 1])
    }
    for (let i = 0; i < genpoly.length; ++i) {
      for (let j = 0; j < qtyBlocks; ++j) {
        codewordsQR.push(blocksECC[j][i])
      }
    }

    this.codewordsQR = codewordsQR
  }

  private makeCodewordVersion(): number {
    return this.needsVerInfo
      ? encodeBCH(this.version, 6, 0x1f25, 12)
      : 0
  }

  private makeCodewordFormat(mask: number): number {
    return encodeBCH(((this.eccl as number) << 3) | mask, 5, 0x537, 10) ^ 0x5412
  }

  public makeMatrix(): void {
    const version = this.version
    const isMaskAuto = this.mask < 0

    let mask = isMaskAuto ? 0 : (this.mask as number)
    let maskFunc = MASKFUNCS[mask]

    const aligns = this.positionAlignmentPatterns
    const codewordVersion = this.makeCodewordVersion()

    let codewordFormat = this.makeCodewordFormat(mask)

    const codewordsQR = this.codewordsQR
    const matrixSize = 21 + 4 * (version - 1)
    const matrix: (number | null)[][] = new Array(matrixSize)
    const mapData: (number | null)[][] = isMaskAuto ? new Array(matrixSize) : []

    const placeBlock = (x: number, y: number, w: number, listWords: number[]): void => {
      for (let j = 0; j < listWords.length; ++j) {
        for (let i = 0; i < w; ++i) {
          matrix[y + j][x + i] = (listWords[j] >> i) & 1
        }
      }
    }

    const placeFormatInfo = (codewordFormat: number): void => {
      const n = matrixSize
      const y = [0, 1, 2, 3, 4, 5, 7, 8, n - 7, n - 6, n - 5, n - 4, n - 3, n - 2, n - 1]
      const x = [n - 1, n - 2, n - 3, n - 4, n - 5, n - 6, n - 7, n - 8, 7, 5, 4, 3, 2, 1, 0]

      for (let i = 0; i < 15; ++i) {
        matrix[8][x[i]] = matrix[y[i]][8] = (codewordFormat >> i) & 1
      }
    }

    for (let i = 0; i < matrixSize; ++i) {
      matrix[i] = new Array(matrixSize).fill(null)

      if (isMaskAuto) {
        mapData[i] = new Array(matrixSize).fill(null)
      }
    }

    placeBlock(0, 0, 8, [0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x7f, 0x0])
    placeBlock(matrixSize - 8, 0, 8, [0xfe, 0x82, 0xba, 0xba, 0xba, 0x82, 0xfe, 0x0])
    placeBlock(0, matrixSize - 8, 8, [0x0, 0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x7f])
    placeBlock(8, matrixSize - 8, 1, [0x1])

    for (let i = 8; i < matrixSize - 8; ++i) {
      matrix[i][6] = matrix[6][i] = ~i & 1
    }

    const m = aligns.length
    for (let x = 0; x < m; ++x) {
      const miny = x === 0 || x === m - 1 ? 1 : 0
      const maxy = x === 0 ? m - 1 : m

      for (let y = miny; y < maxy; ++y) {
        placeBlock(aligns[x], aligns[y], 5, [0x1f, 0x11, 0x15, 0x11, 0x1f])
      }
    }

    placeFormatInfo(codewordFormat)

    if (codewordVersion) {
      for (let y = 0, k = 0; y < 6; ++y) {
        for (let x = 0; x < 3; ++x) {
          matrix[y][matrixSize - 11 + x] = matrix[matrixSize - 11 + x][y] = (codewordVersion >> k++) & 1
        }
      }
    }

    for (let x = matrixSize - 1, k = 0, direction = -1; x > -1; x -= 2) {
      if (x === 6) --x

      for (let y = 0; y < matrixSize; y++) {
        let j = direction < 0 ? matrixSize - y - 1 : y

        for (let i = x; i > x - 2; i--) {
          if (matrix[j][i] === null) {
            const bit = (codewordsQR[k >> 3] >> (~k & 7)) & 1

            // MASKFUNCS возвращают boolean; битовая операция XOR ожидает number (0/1)
            matrix[j][i] = bit ^ (maskFunc(j, i) ? 1 : 0)

            if (isMaskAuto) {
              mapData[j][i] = bit
            }
            ++k
          }
        }
      }

      direction = -direction
    }

    if (isMaskAuto) {
      const reMask = (mask: number): void => {
        maskFunc = MASKFUNCS[mask]

        codewordFormat = this.makeCodewordFormat(mask)

        placeFormatInfo(codewordFormat)

        mapData.forEach((aY, j) => {
          aY.forEach((el, i) => {
            if (el !== null) {
              // MASKFUNCS возвращают boolean; битовая операция XOR ожидает number (0/1)
              matrix[j][i] = el ^ (maskFunc(j, i) ? 1 : 0)
            }
          })
        })
      }

      const testScore = Array(MASKFUNCS.length)
        .fill(0)
        .map((_, i) => {
          if (i) reMask(i)
          return this.maskTest(matrix)
        })

      mask = testScore.reduce(
        (bestMask, score, mask) => {
          if (score < bestMask.score) {
            bestMask.mask = mask
            bestMask.score = score
          }
          return bestMask
        },
        { mask: 0, score: testScore[0] }
      ).mask

      reMask(mask)

      this.mask = mask as Mask
    }

    this.matrix = matrix
  }

  private maskTest(matrix: (number | null)[][]): number {
    const matrixSize = matrix.length

    let qtyBlack = 0
    let score = 0
    let groups: number[]

    const evaluateGroups = (groups: number[]): number => {
      let sum = 0

      for (let i = 0; i < groups.length; ++i) {
        if (groups[i] >= 5) sum += PENALTY.CONSECUTIVE + (groups[i] - 5)
      }
      for (let i = 5; i < groups.length; i += 2) {
        if (
          groups[i] === 1 &&
          groups[i - 1] === 1 &&
          groups[i - 2] === 3 &&
          groups[i - 3] === 1 &&
          groups[i - 4] === 1 &&
          (groups[i - 5] >= 4 || groups[i + 1] >= 4)
        ) {
          sum += PENALTY.FINDERLIKE
        }
      }

      return sum
    }

    for (let xy = 0; xy < matrixSize; ++xy) {
      const rowCells = matrix[xy]
      const nextRowCells = matrix[xy + 1] || []

      groups = []
      for (let x = 0; x < matrixSize; ) {
        let qty: number;
        for (qty = 0; x < matrixSize && !rowCells[x]; ++qty) ++x;
        groups.push(qty);
        for (qty = 0; x < matrixSize && rowCells[x]; ++qty) ++x;
        groups.push(qty);
      }

      score += evaluateGroups(groups)
      groups = []

      for (let y = 0; y < matrixSize; ) {
        let qty: number
        for (qty = 0; y < matrixSize && !matrix[y][xy]; ++qty) ++y
        groups.push(qty)
        for (qty = 0; y < matrixSize && matrix[y][xy]; ++qty) ++y
        groups.push(qty)
      }

      score += evaluateGroups(groups)
      qtyBlack += rowCells[0] || 0

      for (let x = 1; x < matrixSize; ++x) {
        qtyBlack += rowCells[x] || 0

        if (
          rowCells[x] === rowCells[x - 1] &&
          rowCells[x] === nextRowCells[x] &&
          rowCells[x] === nextRowCells[x - 1]
        ) {
          score += PENALTY.TWOBYTWO
        }
      }
    }

    score += PENALTY.DENSITY * (Math.floor((Math.abs((qtyBlack * 100) / matrixSize / matrixSize - 50) - 1) / 5))

    return score
  }
}
