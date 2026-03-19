/**
 * This module contains constants and tables from the ISO/IEC 18004:2015 specification.
 * These values are essential for the QR code generation process.
 */
/**
 * Mode constants (see Table 2 in JIS X 0510:2004 page 16)
 */
export declare const MODE_TERMINATOR = 0;
export declare const MODE_NUMERIC = 1;
export declare const MODE_ALPHANUMERIC = 2;
export declare const MODE_OCTET = 4;
/**
 * Checks if a given mode is a valid QR code mode.
 * @param mode The mode to check.
 * @returns True if the mode is valid, false otherwise.
 */
export declare const isMode: (mode: number) => boolean;
/**
 * ECC levels (see Table 22 in JIS X 0510:2004 page 45)
 */
export declare const ECCLEVEL_M = 0;
export declare const ECCLEVEL_L = 1;
export declare const ECCLEVEL_H = 2;
export declare const ECCLEVEL_Q = 3;
/**
 * Checks if a given ECC level is valid.
 * @param eccl The ECC level to check.
 * @returns True if the ECC level is valid, false otherwise.
 */
export declare const isEccl: (eccl: number) => boolean;
/**
 * Returns the number of bits required to write data length.
 * (see Table 3 in JIS X 0510:2004 page 16)
 * @param version The QR code version.
 * @param mode The encoding mode.
 * @returns The number of bits for the data quantity field.
 */
export declare const bitsFieldDataQuantity: (version: number, mode: number) => number;
/**
 * Table of character values in alphanumeric encoding.
 * (see Table 5 in JIS X 0510:2004, page 19)
 */
export declare const ALPHANUMERIC_MAP: {
    [key: string]: number;
};
/**
 * Logarithmic and anti-logarithmic tables for GF(256) arithmetic.
 */
export declare const GF256: number[];
export declare const GF256_INV: number[];
/**
 * Generating polynomials for error correction.
 */
export declare const GF256_GENPOLY: {
    [key: number]: number[];
};
/**
 * Encodes data using BCH code.
 * @param poly The polynomial to encode.
 * @param bitsPoly The number of bits in the polynomial.
 * @param genpoly The generator polynomial.
 * @param bitsGenpoly The number of bits in the generator polynomial.
 * @returns The BCH encoded data.
 */
export declare const encodeBCH: (poly: number, bitsPoly: number, genpoly: number, bitsGenpoly: number) => number;
/**
 * Masking functions.
 * (see Table 20 in JIS X 0510:2004, page 42)
 */
export declare const MASKFUNCS: ((y: number, x: number) => boolean)[];
/**
 * Penalty scores for QR code matrix evaluation.
 * (see JIS X 0510:2004, section 8.8.2)
 */
export declare const PENALTY: {
    CONSECUTIVE: number;
    TWOBYTWO: number;
    FINDERLIKE: number;
    DENSITY: number;
};
/**
 * Supported image formats.
 */
export declare const IMAGE_FORMATS: readonly ["PNG", "SVG", "HTML", "NONE"];
/**
 * Default module size.
 */
export declare const DEFAULT_MODSIZE = 4;
/**
 * Default margin size.
 */
export declare const DEFAULT_MARGIN = 4;
/**
 * Version information.
 * (see JIS X 0510:2004, page 30–36, 71)
 */
export declare const infoVersion: (number | number[][] | number[][][] | null)[];
