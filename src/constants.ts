/**
 * This module contains constants and tables from the ISO/IEC 18004:2015 specification.
 * These values are essential for the QR code generation process.
 */

/**
 * Mode constants (see Table 2 in JIS X 0510:2004 page 16)
 */
export const MODE_TERMINATOR = 0
export const MODE_NUMERIC = 1
export const MODE_ALPHANUMERIC = 2
export const MODE_OCTET = 4

/**
 * Checks if a given mode is a valid QR code mode.
 * @param mode The mode to check.
 * @returns True if the mode is valid, false otherwise.
 */
export const isMode = (mode: number): boolean => [1, 2, 4].includes(mode);

/**
 * ECC levels (see Table 22 in JIS X 0510:2004 page 45)
 */
export const ECCLEVEL_M = 0
export const ECCLEVEL_L = 1
export const ECCLEVEL_H = 2
export const ECCLEVEL_Q = 3

/**
 * Checks if a given ECC level is valid.
 * @param eccl The ECC level to check.
 * @returns True if the ECC level is valid, false otherwise.
 */
export const isEccl = (eccl: number): boolean => eccl >= 0 && eccl < 4

/**
 * Returns the number of bits required to write data length.
 * (see Table 3 in JIS X 0510:2004 page 16)
 * @param version The QR code version.
 * @param mode The encoding mode.
 * @returns The number of bits for the data quantity field.
 */
export const bitsFieldDataQuantity = (version: number, mode: number): number => {
  if (version < 10) {
    switch (mode) {
      case MODE_NUMERIC: return 10
      case MODE_ALPHANUMERIC: return 9
      case MODE_OCTET: return 8
    }
  } else if (version < 27) {
    switch (mode) {
      case MODE_NUMERIC: return 12
      case MODE_ALPHANUMERIC: return 11
      case MODE_OCTET: return 16
    }
  } else {
    switch (mode) {
      case MODE_NUMERIC: return 14
      case MODE_ALPHANUMERIC: return 13
      case MODE_OCTET: return 16
    }
  }

  return 0
}

/**
 * Table of character values in alphanumeric encoding.
 * (see Table 5 in JIS X 0510:2004, page 19)
 */
export const ALPHANUMERIC_MAP: { [key: string]: number } = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
  .split('')
  .reduce((map: { [key: string]: number }, ch, i) => {
    map[ch] = i
    return map
  }, {})

/**
 * Logarithmic and anti-logarithmic tables for GF(256) arithmetic.
 */
export const GF256: number[] = []
export const GF256_INV: number[] = [-1]

// Generating QR code logs for Galois field 256
for (let i = 0, v = 1; i < 255; ++i) {
  GF256.push(v)
  GF256_INV[v] = i
  v = (v * 2) ^ (v >= 128 ? 0x11d : 0) // 0x11d === 0b100011101
}

/**
 * Generating polynomials for error correction.
 */
export const GF256_GENPOLY: { [key: number]: number[] } = {}

for (let i = 0, genpoly: number[] = []; i < 30; ++i) {
  const poly: number[] = []

  for (let j = 0; j <= i; ++j) {
    const a = (j < i ? GF256[genpoly[j]] : 0)
    const b = GF256[(i + (genpoly[j - 1] || 0)) % 255]
    poly.push(GF256_INV[a ^ b])
  }

  genpoly = poly
  if ([7, 10, 13, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30].includes(i + 1)) {
    GF256_GENPOLY[i + 1] = poly
  }
}

/**
 * Encodes data using BCH code.
 * @param poly The polynomial to encode.
 * @param bitsPoly The number of bits in the polynomial.
 * @param genpoly The generator polynomial.
 * @param bitsGenpoly The number of bits in the generator polynomial.
 * @returns The BCH encoded data.
 */
export const encodeBCH = (poly: number, bitsPoly: number, genpoly: number, bitsGenpoly: number): number => {
  let modulus = poly << bitsGenpoly

  for (let i = bitsPoly - 1; i >= 0; --i) {
    if ((modulus >> (bitsGenpoly + i)) & 1) {
      modulus ^= genpoly << i
    }
  }

  return (poly << bitsGenpoly) | modulus
}

/**
 * Masking functions.
 * (see Table 20 in JIS X 0510:2004, page 42)
 */
export const MASKFUNCS: ((y: number, x: number) => boolean)[] = [
  (y, x) => (y + x) % 2 === 0,
  (y, _) => y % 2 === 0,
  (_, x) => x % 3 === 0,
  (y, x) => (y + x) % 3 === 0,
  (y, x) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (y, x) => (y * x) % 2 + (y * x) % 3 === 0,
  (y, x) => ((y * x) % 2 + (y * x) % 3) % 2 === 0,
  (y, x) => ((y + x) % 2 + (y * x) % 3) % 2 === 0,
]

/**
 * Penalty scores for QR code matrix evaluation.
 * (see JIS X 0510:2004, section 8.8.2)
 */
export const PENALTY = {
  CONSECUTIVE: 3,
  TWOBYTWO: 3,
  FINDERLIKE: 40,
  DENSITY: 10
}

/**
 * Supported image formats.
 */
export const IMAGE_FORMATS = ['PNG', 'SVG', 'HTML', 'NONE'] as const

/**
 * Default module size.
 */
export const DEFAULT_MODSIZE = 4

/**
 * Default margin size.
 */
export const DEFAULT_MARGIN = 4

/**
 * Version information.
 * (see JIS X 0510:2004, page 30–36, 71)
 */
export const infoVersion: (number | number[][] | number[][][] | null)[] = [
  null,
  [[10, 7, 17, 13], [1, 1, 1, 1], []],
  [[16, 10, 28, 22], [1, 1, 1, 1], [4, 16]],
  [[26, 15, 22, 18], [1, 1, 2, 2], [4, 20]],
  [[18, 20, 16, 26], [2, 1, 4, 2], [4, 24]],
  [[24, 26, 22, 18], [2, 1, 4, 4], [4, 28]],
  [[16, 18, 28, 24], [4, 2, 4, 4], [4, 32]],
  [[18, 20, 26, 18], [4, 2, 5, 6], [4, 20, 36]],
  [[22, 24, 26, 22], [4, 2, 6, 6], [4, 22, 40]],
  [[22, 30, 24, 20], [5, 2, 8, 8], [4, 24, 44]],
  [[26, 18, 28, 24], [5, 4, 8, 8], [4, 26, 48]],
  [[30, 20, 24, 28], [5, 4, 11, 8], [4, 28, 52]],
  [[22, 24, 28, 26], [8, 4, 11, 10], [4, 30, 56]],
  [[22, 26, 22, 24], [9, 4, 16, 12], [4, 32, 60]],
  [[24, 30, 24, 20], [9, 4, 16, 16], [4, 24, 44, 64]],
  [[24, 22, 24, 30], [10, 6, 18, 12], [4, 24, 46, 68]],
  [[28, 24, 30, 24], [10, 6, 16, 17], [4, 24, 48, 72]],
  [[28, 28, 28, 28], [11, 6, 19, 16], [4, 28, 52, 76]],
  [[26, 30, 28, 28], [13, 6, 21, 18], [4, 28, 54, 80]],
  [[26, 28, 26, 26], [14, 7, 25, 21], [4, 28, 56, 84]],
  [[26, 28, 28, 30], [16, 8, 25, 20], [4, 32, 60, 88]],
  [[26, 28, 30, 28], [17, 8, 25, 23], [4, 26, 48, 70, 92]],
  [[28, 28, 24, 30], [17, 9, 34, 23], [4, 24, 48, 72, 96]],
  [[28, 30, 30, 30], [18, 9, 30, 25], [4, 28, 52, 76, 100]],
  [[28, 30, 30, 30], [20, 10, 32, 27], [4, 26, 52, 78, 104]],
  [[28, 26, 30, 30], [21, 12, 35, 29], [4, 30, 56, 82, 108]],
  [[28, 28, 30, 28], [23, 12, 37, 34], [4, 28, 56, 84, 112]],
  [[28, 30, 30, 30], [25, 12, 40, 34], [4, 32, 60, 88, 116]],
  [[28, 30, 30, 30], [26, 13, 42, 35], [4, 24, 48, 72, 96, 120]],
  [[28, 30, 30, 30], [28, 14, 45, 38], [4, 28, 52, 76, 100, 124]],
  [[28, 30, 30, 30], [29, 15, 48, 40], [4, 24, 50, 76, 102, 128]],
  [[28, 30, 30, 30], [31, 16, 51, 43], [4, 28, 54, 80, 106, 132]],
  [[28, 30, 30, 30], [33, 17, 54, 45], [4, 32, 58, 84, 110, 136]],
  [[28, 30, 30, 30], [35, 18, 57, 48], [4, 28, 56, 84, 112, 140]],
  [[28, 30, 30, 30], [37, 19, 60, 51], [4, 32, 60, 88, 116, 144]],
  [[28, 30, 30, 30], [38, 19, 63, 53], [4, 28, 52, 76, 100, 124, 148]],
  [[28, 30, 30, 30], [40, 20, 66, 56], [4, 22, 48, 74, 100, 126, 152]],
  [[28, 30, 30, 30], [43, 21, 70, 59], [4, 26, 52, 78, 104, 130, 156]],
  [[28, 30, 30, 30], [45, 22, 74, 62], [4, 30, 56, 82, 108, 134, 160]],
  [[28, 30, 30, 30], [47, 24, 77, 65], [4, 24, 52, 80, 108, 136, 164]],
  [[28, 30, 30, 30], [49, 25, 81, 68], [4, 28, 56, 84, 112, 140, 168]],
]
