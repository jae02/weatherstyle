import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "TOWE - 오늘의 날씨 & 스타일 가이드",
    template: "%s | TOWE",
  },
  description:
    "실시간 기상 데이터 기반 맞춤 복장 추천과 건강 가이드. 매일 새로운 패션 칼럼으로 당신의 스타일을 완성하세요.",
  keywords: [
    "날씨 복장 추천",
    "오늘 뭐 입지",
    "체감 온도",
    "패션 가이드",
    "날씨별 옷차림",
    "계절 패션",
    "스타일 추천",
  ],
  authors: [{ name: "TOWE" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "TOWE - 오늘의 날씨 & 스타일 가이드",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const cities = [
  { slug: "seoul", name: "서울" },
  { slug: "busan", name: "부산" },
  { slug: "daegu", name: "대구" },
  { slug: "incheon", name: "인천" },
  { slug: "gwangju", name: "광주" },
  { slug: "daejeon", name: "대전" },
  { slug: "ulsan", name: "울산" },
  { slug: "jeju", name: "제주" },
];

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const today = getTodayString();

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* Navigation */}
        <nav className="nav" id="main-nav">
          <div className="nav__inner">
            <Link href="/" className="nav__logo" id="nav-logo">
              <span className="nav__logo-icon">⛅</span>
              TOWE
            </Link>
            <div className="nav__cities" id="nav-cities">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/${city.slug}/${today}`}
                  className="nav__city-link"
                  id={`nav-city-${city.slug}`}
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="footer" id="footer">
          <div className="container">
            <div className="footer__links">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/${city.slug}/${today}`}
                  id={`footer-link-${city.slug}`}
                >
                  {city.name} 날씨
                </Link>
              ))}
            </div>
            <p>
              © {new Date().getFullYear()} TOWE. 기상청 데이터 기반 자동 생성
              콘텐츠입니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
