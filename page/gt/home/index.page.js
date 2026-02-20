import * as hmUI from "@zos/ui";
import * as hmApp from "@zos/app";
import { Geolocation } from "@zos/sensor";
import { Time } from "@zos/sensor";
import { log as Logger, px } from "@zos/utils";
import { strings, getTranslation } from "../../../utils/i18n-store";
import { DEVICE_WIDTH, DEVICE_HEIGHT } from "./index.page.s.layout";
import imsakiyahJson from "../../../utils/jadwal-imsakiyah";

const logger = Logger.getLogger("helloworld");
const TIME_ID = "time_text";
const DATE_ID = "date_text";

const MONTH_MAP = {
  'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
  'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
};

function parseIndoDate(dateStr) {
  // "19 Februari 2026"
  const parts = dateStr.split(' ');
  if (parts.length < 3) return null;
  const day = parseInt(parts[0]);
  const month = MONTH_MAP[parts[1]];
  const year = parseInt(parts[2]);
  if (month === undefined) return null;
  return new Date(year, month, day);
}

Page({
  state: {
    date: new Date(),
    lat: -6.2088, // Jakarta defaults
    lon: 106.8456,
    lang: 'id-ID',
    locationName: 'DKI Jakarta',
    prayerTimes: null,
    imsakiyahData: [], // Store full month data
    widgets: {},
    geolocation: null,
  },

  onInit() {
    logger.debug("page onInit invoked");
    hmUI.setStatusBarVisible(false);
    this.loadImsakiyahData();
  },

  loadImsakiyahData() {
    try {
      const data = imsakiyahJson;
      if (data && data.jadwal_imsakiyah) {
        this.state.locationName = data.kota || 'DKI Jakarta';
        // Pre-process data
        this.state.imsakiyahData = data.jadwal_imsakiyah.map(item => {
          return {
            ...item,
            dateObj: parseIndoDate(item.tanggal)
          };
        });
        logger.debug("Loaded " + this.state.imsakiyahData.length + " items");
      }
    } catch (e) {
      logger.error("Error loading JSON: " + e);
      this.state.locationName = "Load Error";
    }
  },

  build() {
    logger.debug("page build invoked");
    this.initUI();
    this.updateScheduleFromData();
    this.updateUI();

    // Update time every second
    this.state.timer = setInterval(() => {
      this.updateClock();
    }, 1000);
  },

  onDestroy() {
    logger.debug("page onDestroy invoked");
    if (this.state.geolocation) {
      this.state.geolocation.stop();
    }
    if (this.state.timer) {
      clearInterval(this.state.timer);
    }
  },

  updateClock() {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    if (this.state.widgets.time) {
      this.state.widgets.time.setProperty(hmUI.prop.TEXT, `${hours}:${mins}`);
    }
  },

  initUI() {
    const { lang } = this.state;
    // Clear existing widgets if any (not implemented here)

    // Header: Time & Date
    this.state.widgets.time = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: px(10),
      w: DEVICE_WIDTH,
      h: px(40),
      text: '',
      color: 0xffffff,
      text_size: px(32),
      align_h: hmUI.align.CENTER_H,
    });

    this.state.widgets.date = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: px(50),
      w: DEVICE_WIDTH,
      h: px(30),
      text: '',
      color: 0xaaaaaa,
      text_size: px(20),
      align_h: hmUI.align.CENTER_H,
    });

    // Navigation Buttons (Prev / Next)
    this.state.widgets.btnPrev = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: px(10),
      y: px(45),
      w: px(40),
      h: px(40),
      text: getTranslation(lang, 'NAV_PREV'),
      normal_color: 0xffffff,
      press_color: 0xcccccc,
      color: 0x000000,
      radius: px(20),
      click_func: () => {
        this.changeDate(-1);
      }
    });

    this.state.widgets.btnNext = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: DEVICE_WIDTH - px(50),
      y: px(45),
      w: px(40),
      h: px(40),
      text: getTranslation(lang, 'NAV_NEXT'),
      normal_color: 0xffffff,
      press_color: 0xcccccc,
      color: 0x000000,
      radius: px(20),
      click_func: () => {
        this.changeDate(1);
      }
    });

    // Content: Imsakiyah List
    const startY = px(120);
    const itemHeight = px(30);
    // API Keys: imsak, subuh, terbit, dzuhur, ashar, maghrib, isya
    const keys = ['imsak', 'subuh', 'terbit', 'dzuhur', 'ashar', 'maghrib', 'isya'];
    const labels = ['IMSAK', 'SUBUH', 'TERBIT', 'DZUHUR', 'ASHAR', 'MAGHRIB', 'ISYA'];

    this.state.widgets.listItems = [];

    // Title Location
    this.state.widgets.location = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: px(85),
      w: DEVICE_WIDTH,
      h: px(25),
      text: this.state.locationName,
      color: 0x00ff00,
      text_size: px(20),
      align_h: hmUI.align.CENTER_H,
    });

    keys.forEach((key, index) => {
      // Label
      const labelWidget = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(20),
        y: startY + (index * itemHeight),
        w: DEVICE_WIDTH / 2 - px(20),
        h: itemHeight,
        text: getTranslation(lang, labels[index]),
        color: 0xffffff,
        text_size: px(20),
        align_h: hmUI.align.LEFT,
      });

      // Time
      const timeWidget = hmUI.createWidget(hmUI.widget.TEXT, {
        x: DEVICE_WIDTH / 2,
        y: startY + (index * itemHeight),
        w: DEVICE_WIDTH / 2 - px(20),
        h: itemHeight,
        text: '--:--',
        color: 0xffffff,
        text_size: px(20),
        align_h: hmUI.align.RIGHT,
      });

      this.state.widgets.listItems.push({ label: labelWidget, time: timeWidget, key: key, labelKey: labels[index] });
    });

    // Footer
    const footerY = DEVICE_HEIGHT - px(60);

    this.state.widgets.btnGps = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: px(10),
      y: footerY,
      w: px(120),
      h: px(40),
      text: getTranslation(lang, 'BTN_GPS'),
      normal_color: 0xffffff,
      press_color: 0xcccccc,
      color: 0x000000,
      radius: px(10),
      text_size: px(16),
      click_func: () => {
        this.fetchGps();
      }
    });

    this.state.widgets.btnLang = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: DEVICE_WIDTH - px(80),
      y: footerY,
      w: px(70),
      h: px(40),
      text: getTranslation(lang, 'BTN_LANG'),
      normal_color: 0xffffff,
      press_color: 0xcccccc,
      color: 0x000000,
      radius: px(10),
      click_func: () => {
        this.toggleLanguage();
      }
    });

    // Exit Button
    this.state.widgets.btnExit = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: (DEVICE_WIDTH - px(40)) / 2,
      y: footerY,
      w: px(40),
      h: px(40),
      text: 'X',
      normal_color: 0xff0000,
      press_color: 0xcc0000,
      color: 0xffffff,
      radius: px(20),
      text_size: px(24),
      click_func: () => {
        hmApp.exit();
      }
    });
  },

  updateScheduleFromData() {
    const d = this.state.date;
    const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dTime = dZero.getTime();

    // Find matching date
    if (this.state.imsakiyahData) {
      const schedule = this.state.imsakiyahData.find(item => {
        return item.dateObj && item.dateObj.getTime() === dTime;
      });

      if (schedule) {
        this.state.prayerTimes = schedule;
        logger.debug("Found schedule for " + d.toDateString());
      } else {
        this.state.prayerTimes = null;
        logger.debug("No schedule for " + d.toDateString());
      }
    } else {
      this.state.prayerTimes = null;
    }
  },

  updateUI() {
    const { lang, date, prayerTimes, locationName } = this.state;
    // Update Date/Time Text
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}/${month}/${year}`;

    this.state.widgets.date.setProperty(hmUI.prop.TEXT, dateStr);

    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    this.state.widgets.time.setProperty(hmUI.prop.TEXT, `${hours}:${mins}`);

    // Update List
    const now = new Date();
    const isToday = date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    let nextFound = false;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (this.state.widgets.listItems.length > 0) {
      this.state.widgets.listItems.forEach(item => {
        item.label.setProperty(hmUI.prop.TEXT, getTranslation(lang, item.labelKey));

        let color = 0xffffff;
        if (prayerTimes && prayerTimes[item.key]) {
          const timeStr = prayerTimes[item.key];
          item.time.setProperty(hmUI.prop.TEXT, timeStr);

          if (isToday && !nextFound) {
            const [h, m] = timeStr.split(':').map(Number);
            const pMinutes = h * 60 + m;
            if (pMinutes >= currentMinutes) {
              color = 0x00ff00; // Green for next
              nextFound = true;
            }
          }
        } else {
          item.time.setProperty(hmUI.prop.TEXT, "--:--");
        }

        item.label.setProperty(hmUI.prop.COLOR, color);
        item.time.setProperty(hmUI.prop.COLOR, color);
      });
    }

    // Update Buttons
    this.state.widgets.btnGps.setProperty(hmUI.prop.TEXT, getTranslation(lang, 'BTN_GPS'));
    this.state.widgets.btnLang.setProperty(hmUI.prop.TEXT, lang === 'id-ID' ? 'EN' : 'ID');

    this.state.widgets.location.setProperty(hmUI.prop.TEXT, locationName);
  },

  changeDate(delta) {
    const newDate = new Date(this.state.date);
    newDate.setDate(newDate.getDate() + delta);
    this.state.date = newDate;
    this.updateScheduleFromData();
    this.updateUI();
  },

  toggleLanguage() {
    this.state.lang = this.state.lang === 'id-ID' ? 'en-US' : 'id-ID';
    this.updateUI();
  },

  fetchGps() {
    // GPS not fully implemented with new API yet
    this.state.locationName = "API: Jakarta Only";
    this.updateUI();
  }
});
