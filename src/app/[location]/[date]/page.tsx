import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { CITY_GRID, processWeatherData, parseKMAResponse, getBaseDateTime, getSeason, getConditionCode, getWindDirectionLabel, getForecastBaseTime, buildDailyForecast } from "@/utils/weather";
import type { WeatherData, DailyForecast } from "@/utils/weather";
import { generateSEOArticle } from "@/utils/seoTextEngine";

// Force dynamic rendering for fresh weather data
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    location: string;
    date: string;
  }>;
}

// ============================================
// Fetch weather data from 기상청 API
// ============================================
async function fetchWeatherFromKMA(
  nx: number,
  ny: number
): Promise<WeatherData> {
  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey) throw new Error("KMA_API_KEY is not set");

  const { baseDate, baseTime } = getBaseDateTime();

  const url = new URL(
    "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"
  );
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "10");
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", baseDate);
  url.searchParams.set("base_time", baseTime);
  url.searchParams.set("nx", String(nx));
  url.searchParams.set("ny", String(ny));

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`KMA API returned ${res.status}`);
  }

  const data = await res.json();

  if (
    !data?.response?.body?.items?.item ||
    data.response.header.resultCode !== "00"
  ) {
    // Fallback: return default weather data when API fails
    console.warn("KMA API returned no data, using fallback values");
    return {
      temperature: 22,
      humidity: 55,
      windSpeed: 2.5,
      precipitation: 0,
      precipType: 0,
      skyCondition: 1,
      windDirection: 270,
    };
  }

  return parseKMAResponse(data.response.body.items.item);
}

async function fetchDailyForecastFromKMA(
  nx: number,
  ny: number,
  targetDate: string
): Promise<DailyForecast | null> {
  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey) throw new Error("KMA_API_KEY is not set");

  const { baseDate, baseTime } = getForecastBaseTime();

  const url = new URL(
    "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
  );
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "1000"); // Ensure we get the full day's data
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", baseDate);
  url.searchParams.set("base_time", baseTime);
  url.searchParams.set("nx", String(nx));
  url.searchParams.set("ny", String(ny));

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (
      !data?.response?.body?.items?.item ||
      data.response.header.resultCode !== "00"
    ) {
      return null;
    }
    const targetDateFormatted = targetDate.replace(/-/g, ""); // "YYYY-MM-DD" -> "YYYYMMDD"
    return buildDailyForecast(data.response.body.items.item, targetDateFormatted);
  } catch (error) {
    console.error("Forecast API error:", error);
    return null;
  }
}

// ============================================
// Get or create daily report
// ============================================
async function getOrCreateReport(location: string, date: string) {
  const cityInfo = CITY_GRID[location];
  if (!cityInfo) return null;

  // Check for existing report
  const existing = await prisma.dailyReport.findUnique({
    where: { location_date: { location, date } },
    include: {
      outfits: {
        include: { outfit: true },
      },
    },
  });

  if (existing) return existing;

  // Fetch fresh weather data concurrently
  let weatherData: WeatherData;
  let dailyForecast: DailyForecast | null = null;
  try {
    const [wData, fData] = await Promise.all([
      fetchWeatherFromKMA(cityInfo.nx, cityInfo.ny),
      fetchDailyForecastFromKMA(cityInfo.nx, cityInfo.ny, date),
    ]);
    weatherData = wData;
    dailyForecast = fData;
  } catch (err) {
    console.error("Weather API error:", err);
    weatherData = {
      temperature: 22,
      humidity: 55,
      windSpeed: 2.5,
      precipitation: 0,
      precipType: 0,
      skyCondition: 1,
      windDirection: 270,
    };
  }

  const processed = processWeatherData(weatherData);

  // Fetch templates from DB
  const templates = await prisma.weatherTemplate.findMany();

  // Generate article
  const { article, seoTitle, seoDescription } = await generateSEOArticle({
    weather: processed,
    dailyForecast: dailyForecast || undefined,
    cityName: cityInfo.name,
    dateStr: date,
    templates: templates.map((t) => ({
      id: t.id,
      category: t.category,
      condition: t.condition,
      minTemp: t.minTemp,
      maxTemp: t.maxTemp,
      template: t.template,
      weight: t.weight,
    })),
  });

  // Find matching outfit recommendations
  const condCode = getConditionCode(processed.skyCondition, processed.precipType);
  const matchingOutfits = await prisma.outfitRecommendation.findMany({
    where: {
      OR: [
        {
          AND: [
            { tempMin: { lte: processed.apparentTemp } },
            { tempMax: { gte: processed.apparentTemp } },
          ],
        },
        { tempMin: null, tempMax: null },
      ],
      condition: { in: [condCode, "all"] },
    },
    orderBy: [{ category: "asc" }, { layerOrder: "asc" }],
  });

  // Select best items per category (limit 1-2 per category)
  const categoryMap = new Map<string, typeof matchingOutfits>();
  for (const outfit of matchingOutfits) {
    const list = categoryMap.get(outfit.category) || [];
    if (list.length < 2) {
      list.push(outfit);
      categoryMap.set(outfit.category, list);
    }
  }
  const selectedOutfits = Array.from(categoryMap.values()).flat();

  // Save to DB — use upsert to handle race conditions
  // (generateMetadata and page component call this concurrently)
  const reportData = {
    location,
    locationName: cityInfo.name,
    date,
    temperature: processed.temperature,
    apparentTemp: processed.apparentTemp,
    minTemp: dailyForecast?.minTemp ?? null,
    maxTemp: dailyForecast?.maxTemp ?? null,
    humidity: processed.humidity,
    windSpeed: processed.windSpeed,
    precipitation: processed.precipitation,
    maxPrecipProb: dailyForecast?.maxPrecipProb ?? null,
    precipType: processed.precipType,
    skyCondition: processed.skyCondition,
    weatherDataJson: JSON.stringify(processed),
    hourlyForecastJson: dailyForecast ? JSON.stringify(dailyForecast.hourly) : null,
    generatedArticle: article,
    seoTitle,
    seoDescription,
  };

  const report = await prisma.$transaction(async (tx) => {
    const upserted = await tx.dailyReport.upsert({
      where: { location_date: { location, date } },
      create: reportData,
      update: {}, // Already exists — keep existing data
    });

    // Sync outfit mappings (only if none exist yet)
    const existingMappings = await tx.reportOutfit.count({
      where: { reportId: upserted.id },
    });

    if (existingMappings === 0) {
      for (const outfit of selectedOutfits) {
        await tx.reportOutfit.create({
          data: {
            reportId: upserted.id,
            outfitId: outfit.id,
          },
        });
      }
    }

    return tx.dailyReport.findUnique({
      where: { id: upserted.id },
      include: {
        outfits: {
          include: { outfit: true },
        },
      },
    });
  });

  return report;
}

// ============================================
// Dynamic Metadata
// ============================================
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { location, date } = await params;
  const cityInfo = CITY_GRID[location];
  if (!cityInfo) return { title: "페이지를 찾을 수 없습니다" };

  const report = await getOrCreateReport(location, date);
  const title = report?.seoTitle || `${cityInfo.name} ${date} 날씨 & 복장 추천`;
  const description =
    report?.seoDescription ||
    `${cityInfo.name}의 ${date} 날씨 정보와 맞춤 복장 추천, 건강 가이드를 확인하세요.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      locale: "ko_KR",
      url: `${siteUrl}/${location}/${date}`,
      siteName: "TOWE",
      publishedTime: `${date}T00:00:00+09:00`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}/${location}/${date}`,
    },
  };
}

// ============================================
// Helper: Weather condition icon & color
// ============================================
function getConditionEmoji(precipType: number, skyCondition: number): string {
  if (precipType === 1 || precipType === 5 || precipType === 6) return "🌧️";
  if (precipType === 2) return "🌨️";
  if (precipType === 3 || precipType === 7) return "❄️";
  if (precipType === 4) return "⛈️";
  if (skyCondition === 1) return "☀️";
  if (skyCondition === 3) return "⛅";
  return "☁️";
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    top: "상의",
    bottom: "하의",
    outer: "외투",
    shoes: "신발",
    accessory: "액세서리",
  };
  return labels[category] || category;
}

function getLayerLabel(order: number): string {
  const labels: Record<number, string> = {
    0: "기본",
    1: "이너",
    2: "미들",
    3: "아우터",
  };
  return labels[order] || `레이어 ${order}`;
}

// ============================================
// Article text to HTML converter
// ============================================
function articleToHtml(article: string): string {
  return article
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("## "))
        return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("### "))
        return `<h3>${trimmed.slice(4)}</h3>`;
      return `<p>${trimmed}</p>`;
    })
    .join("\n");
}

// ============================================
// Page Component (Server Component)
// ============================================
export default async function WeatherReportPage({ params }: PageProps) {
  const { location, date } = await params;

  // Validate location
  const cityInfo = CITY_GRID[location];
  if (!cityInfo) notFound();

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  // Get or create the report
  const report = await getOrCreateReport(location, date);
  if (!report) notFound();

  const weatherData = JSON.parse(report.weatherDataJson);
  const conditionEmoji = getConditionEmoji(report.precipType, report.skyCondition);
  const conditionLabel = weatherData.conditionLabel || "맑음";
  const conditionDesc = weatherData.conditionDesc || "맑은 하늘이 펼쳐져 있습니다.";
  const season = getSeason(date);
  const windDir = getWindDirectionLabel(weatherData.windDirection || 0);

  // Format date for display
  const [year, month, day] = date.split("-");
  const displayDate = `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;

  // Schema.org structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: report.seoTitle,
    description: report.seoDescription,
    datePublished: `${date}T00:00:00+09:00`,
    dateModified: report.updatedAt.toISOString(),
    author: { "@type": "Organization", name: "TOWE" },
    publisher: {
      "@type": "Organization",
      name: "TOWE",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${process.env.NEXT_PUBLIC_SITE_URL || ""}/${location}/${date}`,
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container">
        {/* Page Header */}
        <header className="page-header" id="page-header">
          <div className="page-header__badge">
            <span>{conditionEmoji}</span>
            {displayDate} · {cityInfo.name} 날씨 리포트
          </div>
          <h1 className="page-header__title">
            {cityInfo.name}{" "}
            <span className="page-header__title-gradient">{conditionLabel}</span>
          </h1>
          <p className="page-header__subtitle">
            체감 온도 {report.apparentTemp.toFixed(1)}°C · {conditionDesc}
          </p>
        </header>

        {/* Weather Dashboard */}
        <section id="weather-dashboard" aria-label="기상 데이터 대시보드">
          <div className="dashboard">
            <div className="dashboard__card dashboard__card--temp" id="card-temp">
              <span className="dashboard__card-icon">🌡️</span>
              <div className="dashboard__card-label">현재 기온</div>
              <div className="dashboard__card-value dashboard__card-value--temp">
                {report.temperature.toFixed(1)}
                <span className="dashboard__card-unit">°C</span>
              </div>
              <div className="dashboard__card-desc">
                최저 {report.minTemp ?? '-'}°C / 최고 {report.maxTemp ?? '-'}°C
              </div>
            </div>

            <div className="dashboard__card dashboard__card--apparent" id="card-apparent">
              <span className="dashboard__card-icon">🤔</span>
              <div className="dashboard__card-label">체감 온도</div>
              <div className="dashboard__card-value dashboard__card-value--apparent">
                {report.apparentTemp.toFixed(1)}
                <span className="dashboard__card-unit">°C</span>
              </div>
              <div className="dashboard__card-desc">
                {report.apparentTemp < report.temperature
                  ? "바람으로 인해 더 춥게 느껴집니다"
                  : report.apparentTemp > report.temperature
                  ? "습도로 인해 더 덥게 느껴집니다"
                  : "기온과 비슷하게 느껴집니다"}
              </div>
            </div>

            <div className="dashboard__card dashboard__card--humidity" id="card-humidity">
              <span className="dashboard__card-icon">💧</span>
              <div className="dashboard__card-label">상대 습도</div>
              <div className="dashboard__card-value dashboard__card-value--humidity">
                {report.humidity.toFixed(0)}
                <span className="dashboard__card-unit">%</span>
              </div>
              <div className="dashboard__card-desc">
                {report.humidity > 70
                  ? "습도가 높아 불쾌감 주의"
                  : report.humidity < 30
                  ? "건조합니다. 보습 관리 필요"
                  : "쾌적한 습도입니다"}
              </div>
            </div>

            <div className="dashboard__card dashboard__card--wind" id="card-wind">
              <span className="dashboard__card-icon">💨</span>
              <div className="dashboard__card-label">풍속</div>
              <div className="dashboard__card-value dashboard__card-value--wind">
                {report.windSpeed.toFixed(1)}
                <span className="dashboard__card-unit">m/s</span>
              </div>
              <div className="dashboard__card-desc">{windDir} 방향</div>
            </div>

            <div className="dashboard__card dashboard__card--rain" id="card-rain">
              <span className="dashboard__card-icon">☔</span>
              <div className="dashboard__card-label">강수량</div>
              <div className="dashboard__card-value dashboard__card-value--rain">
                {report.precipitation.toFixed(1)}
                <span className="dashboard__card-unit">mm</span>
              </div>
              <div className="dashboard__card-desc">
                {report.precipitation > 0 || (report.maxPrecipProb ?? 0) > 0
                  ? `최대 강수확률 ${report.maxPrecipProb}%`
                  : "강수 없음"}
              </div>
            </div>
          </div>
        </section>

        {/* Hourly Forecast Timeline */}
        {report.hourlyForecastJson && (
          <section className="timeline-section" id="timeline-section" aria-label="시간대별 날씨 타임라인">
            <h2 className="section-header__title" style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.25rem' }}>
              🕒 시간대별 예보
            </h2>
            <div className="timeline-container">
              {JSON.parse(report.hourlyForecastJson).map((hourly: any, index: number) => {
                const hour = hourly.time.substring(0, 2);
                const emoji = getConditionEmoji(hourly.precipType, hourly.skyCondition);
                const isRaining = hourly.precipType > 0 || hourly.precipProb >= 50;
                return (
                  <div key={index} className={`timeline-item ${isRaining ? 'timeline-item--rain' : ''}`}>
                    <div className="timeline-item__time">{hour}시</div>
                    <div className="timeline-item__icon">{emoji}</div>
                    <div className="timeline-item__temp">{hourly.temperature}°C</div>
                    <div className="timeline-item__prob">
                      {hourly.precipProb > 0 ? `💧 ${hourly.precipProb}%` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Weather Condition Banner */}
        <div className="condition-banner" id="condition-banner">
          <span className="condition-banner__icon">{conditionEmoji}</span>
          <div className="condition-banner__content">
            <div className="condition-banner__label">
              오늘의 날씨: {conditionLabel}
            </div>
            <div className="condition-banner__desc">
              {conditionDesc} 기온 {report.temperature.toFixed(1)}°C (최저 {report.minTemp ?? '-'}° / 최고 {report.maxTemp ?? '-'}°), 체감 온도{" "}
              {report.apparentTemp.toFixed(1)}°C, 습도 {report.humidity.toFixed(0)}
              %, 풍속 {report.windSpeed.toFixed(1)}m/s
            </div>
          </div>
        </div>

        {/* Umbrella Warning Banner */}
        {(report.maxPrecipProb ?? 0) >= 40 && (
          <div className="condition-banner" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', marginTop: '1rem' }}>
            <span className="condition-banner__icon">☂️</span>
            <div className="condition-banner__content">
              <div className="condition-banner__label" style={{ color: 'var(--accent-blue)' }}>우산 준비 안내</div>
              <div className="condition-banner__desc">
                오늘 최대 강수확률이 {report.maxPrecipProb}%입니다. 외출 시 우산을 꼭 챙기시기 바랍니다.
              </div>
            </div>
          </div>
        )}

        {/* Outfit Recommendations */}
        <section className="outfit-section" id="outfit-section" aria-label="복장 추천">
          <div className="section-header">
            <div className="section-header__label">
              <span>👔</span> 오늘의 추천 복장
            </div>
            <h2 className="section-header__title">
              체감 온도 {report.apparentTemp.toFixed(1)}°C에 맞는 스타일링
            </h2>
          </div>

          <div className="outfit-grid" id="outfit-grid">
            {report.outfits
              .sort((a, b) => {
                const catOrder = ["outer", "top", "bottom", "shoes", "accessory"];
                return (
                  catOrder.indexOf(a.outfit.category) -
                  catOrder.indexOf(b.outfit.category)
                );
              })
              .map((ro) => (
                <div
                  className="outfit-card"
                  key={ro.id}
                  id={`outfit-card-${ro.outfit.id}`}
                >
                  <div className="outfit-card__header">
                    <div className="outfit-card__emoji">
                      {ro.outfit.iconEmoji}
                    </div>
                    <div>
                      <div className="outfit-card__category">
                        {getCategoryLabel(ro.outfit.category)}
                      </div>
                      <div className="outfit-card__name">
                        {ro.outfit.itemName}
                      </div>
                    </div>
                  </div>
                  <p className="outfit-card__description">
                    {ro.outfit.description}
                  </p>
                  <div className="outfit-card__layer-badge">
                    📐 {getLayerLabel(ro.outfit.layerOrder)} 레이어
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* SEO Article */}
        <section className="article-section" id="article-section" aria-label="패션 칼럼">
          <div className="section-header">
            <div className="section-header__label">
              <span>📝</span> 오늘의 패션 칼럼
            </div>
            <h2 className="section-header__title">
              {cityInfo.name} {displayDate} 스타일 가이드
            </h2>
          </div>

          <article className="article" id="seo-article">
            <h2 className="article__title">{report.seoTitle}</h2>
            <div
              className="article__body"
              dangerouslySetInnerHTML={{
                __html: articleToHtml(report.generatedArticle),
              }}
            />
            <div className="article__meta">
              <span className="article__meta-item">
                📅 {displayDate}
              </span>
              <span className="article__meta-item">
                📍 {cityInfo.name}
              </span>
              <span className="article__meta-item">
                🌡️ {report.temperature.toFixed(1)}°C
              </span>
              <span className="article__meta-item">
                📊 {report.generatedArticle.length.toLocaleString()}자
              </span>
            </div>
          </article>
        </section>

        {/* AdSense Placeholder */}
        <div className="ad-slot" id="adsense-slot">
          <p>광고 영역 - Google AdSense</p>
          {/* 
            실제 배포 시 아래 코드로 교체:
            <ins className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot="XXXXXXXXXX"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          */}
        </div>
      </div>
    </>
  );
}
