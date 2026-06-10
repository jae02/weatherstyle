import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  CITY_GRID,
  processWeatherData,
  parseKMAResponse,
  getBaseDateTime,
  getConditionCode,
  getForecastBaseTime,
  buildDailyForecast,
} from "@/utils/weather";
import type { WeatherData, DailyForecast } from "@/utils/weather";
import { generateSEOArticle } from "@/utils/seoTextEngine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location");
  const date = searchParams.get("date");

  if (!location || !date) {
    return NextResponse.json(
      { error: "location and date parameters are required" },
      { status: 400 }
    );
  }

  const cityInfo = CITY_GRID[location];
  if (!cityInfo) {
    return NextResponse.json(
      { error: `Unknown location: ${location}. Valid: ${Object.keys(CITY_GRID).join(", ")}` },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Date must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  try {
    // 1. Check cache
    const existing = await prisma.dailyReport.findUnique({
      where: { location_date: { location, date } },
      include: {
        outfits: {
          include: { outfit: true },
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        cached: true,
        report: existing,
      });
    }

    // 2. Fetch weather from 기상청 API
    const apiKey = process.env.KMA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "KMA_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { baseDate, baseTime } = getBaseDateTime();
    const { baseDate: forecastDate, baseTime: forecastTime } = getForecastBaseTime();

    const ultraSrtUrl = new URL(
      "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"
    );
    ultraSrtUrl.searchParams.set("serviceKey", apiKey);
    ultraSrtUrl.searchParams.set("pageNo", "1");
    ultraSrtUrl.searchParams.set("numOfRows", "10");
    ultraSrtUrl.searchParams.set("dataType", "JSON");
    ultraSrtUrl.searchParams.set("base_date", baseDate);
    ultraSrtUrl.searchParams.set("base_time", baseTime);
    ultraSrtUrl.searchParams.set("nx", String(cityInfo.nx));
    ultraSrtUrl.searchParams.set("ny", String(cityInfo.ny));

    const vilageFcstUrl = new URL(
      "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
    );
    vilageFcstUrl.searchParams.set("serviceKey", apiKey);
    vilageFcstUrl.searchParams.set("pageNo", "1");
    vilageFcstUrl.searchParams.set("numOfRows", "1000");
    vilageFcstUrl.searchParams.set("dataType", "JSON");
    vilageFcstUrl.searchParams.set("base_date", forecastDate);
    vilageFcstUrl.searchParams.set("base_time", forecastTime);
    vilageFcstUrl.searchParams.set("nx", String(cityInfo.nx));
    vilageFcstUrl.searchParams.set("ny", String(cityInfo.ny));

    let weatherData: WeatherData;
    let dailyForecast: DailyForecast | null = null;

    try {
      const [wRes, fRes] = await Promise.all([
        fetch(ultraSrtUrl.toString(), { cache: "no-store" }),
        fetch(vilageFcstUrl.toString(), { cache: "no-store" }),
      ]);
      
      const wData = await wRes.json();
      if (
        wData?.response?.body?.items?.item &&
        wData.response.header.resultCode === "00"
      ) {
        weatherData = parseKMAResponse(wData.response.body.items.item);
      } else {
        throw new Error("Invalid UltraSrtNcst data");
      }

      if (fRes.ok) {
        const fData = await fRes.json();
        if (
          fData?.response?.body?.items?.item &&
          fData.response.header.resultCode === "00"
        ) {
          const targetDateFormatted = date.replace(/-/g, "");
          dailyForecast = buildDailyForecast(fData.response.body.items.item, targetDateFormatted);
        }
      }
    } catch {
      console.warn("KMA API fetch failed, using fallback");
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

    // 3. Process weather data
    const processed = processWeatherData(weatherData);

    // 4. Generate SEO article
    const templates = await prisma.weatherTemplate.findMany();
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

    // 5. Find matching outfits
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

    // Select best items (max 2 per category)
    const categoryMap = new Map<string, typeof matchingOutfits>();
    for (const outfit of matchingOutfits) {
      const list = categoryMap.get(outfit.category) || [];
      if (list.length < 2) {
        list.push(outfit);
        categoryMap.set(outfit.category, list);
      }
    }
    const selectedOutfits = Array.from(categoryMap.values()).flat();

    // 6. Transaction: save report + outfit mappings (upsert to avoid race conditions)
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
        update: {},
      });

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

    return NextResponse.json({
      cached: false,
      report,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate weather report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
