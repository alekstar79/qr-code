const MODE_TERMINATOR = 0;
const MODE_NUMERIC = 1;
const MODE_ALPHANUMERIC = 2;
const MODE_OCTET = 4;
const isMode = (mode) => [1, 2, 4].includes(mode);
const ECCLEVEL_H = 2;
const isEccl = (eccl) => eccl >= 0 && eccl < 4;
const bitsFieldDataQuantity = (version, mode) => {
  if (version < 10) {
    switch (mode) {
      case MODE_NUMERIC:
        return 10;
      case MODE_ALPHANUMERIC:
        return 9;
      case MODE_OCTET:
        return 8;
    }
  } else if (version < 27) {
    switch (mode) {
      case MODE_NUMERIC:
        return 12;
      case MODE_ALPHANUMERIC:
        return 11;
      case MODE_OCTET:
        return 16;
    }
  } else {
    switch (mode) {
      case MODE_NUMERIC:
        return 14;
      case MODE_ALPHANUMERIC:
        return 13;
      case MODE_OCTET:
        return 16;
    }
  }
  return 0;
};
const ALPHANUMERIC_MAP = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:".split("").reduce((map, ch, i) => {
  map[ch] = i;
  return map;
}, {});
const GF256 = [];
const GF256_INV = [-1];
for (let i = 0, v = 1; i < 255; ++i) {
  GF256.push(v);
  GF256_INV[v] = i;
  v = v * 2 ^ (v >= 128 ? 285 : 0);
}
const GF256_GENPOLY = {};
for (let i = 0, genpoly = []; i < 30; ++i) {
  const poly = [];
  for (let j = 0; j <= i; ++j) {
    const a = j < i ? GF256[genpoly[j]] : 0;
    const b = GF256[(i + (genpoly[j - 1] || 0)) % 255];
    poly.push(GF256_INV[a ^ b]);
  }
  genpoly = poly;
  if ([7, 10, 13, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30].includes(i + 1)) {
    GF256_GENPOLY[i + 1] = poly;
  }
}
const encodeBCH = (poly, bitsPoly, genpoly, bitsGenpoly) => {
  let modulus = poly << bitsGenpoly;
  for (let i = bitsPoly - 1; i >= 0; --i) {
    if (modulus >> bitsGenpoly + i & 1) {
      modulus ^= genpoly << i;
    }
  }
  return poly << bitsGenpoly | modulus;
};
const MASKFUNCS = [
  (y, x) => (y + x) % 2 === 0,
  (y, _) => y % 2 === 0,
  (_, x) => x % 3 === 0,
  (y, x) => (y + x) % 3 === 0,
  (y, x) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (y, x) => y * x % 2 + y * x % 3 === 0,
  (y, x) => (y * x % 2 + y * x % 3) % 2 === 0,
  (y, x) => ((y + x) % 2 + y * x % 3) % 2 === 0
];
const PENALTY = {
  CONSECUTIVE: 3,
  TWOBYTWO: 3,
  FINDERLIKE: 40,
  DENSITY: 10
};
const IMAGE_FORMATS = ["PNG", "SVG", "HTML", "NONE"];
const DEFAULT_MODSIZE = 4;
const DEFAULT_MARGIN = 4;
const infoVersion = [
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
  [[28, 30, 30, 30], [49, 25, 81, 68], [4, 28, 56, 84, 112, 140, 168]]
];
class ImageRenderer {
  matrix;
  modsize;
  // This is now primarily for download, CSS handles display
  margin;
  // This is now handled by generating extra grid cells
  constructor(matrix, modsize, margin) {
    this.matrix = matrix;
    this.modsize = modsize;
    this.margin = margin;
  }
  render(format) {
    switch (format) {
      case "PNG":
        return this.renderPNG();
      case "SVG":
        return this.renderSVG();
      case "HTML":
        return this.renderHTML();
      case "NONE":
        return document.createElement("div");
    }
  }
  renderPNG() {
    const matrix = this.matrix;
    const matrixSize = this.matrix.length;
    const modsize = this.modsize;
    const margin = this.margin;
    const canvasSize = modsize * (matrixSize + 2 * margin);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = canvasSize;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get canvas context");
    }
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvasSize, canvasSize);
    context.fillStyle = "#000";
    for (let y = 0; y < matrixSize; ++y) {
      for (let x = 0; x < matrixSize; ++x) {
        if (matrix[y][x]) {
          context.fillRect(modsize * (margin + x), modsize * (margin + y), modsize, modsize);
        }
      }
    }
    return canvas;
  }
  renderSVG() {
    const result = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const matrix = this.matrix;
    const matrixSize = this.matrix.length;
    const modsize = this.modsize;
    const margin = this.margin;
    const svgSize = modsize * (matrixSize + 2 * margin);
    const svg = [
      "<style>.bg{fill:#FFF}.fg{fill:#000}</style>",
      `<rect class="bg" x="0" y="0" width="${svgSize}" height="${svgSize}"/>`
    ];
    const svgCommon = ` class="fg" width="${modsize}" height="${modsize}"/>`;
    result.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);
    result.setAttribute("style", "shape-rendering:crispEdges");
    let yo = margin * modsize;
    for (let y = 0; y < matrixSize; ++y) {
      let xo = margin * modsize;
      for (let x = 0; x < matrixSize; ++x) {
        if (matrix[y][x]) {
          svg.push(`<rect x="${xo}" y="${yo}"${svgCommon}`);
        }
        xo += modsize;
      }
      yo += modsize;
    }
    result.innerHTML = svg.join("");
    return result;
  }
  /**
   * Renders the QR code as an HTML div using CSS Grid.
   * This avoids the issues with table scaling and inline styles.
   */
  renderHTML() {
    const qrCodeDiv = document.createElement("div");
    qrCodeDiv.className = "qrcode";
    const matrix = this.matrix;
    const matrixSize = this.matrix.length;
    const margin = this.margin;
    const totalGridSize = matrixSize + 2 * margin;
    qrCodeDiv.style.setProperty("--qr-total-modules", totalGridSize.toString());
    const modules = [];
    for (let y = 0; y < totalGridSize; ++y) {
      for (let x = 0; x < totalGridSize; ++x) {
        const isMatrixCell = y >= margin && y < margin + matrixSize && x >= margin && x < margin + matrixSize;
        let isBlack = false;
        if (isMatrixCell) {
          isBlack = matrix[y - margin][x - margin] === 1;
        }
        modules.push(
          `<div class="qr-module ${isBlack ? "black" : "white"}"></div>`
        );
      }
    }
    qrCodeDiv.innerHTML = modules.join("");
    return qrCodeDiv;
  }
}
class QRCodeGenerator {
  text;
  mode;
  eccl;
  _version;
  mask;
  error = "";
  errorSubcode = "";
  bitsData = 0;
  qtyBlocks = 0;
  bytesCorrectionPerBlock = 0;
  genpoly = [];
  bitsFieldDataQty = 0;
  positionAlignmentPatterns = [];
  data = [];
  codewordsData = [];
  codewordsQR = [];
  matrix = [];
  constructor(text, mode, eccl, version, mask) {
    this._version = version;
    this.text = text;
    this.mode = mode;
    this.eccl = eccl;
    this.mask = mask;
  }
  get version() {
    return this._version;
  }
  set version(version) {
    this._version = version;
    if (isMode(this.mode) && isEccl(this.eccl) && version > 0 && version < 41) {
      this.fixedInfoVersion(version, this.mode, this.eccl);
    }
  }
  get needsVerInfo() {
    return this.version > 6;
  }
  fixedInfoVersion(version, mode, eccl) {
    const versionInfo = infoVersion[version];
    this.qtyBlocks = versionInfo[1][eccl];
    this.bytesCorrectionPerBlock = versionInfo[0][eccl];
    this.genpoly = GF256_GENPOLY[this.bytesCorrectionPerBlock];
    this.bitsFieldDataQty = bitsFieldDataQuantity(version, mode);
    this.positionAlignmentPatterns = versionInfo[2];
    const countDataBits = () => {
      let nBits = 16 * version * version + 128 * version + 64;
      const qtyAP = this.positionAlignmentPatterns.length;
      if (qtyAP) {
        nBits -= 25 * qtyAP * qtyAP - 10 * qtyAP - 55;
      }
      if (this.needsVerInfo) {
        nBits -= 36;
      }
      return nBits;
    };
    this.bitsData = (countDataBits() & -8) - 8 * this.bytesCorrectionPerBlock * this.qtyBlocks;
  }
  textToData() {
    const text = this.text;
    const data = [];
    if (this.mode === MODE_NUMERIC || this.mode === MODE_ALPHANUMERIC) {
      this.data = text.split("");
      return;
    }
    for (const codePoint of text) {
      const utfCode = codePoint.codePointAt(0);
      if (utfCode < 128) {
        data.push(utfCode);
      } else if (utfCode > 2097151) {
        data.length = 0;
        break;
      } else {
        const nAddOctets = utfCode < 2048 ? 1 : utfCode < 65536 ? 2 : 3;
        data.push([192, 224, 240][nAddOctets - 1] | utfCode >> 6 * nAddOctets);
        for (let i = nAddOctets; i > 0; ) {
          data.push(128 | utfCode >> 6 * --i & 63);
        }
      }
    }
    this.data = data;
  }
  dataToCodewords() {
    const data = this.data;
    const datalen = data.length;
    const mode = this.mode;
    const maxQtyCodewordsData = this.bitsData >> 3;
    const codewordsData = [];
    let bits = 0;
    let remaining = 8;
    const pack = (x, n) => {
      while (n > 0) {
        x &= (1 << n) - 1;
        if (n < remaining) {
          bits |= x << (remaining -= n);
          n = 0;
        } else {
          bits |= x >>> (n -= remaining);
          codewordsData.push(bits);
          bits = 0;
          remaining = 8;
        }
      }
    };
    pack(mode, 4);
    pack(datalen, this.bitsFieldDataQty);
    switch (mode) {
      case MODE_NUMERIC:
        for (let i = 2; i < datalen; i += 3) {
          pack(+(data[i - 2] + data[i - 1] + data[i]), 10);
        }
        const rest = [0, 4, 7][datalen % 3];
        if (rest) {
          pack(+((rest === 7 ? data[datalen - 2] : "") + data[datalen - 1]), rest);
        }
        break;
      case MODE_ALPHANUMERIC:
        for (let i = 1; i < datalen; i += 2) {
          pack(ALPHANUMERIC_MAP[data[i - 1]] * 45 + ALPHANUMERIC_MAP[data[i]], 11);
        }
        if (datalen % 2) {
          pack(ALPHANUMERIC_MAP[data[datalen - 1]], 6);
        }
        break;
      case MODE_OCTET:
        data.forEach((x) => pack(x, 8));
        break;
    }
    if (codewordsData.length < maxQtyCodewordsData - 1 || remaining === 8) {
      pack(MODE_TERMINATOR, 4);
    }
    if (remaining < 8) {
      codewordsData.push(bits);
    }
    while (codewordsData.length + 1 < maxQtyCodewordsData) {
      codewordsData.push(236, 17);
    }
    if (codewordsData.length < maxQtyCodewordsData) {
      codewordsData.push(236);
    }
    this.codewordsData = codewordsData;
  }
  makeCodewordsQR() {
    const qtyBlocks = this.qtyBlocks;
    const poly = this.codewordsData;
    const genpoly = this.genpoly;
    const codewordsQR = [];
    const makeMapBlocks = (qtyElements, qtyBlocks2) => {
      const posBlocks = [];
      const qtyElementsInBlock = Math.floor(qtyElements / qtyBlocks2);
      const qtyBlocksWithoutAdd = qtyBlocks2 - qtyElements % qtyBlocks2;
      for (let j = 0, pos = 0; j < qtyBlocks2 + 1; j++) {
        posBlocks.push(pos);
        pos += qtyElementsInBlock + (j < qtyBlocksWithoutAdd ? 0 : 1);
      }
      return {
        pos: posBlocks,
        qtyElementsInBlock,
        qtyBlocksWithoutAdd
      };
    };
    const calculateECC = (poly2, genpoly2) => {
      const codewords = [...poly2].concat(Array(genpoly2.length).fill(0));
      for (let i = 0; i < poly2.length; ) {
        const quotient = GF256_INV[codewords[i++]];
        if (quotient >= 0) {
          for (let j = 0; j < genpoly2.length; ++j) {
            codewords[i + j] ^= GF256[(genpoly2[j] + quotient) % 255];
          }
        }
      }
      return codewords.slice(poly2.length);
    };
    const mapBlocks = makeMapBlocks(poly.length, qtyBlocks);
    const blocksECC = [];
    for (let j = 0; j < qtyBlocks; ++j) {
      blocksECC.push(calculateECC(poly.slice(mapBlocks.pos[j], mapBlocks.pos[j + 1]), genpoly));
    }
    for (let i = 0; i < mapBlocks.qtyElementsInBlock; ++i) {
      for (let j = 0; j < qtyBlocks; ++j) {
        codewordsQR.push(poly[mapBlocks.pos[j] + i]);
      }
    }
    for (let j = mapBlocks.qtyBlocksWithoutAdd; j < qtyBlocks; ++j) {
      codewordsQR.push(poly[mapBlocks.pos[j + 1] - 1]);
    }
    for (let i = 0; i < genpoly.length; ++i) {
      for (let j = 0; j < qtyBlocks; ++j) {
        codewordsQR.push(blocksECC[j][i]);
      }
    }
    this.codewordsQR = codewordsQR;
  }
  makeCodewordVersion() {
    return this.needsVerInfo ? encodeBCH(this.version, 6, 7973, 12) : 0;
  }
  makeCodewordFormat(mask) {
    return encodeBCH(this.eccl << 3 | mask, 5, 1335, 10) ^ 21522;
  }
  makeMatrix() {
    const version = this.version;
    const isMaskAuto = this.mask < 0;
    let mask = isMaskAuto ? 0 : this.mask;
    let maskFunc = MASKFUNCS[mask];
    const aligns = this.positionAlignmentPatterns;
    const codewordVersion = this.makeCodewordVersion();
    let codewordFormat = this.makeCodewordFormat(mask);
    const codewordsQR = this.codewordsQR;
    const matrixSize = 21 + 4 * (version - 1);
    const matrix = new Array(matrixSize);
    const mapData = isMaskAuto ? new Array(matrixSize) : [];
    const placeBlock = (x, y, w, listWords) => {
      for (let j = 0; j < listWords.length; ++j) {
        for (let i = 0; i < w; ++i) {
          matrix[y + j][x + i] = listWords[j] >> i & 1;
        }
      }
    };
    const placeFormatInfo = (codewordFormat2) => {
      const n = matrixSize;
      const y = [0, 1, 2, 3, 4, 5, 7, 8, n - 7, n - 6, n - 5, n - 4, n - 3, n - 2, n - 1];
      const x = [n - 1, n - 2, n - 3, n - 4, n - 5, n - 6, n - 7, n - 8, 7, 5, 4, 3, 2, 1, 0];
      for (let i = 0; i < 15; ++i) {
        matrix[8][x[i]] = matrix[y[i]][8] = codewordFormat2 >> i & 1;
      }
    };
    for (let i = 0; i < matrixSize; ++i) {
      matrix[i] = new Array(matrixSize).fill(null);
      if (isMaskAuto) {
        mapData[i] = new Array(matrixSize).fill(null);
      }
    }
    placeBlock(0, 0, 8, [127, 65, 93, 93, 93, 65, 127, 0]);
    placeBlock(matrixSize - 8, 0, 8, [254, 130, 186, 186, 186, 130, 254, 0]);
    placeBlock(0, matrixSize - 8, 8, [0, 127, 65, 93, 93, 93, 65, 127]);
    placeBlock(8, matrixSize - 8, 1, [1]);
    for (let i = 8; i < matrixSize - 8; ++i) {
      matrix[i][6] = matrix[6][i] = ~i & 1;
    }
    const m = aligns.length;
    for (let x = 0; x < m; ++x) {
      const miny = x === 0 || x === m - 1 ? 1 : 0;
      const maxy = x === 0 ? m - 1 : m;
      for (let y = miny; y < maxy; ++y) {
        placeBlock(aligns[x], aligns[y], 5, [31, 17, 21, 17, 31]);
      }
    }
    placeFormatInfo(codewordFormat);
    if (codewordVersion) {
      for (let y = 0, k = 0; y < 6; ++y) {
        for (let x = 0; x < 3; ++x) {
          matrix[y][matrixSize - 11 + x] = matrix[matrixSize - 11 + x][y] = codewordVersion >> k++ & 1;
        }
      }
    }
    for (let x = matrixSize - 1, k = 0, direction = -1; x > -1; x -= 2) {
      if (x === 6) --x;
      for (let y = 0; y < matrixSize; y++) {
        let j = direction < 0 ? matrixSize - y - 1 : y;
        for (let i = x; i > x - 2; i--) {
          if (matrix[j][i] === null) {
            const bit = codewordsQR[k >> 3] >> (~k & 7) & 1;
            matrix[j][i] = bit ^ (maskFunc(j, i) ? 1 : 0);
            if (isMaskAuto) {
              mapData[j][i] = bit;
            }
            ++k;
          }
        }
      }
      direction = -direction;
    }
    if (isMaskAuto) {
      const reMask = (mask2) => {
        maskFunc = MASKFUNCS[mask2];
        codewordFormat = this.makeCodewordFormat(mask2);
        placeFormatInfo(codewordFormat);
        mapData.forEach((aY, j) => {
          aY.forEach((el, i) => {
            if (el !== null) {
              matrix[j][i] = el ^ (maskFunc(j, i) ? 1 : 0);
            }
          });
        });
      };
      const testScore = Array(MASKFUNCS.length).fill(0).map((_, i) => {
        if (i) reMask(i);
        return this.maskTest(matrix);
      });
      mask = testScore.reduce(
        (bestMask, score, mask2) => {
          if (score < bestMask.score) {
            bestMask.mask = mask2;
            bestMask.score = score;
          }
          return bestMask;
        },
        { mask: 0, score: testScore[0] }
      ).mask;
      reMask(mask);
      this.mask = mask;
    }
    this.matrix = matrix;
  }
  maskTest(matrix) {
    const matrixSize = matrix.length;
    let qtyBlack = 0;
    let score = 0;
    let groups;
    const evaluateGroups = (groups2) => {
      let sum = 0;
      for (let i = 0; i < groups2.length; ++i) {
        if (groups2[i] >= 5) sum += PENALTY.CONSECUTIVE + (groups2[i] - 5);
      }
      for (let i = 5; i < groups2.length; i += 2) {
        if (groups2[i] === 1 && groups2[i - 1] === 1 && groups2[i - 2] === 3 && groups2[i - 3] === 1 && groups2[i - 4] === 1 && (groups2[i - 5] >= 4 || groups2[i + 1] >= 4)) {
          sum += PENALTY.FINDERLIKE;
        }
      }
      return sum;
    };
    for (let xy = 0; xy < matrixSize; ++xy) {
      const rowCells = matrix[xy];
      const nextRowCells = matrix[xy + 1] || [];
      groups = [];
      for (let x = 0; x < matrixSize; ) {
        let qty;
        for (qty = 0; x < matrixSize && !rowCells[x]; ++qty) ++x;
        groups.push(qty);
        for (qty = 0; x < matrixSize && rowCells[x]; ++qty) ++x;
        groups.push(qty);
      }
      score += evaluateGroups(groups);
      groups = [];
      for (let y = 0; y < matrixSize; ) {
        let qty;
        for (qty = 0; y < matrixSize && !matrix[y][xy]; ++qty) ++y;
        groups.push(qty);
        for (qty = 0; y < matrixSize && matrix[y][xy]; ++qty) ++y;
        groups.push(qty);
      }
      score += evaluateGroups(groups);
      qtyBlack += rowCells[0] || 0;
      for (let x = 1; x < matrixSize; ++x) {
        qtyBlack += rowCells[x] || 0;
        if (rowCells[x] === rowCells[x - 1] && rowCells[x] === nextRowCells[x] && rowCells[x] === nextRowCells[x - 1]) {
          score += PENALTY.TWOBYTWO;
        }
      }
    }
    score += PENALTY.DENSITY * Math.floor((Math.abs(qtyBlack * 100 / matrixSize / matrixSize - 50) - 1) / 5);
    return score;
  }
}
class QROptionsError extends Error {
  constructor(setting, subcode) {
    super(`QR options error: ${setting} - ${subcode}`);
    this.setting = setting;
    this.subcode = subcode;
    this.name = "QROptionsError";
  }
}
const notInteger = (value) => value !== Math.floor(value);
const testText = (text) => {
  if (typeof text !== "string") return new QROptionsError("text", "1");
  if (text.length === 0) return new QROptionsError("text", "2");
  return null;
};
const testMode = (mode, text) => {
  const ALPHANUMERIC_REGEXP = /^[A-Z0-9 $%*+\-./:]*$/;
  const NUMERIC_REGEXP = /^\d*$/;
  if ((mode === MODE_NUMERIC || mode === -1) && NUMERIC_REGEXP.test(text)) {
    return MODE_NUMERIC;
  }
  if ((mode === MODE_ALPHANUMERIC || mode === -1) && ALPHANUMERIC_REGEXP.test(text)) {
    return MODE_ALPHANUMERIC;
  }
  if (mode === MODE_OCTET || mode === -1) {
    return MODE_OCTET;
  }
  return new QROptionsError("mode", "1");
};
const testVersion = (qrcode, ecclChoice) => {
  const { mode } = qrcode;
  const bitsDataMax = () => {
    const nBits = qrcode.bitsData - 4 - qrcode.bitsFieldDataQty;
    switch (mode) {
      case MODE_NUMERIC:
        return Math.floor(nBits / 10) * 3 + (nBits % 10 < 4 ? 0 : nBits % 10 < 7 ? 1 : 2);
      case MODE_ALPHANUMERIC:
        return Math.floor(nBits / 11) * 2 + (nBits % 11 < 6 ? 0 : 1);
      case MODE_OCTET:
        return Math.floor(nBits / 8);
    }
    return 0;
  };
  const fitLength = (version2) => {
    qrcode.version = version2;
    return qrcode.data.length <= bitsDataMax();
  };
  const ecclVersion = (version2, ecclChoice2, iStart = 0) => {
    const ecclPriority = [ECCLEVEL_H, 3, 0, 1];
    if (!ecclChoice2) {
      return fitLength(version2);
    }
    for (let i = iStart; i < 4; ++i) {
      qrcode.eccl = ecclPriority[i];
      if (fitLength(version2)) {
        return true;
      }
    }
    return false;
  };
  let version = qrcode.version;
  if (version === -1) {
    if (ecclChoice) {
      qrcode.eccl = ECCLEVEL_H;
    }
    for (version = 1; version < 41; ++version) {
      if (fitLength(version)) break;
    }
    if (version > 40 && (!ecclChoice || !ecclVersion(40, ecclChoice, 1))) {
      return new QROptionsError("version", "1");
    }
  } else if (version < 1 || version > 40 || notInteger(version)) {
    return new QROptionsError("version", "2");
  } else {
    if (!ecclVersion(version, ecclChoice)) {
      return new QROptionsError("version", "3");
    }
  }
  qrcode.version = version;
  return null;
};
function makeQRCode(text = "", options = {}) {
  const {
    mode = -1,
    eccl = -1,
    version = -1,
    mask = -1,
    image = "PNG",
    modsize = -1,
    margin = -1
  } = options;
  const qrcode = new QRCodeGenerator(text, mode, eccl, version, mask);
  let finalModsize = modsize;
  let finalMargin = margin;
  let optionsError = null;
  const textError = testText(text);
  if (textError) {
    optionsError = textError;
  } else {
    const modeResult = testMode(mode, text);
    if (modeResult instanceof QROptionsError) {
      optionsError = modeResult;
    } else {
      qrcode.mode = modeResult;
      qrcode.textToData();
      if (qrcode.data.length === 0) {
        optionsError = new QROptionsError("text", "3");
      } else if (eccl < -1 || eccl > 3 || notInteger(eccl)) {
        optionsError = new QROptionsError("eccl", "1");
      } else {
        const versionError = testVersion(qrcode, eccl < 0);
        if (versionError) {
          optionsError = versionError;
        } else if (mask !== -1 && (mask < 0 || mask > 7 || notInteger(mask))) {
          optionsError = new QROptionsError("mask", "1");
        } else if (!IMAGE_FORMATS.includes(image)) {
          optionsError = new QROptionsError("image", "1");
        } else if (modsize === -1) {
          finalModsize = DEFAULT_MODSIZE;
        } else if (modsize < 1 || notInteger(modsize)) {
          optionsError = new QROptionsError("modsize", "1");
        }
        if (!optionsError) {
          if (margin === -1) {
            finalMargin = DEFAULT_MARGIN;
          } else if (margin < 0 || notInteger(margin)) {
            optionsError = new QROptionsError("margin", "1");
          }
        }
        if (!optionsError) {
          try {
            qrcode.dataToCodewords();
            qrcode.makeCodewordsQR();
            qrcode.makeMatrix();
          } catch (e) {
            qrcode.error = "unknown";
            qrcode.errorSubcode = "0";
          }
        }
      }
    }
  }
  if (optionsError) {
    qrcode.error = optionsError.setting;
    qrcode.errorSubcode = optionsError.subcode;
  }
  const renderer = new ImageRenderer(qrcode.matrix, finalModsize, finalMargin);
  const result = qrcode.error ? null : renderer.render(image);
  const download = (filename = "", downloadImage = image) => {
    const content = renderer.render(downloadImage);
    let dataUrl = "";
    if (content instanceof HTMLCanvasElement) {
      dataUrl = content.toDataURL();
      if (!filename) filename = "qrcode.png";
    } else if (content instanceof SVGElement) {
      const svgXml = new XMLSerializer().serializeToString(content);
      dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgXml)}`;
      if (!filename) filename = "qrcode.svg";
    } else if (content instanceof HTMLElement) {
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
      `;
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
</html>`;
      dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`;
      if (!filename) filename = "qrcode.html";
    }
    const el = document.createElement("a");
    el.setAttribute("href", dataUrl);
    el.setAttribute("download", filename);
    el.click();
  };
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
  };
}
export {
  makeQRCode
};
