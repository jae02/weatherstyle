import Link from "next/link";

const cities = [
  { slug: "seoul", name: "서울", icon: "🏙️", eng: "Seoul" },
  { slug: "busan", name: "부산", icon: "🌊", eng: "Busan" },
  { slug: "daegu", name: "대구", icon: "🌄", eng: "Daegu" },
  { slug: "incheon", name: "인천", icon: "✈️", eng: "Incheon" },
  { slug: "gwangju", name: "광주", icon: "🎨", eng: "Gwangju" },
  { slug: "daejeon", name: "대전", icon: "🔬", eng: "Daejeon" },
  { slug: "ulsan", name: "울산", icon: "⚙️", eng: "Ulsan" },
  { slug: "jeju", name: "제주", icon: "🏝️", eng: "Jeju" },
];

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function HomePage() {
  const today = getTodayString();

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="page-header__badge">
          <span>☀️</span>
          AI 기반 스마트 스타일 가이드
        </div>
        <h1 className="hero__title">
          오늘 뭐 입지?
          <br />
          <span className="text-gradient">날씨가 알려줍니다</span>
        </h1>
        <p className="hero__desc">
          실시간 기상청 데이터와 체감 온도 알고리즘을 결합하여, 매일 새로운
          맞춤형 복장 추천과 건강 가이드를 제공합니다. 도시를 선택하고 오늘의
          스타일을 확인하세요.
        </p>
      </section>

      {/* City Selection Grid */}
      <section id="city-selection">
        <div className="section-header">
          <div className="section-header__label">
            <span>📍</span> 도시 선택
          </div>
          <h2 className="section-header__title">
            오늘의 날씨를 확인할 도시를 선택하세요
          </h2>
        </div>

        <div className="city-grid" id="city-grid">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/${city.slug}/${today}`}
              className="city-card"
              id={`city-card-${city.slug}`}
            >
              <span className="city-card__icon animate-float">
                {city.icon}
              </span>
              <span className="city-card__name">{city.name}</span>
              <span className="city-card__eng">{city.eng}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "4rem 0 2rem", textAlign: "center" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          <div className="outfit-card">
            <div className="outfit-card__header">
              <div className="outfit-card__emoji">🌡️</div>
              <div>
                <div className="outfit-card__category">Algorithm</div>
                <div className="outfit-card__name">체감 온도 분석</div>
              </div>
            </div>
            <p className="outfit-card__description">
              기온, 습도, 풍속을 복합 연산한 열지수(Heat Index)와 체감
              온도(Wind Chill) 알고리즘으로 실제 느끼는 온도를 정밀 산출합니다.
            </p>
          </div>

          <div className="outfit-card">
            <div className="outfit-card__header">
              <div className="outfit-card__emoji">👔</div>
              <div>
                <div className="outfit-card__category">Style</div>
                <div className="outfit-card__name">맞춤 복장 추천</div>
              </div>
            </div>
            <p className="outfit-card__description">
              체감 온도와 날씨 조건에 따라 상의, 하의, 외투, 신발, 액세서리까지
              레이어드 스타일링을 완벽하게 제안합니다.
            </p>
          </div>

          <div className="outfit-card">
            <div className="outfit-card__header">
              <div className="outfit-card__emoji">📝</div>
              <div>
                <div className="outfit-card__category">Content</div>
                <div className="outfit-card__name">일일 패션 칼럼</div>
              </div>
            </div>
            <p className="outfit-card__description">
              매일 완전히 새로운 1,200자 이상의 패션 칼럼과 건강 가이드를
              자동 생성합니다. 똑같은 글은 절대 없습니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
