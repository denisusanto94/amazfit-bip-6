import * as hmUI from "@zos/ui";
import { Geolocation } from "@zos/sensor";
import { Time } from "@zos/sensor";
import { log as Logger, px } from "@zos/utils";
import { PrayerTimes } from "../../../utils/prayer-times";
import { strings, getTranslation } from "../../../utils/i18n-store";
import { DEVICE_WIDTH, DEVICE_HEIGHT } from "./index.page.s.layout";

const logger = Logger.getLogger("helloworld");
const TIME_ID = "time_text";
const DATE_ID = "date_text";

Page({
  state: {
    date: new Date(),
    lat: -6.2088, // Jakarta
    lon: 106.8456,
    lang: 'id-ID',
    locationName: 'DKI Jakarta',
    prayerTimes: null,
    widgets: {},
    geolocation: null,
  },

  onInit() {
    logger.debug("page onInit invoked");
    this.state.prayerCalculator = new PrayerTimes('MWL');
    this.state.prayerCalculator.adjust({ fajr: 20, isha: 18 }); // Indonesia Kemenag style (approx)

    this.calculateSchedule();
  },

  build() {
    logger.debug("page build invoked");
    this.initUI();
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

  calculateSchedule() {
    // zepp os Date might behave differently, but let's assume standard JS Date
    const d = this.state.date;
    const times = this.state.prayerCalculator.getTimes(d, [this.state.lat, this.state.lon], 7); // Jakarta is GMT+7
    this.state.prayerTimes = times;
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

    // Navigation Buttons (Prev / Next) - Absolute positioning near header
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
    const startY = px(100);
    const itemHeight = px(30);
    const keys = ['imsak', 'subuh', 'sunrise', 'dhuhr', 'ashar', 'maghrib', 'isha'];
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
  },

  updateUI() {
    const { lang, date, prayerTimes, locationName } = this.state;

    // Update Date/Time Text
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const dateStr = `${day} ${month} ${year}`;

    this.state.widgets.date.setProperty(hmUI.prop.TEXT, dateStr);

    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    this.state.widgets.time.setProperty(hmUI.prop.TEXT, `${hours}:${mins}`);

    // Update List
    if (prayerTimes) {
      this.state.widgets.listItems.forEach(item => {
        item.label.setProperty(hmUI.prop.TEXT, getTranslation(lang, item.labelKey));
        const t = prayerTimes[item.key];
        item.time.setProperty(hmUI.prop.TEXT, t);
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
    this.calculateSchedule();
    this.updateUI();
  },

  toggleLanguage() {
    this.state.lang = this.state.lang === 'id-ID' ? 'en-US' : 'id-ID';
    this.updateUI();
  },

  fetchGps() {
    this.state.locationName = getTranslation(this.state.lang, 'LOADING');
    this.updateUI();

    const geolocation = new Geolocation();
    this.state.geolocation = geolocation;

    geolocation.start();

    geolocation.onCurrentChange((val) => {
      if (val && val.latitude) {
        this.state.lat = val.latitude;
        this.state.lon = val.longitude;
        this.state.locationName = `GPS: ${val.latitude.toFixed(2)}, ${val.longitude.toFixed(2)}`;
        this.calculateSchedule();
        this.updateUI();
        geolocation.stop();
      }
    });
  }
});
