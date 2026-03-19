import { makeQRCode } from './index.ts'
import { Eccl, ImageFormat, Mode, Mask, QROptions } from './types.ts'
import './css/style.css'

// --- DOM Elements ---
const textInput = document.getElementById('text-input') as HTMLTextAreaElement
const modeSelect = document.getElementById('mode-select') as HTMLSelectElement
const ecclSelect = document.getElementById('eccl-select') as HTMLSelectElement
const versionInput = document.getElementById('version-input') as HTMLInputElement
const maskInput = document.getElementById('mask-input') as HTMLInputElement
const imageFormatSelect = document.getElementById('image-format-select') as HTMLSelectElement
const modsizeInput = document.getElementById('modsize-input') as HTMLInputElement
const marginInput = document.getElementById('margin-input') as HTMLInputElement
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement
const qrCodeContainer = document.getElementById('qr-code-container') as HTMLDivElement
const errorContainer = document.getElementById('error-container') as HTMLDivElement
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement
const langEnBtn = document.getElementById('lang-en') as HTMLButtonElement
const langRuBtn = document.getElementById('lang-ru') as HTMLButtonElement
const appTitle = document.querySelector('#app h1') as HTMLHeadingElement

// --- State ---
let lastQrCodeResult: ReturnType<typeof makeQRCode> | null = null
let currentLang: 'en' | 'ru' = 'en'           // Default language
let activeTooltip: HTMLElement | null = null  // To keep track of the currently open tooltip

// --- Translations ---
const translations = {
  en: {
    appTitle: 'QR Code Generator',
    textInputLabel: 'Text to encode',
    modeSelectLabel: 'Encoding Mode',
    ecclSelectLabel: 'Error Correction Level',
    versionInputLabel: 'Version (1-40, -1 for Auto)',
    maskInputLabel: 'Mask Pattern (0-7, -1 for Auto)',
    imageFormatSelectLabel: 'Image Format',
    modsizeInputLabel: 'Module Size (px)',
    marginInputLabel: 'Margin (modules)',
    generateButton: 'Generate QR Code',
    downloadButton: 'Download',
    autoOption: 'Auto',
    numericalOption: 'Numerical',
    alphanumericOption: 'Alphanumeric',
    binaryOption: 'Binary (UTF8)',
    ecclLOption: 'Low (L)',
    ecclMOption: 'Medium (M)',
    ecclQOption: 'Quartile (Q)',
    ecclHOption: 'High (H)',
    svgOption: 'SVG',
    pngOption: 'PNG',
    htmlOption: 'HTML',
    errorTextEmpty: 'Error: Text cannot be empty.',
    errorGeneric: 'Error:',
    tooltip_textInput: 'The data string to be encoded into the QR code. Supports various characters depending on the encoding mode.',
    tooltip_modeSelect: 'Selects the encoding method for the data. "Auto" will choose the most efficient mode based on the input text.',
    tooltip_ecclSelect: 'Error Correction Level. Higher levels provide more resilience against damage but result in larger QR codes.',
    tooltip_versionInput: 'The version of the QR code (1-40). Higher versions can store more data. "-1" for "Auto" selects the smallest possible version.',
    tooltip_maskInput: 'The mask pattern (0-7) applied to the QR code. "-1" for "Auto" selects the best mask to minimize visual patterns.',
    tooltip_imageFormatSelect: 'The output format for the QR code image. SVG and PNG are image files, HTML renders as a div grid.',
    tooltip_modsizeInput: 'The size of each individual module (pixel) in the QR code. Affects the overall size of the generated image.',
    tooltip_marginInput: 'The size of the quiet zone (empty border) around the QR code, measured in modules. Recommended to be at least 4 modules.',
  },
  ru: {
    appTitle: 'Генератор QR-кода',
    textInputLabel: 'Текст для кодирования',
    modeSelectLabel: 'Режим кодирования',
    ecclSelectLabel: 'Уровень коррекции ошибок',
    versionInputLabel: 'Версия (1-40, -1 для Авто)',
    maskInputLabel: 'Маска (0-7, -1 для Авто)',
    imageFormatSelectLabel: 'Формат изображения',
    modsizeInputLabel: 'Размер модуля (px)',
    marginInputLabel: 'Отступ (модули)',
    generateButton: 'Сгенерировать QR-код',
    downloadButton: 'Скачать',
    autoOption: 'Авто',
    numericalOption: 'Числовой',
    alphanumericOption: 'Буквенно-цифровой',
    binaryOption: 'Бинарный (UTF8)',
    ecclLOption: 'Низкий (L)',
    ecclMOption: 'Средний (M)',
    ecclQOption: 'Квартильный (Q)',
    ecclHOption: 'Высокий (H)',
    svgOption: 'SVG',
    pngOption: 'PNG',
    htmlOption: 'HTML',
    errorTextEmpty: 'Ошибка: Текст не может быть пустым.',
    errorGeneric: 'Ошибка:',
    tooltip_textInput: 'Строка данных для кодирования в QR-код. Поддерживает различные символы в зависимости от режима кодирования.',
    tooltip_modeSelect: 'Выбирает метод кодирования данных. "Авто" выберет наиболее эффективный режим на основе входного текста.',
    tooltip_ecclSelect: 'Уровень коррекции ошибок. Более высокие уровни обеспечивают большую устойчивость к повреждениям, но приводят к увеличению размера QR-кода.',
    tooltip_versionInput: 'Версия QR-кода (1-40). Более высокие версии могут хранить больше данных. "-1" для "Авто" выбирает наименьшую возможную версию.',
    tooltip_maskInput: 'Шаблон маски (0-7), применяемый к QR-коду. "-1" для "Авто" выбирает лучшую маску для минимизации визуальных шаблонов.',
    tooltip_imageFormatSelect: 'Выходной формат изображения QR-кода. SVG и PNG - это файлы изображений, HTML отображается как сетка div.',
    tooltip_modsizeInput: 'Размер каждого отдельного модуля (пикселя) в QR-коде. Влияет на общий размер сгенерированного изображения.',
    tooltip_marginInput: 'Размер тихой зоны (пустой границы) вокруг QR-кода, измеряется в модулях. Рекомендуется не менее 4 модулей.',
  }
}

// --- Functions ---

/**
 * Updates the UI elements with texts for the selected language.
 * @param lang The language to set ('en' or 'ru').
 */
function updateUIForLanguage(lang: 'en' | 'ru') {
  currentLang = lang
  const currentTranslations = translations[currentLang]

  // Update main title
  appTitle.textContent = currentTranslations.appTitle

  // Update elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n') as keyof typeof currentTranslations
    if (currentTranslations[key]) {
      element.textContent = currentTranslations[key]
    }
  })

  // Update option texts in selects
  document.querySelectorAll('#mode-select option').forEach(option => {
    const key = option.getAttribute('data-i18n') as keyof typeof currentTranslations
    if (currentTranslations[key]) {
      option.textContent = currentTranslations[key]
    }
  })
  document.querySelectorAll('#eccl-select option').forEach(option => {
    const key = option.getAttribute('data-i18n') as keyof typeof currentTranslations
    if (currentTranslations[key]) {
      option.textContent = currentTranslations[key]
    }
  })
  document.querySelectorAll('#image-format-select option').forEach(option => {
    const key = option.getAttribute('data-i18n') as keyof typeof currentTranslations
    if (currentTranslations[key]) {
      option.textContent = currentTranslations[key]
    }
  })

  // Re-initialize tooltips with new language
  initializeTooltips()

  // Update active language button
  langEnBtn.classList.remove('active')
  langRuBtn.classList.remove('active')
  if (lang === 'en') {
    langEnBtn.classList.add('active')
  } else {
    langRuBtn.classList.add('active')
  }

  // Update HTML lang attribute
  document.documentElement.lang = lang
}

/**
 * Gathers options from the UI controls.
 */
function getOptionsFromUI(): QROptions {
  return {
    mode: parseInt(modeSelect.value, 10) as Mode,
    eccl: parseInt(ecclSelect.value, 10) as Eccl,
    version: parseInt(versionInput.value, 10),
    mask: parseInt(maskInput.value, 10) as Mask,
    image: imageFormatSelect.value as ImageFormat,
    modsize: parseInt(modsizeInput.value, 10),
    margin: parseInt(marginInput.value, 10),
  }
}

/**
 * Generates and displays the QR code based on current UI settings.
 */
function generate() {
  const text = textInput.value
  const options = getOptionsFromUI()

  // Clear previous state
  qrCodeContainer.innerHTML = ''
  errorContainer.textContent = ''
  downloadBtn.classList.add('hidden')

  if (!text) {
    errorContainer.textContent = translations[currentLang].errorTextEmpty
    return
  }

  const qrCode = makeQRCode(text, options)
  lastQrCodeResult = qrCode

  if (qrCode.result) {
    const qrElement = qrCode.result as HTMLElement
    qrCodeContainer.appendChild(qrElement)
    downloadBtn.classList.remove('hidden')
  } else {
    errorContainer.textContent = `${translations[currentLang].errorGeneric} ${qrCode.error} (subcode: ${qrCode.errorSubcode})`
  }
}

/**
 * Handles the download button click.
 */
function handleDownload() {
  if (!lastQrCodeResult) return

  const selectedFormat = imageFormatSelect.value as ImageFormat
  const filename = `qrcode.${selectedFormat.toLowerCase()}`

  lastQrCodeResult.download(filename, selectedFormat)
}

/**
 * Hides the currently active tooltip.
 */
function hideActiveTooltip() {
  if (activeTooltip) {
    activeTooltip.setAttribute('aria-hidden', 'true')
    activeTooltip.classList.remove('active')
    activeTooltip.parentElement?.setAttribute('aria-expanded', 'false')
    activeTooltip = null
  }
}

/**
 * Initializes tooltips by dynamically creating content elements and attaching click listeners.
 */
function initializeTooltips() {
  // Clear existing tooltips first
  document.querySelectorAll('.tooltip-content').forEach(content => content.remove())
  hideActiveTooltip()

  document.querySelectorAll('.tooltip-trigger').forEach(trigger => {
    const key = trigger.getAttribute('data-tooltip-key')
    const tooltipKey = `tooltip_${key}` as keyof typeof translations['en']

    if (!key) return
    if (!translations[currentLang][tooltipKey]) return

    const tooltipContentId = `tooltip-content-${key}`
    const tooltipContent = document.createElement('span')

    tooltipContent.className = 'tooltip-content'
    tooltipContent.id = tooltipContentId
    tooltipContent.setAttribute('role', 'tooltip')
    tooltipContent.setAttribute('aria-hidden', 'true')
    tooltipContent.textContent = translations[currentLang][tooltipKey]

    trigger.setAttribute('aria-describedby', tooltipContentId)
    trigger.appendChild(tooltipContent)

    // Bind once per trigger; the handler re-queries current tooltip content
    if (trigger.getAttribute('data-tooltip-bound') === 'true') return
    trigger.setAttribute('data-tooltip-bound', 'true')

    const toggleTooltip = (event: Event): void => {
      event.stopPropagation()
      if (event instanceof MouseEvent) {
        event.preventDefault()
      }

      const currentTooltip = trigger.querySelector('.tooltip-content') as HTMLElement | null
      if (!currentTooltip) return

      // Кликнули по самой подсказке (контент внутри trigger) — не переключаем её, чтобы не скрывать.
      const targetNode = event.target as Node | null
      if (targetNode && currentTooltip.contains(targetNode)) {
        return
      }

      if (activeTooltip && activeTooltip !== currentTooltip) {
        hideActiveTooltip()
      }

      const willShow = !currentTooltip.classList.contains('active')
      currentTooltip.classList.toggle('active')
      currentTooltip.setAttribute('aria-hidden', willShow ? 'false' : 'true')
      trigger.setAttribute('aria-expanded', willShow ? 'true' : 'false')
      activeTooltip = willShow ? currentTooltip : null
    }

    trigger.addEventListener('click', toggleTooltip)
    trigger.addEventListener('keydown', (event) => {
      const e = event as KeyboardEvent
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        toggleTooltip(e)
      }
    })
  })
}

// --- Event Listeners ---
generateBtn.addEventListener('click', generate)
downloadBtn.addEventListener('click', handleDownload)
langEnBtn.addEventListener('click', () => updateUIForLanguage('en'))
langRuBtn.addEventListener('click', () => updateUIForLanguage('ru'))

// Global click listener to hide tooltips when clicking outside
document.addEventListener('click', (event) => {
  if (!activeTooltip) return

  const target = event.target as Node | null
  if (!target) return

  // Не скрываем подсказку, если кликнули внутри текущей подсказки.
  if (activeTooltip.contains(target)) return

  // Не скрываем, если кликнули по самому триггеру текущей подсказки.
  const triggerEl = activeTooltip.parentElement
  if (triggerEl && triggerEl.contains(target)) return

  hideActiveTooltip()
})

// --- Initial Setup ---
// Determine initial language from browser or default to 'en'
const browserLang = navigator.language.startsWith('ru') ? 'ru' : 'en'
updateUIForLanguage(browserLang)
initializeTooltips() // Initialize tooltips on page load
generate() // Generate a QR code on page load
