// ============================================================================
// weather.ts — Core meteorological computation module
// Provides weather data processing, apparent temperature calculations,
// and 기상청 (KMA) API response parsing utilities.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeatherData {
  temperature: number;      // T1H or TMP (°C)
  humidity: number;          // REH (%)
  windSpeed: number;         // WSD (m/s)
  precipitation: number;     // RN1 or PCP (mm)
  precipType: number;        // PTY code
  skyCondition: number;      // SKY code (1:맑음, 3:구름많음, 4:흐림)
  windDirection: number;     // VEC (deg)
}

export interface ProcessedWeather extends WeatherData {
  apparentTemp: number;
  heatIndex: number | null;
  windChill: number | null;
  tempRange: TemperatureRange;
  conditionLabel: string;
  conditionDesc: string;
}

export interface HourlyForecast {
  time: string;          // "0600", "0900", ...
  temperature: number;   // TMP
  humidity: number;      // REH
  windSpeed: number;     // WSD
  precipProb: number;    // POP
  precipType: number;    // PTY
  precipitation: number; // PCP
  skyCondition: number;  // SKY
}

export interface DailyForecast {
  minTemp: number;         // TMN
  maxTemp: number;         // TMX
  tempDiff: number;        // maxTemp - minTemp
  maxPrecipProb: number;   // Max POP across the day
  rainExpected: boolean;   // Any PTY matching rain
  snowExpected: boolean;   // Any PTY matching snow
  hourly: HourlyForecast[];
  dominantCondition: string; // clear, cloudy, rainy, snowy based on the whole day
}

export type TemperatureRange =
  | 'extreme_cold'
  | 'cold'
  | 'cool'
  | 'mild'
  | 'warm'
  | 'hot';

// ---------------------------------------------------------------------------
// City Grid Coordinates for 기상청 API (동네예보 격자 좌표)
// ---------------------------------------------------------------------------

export const CITY_GRID: Record<string, { nx: number; ny: number; name: string }> = {
  seoul:   { nx: 60,  ny: 127, name: '서울' },
  busan:   { nx: 98,  ny: 76,  name: '부산' },
  daegu:   { nx: 89,  ny: 90,  name: '대구' },
  incheon: { nx: 55,  ny: 124, name: '인천' },
  gwangju: { nx: 58,  ny: 74,  name: '광주' },
  daejeon: { nx: 67,  ny: 100, name: '대전' },
  ulsan:   { nx: 102, ny: 84,  name: '울산' },
  jeju:    { nx: 52,  ny: 38,  name: '제주' },
};

// ---------------------------------------------------------------------------
// 1. Wind Chill Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates wind chill temperature using the North American / Environment
 * Canada formula.
 *
 * Valid only when T ≤ 10 °C **and** wind speed > 4.8 km/h.
 *
 * Formula (T in °C, W in km/h):
 *   WC = 13.12 + 0.6215·T − 11.37·W^0.16 + 0.3965·T·W^0.16
 *
 * @param temp      Temperature in °C
 * @param windSpeed Wind speed in **m/s** (converted internally to km/h)
 * @returns Wind chill in °C, or `null` if conditions are outside valid range
 */
export function calculateWindChill(
  temp: number,
  windSpeed: number,
): number | null {
  const windSpeedKmh = windSpeed * 3.6; // m/s → km/h

  if (temp > 10 || windSpeedKmh <= 4.8) {
    return null;
  }

  const wPow = Math.pow(windSpeedKmh, 0.16);
  const wc =
    13.12 +
    0.6215 * temp -
    11.37 * wPow +
    0.3965 * temp * wPow;

  return Math.round(wc * 10) / 10;
}

// ---------------------------------------------------------------------------
// 2. Heat Index Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the heat index (체감 더위 지수) using the Rothfusz regression
 * equation with Steadman adjustments.
 *
 * Valid only when T ≥ 27 °C.
 *
 * The Rothfusz regression operates in Fahrenheit; input/output are converted
 * to/from Celsius automatically.
 *
 * Steadman adjustments:
 *   • If RH < 13 % and 80 °F < T < 112 °F → subtract correction
 *   • If RH > 85 % and 80 °F < T < 87 °F  → add correction
 *
 * @param temp     Temperature in °C
 * @param humidity Relative humidity in %
 * @returns Heat index in °C, or `null` if temp < 27 °C
 */
export function calculateHeatIndex(
  temp: number,
  humidity: number,
): number | null {
  if (temp < 27) {
    return null;
  }

  // Convert Celsius → Fahrenheit for the regression
  const T = temp * 9 / 5 + 32;
  const RH = humidity;

  // Rothfusz regression
  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * RH -
    0.22475541 * T * RH -
    0.00683783 * T * T -
    0.05481717 * RH * RH +
    0.00122874 * T * T * RH +
    0.00085282 * T * RH * RH -
    0.00000199 * T * T * RH * RH;

  // Steadman adjustment — low humidity
  if (RH < 13 && T > 80 && T < 112) {
    const adjustment =
      ((13 - RH) / 4) *
      Math.sqrt((17 - Math.abs(T - 95)) / 17);
    HI -= adjustment;
  }

  // Steadman adjustment — high humidity
  if (RH > 85 && T > 80 && T < 87) {
    const adjustment = ((RH - 85) / 10) * ((87 - T) / 5);
    HI += adjustment;
  }

  // Simple heat index (Steadman) for cases where Rothfusz overshoots at lower range
  const simpleHI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094);
  if (simpleHI < 80) {
    // Use simple formula when average of simple HI and T is below 80 °F
    const avg = (simpleHI + T) / 2;
    if (avg < 80) {
      const resultC = (simpleHI - 32) * 5 / 9;
      return Math.round(resultC * 10) / 10;
    }
  }

  // Convert back to Celsius
  const resultC = (HI - 32) * 5 / 9;
  return Math.round(resultC * 10) / 10;
}

// ---------------------------------------------------------------------------
// 3. Apparent Temperature
// ---------------------------------------------------------------------------

/**
 * Returns the "feels-like" temperature.
 * - Cold conditions (T ≤ 10 °C with wind): wind chill
 * - Hot conditions  (T ≥ 27 °C):           heat index
 * - Otherwise:                               actual temperature
 */
export function getApparentTemperature(
  temp: number,
  humidity: number,
  windSpeed: number,
): number {
  const wc = calculateWindChill(temp, windSpeed);
  if (wc !== null) {
    return wc;
  }

  const hi = calculateHeatIndex(temp, humidity);
  if (hi !== null) {
    return hi;
  }

  return temp;
}

// ---------------------------------------------------------------------------
// 4. Temperature Range Classification
// ---------------------------------------------------------------------------

/**
 * Classifies the apparent temperature into a human-friendly range bucket.
 *
 * | Range          | °C          |
 * |----------------|-------------|
 * | extreme_cold   | < −10       |
 * | cold           | −10 ~ 5     |
 * | cool           |   5 ~ 15    |
 * | mild           |  15 ~ 25    |
 * | warm           |  25 ~ 30    |
 * | hot            | > 30        |
 */
export function classifyTemperatureRange(
  apparentTemp: number,
): TemperatureRange {
  if (apparentTemp < -10) return 'extreme_cold';
  if (apparentTemp < 5)   return 'cold';
  if (apparentTemp < 15)  return 'cool';
  if (apparentTemp < 25)  return 'mild';
  if (apparentTemp < 30)  return 'warm';
  return 'hot';
}

// ---------------------------------------------------------------------------
// Temperature-range label map (Korean)
// ---------------------------------------------------------------------------

const TEMP_RANGE_LABELS: Record<TemperatureRange, string> = {
  extreme_cold: '매우 추움',
  cold:         '추움',
  cool:         '선선함',
  mild:         '온화함',
  warm:         '더움',
  hot:          '매우 더움',
};

/**
 * Returns a Korean human-readable label for the temperature range.
 */
export function getTempRangeLabel(range: TemperatureRange): string {
  return TEMP_RANGE_LABELS[range];
}

// ---------------------------------------------------------------------------
// 5. Condition Label (Korean)
// ---------------------------------------------------------------------------

/**
 * Returns a short Korean weather condition label.
 *
 * PTY (강수 형태) codes — takes priority when non-zero:
 *   0 = 없음, 1 = 비, 2 = 비/눈, 3 = 눈, 5 = 빗방울,
 *   6 = 빗방울눈날림, 7 = 눈날림
 *
 * SKY (하늘 상태) codes — used when PTY = 0:
 *   1 = 맑음, 3 = 구름많음, 4 = 흐림
 */
export function getConditionLabel(
  skyCondition: number,
  precipType: number,
): string {
  // Precipitation takes priority
  if (precipType !== 0) {
    switch (precipType) {
      case 1: return '비';
      case 2: return '비/눈';
      case 3: return '눈';
      case 5: return '빗방울';
      case 6: return '빗방울눈날림';
      case 7: return '눈날림';
      default: return '강수';
    }
  }

  switch (skyCondition) {
    case 1:  return '맑음';
    case 3:  return '구름많음';
    case 4:  return '흐림';
    default: return '맑음';
  }
}

// ---------------------------------------------------------------------------
// 6. Condition Description (Korean)
// ---------------------------------------------------------------------------

/**
 * Returns a descriptive Korean phrase for the current weather condition.
 * Intended for use inside longer text / articles.
 */
export function getConditionDesc(
  skyCondition: number,
  precipType: number,
): string {
  if (precipType !== 0) {
    switch (precipType) {
      case 1:
        return '비가 내리고 있어 우산을 꼭 챙기세요';
      case 2:
        return '비와 눈이 섞여 내리고 있어 외출 시 주의가 필요합니다';
      case 3:
        return '눈이 내리고 있어 방한과 미끄럼 주의가 필요합니다';
      case 5:
        return '가벼운 빗방울이 떨어지고 있어 우산을 준비하세요';
      case 6:
        return '빗방울과 눈이 날리고 있어 방수 아우터를 추천합니다';
      case 7:
        return '눈이 날리고 있어 보온에 신경 쓰세요';
      default:
        return '강수가 예상되므로 우산을 준비하세요';
    }
  }

  switch (skyCondition) {
    case 1:
      return '맑은 하늘이 펼쳐져 야외 활동하기 좋은 날씨입니다';
    case 3:
      return '구름이 많지만 비는 오지 않는 날씨입니다';
    case 4:
      return '하늘이 흐려 다소 우울할 수 있지만 비는 오지 않습니다';
    default:
      return '맑은 날씨가 이어지고 있습니다';
  }
}

// ---------------------------------------------------------------------------
// 7. Condition Code
// ---------------------------------------------------------------------------

/**
 * Returns a simple English condition code for programmatic use:
 * 'clear' | 'cloudy' | 'rainy' | 'snowy'
 */
export function getConditionCode(
  skyCondition: number,
  precipType: number,
): string {
  if (precipType !== 0) {
    switch (precipType) {
      case 1:
      case 5:
        return 'rainy';
      case 3:
      case 7:
        return 'snowy';
      case 2:
      case 6:
        return 'rainy'; // mixed precipitation → treat as rain
      default:
        return 'rainy';
    }
  }

  switch (skyCondition) {
    case 1:  return 'clear';
    case 3:  return 'cloudy';
    case 4:  return 'cloudy';
    default: return 'clear';
  }
}

// ---------------------------------------------------------------------------
// 8. Process Weather Data
// ---------------------------------------------------------------------------

/**
 * Enriches raw `WeatherData` with derived fields (apparent temperature,
 * heat index, wind chill, condition labels, temperature range).
 */
export function processWeatherData(data: WeatherData): ProcessedWeather {
  const windChill = calculateWindChill(data.temperature, data.windSpeed);
  const heatIndex = calculateHeatIndex(data.temperature, data.humidity);
  const apparentTemp = getApparentTemperature(
    data.temperature,
    data.humidity,
    data.windSpeed,
  );
  const tempRange = classifyTemperatureRange(apparentTemp);
  const conditionLabel = getConditionLabel(data.skyCondition, data.precipType);
  const conditionDesc = getConditionDesc(data.skyCondition, data.precipType);

  return {
    ...data,
    apparentTemp,
    heatIndex,
    windChill,
    tempRange,
    conditionLabel,
    conditionDesc,
  };
}

// ---------------------------------------------------------------------------
// 9. Parse KMA (기상청) API Response
// ---------------------------------------------------------------------------

/**
 * Parses the `item` array returned by the 기상청 초단기실황 / 단기예보 API
 * into a `WeatherData` object.
 *
 * Supported category codes:
 * - T1H / TMP → temperature
 * - REH       → humidity
 * - WSD       → windSpeed
 * - RN1 / PCP → precipitation
 * - PTY       → precipType
 * - SKY       → skyCondition
 * - VEC       → windDirection
 *
 * If a field is not present in the response, sensible defaults are used.
 */
export function parseKMAResponse(items: any[]): WeatherData {
  const result: WeatherData = {
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    precipitation: 0,
    precipType: 0,
    skyCondition: 1,
    windDirection: 0,
  };

  if (!Array.isArray(items)) {
    return result;
  }

  for (const item of items) {
    const category: string = item.category ?? '';
    const rawValue: string = String(item.obsrValue ?? item.fcstValue ?? '');
    const numericValue = parseFloat(rawValue);
    const value = Number.isNaN(numericValue) ? 0 : numericValue;

    switch (category) {
      // Temperature
      case 'T1H': // 초단기실황 — 기온
      case 'TMP': // 단기예보 — 1시간 기온
        result.temperature = value;
        break;

      // Humidity
      case 'REH':
        result.humidity = value;
        break;

      // Wind speed
      case 'WSD':
        result.windSpeed = value;
        break;

      // Precipitation amount
      case 'RN1': // 초단기실황
        result.precipitation = parsePrecipitation(rawValue);
        break;
      case 'PCP': // 단기예보
        result.precipitation = parsePrecipitation(rawValue);
        break;

      // Precipitation type
      case 'PTY':
        result.precipType = value;
        break;

      // Sky condition
      case 'SKY':
        result.skyCondition = value;
        break;

      // Wind direction
      case 'VEC':
        result.windDirection = value;
        break;

      default:
        // Ignore unrecognised categories (UUU, VVV, LGT, etc.)
        break;
    }
  }

  return result;
}

/**
 * The PCP / RN1 field from KMA can contain strings like "강수없음", "1.0mm",
 * "30.0~50.0mm", or "50.0mm 이상". This helper extracts a usable number.
 */
function parsePrecipitation(raw: string): number {
  if (!raw || raw === '강수없음' || raw === '-' || raw === '0') {
    return 0;
  }

  // "30.0~50.0mm" → take the midpoint
  const rangeMatch = raw.match(
    /(\d+(?:\.\d+)?)\s*~\s*(\d+(?:\.\d+)?)/,
  );
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]);
    const hi = parseFloat(rangeMatch[2]);
    return (lo + hi) / 2;
  }

  // "50.0mm 이상" → just take the number
  const numMatch = raw.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }

  return 0;
}

// ---------------------------------------------------------------------------
// 10. Base Date/Time for 초단기실황 API
// ---------------------------------------------------------------------------

/**
 * Returns the most recent valid `base_date` and `base_time` for the KMA
 * 초단기실황 (Ultra-short-term live) API.
 *
 * Each hour's data becomes available approximately **10 minutes** after the
 * hour. So at 14:25 the latest valid base_time is "1400"; at 14:05 it is
 * still "1300".
 *
 * @param now Optional `Date` for testability; defaults to `new Date()`.
 * @returns `{ baseDate: 'YYYYMMDD', baseTime: 'HHmm' }`
 */
export function getBaseDateTime(
  now: Date = new Date(),
): { baseDate: string; baseTime: string } {
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  let hour = now.getHours();
  const minute = now.getMinutes();

  // Data for hour H is available at H:10.
  // If we're before HH:10, fall back to the previous hour.
  if (minute < 10) {
    hour -= 1;
    if (hour < 0) {
      // Roll back to previous day 23:00
      hour = 23;
      const prev = new Date(now);
      prev.setDate(prev.getDate() - 1);
      year = prev.getFullYear();
      month = prev.getMonth() + 1;
      day = prev.getDate();
    }
  }

  const baseDate =
    String(year) +
    String(month).padStart(2, '0') +
    String(day).padStart(2, '0');

  const baseTime =
    String(hour).padStart(2, '0') + '00';

  return { baseDate, baseTime };
}

// ---------------------------------------------------------------------------
// 10.5. Base Date/Time for 단기예보 (getVilageFcst) API
// ---------------------------------------------------------------------------

/**
 * Returns the most recent valid `base_date` and `base_time` for the KMA
 * 단기예보 (VilageFcst) API.
 *
 * Update times: 02:10, 05:10, 08:10, 11:10, 14:10, 17:10, 20:10, 23:10
 */
export function getForecastBaseTime(
  now: Date = new Date(),
): { baseDate: string; baseTime: string } {
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const validTimes = [23, 20, 17, 14, 11, 8, 5, 2];
  let targetHour = 23;
  let useYesterday = false;

  const currentTotalMins = hour * 60 + minute;

  // Find the most recent valid time that has been published (10 mins after the hour)
  const found = validTimes.find((vt) => currentTotalMins >= vt * 60 + 10);

  if (found !== undefined) {
    targetHour = found;
  } else {
    // If not found, it means it's before 02:10 today, so we must use yesterday's 23:00
    targetHour = 23;
    useYesterday = true;
  }

  if (useYesterday) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    year = prev.getFullYear();
    month = prev.getMonth() + 1;
    day = prev.getDate();
  }

  const baseDate =
    String(year) +
    String(month).padStart(2, '0') +
    String(day).padStart(2, '0');

  const baseTime = String(targetHour).padStart(2, '0') + '00';

  return { baseDate, baseTime };
}

// ---------------------------------------------------------------------------
// 10.6. Parse VilageFcst (단기예보) and build DailyForecast
// ---------------------------------------------------------------------------

export function parseVilageFcstResponse(items: any[], targetDate: string): HourlyForecast[] {
  if (!Array.isArray(items)) return [];

  const timeMap = new Map<string, HourlyForecast>();

  for (const item of items) {
    // KMA dates are YYYYMMDD
    if (item.fcstDate !== targetDate) continue;

    const time = item.fcstTime; // e.g., "0900"
    if (!timeMap.has(time)) {
      timeMap.set(time, {
        time,
        temperature: 0,
        humidity: 0,
        windSpeed: 0,
        precipProb: 0,
        precipType: 0,
        precipitation: 0,
        skyCondition: 1,
      });
    }
    const slot = timeMap.get(time)!;
    const val = item.fcstValue;

    switch (item.category) {
      case 'TMP': slot.temperature = parseFloat(val); break;
      case 'REH': slot.humidity = parseFloat(val); break;
      case 'WSD': slot.windSpeed = parseFloat(val); break;
      case 'POP': slot.precipProb = parseFloat(val); break;
      case 'PTY': slot.precipType = parseInt(val, 10); break;
      case 'PCP': slot.precipitation = parsePrecipitation(val); break;
      case 'SKY': slot.skyCondition = parseInt(val, 10); break;
    }
  }

  // Sort chronologically
  return Array.from(timeMap.values()).sort((a, b) => a.time.localeCompare(b.time));
}

export function buildDailyForecast(items: any[], targetDate: string): DailyForecast {
  const hourly = parseVilageFcstResponse(items, targetDate);

  let minTemp = 999;
  let maxTemp = -999;

  // TMN (일 최저) and TMX (일 최고) can appear in any time slot for the target date
  if (Array.isArray(items)) {
    for (const item of items) {
      if (item.fcstDate !== targetDate) continue;
      if (item.category === 'TMN') {
        minTemp = parseFloat(item.fcstValue);
      }
      if (item.category === 'TMX') {
        maxTemp = parseFloat(item.fcstValue);
      }
    }
  }

  // Fallback if TMN/TMX weren't found
  if (minTemp === 999 && hourly.length > 0) {
    minTemp = Math.min(...hourly.map(h => h.temperature));
  }
  if (maxTemp === -999 && hourly.length > 0) {
    maxTemp = Math.max(...hourly.map(h => h.temperature));
  }

  // If no data at all
  if (minTemp === 999) minTemp = 0;
  if (maxTemp === -999) maxTemp = 0;

  const tempDiff = maxTemp - minTemp;

  let maxPrecipProb = 0;
  let rainExpected = false;
  let snowExpected = false;

  for (const h of hourly) {
    if (h.precipProb > maxPrecipProb) maxPrecipProb = h.precipProb;
    if (h.precipType === 1 || h.precipType === 2 || h.precipType === 4 || h.precipType === 5) rainExpected = true;
    if (h.precipType === 3 || h.precipType === 6 || h.precipType === 7) snowExpected = true;
  }

  let dominantCondition = 'clear';
  if (snowExpected) {
    dominantCondition = 'snowy';
  } else if (rainExpected) {
    dominantCondition = 'rainy';
  } else {
    // If average SKY > 2.5, consider it cloudy
    const avgSky = hourly.length ? hourly.reduce((sum, h) => sum + h.skyCondition, 0) / hourly.length : 1;
    if (avgSky >= 3) {
      dominantCondition = 'cloudy';
    }
  }

  return {
    minTemp,
    maxTemp,
    tempDiff,
    maxPrecipProb,
    rainExpected,
    snowExpected,
    hourly,
    dominantCondition,
  };
}

// ---------------------------------------------------------------------------
// 11. Season from Date String
// ---------------------------------------------------------------------------

/**
 * Returns the Korean season name for the given date.
 *
 * Season boundaries (meteorological convention):
 * - 봄  (Spring): March – May
 * - 여름 (Summer): June – August
 * - 가을 (Autumn): September – November
 * - 겨울 (Winter): December – February
 *
 * @param date Date string in any format parseable by `Date`, but
 *             'YYYY-MM-DD' or 'YYYYMMDD' recommended.
 */
export function getSeason(date: string): string {
  // Handle both 'YYYYMMDD' and 'YYYY-MM-DD'
  let month: number;
  if (/^\d{8}$/.test(date)) {
    month = parseInt(date.substring(4, 6), 10);
  } else {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      // Fallback — try current month
      month = new Date().getMonth() + 1;
    } else {
      month = parsed.getMonth() + 1;
    }
  }

  if (month >= 3 && month <= 5) return '봄';
  if (month >= 6 && month <= 8) return '여름';
  if (month >= 9 && month <= 11) return '가을';
  return '겨울';
}

// ---------------------------------------------------------------------------
// 12. Wind Direction Label
// ---------------------------------------------------------------------------

/**
 * Converts compass degrees (0–360) to a Korean cardinal/intercardinal label.
 *
 * | Degrees       | Label |
 * |---------------|-------|
 * | 337.5 – 22.5  | 북    |
 * |  22.5 – 67.5  | 북동  |
 * |  67.5 – 112.5 | 동    |
 * | 112.5 – 157.5 | 남동  |
 * | 157.5 – 202.5 | 남    |
 * | 202.5 – 247.5 | 남서  |
 * | 247.5 – 292.5 | 서    |
 * | 292.5 – 337.5 | 북서  |
 */
export function getWindDirectionLabel(degrees: number): string {
  // Normalise to 0–360
  const d = ((degrees % 360) + 360) % 360;

  const directions: [number, string][] = [
    [22.5,  '북'],
    [67.5,  '북동'],
    [112.5, '동'],
    [157.5, '남동'],
    [202.5, '남'],
    [247.5, '남서'],
    [292.5, '서'],
    [337.5, '북서'],
  ];

  for (const [upperBound, label] of directions) {
    if (d < upperBound) {
      return label;
    }
  }

  // 337.5 ≤ d < 360 wraps back to 북
  return '북';
}
