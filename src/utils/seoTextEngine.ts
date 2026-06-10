// ============================================================================
// seoTextEngine.ts — Deterministic SEO article generator
// Produces unique 1,200+ character Korean fashion / health articles based on
// weather data. Uses a seeded PRNG so that same (city + date) always yields
// the same article, while different inputs produce different articles.
// ============================================================================

import {
  ProcessedWeather,
  DailyForecast,
  getSeason,
  getWindDirectionLabel,
  getTempRangeLabel,
} from './weather';

// ---------------------------------------------------------------------------
// Template Data Interface
// ---------------------------------------------------------------------------

export interface TemplateData {
  id: number;
  category: string;       // 'intro' | 'health_guide' | 'outfit_tip' | 'trend_conclusion'
  condition: string;       // 'clear' | 'cloudy' | 'rainy' | 'snowy' | 'any'
  minTemp: number | null;  // Minimum applicable apparent temp (inclusive), null = no limit
  maxTemp: number | null;  // Maximum applicable apparent temp (exclusive), null = no limit
  template: string;        // Template text with {{variable}} placeholders
  weight: number;          // Selection weight (higher = more likely to be picked)
}

// ---------------------------------------------------------------------------
// SeededRandom — Deterministic PRNG
// ---------------------------------------------------------------------------

export class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
    // Warm up the generator to avoid weak initial states
    for (let i = 0; i < 10; i++) {
      this.next();
    }
  }

  /**
   * djb2 hash — converts an arbitrary string to a 32-bit integer seed.
   */
  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      // hash * 33 + charCode
      hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
    }
    // Ensure positive
    return hash >>> 0;
  }

  /**
   * mulberry32 — fast 32-bit PRNG.
   * @returns A float in [0, 1).
   */
  next(): number {
    this.seed += 0x6d2b79f5;
    let t = this.seed | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer in [min, max] (inclusive on both ends).
   */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /**
   * Fisher-Yates shuffle (in-place, returns the same array reference).
   */
  shuffle<T>(array: T[]): T[] {
    const a = [...array]; // clone so the original is untouched
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Pick one random element from the array.
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Pick `n` unique elements from the array (without replacement).
   * If n ≥ array.length, returns a shuffled copy of the entire array.
   */
  pickN<T>(array: T[], n: number): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(n, shuffled.length));
  }
}

// ---------------------------------------------------------------------------
// TemplatePicker — Weighted random template selection
// ---------------------------------------------------------------------------

export class TemplatePicker {
  private templates: TemplateData[];
  private rng: SeededRandom;
  private usedIds: Set<number>;

  constructor(templates: TemplateData[], rng: SeededRandom) {
    this.templates = templates;
    this.rng = rng;
    this.usedIds = new Set();
  }

  /**
   * Filter templates that match the given criteria.
   */
  private filter(
    category: string,
    condition: string,
    temp: number,
  ): TemplateData[] {
    return this.templates.filter((t) => {
      // Must match category
      if (t.category !== category) return false;

      // Must not have been used already
      if (this.usedIds.has(t.id)) return false;

      // Condition must match, or be 'any'/'all' (universal)
      if (t.condition !== 'any' && t.condition !== 'all' && t.condition !== condition) return false;

      // Temperature range check
      if (t.minTemp !== null && temp < t.minTemp) return false;
      if (t.maxTemp !== null && temp >= t.maxTemp) return false;

      return true;
    });
  }

  /**
   * Weighted random pick from a pool of candidate templates.
   * Marks the picked template as used.
   */
  pick(
    category: string,
    condition: string,
    temp: number,
  ): TemplateData | null {
    const candidates = this.filter(category, condition, temp);
    if (candidates.length === 0) {
      // Fallback: try 'any' condition if the specific condition yielded nothing
      const fallback = this.templates.filter(
        (t) =>
          t.category === category &&
          !this.usedIds.has(t.id) &&
          t.condition === 'any' &&
          (t.minTemp === null || temp >= t.minTemp) &&
          (t.maxTemp === null || temp < t.maxTemp),
      );
      if (fallback.length === 0) return null;
      return this.weightedPick(fallback);
    }
    return this.weightedPick(candidates);
  }

  /**
   * Pick `n` templates, each unique.
   */
  pickN(
    category: string,
    condition: string,
    temp: number,
    n: number,
  ): TemplateData[] {
    const result: TemplateData[] = [];
    for (let i = 0; i < n; i++) {
      const t = this.pick(category, condition, temp);
      if (t) result.push(t);
    }
    return result;
  }

  /**
   * Internal weighted random selection using cumulative-weight approach.
   */
  private weightedPick(pool: TemplateData[]): TemplateData {
    const totalWeight = pool.reduce((sum, t) => sum + t.weight, 0);
    let r = this.rng.next() * totalWeight;

    for (const t of pool) {
      r -= t.weight;
      if (r <= 0) {
        this.usedIds.add(t.id);
        return t;
      }
    }

    // Fallback (shouldn't happen, but safety)
    const last = pool[pool.length - 1];
    this.usedIds.add(last.id);
    return last;
  }
}

// ---------------------------------------------------------------------------
// Transition Phrases
// ---------------------------------------------------------------------------

const TRANSITION_PHRASES = [
  '한편,',
  '이어서,',
  '또한,',
  '특히,',
  '참고로,',
  '아울러,',
  '더불어,',
  '그리고,',
  '이 밖에도,',
  '덧붙여,',
  '여기에 더해,',
  '무엇보다,',
  '마지막으로,',
];

// ---------------------------------------------------------------------------
// Season Tips
// ---------------------------------------------------------------------------

const SEASON_TIPS: Record<string, string[]> = {
  봄: [
    '봄철 환절기에는 일교차가 크므로 겉옷을 꼭 챙기세요.',
    '미세먼지가 잦은 봄철에는 마스크와 선글라스를 추천합니다.',
    '봄비가 자주 내리는 시기이니 접이식 우산을 가방에 넣어두세요.',
    '꽃가루 알레르기가 심해지는 계절이니 외출 후 손 씻기를 생활화하세요.',
    '봄 나들이 시 자외선 차단제를 꼼꼼히 발라주세요.',
  ],
  여름: [
    '무더운 여름에는 통풍이 잘 되는 린넨 소재를 추천합니다.',
    '열사병 예방을 위해 수분 섭취를 충분히 하세요.',
    '강한 자외선에 대비해 모자와 선크림은 필수입니다.',
    '장마철에는 방수 기능이 있는 신발을 신는 것이 좋습니다.',
    '에어컨 실내에서는 얇은 가디건을 준비하세요.',
  ],
  가을: [
    '선선한 가을 바람에 맞는 가벼운 니트를 준비하세요.',
    '가을 단풍 나들이에는 편한 운동화가 제격입니다.',
    '일교차가 벌어지는 가을에는 레이어드 코디를 추천합니다.',
    '건조한 가을 날씨에 보습 관리에 신경 쓰세요.',
    '가을철 나들이에는 가벼운 트렌치코트를 걸쳐보세요.',
  ],
  겨울: [
    '겨울철 외출 시 목도리, 장갑, 귀마개는 필수입니다.',
    '한파 특보 시에는 가급적 외출을 삼가세요.',
    '겨울철 실내 건조함을 막기 위해 가습기를 활용하세요.',
    '빙판길 낙상 사고에 주의하고 미끄럼 방지 신발을 신으세요.',
    '두꺼운 옷 하나보다 얇은 옷 여러 겹이 보온에 효과적입니다.',
  ],
};

// ---------------------------------------------------------------------------
// ArticleComposer — Full article generation
// ---------------------------------------------------------------------------

export class ArticleComposer {
  private picker: TemplatePicker;
  private rng: SeededRandom;
  private weather: ProcessedWeather;
  private dailyForecast: DailyForecast | null;
  private cityName: string;
  private dateStr: string;
  private season: string;

  constructor(params: {
    templates: TemplateData[];
    weather: ProcessedWeather;
    dailyForecast?: DailyForecast;
    cityName: string;
    dateStr: string; // 'YYYY-MM-DD'
  }) {
    const seedStr = `${params.cityName}::${params.dateStr}`;
    this.rng = new SeededRandom(seedStr);
    this.picker = new TemplatePicker(params.templates, this.rng);
    this.weather = params.weather;
    this.dailyForecast = params.dailyForecast || null;
    this.cityName = params.cityName;
    this.dateStr = params.dateStr;
    this.season = getSeason(params.dateStr);
  }

  // -----------------------------------------------------------------------
  // Template variable interpolation
  // -----------------------------------------------------------------------

  private interpolate(template: string): string {
    const w = this.weather;
    const windDir = getWindDirectionLabel(w.windDirection);

    // Format date for display: 'YYYY년 MM월 DD일'
    const formattedDate = this.formatDateKorean(this.dateStr);

    const replacements: Record<string, string> = {
      city: this.cityName,
      temp: `${w.temperature}`,
      apparentTemp: `${w.apparentTemp}`,
      humidity: `${w.humidity}`,
      windSpeed: `${w.windSpeed}`,
      windDirection: windDir,
      precipitation: `${w.precipitation}`,
      date: formattedDate,
      condition: w.conditionLabel,
      conditionDesc: w.conditionDesc,
      season: this.season,
      seasonTip: this.getSeasonTip(),
      tempRange: this.getTempRangeDesc(),
      minTemp: String(this.dailyForecast?.minTemp ?? Math.round(this.weather.temperature - 5)),
      maxTemp: String(this.dailyForecast?.maxTemp ?? Math.round(this.weather.temperature + 5)),
      tempDiff: String(this.dailyForecast?.tempDiff ?? 10),
      maxPrecipProb: String(this.dailyForecast?.maxPrecipProb ?? 0),
      rainTime: this.getRainTimeDesc(),
      umbrellaAdvice: this.getUmbrellaAdvice(),
      heatIndex: w.heatIndex !== null ? `${w.heatIndex}` : '해당없음',
      windChill: w.windChill !== null ? `${w.windChill}` : '해당없음',
    };

    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      // Replace all occurrences of {{key}}
      result = result.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        value,
      );
    }

    return result;
  }

  /**
   * Formats 'YYYY-MM-DD' → 'YYYY년 M월 D일'
   */
  private formatDateKorean(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      return `${y}년 ${m}월 ${d}일`;
    }
    return dateStr;
  }

  private getSeasonTip(): string {
    const seasonTips = SEASON_TIPS[this.season] ?? SEASON_TIPS['봄'];
    return this.rng.pick(seasonTips);
  }

  private getTempRangeDesc(): string {
    return getTempRangeLabel(this.weather.tempRange);
  }

  private getRainTimeDesc(): string {
    if (!this.dailyForecast || this.dailyForecast.hourly.length === 0) return '오후 늦게';
    const rainSlots = this.dailyForecast.hourly.filter(h => h.precipProb >= 40 || h.precipType > 0);
    if (rainSlots.length === 0) return '하루 중';
    
    // Group slots into Morning, Afternoon, Evening
    let morning = false, afternoon = false, evening = false;
    for (const slot of rainSlots) {
      const hour = parseInt(slot.time.substring(0, 2), 10);
      if (hour < 12) morning = true;
      else if (hour < 18) afternoon = true;
      else evening = true;
    }

    if (morning && afternoon && evening) return '하루 종일';
    if (morning && afternoon) return '아침부터 오후까지';
    if (afternoon && evening) return '오후부터 저녁까지';
    if (morning) return '오전에';
    if (afternoon) return '오후에';
    if (evening) return '저녁에';
    return '특정 시간대에';
  }

  private getUmbrellaAdvice(): string {
    const prob = this.dailyForecast?.maxPrecipProb ?? 0;
    if (prob >= 70) return '외출 시 우산을 반드시 챙기시길 바랍니다.';
    if (prob >= 40) return '만약을 위해 접이식 우산을 챙기시는 것을 권장합니다.';
    return '비가 올 확률은 낮지만, 혹시 모를 소나기에 대비해 가벼운 우산을 챙기는 것도 좋습니다.';
  }

  // -----------------------------------------------------------------------
  // Transition insertion
  // -----------------------------------------------------------------------

  private addTransitions(sections: string[]): string {
    if (sections.length <= 1) {
      return sections.join('\n\n');
    }

    const usedPhrases = new Set<string>();
    const parts: string[] = [sections[0]];

    for (let i = 1; i < sections.length; i++) {
      // Pick an unused transition phrase
      let phrase: string;
      const available = TRANSITION_PHRASES.filter((p) => !usedPhrases.has(p));
      if (available.length > 0) {
        phrase = this.rng.pick(available);
      } else {
        phrase = this.rng.pick(TRANSITION_PHRASES);
      }
      usedPhrases.add(phrase);

      // Prepend transition to section if the section doesn't already start with one
      const section = sections[i];
      const startsWithTransition = TRANSITION_PHRASES.some((tp) =>
        section.startsWith(tp),
      );

      if (startsWithTransition) {
        parts.push(section);
      } else {
        parts.push(`${phrase} ${section}`);
      }
    }

    return parts.join('\n\n');
  }

  // -----------------------------------------------------------------------
  // Compose full article
  // -----------------------------------------------------------------------

  compose(): { article: string; seoTitle: string; seoDescription: string } {
    const conditionCode = this.getSimpleConditionCode();

    // ----- 1. Intro section (3–4 templates) -----
    const introTemplates = this.picker.pickN(
      'intro',
      conditionCode,
      this.weather.apparentTemp,
      4,
    );
    const introTexts = introTemplates.map((t) => this.interpolate(t.template));
    const introSection = this.buildSection('오늘의 날씨 요약', introTexts);

    // ----- 2. Health guide section (4–5 templates) -----
    const healthTemplates = this.picker.pickN(
      'health_guide',
      conditionCode,
      this.weather.apparentTemp,
      5,
    );
    const healthTexts = healthTemplates.map((t) => this.interpolate(t.template));
    const healthSection = this.buildSection('건강 관리 가이드', healthTexts);

    // ----- 3. Outfit tip section (5–6 templates) -----
    const outfitTemplates = this.picker.pickN(
      'outfit_tip',
      conditionCode,
      this.weather.apparentTemp,
      6,
    );
    const outfitTexts = outfitTemplates.map((t) => this.interpolate(t.template));
    const outfitSection = this.buildSection('오늘의 코디 추천', outfitTexts);

    // ----- 4. Conclusion section (2–3 templates) -----
    const conclusionTemplates = this.picker.pickN(
      'trend_conclusion',
      conditionCode,
      this.weather.apparentTemp,
      3,
    );
    const conclusionTexts = conclusionTemplates.map((t) =>
      this.interpolate(t.template),
    );
    const conclusionSection = this.buildSection(
      '마무리 및 트렌드',
      conclusionTexts,
    );

    // ----- 5. Assemble with transitions -----
    const allSections = [
      introSection,
      healthSection,
      outfitSection,
      conclusionSection,
    ].filter((s) => s.length > 0);

    let article = this.addTransitions(allSections);

    // ----- 6. Ensure minimum 1,200 characters -----
    article = this.ensureMinimumLength(article);

    // ----- 7. Generate SEO title and description -----
    const seoTitle = this.generateSeoTitle();
    const seoDescription = this.generateSeoDescription();

    return { article, seoTitle, seoDescription };
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Maps weather conditions to the simplified condition code used for
   * template matching.
   */
  private getSimpleConditionCode(): string {
    const pt = this.weather.precipType;
    if (pt === 1 || pt === 2 || pt === 5 || pt === 6) return 'rainy';
    if (pt === 3 || pt === 7) return 'snowy';

    const sky = this.weather.skyCondition;
    if (sky === 3 || sky === 4) return 'cloudy';
    return 'clear';
  }

  /**
   * Builds a markdown-style section with a heading and paragraph content.
   */
  private buildSection(heading: string, texts: string[]): string {
    if (texts.length === 0) return '';

    const header = `## ${heading}`;
    const body = texts.join(' ');
    return `${header}\n\n${body}`;
  }

  /**
   * If the article is under 1,200 characters, pad it with additional
   * contextual filler sentences.
   */
  private ensureMinimumLength(article: string): string {
    const MIN_LENGTH = 1200;

    if (article.length >= MIN_LENGTH) {
      return article;
    }

    const fillerSentences = [
      `${this.cityName} 지역의 현재 기온은 ${this.weather.temperature}°C이며, 체감 온도는 약 ${this.weather.apparentTemp}°C입니다.`,
      `현재 습도는 ${this.weather.humidity}%로, ${this.weather.humidity > 60 ? '다소 습한 편이니 통풍이 잘 되는 옷을 선택하세요.' : '적절한 수준을 유지하고 있습니다.'}`,
      `바람은 ${getWindDirectionLabel(this.weather.windDirection)}풍이 ${this.weather.windSpeed}m/s로 불고 있습니다. ${this.weather.windSpeed > 5 ? '바람이 강하니 모자가 날리지 않도록 주의하세요.' : '비교적 잔잔한 바람이 불고 있습니다.'}`,
      `오늘 ${this.cityName}의 하늘은 ${this.weather.conditionLabel} 상태입니다. ${this.weather.conditionDesc}.`,
      `${this.season}철 ${this.cityName}에서는 ${this.getSeasonalFashionTip()}`,
      `외출 전 기상 정보를 꼭 확인하시고, 변덕스러운 날씨에 대비하여 여분의 겉옷을 챙기시길 추천드립니다.`,
      `기상청에 따르면 오늘 ${this.cityName} 지역은 ${this.weather.conditionLabel} 날씨가 이어질 전망입니다. 건강과 패션 모두 챙기는 하루가 되시길 바랍니다.`,
      `일상에서 날씨에 맞는 옷차림을 선택하는 것은 건강 관리의 기본입니다. 오늘처럼 ${getTempRangeLabel(this.weather.tempRange)} 날씨에는 적절한 의복 조절이 중요합니다.`,
      `${this.cityName}의 ${this.season} 패션 트렌드를 참고하여 실용적이면서도 스타일리시한 코디를 완성해 보세요.`,
      `매일 아침 날씨를 확인하고 그에 맞는 옷차림을 준비하는 습관이 건강하고 활기찬 하루를 만들어 줍니다.`,
    ];

    let result = article;
    const shuffled = this.rng.shuffle(fillerSentences);
    let idx = 0;

    while (result.length < MIN_LENGTH && idx < shuffled.length) {
      result += ' ' + shuffled[idx];
      idx++;
    }

    // If still under length after all fillers (very unlikely), add more generic content
    if (result.length < MIN_LENGTH) {
      const extra = `${this.cityName}에서의 ${this.season}을 건강하고 멋지게 보내시길 바랍니다. ` +
        `날씨 변화에 유연하게 대응하는 패션 센스로 편안하면서도 세련된 하루를 보내세요. ` +
        `오늘도 좋은 하루 되세요!`;
      result += '\n\n' + extra;
    }

    return result;
  }

  /**
   * Returns a seasonal fashion tip string.
   */
  private getSeasonalFashionTip(): string {
    const tips: Record<string, string> = {
      봄: '가벼운 트렌치코트나 얇은 가디건이 활용도가 높습니다.',
      여름: '시원한 반팔 티셔츠와 통풍이 잘 되는 린넨 팬츠가 인기입니다.',
      가을: '따뜻한 톤의 니트와 코듀로이 팬츠 조합을 추천합니다.',
      겨울: '두꺼운 패딩이나 울 코트로 보온성을 확보하세요.',
    };
    return tips[this.season] ?? tips['봄'];
  }

  /**
   * Generates an SEO-optimized title.
   */
  private generateSeoTitle(): string {
    const formattedDate = this.formatDateKorean(this.dateStr);
    const titleVariants = [
      `${formattedDate} ${this.cityName} 날씨 ${this.weather.temperature}°C — 오늘의 코디 추천`,
      `오늘 ${this.cityName} 날씨 ${this.weather.conditionLabel} ${this.weather.temperature}°C, 뭐 입지? 코디 가이드`,
      `${this.cityName} ${this.season} 코디 — ${formattedDate} 날씨별 옷차림 추천`,
      `${formattedDate} ${this.cityName} 기온 ${this.weather.temperature}°C ${this.weather.conditionLabel} 패션 가이드`,
      `${this.cityName} 오늘 날씨 체감온도 ${this.weather.apparentTemp}°C — ${this.season} 옷차림 꿀팁`,
    ];

    return this.rng.pick(titleVariants);
  }

  /**
   * Generates an SEO-optimized meta description (≤ 160 chars).
   */
  private generateSeoDescription(): string {
    const descVariants = [
      `${this.cityName} 오늘 기온 ${this.weather.temperature}°C, 체감 ${this.weather.apparentTemp}°C. ${this.weather.conditionLabel} 날씨에 맞는 코디와 건강 팁을 확인하세요.`,
      `${this.cityName} ${this.season} 날씨 ${this.weather.temperature}°C, ${this.weather.conditionLabel}. 기온별 추천 코디와 외출 시 주의사항을 알려드립니다.`,
      `오늘 ${this.cityName} ${this.weather.conditionLabel} ${this.weather.temperature}°C. 체감온도 ${this.weather.apparentTemp}°C에 맞는 패션 가이드와 건강 관리법.`,
      `${this.cityName} 날씨 ${this.weather.temperature}°C ${this.weather.conditionLabel}. ${this.season}철 건강하고 스타일리시한 옷차림 추천.`,
    ];

    return this.rng.pick(descVariants);
  }
}

// ---------------------------------------------------------------------------
// Default Templates — Comprehensive built-in template library
// ---------------------------------------------------------------------------

export const DEFAULT_TEMPLATES: TemplateData[] = [
  // ===== INTRO templates =====
  { id: 1,   category: 'intro', condition: 'clear',  minTemp: null, maxTemp: null, template: '{{date}} {{city}}의 하늘은 맑고 화창합니다. 현재 기온 {{temp}}°C에 체감 온도 {{apparentTemp}}°C로 {{tempRange}} 날씨가 이어지고 있습니다.', weight: 10 },
  { id: 2,   category: 'intro', condition: 'cloudy', minTemp: null, maxTemp: null, template: '{{date}} {{city}}은(는) 구름이 많은 날씨를 보이고 있습니다. 기온은 {{temp}}°C이며 체감 온도는 {{apparentTemp}}°C입니다.', weight: 10 },
  { id: 3,   category: 'intro', condition: 'rainy',  minTemp: null, maxTemp: null, template: '{{date}} {{city}}에는 비 소식이 있습니다. 현재 강수량은 {{precipitation}}mm이며, 기온 {{temp}}°C에 습도가 {{humidity}}%입니다. 외출 시 우산을 꼭 챙기세요.', weight: 10 },
  { id: 4,   category: 'intro', condition: 'snowy',  minTemp: null, maxTemp: null, template: '{{date}} {{city}}에 눈이 내리고 있습니다. 기온은 {{temp}}°C로 {{tempRange}} 날씨이며, 빙판길 안전에 주의하시기 바랍니다.', weight: 10 },
  { id: 5,   category: 'intro', condition: 'any',    minTemp: null, maxTemp: null, template: '{{date}} {{city}}의 현재 날씨는 {{condition}}이며, 기온 {{temp}}°C, 체감 온도 {{apparentTemp}}°C를 기록하고 있습니다. 습도는 {{humidity}}%이며 바람은 {{windSpeed}}m/s로 불고 있습니다.', weight: 8 },
  { id: 6,   category: 'intro', condition: 'any',    minTemp: null, maxTemp: null, template: '오늘 {{city}} 지역의 날씨를 상세하게 분석해 드리겠습니다. {{conditionDesc}}. 현재 기온은 {{temp}}°C이고, 바람은 {{windDirection}}풍 {{windSpeed}}m/s로 불고 있습니다.', weight: 8 },
  { id: 7,   category: 'intro', condition: 'clear',  minTemp: 25,  maxTemp: null, template: '{{date}} {{city}}는 맑고 더운 날씨입니다. 기온이 {{temp}}°C까지 올라 체감 온도는 {{apparentTemp}}°C에 달합니다. 무더위에 대비한 가벼운 옷차림이 필요합니다.', weight: 10 },
  { id: 8,   category: 'intro', condition: 'clear',  minTemp: null, maxTemp: 5,   template: '{{date}} {{city}}는 맑지만 매우 쌀쌀한 날씨입니다. 기온 {{temp}}°C에 체감 온도는 {{apparentTemp}}°C로 떨어져 방한 대비가 필수입니다.', weight: 10 },
  { id: 9,   category: 'intro', condition: 'any',    minTemp: 15,  maxTemp: 25,  template: '{{date}} {{city}}는 외출하기 좋은 온화한 날씨입니다. 현재 기온 {{temp}}°C, 체감 온도 {{apparentTemp}}°C로 활동하기 적당한 기온입니다.', weight: 9 },
  { id: 10,  category: 'intro', condition: 'any',    minTemp: null, maxTemp: null, template: '{{season}}을 맞은 {{city}}의 오늘 날씨를 확인해 보겠습니다. {{condition}} 하늘 아래 기온은 {{temp}}°C이며, {{conditionDesc}}.', weight: 7 },

  // ===== HEALTH GUIDE templates =====
  { id: 101, category: 'health_guide', condition: 'any',    minTemp: 30,  maxTemp: null, template: '기온이 {{temp}}°C로 높아 열사병과 일사병에 특히 주의해야 합니다. 외출 시 충분한 수분을 섭취하고, 그늘에서 자주 쉬어주세요. 현재 습도 {{humidity}}%로 불쾌지수가 높을 수 있습니다.', weight: 10 },
  { id: 102, category: 'health_guide', condition: 'any',    minTemp: 25,  maxTemp: 30,  template: '체감 온도 {{apparentTemp}}°C의 더운 날씨입니다. 자외선 차단제를 꼼꼼히 바르고, 모자와 선글라스로 자외선을 차단하세요. 물을 수시로 마셔 탈수를 예방하세요.', weight: 10 },
  { id: 103, category: 'health_guide', condition: 'any',    minTemp: null, maxTemp: -10, template: '체감 온도 {{apparentTemp}}°C의 강추위입니다. 동상 위험이 있으므로 노출 부위를 최소화하세요. 따뜻한 음료를 자주 마시고, 실내 적정 온도를 유지하세요.', weight: 10 },
  { id: 104, category: 'health_guide', condition: 'any',    minTemp: -10, maxTemp: 5,   template: '기온 {{temp}}°C로 춥습니다. 감기와 독감 예방을 위해 손 씻기를 생활화하고, 외출 후 따뜻한 물로 샤워하세요. 실내 습도 관리에도 신경 쓰면 좋습니다.', weight: 10 },
  { id: 105, category: 'health_guide', condition: 'any',    minTemp: 5,   maxTemp: 15,  template: '선선한 기온 {{temp}}°C에는 환절기 건강 관리가 중요합니다. 일교차가 클 수 있으니 얇은 겉옷을 준비하고, 비타민 C 섭취를 늘려 면역력을 높이세요.', weight: 10 },
  { id: 106, category: 'health_guide', condition: 'any',    minTemp: 15,  maxTemp: 25,  template: '기온 {{temp}}°C의 활동하기 좋은 날씨입니다. 적당한 야외 운동으로 체력을 기르고, 규칙적인 생활 리듬을 유지하세요. 습도 {{humidity}}%로 쾌적한 환경입니다.', weight: 10 },
  { id: 107, category: 'health_guide', condition: 'rainy',  minTemp: null, maxTemp: null, template: '비가 오는 날에는 습도가 높아지면서 관절통이 심해질 수 있습니다. 현재 습도 {{humidity}}%이니, 실내에서는 제습기를 활용하고 관절 보온에 신경 쓰세요.', weight: 9 },
  { id: 108, category: 'health_guide', condition: 'rainy',  minTemp: null, maxTemp: null, template: '젖은 옷은 체온을 빼앗을 수 있으니 비에 젖으면 빨리 갈아입으세요. 우천 시에는 미끄러운 길에서의 낙상 사고에도 주의하셔야 합니다.', weight: 8 },
  { id: 109, category: 'health_guide', condition: 'snowy',  minTemp: null, maxTemp: null, template: '눈이 내리는 날에는 미끄러운 빙판길 사고가 빈번합니다. 외출 시 바닥에 홈이 있는 방한화를 신고, 양손을 주머니에서 빼고 걸으세요.', weight: 9 },
  { id: 110, category: 'health_guide', condition: 'any',    minTemp: null, maxTemp: null, template: '{{seasonTip}} {{season}}철 건강 관리는 무엇보다 규칙적인 생활과 충분한 수면이 기본입니다. 오늘도 무리하지 않는 하루 보내시길 바랍니다.', weight: 7 },
  { id: 111, category: 'health_guide', condition: 'cloudy', minTemp: null, maxTemp: null, template: '흐린 날씨에는 세로토닌 분비가 줄어 기분이 가라앉을 수 있습니다. 밝은 색상의 옷을 입고, 실내에서도 조명을 밝게 유지하면 기분 전환에 도움이 됩니다.', weight: 8 },
  { id: 112, category: 'health_guide', condition: 'any',    minTemp: null, maxTemp: null, template: '현재 바람이 {{windSpeed}}m/s로 불고 있습니다. {{windSpeed}}m/s 이상의 바람이 불 때는 렌즈 착용자는 안경으로 교체하고, 미세먼지 농도도 함께 확인하세요.', weight: 6 },

  // ===== OUTFIT TIP templates =====
  { id: 201, category: 'outfit_tip', condition: 'any',    minTemp: 30,  maxTemp: null, template: '기온 {{temp}}°C 이상의 무더운 날에는 얇고 통풍이 잘 되는 린넨이나 면 소재의 반팔 셔츠를 추천합니다. 밝은 컬러를 선택하면 열 흡수를 줄일 수 있습니다.', weight: 10 },
  { id: 202, category: 'outfit_tip', condition: 'any',    minTemp: 30,  maxTemp: null, template: '더위가 기승을 부리는 날에는 와이드 팬츠나 쇼츠로 하체 통풍을 확보하세요. 샌들이나 스니커즈로 발 쾌적함도 잊지 마세요.', weight: 9 },
  { id: 203, category: 'outfit_tip', condition: 'any',    minTemp: 25,  maxTemp: 30,  template: '체감 {{apparentTemp}}°C의 더운 날씨에는 반팔 티셔츠와 면바지 조합이 무난합니다. 에어컨이 강한 실내를 대비해 얇은 가디건을 가방에 넣어두면 좋습니다.', weight: 10 },
  { id: 204, category: 'outfit_tip', condition: 'any',    minTemp: 25,  maxTemp: 30,  template: '여름 더위에는 쿨맥스 같은 기능성 소재의 옷이 땀 흡수와 속건에 효과적입니다. UV 차단 기능이 있는 아우터도 활용해 보세요.', weight: 8 },
  { id: 205, category: 'outfit_tip', condition: 'any',    minTemp: 15,  maxTemp: 25,  template: '{{temp}}°C의 온화한 기온에는 긴팔 셔츠에 슬랙스, 혹은 원피스에 가벼운 재킷을 매치하면 세련된 코디가 완성됩니다.', weight: 10 },
  { id: 206, category: 'outfit_tip', condition: 'any',    minTemp: 15,  maxTemp: 25,  template: '일교차를 고려해 얇은 니트나 후드집업을 레이어드하면 기온 변화에 유연하게 대응할 수 있습니다. 스카프로 포인트를 주는 것도 좋습니다.', weight: 9 },
  { id: 207, category: 'outfit_tip', condition: 'any',    minTemp: 5,   maxTemp: 15,  template: '선선한 {{temp}}°C 날씨에는 가을 느낌의 트렌치코트나 야상 재킷이 잘 어울립니다. 안에 얇은 니트를 매치하면 보온과 스타일을 모두 잡을 수 있습니다.', weight: 10 },
  { id: 208, category: 'outfit_tip', condition: 'any',    minTemp: 5,   maxTemp: 15,  template: '{{tempRange}} 날씨의 핵심은 레이어링입니다. 티셔츠 위에 셔츠, 그 위에 가벼운 아우터를 겹쳐 입으면 낮과 밤의 기온 차이에 대응할 수 있습니다.', weight: 9 },
  { id: 209, category: 'outfit_tip', condition: 'any',    minTemp: -10, maxTemp: 5,   template: '기온 {{temp}}°C의 추운 날씨에는 패딩이나 두꺼운 코트가 필수입니다. 히트텍 같은 발열 내의를 안에 입으면 부피를 줄이면서 따뜻함을 유지할 수 있습니다.', weight: 10 },
  { id: 210, category: 'outfit_tip', condition: 'any',    minTemp: -10, maxTemp: 5,   template: '추운 날에는 목도리, 장갑, 비니 등 방한 소품이 체감 온도를 크게 높여줍니다. 기모 안감의 바지도 하체 보온에 효과적입니다.', weight: 9 },
  { id: 211, category: 'outfit_tip', condition: 'any',    minTemp: null, maxTemp: -10, template: '체감 {{apparentTemp}}°C의 강추위에는 롱패딩 또는 두꺼운 다운 재킷이 필수입니다. 방한 부츠, 넥워머, 귀마개까지 착용하세요.', weight: 10 },
  { id: 212, category: 'outfit_tip', condition: 'any',    minTemp: null, maxTemp: -10, template: '극심한 추위에는 겹겹이 껴입는 것이 핵심입니다. 내의→플리스→패딩 순서로 레이어드하고, 장갑은 터치 가능한 스마트 장갑이 편리합니다.', weight: 9 },
  { id: 213, category: 'outfit_tip', condition: 'rainy',  minTemp: null, maxTemp: null, template: '비 오는 날에는 방수 기능이 있는 아우터와 고어텍스 소재 신발이 실용적입니다. 밝은 색상의 우비는 시인성도 높여 안전에 도움이 됩니다.', weight: 10 },
  { id: 214, category: 'outfit_tip', condition: 'rainy',  minTemp: null, maxTemp: null, template: '우천 시에는 빨리 마르는 폴리에스터 소재의 옷을 선택하세요. 청바지는 젖으면 무거워지므로 피하고, 발목 길이의 바지로 물튀김을 방지하세요.', weight: 9 },
  { id: 215, category: 'outfit_tip', condition: 'snowy',  minTemp: null, maxTemp: null, template: '눈 오는 날에는 방수·방한 기능을 갖춘 패딩 부츠를 신고, 미끄럼 방지 밑창이 있는 신발을 선택하세요. 밝은 색상의 아우터로 눈 속 안전을 확보하세요.', weight: 10 },
  { id: 216, category: 'outfit_tip', condition: 'snowy',  minTemp: null, maxTemp: null, template: '눈 내리는 겨울에는 방수 소재의 롱패딩과 기모 바지 조합이 최적입니다. 머플러와 비니로 두상과 목을 따뜻하게 감싸세요.', weight: 9 },
  { id: 217, category: 'outfit_tip', condition: 'cloudy', minTemp: null, maxTemp: null, template: '흐린 날에는 갑작스러운 비에 대비해 방수 소재의 아우터를 선택하면 실용적입니다. 접이식 우산을 가방에 넣어두면 안심할 수 있습니다.', weight: 8 },
  { id: 218, category: 'outfit_tip', condition: 'any',    minTemp: null, maxTemp: null, template: '{{season}} 트렌드 컬러를 활용하면 날씨에 맞으면서도 세련된 코디를 완성할 수 있습니다. 액세서리로 포인트를 주면 간단하면서도 스타일리시합니다.', weight: 7 },

  // ===== TREND CONCLUSION templates =====
  { id: 301, category: 'trend_conclusion', condition: 'any', minTemp: null, maxTemp: null, template: '오늘 {{city}}의 날씨를 종합하면, {{condition}} 하늘에 기온 {{temp}}°C, 체감 {{apparentTemp}}°C입니다. 날씨에 맞는 옷차림으로 건강하고 멋진 하루를 보내시길 바랍니다.', weight: 10 },
  { id: 302, category: 'trend_conclusion', condition: 'any', minTemp: null, maxTemp: null, template: '패션은 자기 표현의 수단이지만, 날씨에 맞지 않는 옷차림은 건강을 해칠 수 있습니다. 오늘의 기온 {{temp}}°C와 {{condition}} 날씨를 고려해 실용적이면서도 스타일리시한 선택을 하세요.', weight: 9 },
  { id: 303, category: 'trend_conclusion', condition: 'any', minTemp: null, maxTemp: null, template: '{{seasonTip}} 매일 변하는 날씨에 맞춰 옷차림을 조절하는 것이 {{season}}을 건강하게 보내는 비결입니다.', weight: 8 },
  { id: 304, category: 'trend_conclusion', condition: 'any', minTemp: null, maxTemp: null, template: '날씨 앱을 통해 실시간 기상 정보를 확인하고, 기온 변화에 유연하게 대응하는 습관을 길러보세요. 오늘도 좋은 하루 되세요!', weight: 7 },
  { id: 305, category: 'trend_conclusion', condition: 'any', minTemp: 25, maxTemp: null, template: '무더운 {{season}}철에도 스타일을 포기할 필요 없습니다. 시원한 소재와 밝은 컬러로 더위를 이기는 패션을 완성해 보세요. {{city}}의 여름을 즐겁게 보내시길 바랍니다.', weight: 8 },
  { id: 306, category: 'trend_conclusion', condition: 'any', minTemp: null, maxTemp: 5,  template: '추운 {{season}}에도 멋을 잃지 않으려면 보온성과 디자인을 겸비한 아이템을 선택하세요. {{city}}의 겨울을 따뜻하고 멋지게 보내시길 응원합니다.', weight: 8 },
  { id: 307, category: 'trend_conclusion', condition: 'rainy', minTemp: null, maxTemp: null, template: '비 오는 날에도 세련된 레인웨어와 방수 아이템으로 패션을 포기하지 마세요. {{city}}의 비 오는 거리를 멋지게 걸어보세요.', weight: 8 },
  { id: 308, category: 'trend_conclusion', condition: 'snowy', minTemp: null, maxTemp: null, template: '눈 내리는 {{city}}의 풍경을 즐기면서, 따뜻한 방한 코디로 겨울의 낭만을 만끽하세요. 안전한 외출 되시길 바랍니다.', weight: 8 },
];

// ---------------------------------------------------------------------------
// Main Export — generateSEOArticle
// ---------------------------------------------------------------------------

/**
 * Generates a complete SEO-optimized Korean article about weather-appropriate
 * fashion and health tips.
 *
 * The output is **deterministic**: the same (cityName + dateStr) combination
 * always produces the same article. Different inputs produce different articles.
 *
 * @param params.weather    Processed weather data (from `processWeatherData`)
 * @param params.cityName   Korean city name (e.g. '서울')
 * @param params.dateStr    Date in 'YYYY-MM-DD' format
 * @param params.templates  Array of TemplateData; pass `DEFAULT_TEMPLATES` if
 *                          you don't have custom templates
 *
 * @returns `{ article, seoTitle, seoDescription }`
 *          — `article` is ≥ 1,200 characters of flowing Korean text with
 *            markdown section headers.
 *          — `seoTitle` is an SEO-optimized page title.
 *          — `seoDescription` is a ≤ 160-char meta description.
 */
export async function generateSEOArticle(params: {
  weather: ProcessedWeather;
  dailyForecast?: DailyForecast;
  cityName: string;
  dateStr: string;
  templates: TemplateData[];
}): Promise<{ article: string; seoTitle: string; seoDescription: string }> {
  const composer = new ArticleComposer(params);
  return composer.compose();
}
