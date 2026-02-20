import { Vibrator } from "@zos/sensor";
import { log as Logger } from "@zos/utils";
import imsakiyahJson from "../utils/jadwal-imsakiyah";

const logger = Logger.getLogger("app-service");

// Helper function to parse Date
const MONTH_MAP = {
    'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
    'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
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

            let match = false;

            // Iterate through keys to find if any value matches currentTime
            for (let key of keys) {
                if (schedule[key] === currentTime) {
                    match = true;
                    break;
                }
            }

            if (match) {
                if (this.lastTriggered !== currentTime) {
                    this.lastTriggered = currentTime;
                    this.triggerVibration();
                }
            }
        }
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
    }
});
