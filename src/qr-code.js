/* QR code generator */

import { controlOptions } from './creator/controlOptions.js'
import { DataQR } from './creator/dataQR.js'

/*
parameters:
 text - UTF-8 string to encode
 [options], default: { mode: -1, eccl: -1, version: -1, mask: -1, image: 'PNG', modsize: -1, margin: -1}

   // - options:
   options.mode - encoding method: 1-numeric, 2-alphanumeric, 4-octet
     if not specified or -1, then a valid method is selected
   options.eccl - error correction level: 1(L), 0(M), 3(Q), 2(H)
     if not specified or -1, then selection of an acceptable level starting from 3(Q)
   options.version - version: integer in [1,40]
     if not specified or -1 then the smallest possible version is chosen
   options.mask: - mask pattern: integer in [0,7]
     if not specified or -1, then the best mask is chosen

   // - result parameters:
   options.image: - image format: case-insensitive string:
     one of 'PNG', 'SVG', 'HTML' or 'NONE' (don't render image),
     if not specified, the result is output in 'PNG' format
   options.modsize: - module size (modsize x modsize): integer greater than 1, if not specified or -1 then 4
   options.margin: - free zone size in modules: integer from 0, if not specified, then 4 modules

returns an object { ... }:
  // original text
  text,
  // parameters of the generated QR code
  mode, eccl, version, mask, image, modsize, margin,
  // array - QR code matrix in 0-white, 1-black
  matrix,
  // HTML image of the QR code in the specified format or '' in case of an error
  // or when the image === 'NONE' parameter was set
  result,
  // name of the parameter that caused the error, or '' if there were no errors
  // code explaining the error or '' if there are no errors
  errorSubcode
 */
window.makeQRCode = (text = '', options = {}) => {
  const qrcode = new DataQR(text, options)

  // to control QR code generation options
  controlOptions(qrcode)

  if (!qrcode.error) {
    // - generation of codewords (no ECC bits)
    qrcode.dataToCodewords()
    // - formation of code words for placement in a QR code (grouping with ECC)
    qrcode.makeCodewordsQR()
    // - formation of a QR code matrix
    qrcode.makeMatrix()
  }

  return qrcode.report()
}
