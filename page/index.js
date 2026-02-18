import { getText } from '@zos/i18n'
import * as Styles from 'zosLoader:./index.[pf].layout.js'
import { Geolocation } from '@zos/sensor'
import { Vibrator } from '@zos/vibrator'
import { createWidget, widget, prop, align, event, deleteWidget } from '@zos/ui'
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan'
import { localStorage } from '@zos/storage'

const JAKARTA_COORDS = { latitude: -6.2088, longitude: 106.8456 }

// Simple Loc Dictionary since we might override system language
const STRINGS = {
  'ID': {
    'SCAN_GPS': 'Memindai GPS...',
    'OUTDOORS': 'Pastikan di luar ruangan',
    'RETRY': 'Coba Lagi',
    'USE_DEFAULT': 'Gunakan Default',
    'IMSAK': 'Imsak',
    'SUBUH': 'Subuh',
    'ZUHUR': 'Zuhur',
    'ASAR': 'Asar',
    'MAGHRIB': 'Maghrib',
    'ISYA': 'Isya',
    'LOC_JAKARTA': 'Lok: Jakarta',
    'LOC_GPS': 'Lok: GPS',
    'SCAN_BTN': 'Pindai'
  },
  'EN': {
    'SCAN_GPS': 'Scanning GPS...',
    'OUTDOORS': 'Ensure you are outdoors',
    'RETRY': 'Retry',
    'USE_DEFAULT': 'Use Default',
    'IMSAK': 'Imsak',
    'SUBUH': 'Fajr',
    'ZUHUR': 'Dhuhr',
    'ASAR': 'Asr',
    'MAGHRIB': 'Maghrib',
    'ISYA': 'Isha',
    'LOC_JAKARTA': 'Loc: Jakarta',
    'LOC_GPS': 'Loc: GPS',
    'SCAN_BTN': 'Scan'
  }
}

Page({
  state: {
    lang: 'ID', // Default
    step: 'LANG', // LANG, GPS, MAIN
    coords: null,
    displayDate: new Date(),
    todayPrayerTimes: null, // For alerts
    widgets: [],
    timer: null,
    lastVibrationTime: 0
  },

  build() {
    this.initApp()
  },

  clearScreen() {
    this.state.widgets.forEach(w => {
      try { deleteWidget(w) } catch (e) { }
    })
    this.state.widgets = []
  },

  t(key) {
    return STRINGS[this.state.lang][key] || key
  },

  initApp() {
    // Check Language
    const savedLang = localStorage.getItem('lang')
    if (savedLang) {
      this.state.lang = savedLang
      this.checkGPSAndStart()
    } else {
      this.showLanguageScreen()
    }
  },

  checkGPSAndStart() {
    const savedCoords = localStorage.getItem('coords')
    if (savedCoords) {
      try {
        this.state.coords = JSON.parse(savedCoords)
        this.startMainFlow()
      } catch (e) {
        this.showGPSScreen()
      }
    } else {
      this.showGPSScreen()
    }
  },

  // --- SCREEN 1: LANGUAGE ---
  showLanguageScreen() {
    this.state.step = 'LANG'
    this.clearScreen()

    const btnY = 150
    const gap = 60

    // Button ID
    const btnID = createWidget(widget.BUTTON, {
      ...Styles.BUTTON_STYLE,
      x: Styles.BTN_LANG_ID_X,
      y: Styles.BTN_LANG_ID_Y,
      text: 'Bahasa Indonesia',
      click_func: () => {
        this.setLanguage('ID')
      }
    })
    this.state.widgets.push(btnID)

    // Button EN
    const btnEN = createWidget(widget.BUTTON, {
      ...Styles.BUTTON_STYLE,
      x: Styles.BTN_LANG_EN_X,
      y: Styles.BTN_LANG_EN_Y,
      text: 'English',
      click_func: () => {
        this.setLanguage('EN')
      }
    })
    this.state.widgets.push(btnEN)
  },

  setLanguage(lang) {
    this.state.lang = lang
    localStorage.setItem('lang', lang)
    this.checkGPSAndStart()
  },

  // --- SCREEN 2: GPS ---
  showGPSScreen() {
    this.state.step = 'GPS'
    this.clearScreen()

    // Text Scan
    const txtScan = createWidget(widget.TEXT, {
      ...Styles.TEXT_STYLE,
      y: px(100),
      text: this.t('SCAN_GPS')
    })
    this.state.widgets.push(txtScan)

    // Text Outdoors
    const txtOutdoor = createWidget(widget.TEXT, {
      ...Styles.TEXT_STYLE,
      y: px(150),
      text_size: px(18),
      text: this.t('OUTDOORS')
    })
    this.state.widgets.push(txtOutdoor)

    // Skip Button (in case GPS fails or indoors)
    const btnSkip = createWidget(widget.BUTTON, {
      ...Styles.BUTTON_STYLE,
      x: Styles.BTN_SKIP_X,
      y: Styles.BTN_SKIP_Y,
      text: this.t('USE_DEFAULT'),
      click_func: () => {
        const defaultCoords = JAKARTA_COORDS
        this.saveCoords(defaultCoords)
        this.startMainFlow()
      }
    })
    this.state.widgets.push(btnSkip)

    this.startGPSScan()
  },

  startGPSScan() {
    const geolocation = new Geolocation()
    geolocation.start()

    // Timeout to stop scanning if too long? 
    // User can click "Use Default".

    geolocation.onChange((event) => {
      if (event.latitude && event.longitude) {
        const coords = {
          latitude: event.latitude,
          longitude: event.longitude
        }
        geolocation.stop()
        this.saveCoords(coords)
        this.startMainFlow()
      }
    })
  },

  saveCoords(coords) {
    this.state.coords = coords
    localStorage.setItem('coords', JSON.stringify(coords))
  },

  startMainFlow() {
    // Init alert timer
    this.updateTodayPrayerTimes()
    this.startTimer()
    this.showMainScreen()
  },

  // --- SCREEN 3: MAIN ---
  showMainScreen() {
    this.state.step = 'MAIN'
    this.clearScreen()

    // Header Group
    this.renderHeader()
    this.renderList()
    this.renderNavigation()
  },

  renderHeader() {
    // Date Text
    const txtDate = createWidget(widget.TEXT, {
      ...Styles.HEADER_STYLE,
      align_h: align.CENTER_H,
      text: this.formatDate(this.state.displayDate)
    })
    this.state.widgets.push(txtDate)
    this.state.txtDateWidget = txtDate
  },

  renderNavigation() {
    // Prev Button
    this.state.widgets.push(createWidget(widget.BUTTON, {
      ...Styles.NAV_BTN_STYLE,
      x: Styles.NAV_PREV_X,
      y: Styles.NAV_PREV_Y,
      text: '<',
      click_func: () => {
        this.changeDate(-1)
      }
    }))

    // Scan GPS Button (Middle)
    this.state.widgets.push(createWidget(widget.BUTTON, {
      ...Styles.GPS_BTN_STYLE,
      x: Styles.NAV_SCAN_X,
      y: Styles.NAV_SCAN_Y,
      w: Styles.NAV_SCAN_W,
      text: this.t('SCAN_BTN'),
      click_func: () => {
        this.showGPSScreen()
      }
    }))

    // Next Button
    this.state.widgets.push(createWidget(widget.BUTTON, {
      ...Styles.NAV_BTN_STYLE,
      x: Styles.NAV_NEXT_X,
      y: Styles.NAV_NEXT_Y,
      text: '>',
      click_func: () => {
        this.changeDate(1)
      }
    }))
  },

  renderList() {
    const listY = px(80)
    const lineH = px(40)
    const prayerKeys = ['IMSAK', 'SUBUH', 'ZUHUR', 'ASAR', 'MAGHRIB', 'ISYA']

    this.state.prayerWidgets = {}

    prayerKeys.forEach((key, i) => {
      // Label
      const lbl = createWidget(widget.TEXT, {
        x: Styles.LIST_LABEL_X,
        y: listY + (i * lineH),
        w: px(140),
        h: Styles.LIST_ITEM_STYLE.h,
        text_size: Styles.LIST_ITEM_STYLE.text_size,
        color: Styles.LIST_ITEM_STYLE.color,
        text: this.t(key)
      })
      this.state.widgets.push(lbl)

      // Time
      const val = createWidget(widget.TEXT, {
        x: Styles.LIST_VALUE_X,
        y: listY + (i * lineH),
        w: px(100),
        h: Styles.LIST_ITEM_STYLE.h,
        text_size: Styles.LIST_ITEM_STYLE.text_size,
        color: Styles.LIST_ITEM_STYLE.color,
        align_h: align.RIGHT,
        text: '--:--'
      })
      this.state.widgets.push(val)
      this.state.prayerWidgets[key] = val
    })

    this.updateListValues()
  },

  changeDate(delta) {
    const d = this.state.displayDate
    d.setDate(d.getDate() + delta)
    this.state.displayDate = new Date(d) // Force refresh

    // Update Header
    if (this.state.txtDateWidget) {
      this.state.txtDateWidget.setProperty(prop.TEXT, this.formatDate(d))
    }
    this.updateListValues()
  },

  updateListValues() {
    if (!this.state.coords) return

    const date = this.state.displayDate
    const coordinates = new Coordinates(this.state.coords.latitude, this.state.coords.longitude)
    const params = CalculationMethod.Singapore()
    params.madhab = Madhab.Shafi

    const times = new PrayerTimes(coordinates, date, params)

    const formatTime = (t) => {
      return `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`
    }

    if (this.state.prayerWidgets) {
      this.state.prayerWidgets['IMSAK'].setProperty(prop.TEXT, formatTime(times.imsak))
      this.state.prayerWidgets['SUBUH'].setProperty(prop.TEXT, formatTime(times.fajr))
      this.state.prayerWidgets['ZUHUR'].setProperty(prop.TEXT, formatTime(times.dhuhr))
      this.state.prayerWidgets['ASAR'].setProperty(prop.TEXT, formatTime(times.asr))
      this.state.prayerWidgets['MAGHRIB'].setProperty(prop.TEXT, formatTime(times.maghrib))
      this.state.prayerWidgets['ISYA'].setProperty(prop.TEXT, formatTime(times.isha))
    }
  },

  formatDate(date) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' }
    return date.toLocaleDateString(
      this.state.lang === 'ID' ? 'id-ID' : 'en-US',
      options
    )
  },

  // --- LOGIC: ALERTS ---
  updateTodayPrayerTimes() {
    if (!this.state.coords) return
    const date = new Date()
    const coordinates = new Coordinates(this.state.coords.latitude, this.state.coords.longitude)
    const params = CalculationMethod.Singapore()
    params.madhab = Madhab.Shafi
    this.state.todayPrayerTimes = new PrayerTimes(coordinates, date, params)
  },

  startTimer() {
    if (this.state.timer) clearInterval(this.state.timer)
    this.state.timer = setInterval(() => {
      if (new Date().getHours() === 0 && new Date().getMinutes() === 0) {
        // New day, update today's times
        this.updateTodayPrayerTimes()
      }
      this.checkPrayerTime()
    }, 60000)
  },

  checkPrayerTime() {
    if (!this.state.todayPrayerTimes) return

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const times = [
      this.state.todayPrayerTimes.imsak,
      this.state.todayPrayerTimes.fajr,
      this.state.todayPrayerTimes.dhuhr,
      this.state.todayPrayerTimes.asr,
      this.state.todayPrayerTimes.maghrib,
      this.state.todayPrayerTimes.isha
    ]

    const match = times.some(t => {
      const timeMinutes = t.getHours() * 60 + t.getMinutes()
      return Math.abs(currentMinutes - timeMinutes) < 1
    })

    if (match) {
      if (now.getTime() - this.state.lastVibrationTime > 60000) {
        this.vibrate()
        this.state.lastVibrationTime = now.getTime()
      }
    }
  },

  vibrate() {
    const vibrator = new Vibrator()
    vibrator.start()
    setTimeout(() => {
      vibrator.stop()
    }, 2000)
  },

  onDestroy() {
    if (this.state.timer) clearInterval(this.state.timer)
  }
})
