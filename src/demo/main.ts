import { makeQRCode } from '../lib';
import { Eccl, ImageFormat, QROptions } from '../lib/types';
import './style.css';

// --- DOM Elements ---
const textInput = document.getElementById('text-input') as HTMLTextAreaElement;
const ecclSelect = document.getElementById('eccl-select') as HTMLSelectElement;
const imageFormatSelect = document.getElementById('image-format-select') as HTMLSelectElement;
const modsizeInput = document.getElementById('modsize-input') as HTMLInputElement;
const marginInput = document.getElementById('margin-input') as HTMLInputElement;
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const qrCodeContainer = document.getElementById('qr-code-container') as HTMLDivElement;
const errorContainer = document.getElementById('error-container') as HTMLDivElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;

// --- State ---
let lastQrCodeResult: ReturnType<typeof makeQRCode> | null = null;

// --- Functions ---

/**
 * Gathers options from the UI controls.
 */
function getOptionsFromUI(): QROptions {
  return {
    eccl: parseInt(ecclSelect.value, 10) as Eccl,
    image: imageFormatSelect.value as ImageFormat,
    modsize: parseInt(modsizeInput.value, 10),
    margin: parseInt(marginInput.value, 10),
  };
}

/**
 * Generates and displays the QR code based on current UI settings.
 */
function generate() {
  const text = textInput.value;
  const options = getOptionsFromUI();

  // Clear previous state
  qrCodeContainer.innerHTML = '';
  errorContainer.textContent = '';
  downloadBtn.classList.add('hidden');

  if (!text) {
    errorContainer.textContent = 'Error: Text cannot be empty.';
    return;
  }

  const qrCode = makeQRCode(text, options);
  lastQrCodeResult = qrCode;

  if (qrCode.result) {
    const qrElement = qrCode.result as HTMLElement;
    
    // The CSS variable --qr-total-modules is now set directly by image-renderer.ts
    // No need to set any CSS variables here for HTML QR code.

    qrCodeContainer.appendChild(qrElement);
    downloadBtn.classList.remove('hidden');
  } else {
    errorContainer.textContent = `Error: ${qrCode.error} (subcode: ${qrCode.errorSubcode})`;
  }
}

/**
 * Handles the download button click.
 */
function handleDownload() {
  if (!lastQrCodeResult) return;

  const selectedFormat = imageFormatSelect.value as ImageFormat;
  const filename = `qrcode.${selectedFormat.toLowerCase()}`;
  
  lastQrCodeResult.download(filename, selectedFormat);
}

// --- Event Listeners ---
generateBtn.addEventListener('click', generate);
downloadBtn.addEventListener('click', handleDownload);

// --- Initial Generation ---
// Generate a QR code on page load
generate();
