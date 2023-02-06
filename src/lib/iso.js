/* Information from the ISO specification */

export const constQR = {

  // Mode constants (see Table 2 in JIS X 0510:2004 page 16)
  MODE_TERMINATOR: 0,
  MODE_NUMERIC: 1,
  MODE_ALPHANUMERIC: 2,
  MODE_OCTET: 4,

  isMode: mode => '124'.includes(mode + ''),

  // ECC levels (see Table 22 in JIS X 0510:2004 page 45)
  ECCLEVEL_M: 0,
  ECCLEVEL_L: 1,
  ECCLEVEL_H: 2,
  ECCLEVEL_Q: 3,

  isEccl: eccl => eccl > -1 && eccl < 4,

  // Returns the number of bits required to write data
  // (see Table 3 in JIS X 0510:2004 page 16)
  bitsFieldDataQuantity: (version, mode) => {
    switch (mode) {
      case constQR.MODE_NUMERIC:
        return (version < 10 ? 10 : version < 27 ? 12 : 14)
      case constQR.MODE_ALPHANUMERIC:
        return (version < 10 ? 9 : version < 27 ? 11 : 13)
      case constQR.MODE_OCTET:
        return (version < 10 ? 8 : 16)
    }

    return 0
  },

  // Table of character values in alphanumeric encoding
  // in the form of an object: {'A':10, ..., ':': 44, ...}
  // (see Table 5 in JIS X 0510:2004, page 19)
  ALPHANUMERIC_MAP: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
    .split('')
    .reduce((map, ch, i) => {
      map[ch] = i;
      return map;
    }, {}),

  // Logarithmic tables and anti-logarithmic values,
  // used in GF(256) arithmetic (formed below)
  GF256: [],
  GF256_INV: [-1], // added to match index with value from GF256

  // Generating polynomials (formed below):
  // where i is the number of correction bytes
  // GF256_GENPOLY[i] - corresponding generating polynomial array
  GF256_GENPOLY: {},

  // completes the code BCH(p+q,q) to a polynomial over GF(2) for a correct genpoly
  encodeBCH: (poly, bitsPoly, genpoly, bitsGenpoly) => {
    let modulus = poly << bitsGenpoly

    for (let i = bitsPoly - 1; i >= 0; --i) {
      if ((modulus >> (bitsGenpoly + i)) & 1) {
        modulus ^= genpoly << i
      }
    }

    return (poly << bitsGenpoly) | modulus
  },

  // Function masking in terms of row number and column number,
  // where y/i refers to the row position of the module in question and x/j to its column position
  // (see Table 20 в JIS X 0510:2004, page 42)
  MASKFUNCS: [
    (y, x) => (y + x) % 2 === 0,
    (y, x) => y % 2 === 0,
    (y, x) => x % 3 === 0,
    (y, x) => (y + x) % 3 === 0,
    (y, x) => (((y / 2) | 0) + ((x / 3) | 0)) % 2 === 0,
    (y, x) => (y * x) % 2 + (y * x) % 3 === 0,
    (y, x) => ((y * x) % 2 + (y * x) % 3) % 2 === 0,
    (y, x) => ((y + x) % 2 + (y * x) % 3) % 2 === 0
  ],

  /*
  Constants for accruing penalty points for tests of the QR code matrix
   CONSECUTIVE:
     N1+(k-5) points for each consecutive row of k modules of the same color,
     where k >= 5 (the number of overlapping rows is not taken into account)
   TWOBYTWO:
     N2 points for each block of 2x2 modules of the same color (the number of overlapping blocks counts)
   FINDERLIKE:
     N3 points for each pattern with >4W:1B:1W:3B:1W:1B or 1B:1W:3B:1W:1B:>4W,
     or their multiples (for example, unlikely, but 13W:3B:3W:9B:3W:3B counts)
   DENSITY:
     N4*k points for each (5*k)% deviation from 50% black density,
     that is, k=1 for 55~60% and 40~45%, k=2 for 60~65% and 35~40%, etc.
     (see JIS X 0510:2004, section 8.8.2)
  */
  PENALTY: {
    CONSECUTIVE: 3,
    TWOBYTWO: 3,
    FINDERLIKE: 40,
    DENSITY: 10
  },

  /* image formats */
  IMAGE: ['PNG', 'SVG', 'HTML', 'NONE'],
  /* module size */
  modsize: 4,
  /* free zone size in modules */
  margin: 4
}

// Generating QR code logs for Galois field 256:
// logarithmic GF256 (2^8) integer values with decreasing polynomial x^8+x^4+x^3+x^2+1
// and anti-logarithmic GF256_INV values, where GF256[GF256_INV[i]] == i for all i in [1,256]
for (let i = 0, v = 1; i < 255; ++i) {
  constQR.GF256.push(v)
  constQR.GF256_INV[v] = i

  v = (v * 2) ^ (v >= 128 ? 0x11d : 0)  // 0x11d === 0b100011101
}

// Formation of generating polynomials (exponents of the generating polynomial)
// to create error correction codewords for the QR code,
// match with polynomials in JIS X 0510:2004 Appendix A
for (let i = 0, genpoly = []; i < 30; ++i) {
  const poly = []

  for (let j = 0; j <= i; ++j) {
    const a = (j < i ? constQR.GF256[genpoly[j]] : 0)
    const b = constQR.GF256[(i + (genpoly[j - 1] || 0)) % 255]

    poly.push(constQR.GF256_INV[a ^ b])
  }

  genpoly = poly

  if ([7, 10, 13, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30].includes(i + 1)) {
    constQR.GF256_GENPOLY[i + 1] = poly
  }
}

/*
Version information (see JIS X 0510:2004, page 30–36, 71)
  infoVersion[i] - where i is the version number
    [i,0]: number of correction bytes per code block by ECC levels
       (exponent of generating polynomial):
       [i,0,eccl], where eccl corresponds to the correction level [M,L,H,Q]

    [i,1]: number of code blocks by ECC levels:
       [i,1,l], where l corresponds to correction levels [M,L,H,Q]
    [i,2]: upper left positions of guide templates, starting from version 2

   Note:
     In order to unify the calculation algorithm, for infoVersion[1,2] added [],
     for infoVersion[2...6, 2] added one unused coordinate
*/
export const infoVersion = [
  null,  // added to refer to infoVersion by version number 1-40
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
  [[28, 30, 30, 30], [49, 25, 81, 68], [4, 28, 56, 84, 112, 140, 168]]
]
