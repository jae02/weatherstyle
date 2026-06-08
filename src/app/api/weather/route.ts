import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  CITY_GRID,
  processWeatherData,
  parseKMAResponse,
  getBaseDateTime,
  getConditionCode,
} from "@/utils/weather";
import type { WeatherData } from "@/utils/weather";
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

    const url = new URL(
      "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"
    );
    url.searchParams.set("serviceKey", apiKey);
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("numOfRows", "10");
    url.searchParams.set("dataType", "JSON");
    url.searchParams.set("base_date", baseDate);
    url.searchParams.set("base_time", baseTime);
    url.searchParams.set("nx", String(cityInfo.nx));
    url.searchParams.set("ny", String(cityInfo.ny));

    let weatherData: WeatherData;

    try {
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();

      if (
        data?.response?.body?.items?.item &&
        data.response.header.resultCode === "00"
      ) {
        weatherData = parseKMAResponse(data.response.body.items.item);
      } else {
        console.warn("KMA API returned invalid data, using fallback");
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

    // 6. Transaction: save report + outfit mappings
    const report = await prisma.$transaction(async (tx) => {
      const newReport = await tx.dailyReport.create({
        data: {
          location,
          locationName: cityInfo.name,
          date,
          temperature: processed.temperature,
          apparentTemp: processed.apparentTemp,
          humidity: processed.humidity,
          windSpeed: processed.windSpeed,
          precipitation: processed.precipitation,
          precipType: processed.precipType,
          skyCondition: processed.skyCondition,
          weatherDataJson: JSON.stringify(processed),
          generatedArticle: article,
          seoTitle,
          seoDescription,
        },
      });

      for (const outfit of selectedOutfits) {
        await tx.reportOutfit.create({
          data: {
            reportId: newReport.id,
            outfitId: outfit.id,
          },
        });
      }

      return tx.dailyReport.findUnique({
        where: { id: newReport.id },
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
