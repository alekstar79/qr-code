import {
  // isEccl,
  DEFAULT_MARGIN,
  DEFAULT_MODSIZE,
  ECCLEVEL_H,
  IMAGE_FORMATS,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
} from './constants'
import { ImageRenderer } from './image-renderer'
import { QRCodeGenerator } from './qr-code-generator'
import { Eccl, ImageFormat, Mode, QROptions, QRCode } from './types'

class QROptionsError extends Error {
  constructor(public setting: string, public subcode: string) {
    super(`QR options error: ${setting} - ${subcode}`)
    this.name = 'QROptionsError'
  }
}

const notInteger = (value: number) => value !== Math.floor(value);

const testText = (text: unknown) => {
  if (typeof text !== 'string') {
    throw new QROptionsError('text', '1')
  }
  if (text.length === 0) {
    throw new QROptionsError('text', '2')
  }
}

const testMode = (mode: Mode, text: string): Mode => {
  const ALPHANUMERIC_REGEXP = /^[A-Z0-9 $%*+\-./:]*$/
  const NUMERIC_REGEXP = /^\d*$/

  if ((mode === MODE_NUMERIC || mode === -1) && NUMERIC_REGEXP.test(text)) {
    return MODE_NUMERIC
  }
  if ((mode === MODE_ALPHANUMERIC || mode === -1) && ALPHANUMERIC_REGEXP.test(text)) {
    return MODE_ALPHANUMERIC
  }
  if (mode === MODE_OCTET || mode === -1) {
    return MODE_OCTET
  }

  throw new QROptionsError('mode', '1')
}

const testVersion = (qrcode: QRCodeGenerator, ecclChoice: boolean) => {
  const { mode } = qrcode

  const bitsDataMax = () => {
    const nBits = (qrcode as any).bitsData - 4 - (qrcode as any).bitsFieldDataQty

    switch (mode) {
      case MODE_NUMERIC:
        return Math.floor(nBits / 10) * 3 + (nBits % 10 < 4 ? 0 : nBits % 10 < 7 ? 1 : 2)
      case MODE_ALPHANUMERIC:
        return Math.floor(nBits / 11) * 2 + (nBits % 11 < 6 ? 0 : 1)
      case MODE_OCTET:
        return Math.floor(nBits / 8)
    }

    return 0
  }

  const fitLength = (version: number) => {
    qrcode.version = version
    return (qrcode as any).data.length <= bitsDataMax()
  }

  const ecclVersion = (version: number, ecclChoice: boolean, iStart = 0) => {
    const ecclPriority = [ECCLEVEL_H, 3, 0, 1]

    if (!ecclChoice) {
      return fitLength(version)
    }

    for (let i = iStart; i < 4; ++i) {
      qrcode.eccl = ecclPriority[i] as Eccl

      if (fitLength(version)) {
        return true
      }
    }

    return false
  }

  let version = qrcode.version;
  if (version === -1) {
    if (ecclChoice) {
      qrcode.eccl = ECCLEVEL_H;
    }
    for (version = 1; version < 41; ++version) {
      if (fitLength(version)) break;
    }
    if (version > 40 && (!ecclChoice || !ecclVersion(40, ecclChoice, 1))) {
      throw new QROptionsError('version', '1');
    }
  } else if (version < 1 || version > 40 || notInteger(version)) {
    throw new QROptionsError('version', '2');
  } else {
    if (!ecclVersion(version, ecclChoice)) {
      throw new QROptionsError('version', '3');
    }
  }
  qrcode.version = version;
}

export function makeQRCode(text = '', options: QROptions = {}): QRCode {
  const {
    mode = -1,
    eccl = -1,
    version = -1,
    mask = -1,
    image = 'PNG',
    modsize = -1,
    margin = -1,
  } = options

  const qrcode = new QRCodeGenerator(text, mode, eccl, version, mask)
  let finalModsize = modsize
  let finalMargin = margin

  try {
    testText(text)
    qrcode.mode = testMode(mode, text)
    qrcode.textToData()

    if ((qrcode as any).data.length === 0) {
      throw new QROptionsError('text', '3')
    }

    if (eccl < -1 || eccl > 3 || notInteger(eccl)) {
      throw new QROptionsError('eccl', '1')
    }

    testVersion(qrcode, eccl < 0)

    if (mask !== -1 && (mask < 0 || mask > 8 || notInteger(mask))) {
      throw new QROptionsError('mask', '1')
    }

    if (!IMAGE_FORMATS.includes(image)) {
      throw new QROptionsError('image', '1')
    }

    if (modsize === -1) {
      finalModsize = DEFAULT_MODSIZE
    } else if (modsize < 1 || notInteger(modsize)) {
      throw new QROptionsError('modsize', '1')
    }

    if (margin === -1) {
      finalMargin = DEFAULT_MARGIN
    } else if (margin < 0 || notInteger(margin)) {
      throw new QROptionsError('margin', '1')
    }

    qrcode.dataToCodewords()
    qrcode.makeCodewordsQR()
    qrcode.makeMatrix()
  } catch (e) {
    if (e instanceof QROptionsError) {
      qrcode.error = e.setting
      qrcode.errorSubcode = e.subcode
    } else {
      qrcode.error = 'unknown'
      qrcode.errorSubcode = '0'
    }
  }

  const renderer = new ImageRenderer(qrcode.matrix, finalModsize, finalMargin)
  const result = qrcode.error ? null : renderer.render(image)

  const download = (filename = '', downloadImage: ImageFormat = image) => {
    const content = renderer.render(downloadImage)
    let dataUrl = ''

    if (content instanceof HTMLCanvasElement) {
      dataUrl = content.toDataURL()
      if (!filename) filename = 'qrcode.png'
    } else if (content instanceof SVGElement) {
      const svgXml = new XMLSerializer().serializeToString(content)
      dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`
      if (!filename) filename = 'qrcode.svg'
    } else if (content instanceof HTMLElement) {
      // Critical CSS for HTML QR code to be self-contained
      const htmlStyles = `
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f0f0; }
          .qrcode {
            display: grid;
            grid-template-columns: repeat(var(--qr-total-modules), 1fr);
            grid-template-rows: repeat(var(--qr-total-modules), 1fr);
            width: 90vmin; /* Use vmin to ensure it fits in the viewport and is square */
            height: 90vmin;
            aspect-ratio: 1 / 1;
            background-color: #fff;
            box-sizing: border-box;
            padding: 0;
          }
          .qr-module {
            background-color: #fff;
          }
          .qr-module.black {
            background-color: #000;
          }
        </style>
      `

      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code</title>
  ${htmlStyles}
</head>
<body>
  ${content.outerHTML}
</body>
</html>`

      dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`
      if (!filename) filename = 'qrcode.html'
    }

    const el = document.createElement('a')
    el.setAttribute('href', dataUrl)
    el.setAttribute('download', filename)
    el.click()
  }

  return {
    text: qrcode.text,
    mode: qrcode.mode,
    eccl: qrcode.eccl,
    version: qrcode.version,
    mask: qrcode.mask,
    matrix: qrcode.matrix,
    modsize: finalModsize,
    margin: finalMargin,
    error: qrcode.error,
    errorSubcode: qrcode.errorSubcode,
    result,
    download
  }
}
