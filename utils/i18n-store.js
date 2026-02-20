export const strings = {
    'en-US': {
        HEADING_TIME: 'Time',
        IMSAYAKIYAH: 'Imsakiyah',
        IMSAK: 'Imsak',
        SUBUH: 'Subuh',
        TERBIT: 'Sunrise',
        DZUHUR: 'Dzuhur',
        ASHAR: 'Ashar',
        MAGHRIB: 'Maghrib',
        ISYA: 'Isya',
        BTN_GPS: '🔍',
        BTN_LANG: 'ID',
        LOCATION_JAKARTA: 'DKI Jakarta',
        LOADING: 'Loading...',
        NAV_PREV: '<',
        NAV_NEXT: '>',
    },
    'id-ID': {
        HEADING_TIME: 'Waktu',
        IMSAYAKIYAH: 'Imsakiyah',
        IMSAK: 'Imsak',
        SUBUH: 'Subuh',
        TERBIT: 'Terbit',
        DZUHUR: 'Dzuhur',
        ASHAR: 'Ashar',
        MAGHRIB: 'Maghrib',
        ISYA: 'Isya',
        BTN_GPS: '🔍',
        BTN_LANG: 'EN',
        LOCATION_JAKARTA: 'DKI Jakarta',
        LOADING: 'Memuat...',
        NAV_PREV: '<',
        NAV_NEXT: '>',
    }
};

export function getTranslation(lang, key) {
    return strings[lang][key] || key;
}
