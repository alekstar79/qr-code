// Control options for QR code generation
// noinspection ExceptionCaughtLocallyJS

import { constQR } from '../lib/iso.js'

export const controlOptions = (qrcode) => {
  const errorQR = (setting, subcode) => ({ name: 'QRoptionsError', setting, subcode })
  const notInteger = (value) => value !== (value & ~0)

  // string test for text encoding
  const testText = (text) => {
    try {
      if (typeof (text) !== 'string') {
        throw errorQR('text', '1')
      }
      if (text.length === 0) {
        throw errorQR('text', '2')
      }
    } catch (e) {
      if (e.name === 'QRoptionsError') {
        throw e
      }
    }
  }

  // string encoding method test
  const testMode = (mode, text) => {
    try {
      // mode validation regular expressions
      const ALPHANUMERIC_REGEXP = /^[A-Z0-9 $%*+\-./:]*$/,
        NUMERIC_REGEXP = /^\d*$/

      if ((mode === constQR.MODE_NUMERIC || mode === -1) && !text.replace(NUMERIC_REGEXP, '')) {
        mode = constQR.MODE_NUMERIC
      } else if ((mode === constQR.MODE_ALPHANUMERIC || mode === -1) && !text.replace(ALPHANUMERIC_REGEXP, '')) {
        mode = constQR.MODE_ALPHANUMERIC
      } else if (mode === constQR.MODE_OCTET || mode === -1) {
        mode = constQR.MODE_OCTET
      } else {
        throw errorQR('mode', '1')
      }
    } catch (e) {
      if (e.name === 'QRoptionsError') {
        throw e
      }
    } finally {
      qrcode.mode = mode
    }
  }

  // qr code version test (with selection of error correction level)
  const testVersion = (version, ecclChoice) => {
    const mode = qrcode.mode

    // returns the maximum data length possible in the given configuration.
    const bitsDataMax = () => {
      /*
      number of bits for "pure data":
        qrcode.bitsData data bits without error correction codewords
         - 4 bits for writing the method code
         - qrcode.sizeFieldDataQty bit to write the amount of data
      */
      const nBits = qrcode.bitsData - 4 - qrcode.bitsFieldDataQty

      switch (mode) {
        case constQR.MODE_NUMERIC:          // 3 digits in 10 bits + remainder: 1 digit in 4 bits or 2 digits in 7 bits
          return ((nBits / 10) | 0) * 3 + (nBits % 10 < 4 ? 0 : nBits % 10 < 7 ? 1 : 2)
        case constQR.MODE_ALPHANUMERIC:     // 2 letters in 11 bits + remainder 1 letter in 6 bits
          return ((nBits / 11) | 0) * 2 + (nBits % 11 < 6 ? 0 : 1)
        case constQR.MODE_OCTET:
          return (nBits / 8) | 0            // integer number of bytes
      }
    }

    // returns whether the text will fit in the qr-code of the given version
    const fitLength = (version) => {
      // setting the version and fixing information for building the qr code
      qrcode.version = version
      return qrcode.data.length <= bitsDataMax()
    }

    // selection of the error correction level for the version
    const ecclVersion = (version, ecclChoice, iStart = 0) => {
      // error correction level selection priority in descending order: 2(H) 3(Q) 0(M) 1(L)
      const ecclPriority = [2, 3, 0, 1]

      if (!ecclChoice) {
        return fitLength(version)
      }

      for (let i = iStart; i < 4; ++i) {
        // setting the version and fixing the information to build the qr code
        qrcode.eccl = ecclPriority[i]

        if (fitLength(version)) {
          return true
        }
      }

      return false
    }

    try {
      if (version === -1) {
        if (ecclChoice) {
          qrcode.eccl = 2 // start with "H"
        }

        for (version = 1; version < 41; ++version) {
          if (fitLength(version)) break
        }

        if (version > 40 && (!ecclChoice || !ecclVersion(40, ecclChoice, 1))) {
          throw errorQR('version', '1')
        }

      } else if (version < 1 || version > 40 || notInteger(version)) {
        throw errorQR('version', '2')

      } else {
        if (!ecclVersion(version, ecclChoice)) {
          throw errorQR('version', '3')
        }
      }
    } catch (e) {
      if (e.name === 'QRoptionsError') {
        throw e
      }
    }
  }

  try {
    // string test to encode
    testText(qrcode.text)
    // string encoding method test
    testMode(qrcode.mode, qrcode.text)
    // rewriting the string into an array of actually encoded characters
    qrcode.textToData()

    if (!qrcode.data.length) {
      throw errorQR('text', '3')
    }

    // error correction level: 0(M) 1(L) 3(Q) 2(H)
    if (qrcode.eccl < -1 || qrcode.eccl > 3 || notInteger(qrcode.eccl)) {
      throw errorQR('eccl', '1')
    }

    // qr code version test (with selection of error correction level)
    testVersion(qrcode.version, qrcode.eccl < 0)

    // маска применяется (и выбирается) после формировиня qr-кода
    if (qrcode.mask !== -1 && (qrcode.mask < 0 || qrcode.mask > 8 || notInteger(qrcode.mask))) {
      throw errorQR('mask', '1')
    }

    // image format
    if (!(constQR.IMAGE.includes(qrcode.image))) {
      throw errorQR('image', '1')
    }

    // module size n x n, where n > 1
    if (qrcode.modsize === -1) {
      qrcode.modsize = constQR.modsize
    } else if (qrcode.modsize < 1 || notInteger(qrcode.modsize)) {
      throw errorQR('modsize', '1')
    }

    // free zone size in modules: from 0
    if (qrcode.margin === -1) {
      qrcode.margin = constQR.margin
    } else if (qrcode.margin < 0 || notInteger(qrcode.margin)) {
      throw errorQR('margin', '1')
    }

  } catch (e) {
    qrcode.error = e.setting
    qrcode.errorSubcode = e.subcode
  }
}
