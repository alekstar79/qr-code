# QR Code Generator

[![npm version](https://img.shields.io/npm/v/@alekstar79/qr-code.svg)](https://www.npmjs.com/package/@alekstar79/qr-code)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-repo-green.svg?style=flat)](https://github.com/alekstar79/qr-code)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square)](https://www.typescriptlang.org)
[![Coverage](https://img.shields.io/badge/coverage-95.83%25-brightgreen.svg)](https://github.com/alekstar79/qr-code)

A lightweight, dependency‑free QR code generator written in TypeScript.  
It creates QR codes in **PNG**, **SVG**, or **HTML** (CSS Grid) formats, with full control over encoding mode, error correction, version, mask, module size, and quiet zone.

👉 [**Live Demo**](https://alekstar79.github.io/qr-code)

---

## Features

- 🔢 Supports **numeric**, **alphanumeric**, and **octet (UTF‑8)** modes.
- 🛡️ All four error correction levels (L, M, Q, H) – automatically chooses the best if not specified.
- 📦 Works with any version from 1 to 40 – picks the smallest possible version automatically.
- 🎭 Mask pattern selection (0‑7) with automatic best‑mask evaluation.
- 🖼️ Output formats: **PNG** (Canvas), **SVG**, **HTML** (responsive CSS Grid), or **NONE** (only matrix).
- 📏 Customizable module size (`modsize`) and margin (quiet zone).
- 📥 Built‑in `download()` method to save the generated QR code as a file.
- 🌐 Full TypeScript support with clear types.
- 🔧 No external dependencies – pure JavaScript/TypeScript.

---

## Installation

### Using npm

```bash
npm install @alekstar79/qr-code-generator
```

Then import it in your project:

```typescript
import { makeQRCode } from '@alekstar79/qr-code-generator'
```

> **Note**: The CDN path points to the compiled ESM module. For legacy script tags, you can also download the file from the [releases](https://github.com/alekstar79/qr-code/releases) page.

---

## Usage

### Basic Example

```typescript
import { makeQRCode } from '@alekstar79/qr-code-generator'

const qr = makeQRCode('https://example.com')
document.body.appendChild(qr.result) // result is an HTMLCanvasElement
```

### With Options

```typescript
import { makeQRCode, QROptions } from '@alekstar79/qr-code-generator'

const options: QROptions = {
  mode: -1,           // auto (numeric, alphanumeric, or octet)
  eccl: 2,            // High error correction
  version: -1,        // auto version
  mask: -1,           // auto mask
  image: 'SVG',       // output format: 'PNG', 'SVG', 'HTML', 'NONE'
  modsize: 8,         // module size in pixels (only for PNG/SVG)
  margin: 4           // quiet zone in modules
}

const qr = makeQRCode('Hello, World!', options)
document.getElementById('qr-container')!.appendChild(qr.result)
```

### Using the Returned Object

```typescript
import { makeQRCode, QRCode } from '@alekstar79/qr-code-generator'

const qr: QRCode = makeQRCode('My data')

// Access generated matrix (0/1/null)
console.log(qr.matrix)

// Change output format after generation
qr.image = 'HTML'          // updates qr.result accordingly

// Download as file
qr.download('my-qr.png')   // uses current format
qr.download('my-qr.svg', 'SVG') // specify format
```

---

## API Reference

### `makeQRCode(text: string, options?: QROptions): QRCode`

### `makeQRCode(options: QROptions): QRCode`

Generates a QR code and returns an object with the following properties and methods.

#### `QROptions`

| Property  | Type                                                 | Default | Description                                                                              |
|-----------|------------------------------------------------------|---------|------------------------------------------------------------------------------------------|
| `text`    | `string`                                             | `''`    | The data to encode.                                                                      |
| `mode`    | `Mode` (`-1 \| 1 \| 2 \| 4`)                         | `-1`    | Encoding mode: `1` = numeric, `2` = alphanumeric, `4` = octet (UTF‑8), `-1` = auto.      |
| `eccl`    | `Eccl` (`-1 \| 0 \| 1 \| 2 \| 3`)                    | `-1`    | Error correction level: `0` = M, `1` = L, `2` = H, `3` = Q, `-1` = auto (tries H first). |
| `version` | `number` (`-1 \| 1–40`)                              | `-1`    | QR code version (size). `-1` selects the smallest possible version.                      |
| `mask`    | `Mask` (`-1 \| 0–7`)                                 | `-1`    | Mask pattern. `-1` selects the best mask automatically.                                  |
| `image`   | `ImageFormat` (`'PNG' \| 'SVG' \| 'HTML' \| 'NONE'`) | `'PNG'` | Output format. `'NONE'` skips image generation (only matrix is available).               |
| `modsize` | `number`                                             | `4`     | Module size in pixels (for PNG/SVG). Ignored for `'HTML'`.                               |
| `margin`  | `number`                                             | `4`     | Quiet zone width in modules.                                                             |

#### Returned `QRCode` object

| Property                       | Type                                                     | Description                                                                                                                                                                                                                 |
|--------------------------------|----------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `text`                         | `string`                                                 | The original input text.                                                                                                                                                                                                    |
| `mode`                         | `Mode`                                                   | The encoding mode used.                                                                                                                                                                                                     |
| `eccl`                         | `Eccl`                                                   | Error correction level used.                                                                                                                                                                                                |
| `version`                      | `number`                                                 | QR code version.                                                                                                                                                                                                            |
| `mask`                         | `Mask`                                                   | Mask pattern applied.                                                                                                                                                                                                       |
| `matrix`                       | `(number \| null)[][]`                                   | The QR matrix (0 = white, 1 = black, null = reserved areas).                                                                                                                                                                |
| `modsize`                      | `number`                                                 | Module size actually used (may differ from input if auto).                                                                                                                                                                  |
| `margin`                       | `number`                                                 | Margin size actually used.                                                                                                                                                                                                  |
| `result`                       | `HTMLElement \| HTMLCanvasElement \| SVGElement \| null` | The generated image element. `null` if an error occurred or format is `'NONE'`.                                                                                                                                             |
| `error`                        | `string`                                                 | Error code (empty if no error).                                                                                                                                                                                             |
| `errorSubcode`                 | `string`                                                 | Additional error details.                                                                                                                                                                                                   |
| `download(filename?, format?)` | `void`                                                   | Triggers download of the QR code image. If no `filename` given, default is `qrcode.png`, `qrcode.svg`, or `qrcode.html` based on format. If `format` is provided, it temporarily changes the image format for the download. |

#### Changing `image` property

You can change the output format after generation by assigning a new value to `qr.image`. This will update `qr.result` accordingly.

```typescript
qr.image = 'SVG'      // qr.result becomes an SVGElement
qr.image = 'HTML'     // qr.result becomes a HTMLDivElement with CSS Grid
```

---

## Error Handling

If an error occurs, `qr.error` contains the name of the property that caused the issue (e.g., `'text'`, `'version'`), and `qr.errorSubcode` gives more details.

Common error codes:

| `error`     | `errorSubcode` | Meaning                                               |
|-------------|----------------|-------------------------------------------------------|
| `'text'`    | `'1'`          | Invalid text format.                                  |
| `'text'`    | `'2'`          | Empty text.                                           |
| `'text'`    | `'3'`          | Text contains invalid characters for the chosen mode. |
| `'mode'`    | `'1'`          | Unsupported encoding mode.                            |
| `'version'` | `'1'`          | Text too long for any version.                        |
| `'version'` | `'2'`          | Invalid version number.                               |
| `'version'` | `'3'`          | Text too long for the specified version.              |
| `'eccl'`    | `'1'`          | Invalid error correction level.                       |
| `'mask'`    | `'1'`          | Invalid mask pattern.                                 |
| `'image'`   | `'1'`          | Unsupported image format.                             |
| `'modsize'` | `'1'`          | Invalid module size.                                  |
| `'margin'`  | `'1'`          | Invalid margin size.                                  |

Additionally, library‑specific error codes:

| `error`                      | Meaning                                                     |
|------------------------------|-------------------------------------------------------------|
| `'ERR_TEXT_EMPTY'`           | Text is empty.                                              |
| `'ERR_INVALID_CHAR'`         | Text contains unsupported characters for the selected mode. |
| `'ERR_VERSION_OUT_OF_RANGE'` | Invalid version number.                                     |

---

## Browser Support

| Chrome | Firefox | Edge  | Safari | Opera |
|--------|---------|-------|--------|-------|
| ≥ 106  | ≥ 105   | ≥ 106 | ≥ 15   | ≥ 92  |

Works in all modern browsers that support Canvas, SVG, and CSS Grid (for the HTML output). The library itself is pure ECMAScript and does not rely on any polyfills.

---

## Development

### Project Structure

```
qr-code/
├── src/
│   ├── constants.ts         # QR code tables and constants
│   ├── qr-code-generator.ts # Core QR encoding logic
│   ├── image-renderer.ts    # Converts matrix to PNG/SVG/HTML
│   ├── types.ts             # TypeScript definitions
│   ├── index.ts             # Public API (makeQRCode)
│   ├── main.ts              # Demo app (Vite)
│   └── css/                 # Demo styles
├── test/                    # Unit tests (Vitest + JSDOM)
├── lib/                     # Build output (library)
├── dist/                    # Build output (demo)
├── package.json
├── tsconfig.json
├── vite.config.ts           # Demo build config
└── vite.config.lib.ts       # Library build config
```

### Build Commands

```bash
# Build library (output to lib/)
yarn build:lib

# Build demo (output to dist/)
yarn build:demo

# Run development server (demo)
yarn dev

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage
```

### Testing

The test suite uses [Vitest](https://vitest.dev/) with JSDOM. Run `yarn test` to execute all tests.

---

## License

ISC © [alekstar79](https://github.com/alekstar79)

---

## Useful Links

- **Tutorial** [QR Code Tutorial](https://www.thonky.com/qr-code-tutorial/introduction)
- **Habr.com** [QR Code generation algorithm](https://habr.com/ru/post/172525/)
- **Standard** [QR Code ISO/IEC 18004:2015 Barcode Symbol Specification](https://meganorm.ru/Data2/1/4293763/4293763455.pdf)
