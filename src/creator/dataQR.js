// noinspection HtmlDeprecatedAttribute
/* QR code data */

import { constQR, infoVersion } from '../lib/iso.js'

class QRCODE
{
  constructor(image, options, errorDescription)
  {
    for (const param in options) {
      Object.defineProperty(this, param, { enumerable: true, value: options[param] })
    }
    for (const param in errorDescription) {
      Object.defineProperty(this, param, { writable: true, value: errorDescription[param] })
    }

    // QR code image format
    Object.defineProperty(this, `_image`, { writable: true, value: '' })
    // HTML image element of a QR code in the given format or '' in case of an error
    Object.defineProperty(this, `result`, { writable: true, value: '' })
    // generating a QR code image
    this.image = image
  }

 /*
 * generating a QR code image
 */
  set image(v) {
    const makeImage = () => {
      ({
        // without imaging
        NONE: () => {
          this.result = ''
        },

        // PNG image generation
        PNG: () => {
          const matrix = this.matrix,
            matrixSize = this.matrix.length,
            modsize = this.modsize,
            margin = this.margin

          const canvasSize = modsize * (matrixSize + 2 * margin),
            canvas = document.createElement('canvas')

          let context

          canvas.width = canvas.height = canvasSize
          context = canvas.getContext('2d')

          if (!context) {
            this.error = 'image'
            this.errorSubcode = '2'
            return
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

          this.result = canvas
        },

        // SVG image generation
        SVG: () => {
          const result = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

          const matrix = this.matrix,
            matrixSize = this.matrix.length,
            modsize = this.modsize,
            margin = this.margin

          const svgSize = modsize * (matrixSize + 2 * margin),
            svg = [
              '<style>.bg{fill:#FFF}.fg{fill:#000}</style>',
              '<rect class="bg" x="0" y="0"',
              'width="' + svgSize + '" height="' + svgSize + '"/>',
            ],

            svgCommon = ' class= "fg"' + ' width="' + modsize + '" height="' + modsize + '"/>';

          result.setAttribute('viewBox', '0 0 ' + svgSize + ' ' + svgSize)
          result.setAttribute('style', 'shape-rendering:crispEdges')

          let yo = margin * modsize
          for (let y = 0; y < matrixSize; ++y) {
            let xo = margin * modsize

            for (let x = 0; x < matrixSize; ++x) {
              if (matrix[y][x]) {
                svg.push('<rect x="' + xo + '" y="' + yo + '"', svgCommon)
              }

              xo += modsize
            }

            yo += modsize
          }

          result.innerHTML = svg.join('')

          this.result = result
        },

        // generating an image in HTML format
        HTML: () => {
          const result = document.createElement('div')

          const matrix = this.matrix,
            matrixSize = this.matrix.length,
            modsize = this.modsize,
            margin = this.margin

          const table = [`<table border="0" cellspacing="0" cellpadding="0" style="display: block; border: ${modsize * margin}px solid #fff; background: #fff">`]
          // const html = [`<table style="display: block; border: ${modsize * margin}px solid #fff; border-collapse: collapse; background: #fff">`]

          for (let y = 0; y < matrixSize; ++y) {
            table.push('<tr>')

            for (let x = 0; x < matrixSize; ++x) {
              table.push('<td style="width:' + modsize + 'px; height:' + modsize + 'px' +
                (matrix[y][x] ? ';background:#000' : '') + '"></td>')
            }

            table.push('</tr>')
          }

          result.className = 'qrcode'
          result.innerHTML = table.join('') + '</table>'

          this.result = result
        },

      }[this.image])()
    }

    v = v.trim().toUpperCase()

    this._image = v
    this.result = ''

    if (this.error === 'image') {
      this.clearError()
    }
    if (!(constQR.IMAGE.includes(v))) {
      this.error = 'image'
      this.errorSubcode = '3'
    }
    if (!this.error) {
      makeImage()
    }
  }

  get image() {
    return this._image
  }

  /*
  * download QR code file
  */
  download(filename = '', image = this.image) {
    let content = '', mimeType = ''

    const perform = (content, mimeType, filename) => {
      const el = document.createElement('a')
      if (mimeType) mimeType += ','

      el.setAttribute('href', `${mimeType}${content}`)
      el.setAttribute('download', filename)
      el.click()
    }

    this.image = image

    if (this.result) {
      switch (this.image) {
        case 'PNG':
          if (!filename) {
            filename = 'qrcode.png'
          }

          content = this.result.toDataURL()
          break

        case 'SVG':
          if (!filename) {
            filename = 'qrcode.svg'
          }

          content = `<svg xmlns="http://www.w3.org/2000/svg" ` +
            `viewBox="${this.result.getAttribute('viewBox')} ">` +
            `${this.result.innerHTML}</svg>`

          content = encodeURIComponent(content)
          mimeType = `data:image/svg+xml;charset=utf-8`
          break

        case 'HTML':
          if (!filename) {
            filename = 'qrcode.html'
          }

          content = encodeURIComponent(this.result.innerHTML)
          mimeType = `data:text/html;charset=utf-8`
          break
      }
      perform(content, mimeType, filename);
    }
  }

  /*
  * clearing the error message
  */
  clearError()
  {
    this.error = ''
    this.errorSubcode = ''
  }
}

export class DataQR
{
  constructor(text = '', options = {})
  {
    let { mode, eccl, version, mask, image, modsize, margin } = {
      mode: -1, eccl: -1, version: -1, mask: -1, image: 'PNG', modsize: -1, margin: -1, ...options
    }

    // text to encode in a QR-code
    this.text = text

    // formation parameters:
    this.mode = mode
    this.eccl = eccl
    this._version = version
    this.mask = mask

    // result parameters:
    this.image = image.trim().toUpperCase()
    this.modsize = modsize
    this.margin = margin

    // - name of the parameter that caused the error, or '' if there were no errors
    this.error = ''
    // - error message or '' for no errors
    this.errorSubcode = ''

    // properties for current mode, eccl:

    // number of data bits without error correction code words,
    // but including method bits and fields to record the amount of data
    this.bitsData = 0
    // number of code blocks for version by eccl
    this.qtyBlocks = 0
    // number of correction bytes per code block for version by eccl
    this.bytesCorrectionPerBlock = 0
    // generating polynomial (exponents of the generating polynomial)
    this.genpoly = []
    // size in bits of the field for writing the amount of data in the QR-code
    this.bitsFieldDataQty = 0
    // positions of alignment templates
    this.positionAlignmentPatterns = []

    // the results of the stages of formation of code words

    // array of actually encoded characters (from text)
    this.data = []
    // data codewords (no ECC bits)
    this.codewordsData = []
    // code words for placement in a QR-code (with ECC bits and with combining blocks into a stream)
    this.codewordsQR = []
    // заполненная матрица QR-кода (без обязательной свободной зоны)
    this.matrix = []
  }

  // setting version and info to build QR-code
  set version(version) {
    const mode = this.mode, eccl = this.eccl

    this._version = version

    if (constQR.isMode(mode) && constQR.isEccl(eccl) && version > 0 && version < 41) {
      // fixing information to build a QR-code for the current state
      this.fixedInfoVersion(version, mode, eccl)
    }
  }

  get version() {
    return this._version
  }

  get needsVerInfo() {
    return this.version > 6
  }

  /*
  * fixing information to build a QR-code for the current state
  */
  fixedInfoVersion(version, mode, eccl)
  {
    this.qtyBlocks = infoVersion[version][1][eccl]
    this.bytesCorrectionPerBlock = infoVersion[version][0][eccl]
    this.genpoly = constQR.GF256_GENPOLY[this.bytesCorrectionPerBlock]
    this.bitsFieldDataQty = constQR.bitsFieldDataQuantity(version, mode)
    this.positionAlignmentPatterns = infoVersion[version][2]

    // counting the number of bits for data fields in a QR-code
    const countDataBits = () => {
      /*
      * reduction: total (21+4*(version-1))**2
      * - search patterns (8*8*3+1) and synchronization 2*(21+4*(version-1)-8*2)
      * - format information (2*15)
      */
      let nBits = 16 * version * version + 128 * version + 64

      // number of sync pattern positions
      const qtyAP = this.positionAlignmentPatterns.length

      if (qtyAP) {
        /*
        * reduction: total 5*5 bits * qtyAP**2 number of blocks
        * - 2*(5 * (qtyAP-2)) synchronization pattern intersection
        * - 5*5*3 not displayed (intersected with search patterns)
        */
        nBits -= 25 * qtyAP * qtyAP - 10 * qtyAP - 55
      }
      if (this.needsVerInfo) {
        nBits -= 36; // version information 2*18
      }

      return nBits
    }

    /*
    * maximum amount of information (including information about method and number of data)
    * block stream must be a multiple of 8 (clear the last 3 bits)
    * subtract ECC bits: 8 bits per byte * number of bytes per block * number of blocks
    */
    this.bitsData = (countDataBits() & ~7) - 8 * this.bytesCorrectionPerBlock * this.qtyBlocks
  }

  /*
  * rewriting the string into an array of actually encoded characters
  */
  textToData()
  {
    const text = this.text, data = this.data

    if (this.mode === constQR.MODE_NUMERIC || this.mode === constQR.MODE_ALPHANUMERIC) {
      this.data = text.split('')
      return
    }

    // split the encoded utf-8 string (including ASCII) into an array of octets (bytes)
    for (const codePoint of text) {
      // for characters up to 65535 and for a pair of surrogates returns UTF-8 code
      const utfCode = codePoint.codePointAt(0)

      if (utfCode < 128) {
        data.push(utfCode)

      } else if (utfCode > 2097151) {
        data.length = 0
        break

      } else {
        // number of additional octets of 6 bits to write the value
        const nAddOctets = (utfCode < 2048) ? 1 : (utfCode < 65536) ? 2 : 3

        // first octet
        data.push([0xc0, 0xe0, 0xf0][nAddOctets - 1] | (utfCode >> 6 * nAddOctets))

        // subsequent octets
        for (let i = nAddOctets; i > 0;) {
          data.push(0x80 | ((utfCode >> 6 * --i) & 0x3f))
        }
      }
    }
  }

  // generation of data codewords (no ECC bits)
  dataToCodewords()
  {
    const data = this.data, datalen = data.length, mode = this.mode,
      maxQtyCodewordsData = this.bitsData >> 3,
      codewordsData = this.codewordsData;

    // bitstream queue packing into 8-bit codewords
    let bits = 0, remaining = 8
    const pack = (x, n) => {
      while (n > 0) {
        x &= (1 << n) - 1

        if (n < remaining) {
          bits |= x << (remaining -= n)
          n = 0

        } else {  // n >= remaining
          bits |= x >>> (n -= remaining)
          codewordsData.push(bits)
          bits = 0
          remaining = 8
        }
      }
    }

    // encoding method
    pack(mode, 4)

    // amount of data
    pack(datalen, this.bitsFieldDataQty)

    // data encoded according to mode
    switch (mode) {
      case constQR.MODE_NUMERIC:
        for (let i = 2; i < datalen; i += 3) {
          pack(+(data[i - 2] + data[i - 1] + data[i]), 10)
        }

        const rest = [0, 4, 7][datalen % 3]

        if (rest) {
          pack(+((rest === 7 ? data[datalen - 2] : '') + data[datalen - 1]), rest)
        }

        break

      case constQR.MODE_ALPHANUMERIC:
        const mapCode = constQR.ALPHANUMERIC_MAP

        for (let i = 1; i < datalen; i += 2) {
          pack(mapCode[data[i - 1]] * 45 + mapCode[data[i]], 11)
        }

        if (datalen % 2) {
          pack(mapCode[data[datalen - 1]], 6)
        }

        break

      case constQR.MODE_OCTET:
        data.forEach(x => pack(x, 8))
        break
    }

    // overflow control of the number of code words
    if ((codewordsData.length < maxQtyCodewordsData - 1) || remaining === 8) {
      pack(constQR.MODE_TERMINATOR, 4)
    }

    // last meaningful word
    if (remaining < 8) {
      codewordsData.push(bits)
    }

    // padding with interleaved bytes to maxQtyCodewordsData
    while (codewordsData.length + 1 < maxQtyCodewordsData) {
      codewordsData.push(0xec, 0x11)
    }

    if (codewordsData.length < maxQtyCodewordsData) {
      codewordsData.push(0xec)
    }
  }

  /*
  * generate code words for placement in a QR code
  */
  makeCodewordsQR()
  {
    const qtyBlocks = this.qtyBlocks,
      poly = this.codewordsData,
      genpoly = this.genpoly

    const codewordsQR = this.codewordsQR

    /*
    * creating a navigation map of data blocks with an equal number of elements for an array of a given length,
    * if not evenly distributed, the number of elements in the last blocks increases by 1
    *
    * returns:
    *   array of indices of the first block elements in the array, where the last contains the total number of elements,
    *   the number of elements in the block, the number of blocks without adding one element
    */
    const makeMapBlocks = (qtyElements, qtyBlocks) => {
      const posBlocks = []

      const qtyElementsInBlock = (qtyElements / qtyBlocks) | 0,
        qtyBlocksWithoutAdd = qtyBlocks - qtyElements % qtyBlocks

      for (let j = 0, pos = 0; j < qtyBlocks + 1; j++) {
        posBlocks.push(pos)
        pos += qtyElementsInBlock + (j < qtyBlocksWithoutAdd ? 0 : 1)
      }

      return {
        pos: posBlocks,
        qtyElementsInBlock,
        qtyBlocksWithoutAdd
      }
    }

    // computes ECC codewords for a group of codewords and a generating polynomial
    const calculateECC = (poly, genpoly) => {
      const codewords = [...poly].concat(Array(genpoly.length).fill(0))

      for (let i = 0; i < poly.length;) {
        const quotient = constQR.GF256_INV[codewords[i++]]

        if (quotient >= 0) {
          for (let j = 0; j < genpoly.length; ++j) {
            codewords[i + j] ^= constQR.GF256[(genpoly[j] + quotient) % 255]
          }
        }
      }

      return codewords.slice(poly.length)
    }

    // map of location of blocks in data
    const mapBlocks = makeMapBlocks(poly.length, qtyBlocks)

    // for each block of codewords we create error codes
    const blocksECC = []

    for (let j = 0; j < qtyBlocks; ++j) {
      blocksECC.push(calculateECC(poly.slice(mapBlocks.pos[j], mapBlocks.pos[j + 1]), genpoly))
    }

    // collecting a stream of code words for placement in a QR code

    // - codewords from all blocks
    for (let i = 0; i < mapBlocks.qtyElementsInBlock; ++i) {
      for (let j = 0; j < qtyBlocks; ++j) {
        codewordsQR.push(poly[mapBlocks.pos[j] + i])
      }
    }
    // - codewords from blocks containing an additional word
    for (let j = mapBlocks.qtyBlocksWithoutAdd; j < qtyBlocks; ++j) {
      codewordsQR.push(poly[mapBlocks.pos[j + 1] - 1])
    }
    // - ECC codewords
    for (let i = 0; i < genpoly.length; ++i) {
      for (let j = 0; j < qtyBlocks; ++j) {
        codewordsQR.push(blocksECC[j][i])
      }
    }
  }

  /*
  * generate version code word (with ECC bits),
  * the Golay code (18,6) is used to obtain the error correction bits.
  * generating polynomial: x^12+x^11+x^10+x^9+x^8+x^5+x^2+1 or 0x1F25
  * Annex D, paragraph D.1 page 70 GOST R ISO/IEC 18004-2015
  */
  makeCodewordVersion()
  {
    return this.needsVerInfo ? constQR.encodeBCH(this.version, 6, 0x1F25, 12) : 0
  }

  /*
  * generate a format code word (mask code, error correction level code, ECC bits),
  * Bose-Chaudhuri-Hocquenghem code (BCH) (15.5) is used to get the error correction bits
  * generating polynomial: x^10+x^8+x^5+x^4+x^2+x+1 or 0x537
  * additionally encoded XORs with mask pattern 0x5412
  * Annex С, paragraph С.1 page 68 GOST R ISO/IEC 18004-2015
  */
  makeCodewordFormat(mask)
  {
    return constQR.encodeBCH((this.eccl << 3) | mask, 5, 0x537, 10) ^ 0x5412
  }

  /*
  * filling in the QR-code matrix
  */
  makeMatrix()
  {
    const version = this.version
    const isMaskAuto = this.mask < 0

    let mask = isMaskAuto ? 0 : this.mask, maskFunc = constQR.MASKFUNCS[mask]

    const aligns = this.positionAlignmentPatterns

    const codewordVersion = this.makeCodewordVersion()

    // format codeword (mask code, error correction level code, ECC bits)
    let codewordFormat = this.makeCodewordFormat(mask)
    const codewordsQR = this.codewordsQR

    const matrixSize = 21 + 4 * (version - 1),   // QR-code matrix size according to version
      matrix = new Array(matrixSize), // QR-code matrix
      // unmasked data matrix
      mapData = isMaskAuto
        ? new Array(matrixSize)
        : []

    // put w-bit words from listWords array into matrix starting from x,y coordinate
    const placeBlock = (x, y, w, listWords) => {
      for (let j = 0; j < listWords.length; ++j) {
        for (let i = 0; i < w; ++i) {
          matrix[y + j][x + i] = (listWords[j] >> i) & 1
        }
      }
    }

    // put format information in matrix
    const placeFormatInfo = (codewordFormat) => {
      const n = matrixSize
      const y = [0, 1, 2, 3, 4, 5, 7, 8, n - 7, n - 6, n - 5, n - 4, n - 3, n - 2, n - 1]
      const x = [n - 1, n - 2, n - 3, n - 4, n - 5, n - 6, n - 7, n - 8, 7, 5, 4, 3, 2, 1, 0]

      for (let i = 0; i < 15; ++i) {
        matrix[8][x[i]] = matrix[y[i]][8] = (codewordFormat >> i) & 1
      }
    }

    // initialization of the QR-code matrix and, if necessary,
    // auto-selection of the mask, unmasked data matrix
    for (let i = 0; i < matrixSize; ++i) {
      matrix[i] = (new Array(matrixSize)).fill(null)

      if (isMaskAuto) {
        mapData[i] = (new Array(matrixSize)).fill(null)
      }
    }

    // delimiter search patterns
    placeBlock(0, 0, 8, [0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x7f, 0x0])
    placeBlock(matrixSize - 8, 0, 8, [0xfe, 0x82, 0xba, 0xba, 0xba, 0x82, 0xfe, 0x0])
    placeBlock(0, matrixSize - 8, 8, [0x0, 0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x7f])
    placeBlock(8, matrixSize - 8, 1, [0x1])

    // templates of synchronization
    for (let i = 8; i < matrixSize - 8; ++i) {
      matrix[i][6] = matrix[6][i] = ~i & 1
    }

    // guide templates
    const m = aligns.length

    for (let x = 0; x < m; ++x) {
      const miny = (x === 0 || x === m - 1 ? 1 : 0), maxy = (x === 0 ? m - 1 : m)

      for (let y = miny; y < maxy; ++y) {
        placeBlock(aligns[x], aligns[y], 5, [0x1f, 0x11, 0x15, 0x11, 0x1f])
      }
    }

    // format information
    placeFormatInfo(codewordFormat)

    // version information
    if (codewordVersion) {
      for (let y = 0, k = 0; y < 6; ++y) {
        for (let x = 0; x < 3; ++x) {
          matrix[y][(matrixSize - 11) + x] = matrix[(matrixSize - 11) + x][y] = (codewordVersion >> k++) & 1
        }
      }
    }

    /*
    * Codewords and error corrections are filled with codeword bits,
    * null-elements of the matrix from the most significant bit of the word to the least significant bit,
    * the remaining unfilled null elements are set equal to 0
    * (see JIS X 0510:2004, section 8.7.3).
    */
    for (let x = matrixSize - 1, k = 0, direction = -1; x > -1; x -= 2) {
      if (x === 6) --x // skip entire sync pattern column

      for (let y = 0; y < matrixSize; y++) {
        let j = (direction < 0 ? matrixSize - y - 1 : y)

        for (let i = x; i > x - 2; i--) {
          if (matrix[j][i] === null) {
            /*
            * if there are empty null elements,
            * (k >> 3) will become larger (codewordsQR.length - 1),
            * but (undefined >> (~k&7)) === 0,
            * so the remaining null elements will be filled with nulls
            */
            const bit = (codewordsQR[k >> 3] >> (~k & 7)) & 1

            matrix[j][i] = bit ^ maskFunc(j, i);

            if (isMaskAuto) {
              mapData[j][i] = bit
            }

            ++k
          }
        }
      }

      direction = -direction
    }

    // automatic mask selection
    if (isMaskAuto) {
      // changing the data mask of the QR-code matrix
      const reMask = (mask) => {
        const maskFunc = constQR.MASKFUNCS[mask]
        // format codeword (mask code, error correction level code, ECC bits)
        let codewordFormat = this.makeCodewordFormat(mask)

        // format information is overwritten
        placeFormatInfo(codewordFormat)

        // overlaying the selected mask on the data bit stream
        mapData.forEach((aY, j) => {
          aY.forEach((el, i) => {
            if (el !== null) {
              matrix[j][i] = el ^ maskFunc(j, i)
            }
          })
        })
      }

      // mask tests
      const testScore = (Array(constQR.MASKFUNCS.length).fill(0)).map((el, i) => {
        if (i) reMask(i) // the current matrix is already set to zero mask
        return this.maskTest(matrix)
      })

      // selection of the best mask, with the least number of penalty points
      mask = testScore.reduce((bestMask, score, mask) => {
        if (score < bestMask.score) {
          bestMask.mask = mask
          bestMask.score = score
        }

        return bestMask

      }, {
        mask: 0,
        score: testScore[0]
      }).mask

      // set the selected mask
      reMask(mask)
      // fix the selected mask
      this.mask = mask
    }

    // completed QR-code matrix
    this.matrix = matrix
  }

  /*
  * evaluates the QR-code matrix and returns the score
  */
  maskTest(matrix)
  {
    const matrixSize = matrix.length

    let qtyBlack = 0, // number of black modules (matrix elements with value 1)
      score = 0,
      groups

    // evaluate groups of sequences: the number of consecutive white and black blocks,
    // assumes the order [W,B,W,B,W...]
    const evaluateGroups = (groups) => {
      let sum = 0

      // test CONSECUTIVE
      for (let i = 0; i < groups.length; ++i) {
        if (groups[i] >= 5) sum += constQR.PENALTY.CONSECUTIVE + (groups[i] - 5)
      }

      // test FINDERLIKE (looks like a search pattern [W4],B1,W1,B3,W1,B1,[W4])
      // starting with the third black group
      for (let i = 5; i < groups.length; i += 2) {
        if (groups[i] === 1 &&    // Ч1
          groups[i - 1] === 1 &&  // Б1
          groups[i - 2] === 3 &&  // Ч3
          groups[i - 3] === 1 &&  // Б1
          groups[i - 4] === 1 &&  // Ч1
          // right or left 4 or more W
          (groups[i - 5] >= 4 || groups[i + 1] >= 4)) {
          sum += constQR.PENALTY.FINDERLIKE
        }
      }

      return sum
    }

    for (let xy = 0; xy < matrixSize; ++xy) {
      const rowCells = matrix[xy]
      const nextRowCells = matrix[xy + 1] || []

      // evaluate rows
      groups = []

      for (let x = 0; x < matrixSize;) {
        let qty
        // first group of whites
        for (qty = 0; x < matrixSize && !rowCells[x]; ++qty) ++x;
        groups.push(qty)

        for (qty = 0; x < matrixSize && rowCells[x]; ++qty) ++x
        groups.push(qty)
      }

      score += evaluateGroups(groups)

      // evaluate columns
      groups = []

      for (let y = 0; y < matrixSize;) {
        let qty;
        // first group of whites
        for (qty = 0; y < matrixSize && !matrix[y][xy]; ++qty) ++y
        groups.push(qty)

        for (qty = 0; y < matrixSize && matrix[y][xy]; ++qty) ++y
        groups.push(qty)
      }

      score += evaluateGroups(groups)

      // test TWOBYTWO (two-two) and count the black blocks
      qtyBlack += rowCells[0]

      for (let x = 1; x < matrixSize; ++x) {
        qtyBlack += rowCells[x]

        if (rowCells[x] === rowCells[x - 1] &&
          rowCells[x] === nextRowCells[x] &&
          rowCells[x] === nextRowCells[x - 1]) {
          score += constQR.PENALTY.TWOBYTWO
        }
      }
    }

    // test DENSITY
    score += constQR.PENALTY.DENSITY *
      (((Math.abs(qtyBlack * 100 / matrixSize / matrixSize - 50) - 1) / 5) | 0)

    return score
  }

  /*
  * status report
  */
  report()
  {
    return new QRCODE(
      this.image,
      {
        text: this.text,
        mode: this.mode,
        eccl: this.eccl,
        version: this.version,
        mask: this.mask,
        matrix: this.matrix,

        modsize: this.modsize,
        margin: this.margin
      },
      {
        error: this.error,
        errorSubcode: this.errorSubcode
      }
    )
  }
}
