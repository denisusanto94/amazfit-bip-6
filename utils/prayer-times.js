export class PrayerTimes {
  constructor(method = 'MWL') {
    this.method = method; // MWL, ISNA, Egypt, Makkah, Karachi, Tehran, Jafari
    this.calcMethod = this.getDateStyle();
    this.setting = {
      imsak: '10 min',
      dhuhr: '0 min',
      asr: 'Standard',
      highLats: 'NightMiddle'
    };
    this.timeFormat = '24h';
    this.timeSuffixes = ['am', 'pm'];
    this.invalidTime = '-----';
    this.numIterations = 1;
    this.offset = {};

    this.defParams = {
      maghrib: '0 min', midnight: 'Standard'
    };

    // Default parameters for standard methods
    this.methods = {
      MWL: { name: 'Muslim World League', params: { fajr: 18, isha: 17 } },
      ISNA: { name: 'Islamic Society of North America (ISNA)', params: { fajr: 15, isha: 15 } },
      Egypt: { name: 'Egyptian General Authority of Survey', params: { fajr: 19.5, isha: 17.5 } },
      Makkah: { name: 'Umm Al-Qura University, Makkah', params: { fajr: 18.5, isha: '90 min' } }, // fajr was 19 prior to 1430 hijri
      Karachi: { name: 'University of Islamic Sciences, Karachi', params: { fajr: 18, isha: 18 } },
      Tehran: { name: 'Institute of Geophysics, University of Tehran', params: { fajr: 17.7, isha: 14, maghrib: 4.5, midnight: 'Jafari' } }, // isha is not explicitly specified in this method
      Jafari: { name: 'Shia Ithna-Ashari, Leva Institute, Qum', params: { fajr: 16, isha: 14, maghrib: 4, midnight: 'Jafari' } }
    };

    this.adjust(this.methods[method].params);
  }

  getDateStyle() {
    return '24h';
  }

  // set calculation method parameters
  adjust(params) {
    for (var id in params)
      this.setting[id] = params[id];
  }

  // set time format
  setFormat(format) {
    this.timeFormat = format;
  }

  // calculate prayer times
  getTimes(date, coords, timezone, dst = 0, format = null) {
    this.lat = 1 * coords[0];
    this.lng = 1 * coords[1];
    this.elv = coords[2] ? 1 * coords[2] : 0;
    this.timeFormat = format || this.timeFormat;

    if (date instanceof Date || (typeof date === 'object' && typeof date.getFullYear === 'function'))
      date = [date.getFullYear(), date.getMonth() + 1, date.getDate()];

    this.jDate = this.julian(date[0], date[1], date[2]) - this.lng / (15 * 24);

    return this.computeTimes(timezone, dst);
  }

  // convert float time to the given format (see timeFormats)
  getFormattedTime(time, format, suffixes) {
    if (isNaN(time)) return this.invalidTime;

    if (format === 'Float') return time;

    suffixes = suffixes || this.timeSuffixes;

    time = this.fixHour(time + 0.5 / 60);  // add 0.5 minutes to round
    var hours = Math.floor(time);
    var minutes = Math.floor((time - hours) * 60);
    var suffix = (format === '12h') ? suffixes[hours < 12 ? 0 : 1] : '';
    var hour = (format === '24h') ? this.twoDigitsFormat(hours) : ((hours + 11) % 12 + 1);

    return hour + ':' + this.twoDigitsFormat(minutes) + (suffix ? ' ' + suffix : '');
  }

  // compute prayer times 
  computeTimes(timezone, dst) {
    var times = {
      imsak: 5, fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, maghrib: 18, isha: 18
    };

    // default times
    var times = this.computePrayerTimes(times);

    // adjustments
    times = this.adjustTimes(times, timezone, dst);

    // add midnight time
    times.midnight = (this.setting.midnight === 'Jafari') ?
      times.sunset + this.timeDiff(times.sunset, times.fajr) / 2 :
      times.sunset + this.timeDiff(times.sunset, times.sunrise) / 2;

    times = this.tuneTimes(times);

    return this.modifyFormats(times);
  }

  computePrayerTimes(times) {
    times = this.dayPortion(times);
    var params = this.setting;

    var imsak = this.sunAngleTime(this.eval(params.imsak), times.imsak, 'ccw');
    var fajr = this.sunAngleTime(this.eval(params.fajr), times.fajr, 'ccw');
    var sunrise = this.sunAngleTime(this.riseSetAngle(), times.sunrise, 'ccw');
    var dhuhr = this.midDay(times.dhuhr);
    var asr = this.asrTime(this.asrFactor(params.asr), times.asr);
    var sunset = this.sunAngleTime(this.riseSetAngle(), times.sunset);;
    var maghrib = this.sunAngleTime(this.eval(params.maghrib), times.maghrib);
    var isha = this.sunAngleTime(this.eval(params.isha), times.isha);

    return {
      imsak: imsak, fajr: fajr, sunrise: sunrise, dhuhr: dhuhr,
      asr: asr, sunset: sunset, maghrib: maghrib, isha: isha
    };
  }

  adjustTimes(times, timezone, dst) {
    var params = this.setting;
    for (var i in times) {
      times[i] += timezone - this.lng / 15;
    }

    if (params.highLats !== 'None')
      times = this.adjustHighLats(times);

    if (this.isMin(params.imsak))
      times.imsak = times.fajr - this.eval(params.imsak) / 60;
    if (this.isMin(params.maghrib))
      times.maghrib = times.sunset + this.eval(params.maghrib) / 60;
    if (this.isMin(params.isha))
      times.isha = times.maghrib + this.eval(params.isha) / 60;

    times.dhuhr += this.eval(params.dhuhr) / 60;

    return times;
  }

  asrFactor(asrParam) {
    var methods = { Standard: 1, Hanafi: 2 };
    return methods[asrParam] || this.eval(asrParam);
  }

  riseSetAngle() {
    //var earthRad = 6371009; // in meters
    //var angle = DMath.arccos(earthRad/(earthRad+ elv));
    var angle = 0.0347 * Math.sqrt(this.elv); // an approximation
    return 0.833 + angle;
  }

  tuneTimes(times) {
    for (var i in times)
      times[i] += this.offset[i] / 60;
    return times;
  }

  modifyFormats(times) {
    for (var i in times)
      times[i] = this.getFormattedTime(times[i], this.timeFormat);
    return times;
  }

  adjustHighLats(times) {
    var params = this.setting;
    var nightTime = this.timeDiff(times.sunset, times.sunrise);

    times.imsak = this.adjustHLTime(times.imsak, times.sunrise, this.eval(params.imsak), nightTime, 'ccw');
    times.fajr = this.adjustHLTime(times.fajr, times.sunrise, this.eval(params.fajr), nightTime, 'ccw');
    times.isha = this.adjustHLTime(times.isha, times.sunset, this.eval(params.isha), nightTime);
    times.maghrib = this.adjustHLTime(times.maghrib, times.sunset, this.eval(params.maghrib), nightTime);

    return times;
  }

  adjustHLTime(time, base, angle, night, direction) {
    var portion = this.nightPortion(angle, night);
    var timeDiff = (direction === 'ccw') ?
      this.timeDiff(time, base) :
      this.timeDiff(base, time);
    if (isNaN(time) || timeDiff > portion)
      time = base + (direction === 'ccw' ? -portion : portion);
    return time;
  }

  nightPortion(angle, night) {
    var method = this.setting.highLats;
    var portion = 1 / 2 // Midnight
    if (method === 'AngleBased')
      portion = 1 / 60 * angle;
    if (method === 'OneSeventh')
      portion = 1 / 7;
    return portion * night;
  }

  dayPortion(times) {
    for (var i in times)
      times[i] /= 24;
    return times;
  }

  sunAngleTime(angle, time, direction) {
    var decl = this.sunPosition(this.jDate + time).declination;
    var noon = this.midDay(time);
    var t = 1 / 15 * this.arccos((-this.sin(angle) - this.sin(decl) * this.sin(this.lat)) / (this.cos(decl) * this.cos(this.lat)));
    return noon + (direction === 'ccw' ? -t : t);
  }

  midDay(time) {
    var eqt = this.sunPosition(this.jDate + time).equation;
    var noon = this.fixHour(12 - eqt);
    return noon;
  }

  sunPosition(jd) {
    var D = jd - 2451545.0;
    var g = this.fixAngle(357.529 + 0.98560028 * D);
    var q = this.fixAngle(280.459 + 0.98564736 * D);
    var L = this.fixAngle(q + 1.915 * this.sin(g) + 0.020 * this.sin(2 * g));

    var R = 1.00014 - 0.01671 * this.cos(g) - 0.00014 * this.cos(2 * g);
    var e = 23.439 - 0.00000036 * D;

    var RA = this.arctan2(this.cos(e) * this.sin(L), this.cos(L)) / 15;
    var eqt = q / 15 - this.fixHour(RA);
    var decl = this.arcsin(this.sin(e) * this.sin(L));

    return { declination: decl, equation: eqt };
  }

  julian(year, month, day) {
    if (month <= 2) {
      year -= 1;
      month += 12;
    };
    var A = Math.floor(year / 100);
    var B = 2 - A + Math.floor(A / 4);
    var JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
    return JD;
  }

  // math functions
  dtr(d) { return (d * Math.PI) / 180.0; }
  rtd(r) { return (r * 180.0) / Math.PI; }

  sin(d) { return Math.sin(this.dtr(d)); }
  cos(d) { return Math.cos(this.dtr(d)); }
  tan(d) { return Math.tan(this.dtr(d)); }

  arcsin(d) { return this.rtd(Math.asin(d)); }
  arccos(d) { return this.rtd(Math.acos(d)); }
  arctan(d) { return this.rtd(Math.atan(d)); }
  arctan2(y, x) { return this.rtd(Math.atan2(y, x)); }

  arccot(x) { return this.rtd(Math.atan(1 / x)); }

  fixAngle(a) { return this.fix(a, 360); }
  fixHour(a) { return this.fix(a, 24); }

  fix(a, b) {
    a = a - b * (Math.floor(a / b));
    return (a < 0) ? a + b : a;
  }

  timeDiff(time1, time2) {
    return this.fixHour(time2 - time1);
  }

  isMin(arg) { return (arg instanceof Number || typeof arg === 'number'); }

  eval(str) { return 1 * (str + '').split(/[^0-9.+-]/)[0]; }

  twoDigitsFormat(num) { return (num < 10) ? '0' + num : num; }
}
