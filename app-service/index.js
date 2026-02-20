import { Vibrator } from "@zos/sensor";
import { notify } from "@zos/notification";
import { log as Logger } from "@zos/utils";
import imsakiyahJson from "../utils/jadwal-imsakiyah";

const logger = Logger.getLogger("app-service");

// Helper function to parse Date
const MONTH_MAP = {
    'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
    'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
};

const PRAYER_LABELS = {
    imsak: "Imsak",
    subuh: "Subuh",
    terbit: "Terbit",
    duha: "Duha",
    dzuhur: "Dzuhur",
    ashar: "Ashar",
    maghrib: "Maghrib",
    isya: "Isya"
};

function parseIndoDate(dateStr) {
    const parts = dateStr.split(' ');
    if (parts.length < 3) return null;
    const day = parseInt(parts[0]);
    const month = MONTH_MAP[parts[1]];
    const year = parseInt(parts[2]);
    if (month === undefined) return null;
    return new Date(year, month, day);
}

AppService({
    onInit(params) {
        logger.debug("AppService onInit");
        this.imsakiyahData = [];
        this.lastTriggered = null;
        this.loadData();
        this.startTimer();
    },

    onDestroy() {
        logger.debug("AppService onDestroy");
        this.stopTimer();
    },

    loadData() {
        try {
            const data = imsakiyahJson;
            if (data && data.jadwal_imsakiyah) {
                this.imsakiyahData = data.jadwal_imsakiyah.map(item => {
                    return {
                        ...item,
                        dateObj: parseIndoDate(item.tanggal)
                    };
                });
                logger.debug("AppService Data Loaded: " + this.imsakiyahData.length);
            }
        } catch (e) {
            logger.error("Error loading data: " + e);
        }
    },

    startTimer() {
        // Check every 30 seconds to be safe
        this.timer = setInterval(() => {
            this.checkAlarm();
        }, 1000 * 30);
        this.checkAlarm(); // Check immediately
    },

    stopTimer() {
        if (this.timer) clearInterval(this.timer);
    },

    checkAlarm() {
        if (!this.imsakiyahData || this.imsakiyahData.length === 0) return;

        const now = new Date();
        // Today at 00:00:00
        const dZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dTime = dZero.getTime();

        // Find today's schedule
        const schedule = this.imsakiyahData.find(item => {
            return item.dateObj && item.dateObj.getTime() === dTime;
        });

        if (schedule) {
            const hours = now.getHours().toString().padStart(2, '0');
            const mins = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${hours}:${mins}`;

            // keys to check in JSON
            // keys: imsak, subuh, terbit, duha, dzuhur, ashar, maghrib, isya
            const keys = ['imsak', 'subuh', 'terbit', 'duha', 'dzuhur', 'ashar', 'maghrib', 'isya'];

            let matchKey = null;

            // Iterate through keys to find if any value matches currentTime
            for (let key of keys) {
                if (schedule[key] === currentTime) {
                    matchKey = key;
                    break;
                }
            }

            if (matchKey) {
                const triggerKey = `${matchKey}-${currentTime}`;
                if (this.lastTriggered !== triggerKey) {
                    this.lastTriggered = triggerKey;
                    this.triggerAlarm(matchKey, currentTime);
                }
            }
        }
    },

    triggerAlarm(prayerKey, timeStr) {
        this.triggerVibration();
        this.sendNotification(prayerKey, timeStr);
    },

    triggerVibration() {
        logger.debug("Background Vibration Triggered");
        try {
            const vibrator = new Vibrator();
            vibrator.start();
            setTimeout(() => {
                vibrator.stop();
            }, 5000); // 5 seconds
        } catch (e) {
            logger.error("Vibration error: " + e);
        }
    },

    sendNotification(prayerKey, timeStr) {
        const prayerLabel = PRAYER_LABELS[prayerKey] || prayerKey;
        const message = `Sudah Memasuki Waktu ${prayerLabel} (${timeStr})`;
        try {
            notify({
                title: "Pengingat Imsakiyah",
                content: message,
                vibrate: 0
            });
            logger.debug(`Notification sent for ${prayerLabel} at ${timeStr}`);
        } catch (e) {
            logger.error("Notification error: " + e);
        }
    }
});
