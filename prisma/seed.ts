import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WeatherTemplateSeed {
  category: string;
  condition: string;
  minTemp: number | null;
  maxTemp: number | null;
  template: string;
  weight: number;
}

interface OutfitSeed {
  category: string;
  itemName: string;
  description: string;
  tempMin: number | null;
  tempMax: number | null;
  condition: string;
  layerOrder: number;
  iconEmoji: string;
}

// ============================================================
// WeatherTemplate Seeds — 200+ Korean sentence templates
// ============================================================

const weatherTemplates: WeatherTemplateSeed[] = [
  // ──────────────────────────────────────────────────────────
  // CATEGORY: intro (서론 - 날씨 분석)  — 55 templates
  // ──────────────────────────────────────────────────────────

  // intro / clear — various temp ranges
  { category: 'intro', condition: 'clear', minTemp: null, maxTemp: 5, template: '{{city}}의 오늘 날씨는 맑지만 매서운 추위가 기다리고 있습니다. {{date}} 기준 기온 {{temp}}°C, 체감 온도 {{apparentTemp}}°C로, 한겨울의 칼바람을 대비해야 하는 하루입니다.', weight: 2 },
  { category: 'intro', condition: 'clear', minTemp: null, maxTemp: 5, template: '{{date}}, {{city}}의 하늘은 청명하지만 바깥 공기는 차갑습니다. 현재 기온 {{temp}}°C, 체감 {{apparentTemp}}°C를 기록하며, 일교차에 대한 철저한 준비가 필요합니다.', weight: 1 },
  { category: 'intro', condition: 'clear', minTemp: null, maxTemp: 5, template: '맑은 겨울 하늘이 펼쳐진 {{city}}, 오늘의 기온은 {{temp}}°C입니다. 체감 온도 {{apparentTemp}}°C의 쌀쌀한 공기가 감싸고 있으니, 따뜻한 옷차림을 권장합니다.', weight: 1 },
  { category: 'intro', condition: 'clear', minTemp: 5, maxTemp: 15, template: '{{city}}의 오늘 날씨, {{date}} 기준으로 현재 기온은 {{temp}}°C를 기록하고 있습니다. 체감 온도는 {{apparentTemp}}°C로, {{conditionDesc}}한 하루가 예상됩니다.', weight: 3 },
  { category: 'intro', condition: 'clear', minTemp: 5, maxTemp: 15, template: '선선한 바람이 부는 {{city}}, {{date}} 오늘의 기온은 {{temp}}°C입니다. 습도 {{humidity}}%와 풍속 {{windSpeed}}m/s를 감안하면, 가볍게 걸칠 아우터가 필요한 날씨입니다.', weight: 2 },
  { category: 'intro', condition: 'clear', minTemp: 5, maxTemp: 15, template: '{{date}} {{city}}의 하늘은 맑음, 기온은 {{temp}}°C입니다. 체감 온도 {{apparentTemp}}°C에 습도 {{humidity}}%로, 활동하기 좋은 쾌적한 날씨가 이어지고 있습니다.', weight: 1 },
  { category: 'intro', condition: 'clear', minTemp: 15, maxTemp: 25, template: '화창한 하늘이 펼쳐진 {{city}}, 오늘의 기온은 {{temp}}°C입니다. 습도 {{humidity}}%의 {{conditionDesc}}한 날씨 속에서 어떤 스타일이 어울릴까요?', weight: 3 },
  { category: 'intro', condition: 'clear', minTemp: 15, maxTemp: 25, template: '{{city}}의 {{date}}, 기분 좋은 맑은 하늘이 펼쳐졌습니다. 기온 {{temp}}°C에 체감 {{apparentTemp}}°C, 야외 활동을 즐기기에 더없이 좋은 날씨입니다.', weight: 2 },
  { category: 'intro', condition: 'clear', minTemp: 15, maxTemp: 25, template: '완연한 봄 날씨의 {{city}}, {{date}} 오늘 기온은 {{temp}}°C를 기록 중입니다. 맑고 포근한 공기 속에서 나들이 계획을 세워보는 건 어떨까요?', weight: 1 },
  { category: 'intro', condition: 'clear', minTemp: 25, maxTemp: 35, template: '{{city}}에 한여름 더위가 찾아왔습니다. {{date}} 기준 기온 {{temp}}°C, 체감 온도 {{apparentTemp}}°C로 무더운 하루가 예상됩니다. 습도 {{humidity}}%에 자외선도 강하니 주의가 필요합니다.', weight: 3 },
  { category: 'intro', condition: 'clear', minTemp: 25, maxTemp: 35, template: '뜨거운 태양 아래 {{city}}의 기온이 {{temp}}°C까지 올랐습니다. {{date}} 오늘, 체감 온도 {{apparentTemp}}°C의 불볕더위 속에서 시원한 옷차림이 필수입니다.', weight: 2 },
  { category: 'intro', condition: 'clear', minTemp: 25, maxTemp: null, template: '{{date}}, {{city}}의 한낮 기온이 {{temp}}°C에 달하고 있습니다. 습도 {{humidity}}%와 결합된 체감 온도 {{apparentTemp}}°C는 폭염 수준으로, 야외 활동 시 각별한 주의가 요구됩니다.', weight: 2 },
  { category: 'intro', condition: 'clear', minTemp: 25, maxTemp: null, template: '{{city}}의 오늘 날씨는 한마디로 \'무더위\'입니다. 기온 {{temp}}°C에 습도 {{humidity}}%까지 높아 불쾌지수가 매우 높습니다. 시원한 옷차림과 충분한 수분 섭취를 권합니다.', weight: 1 },

  // intro / cloudy
  { category: 'intro', condition: 'cloudy', minTemp: null, maxTemp: 5, template: '{{city}}의 하늘이 두꺼운 구름으로 뒤덮인 {{date}}, 기온은 {{temp}}°C입니다. 체감 {{apparentTemp}}°C의 스산한 날씨에 따뜻한 옷차림이 필수입니다.', weight: 2 },
  { category: 'intro', condition: 'cloudy', minTemp: null, maxTemp: 5, template: '구름 가득한 겨울 하늘 아래 {{city}}의 기온은 {{temp}}°C에 머무르고 있습니다. 체감 온도 {{apparentTemp}}°C의 추운 날씨가 계속되고 있으니 보온에 신경 써주세요.', weight: 1 },
  { category: 'intro', condition: 'cloudy', minTemp: 5, maxTemp: 15, template: '{{city}}의 {{date}}, 구름이 많은 하늘 아래 기온은 {{temp}}°C를 나타내고 있습니다. 체감 온도 {{apparentTemp}}°C로, 얇은 겉옷을 챙기시는 것이 좋겠습니다.', weight: 2 },
  { category: 'intro', condition: 'cloudy', minTemp: 5, maxTemp: 15, template: '흐린 날씨가 이어지는 {{city}}, 오늘의 기온은 {{temp}}°C입니다. 바람이 {{windSpeed}}m/s로 불어 체감 온도는 {{apparentTemp}}°C까지 내려가고 있습니다.', weight: 1 },
  { category: 'intro', condition: 'cloudy', minTemp: 15, maxTemp: 25, template: '{{city}}의 {{date}}, 구름이 하늘을 가리고 있지만 기온은 {{temp}}°C로 비교적 따뜻합니다. 습도 {{humidity}}%의 포근한 흐림 속에서 편안한 외출을 준비해 보세요.', weight: 2 },
  { category: 'intro', condition: 'cloudy', minTemp: 15, maxTemp: 25, template: '구름 사이로 간간이 햇빛이 비치는 {{city}}, 기온 {{temp}}°C에 체감 {{apparentTemp}}°C입니다. 자외선은 다소 약하지만, 갑작스러운 소나기에 대비해 우산을 챙기세요.', weight: 1 },
  { category: 'intro', condition: 'cloudy', minTemp: 25, maxTemp: null, template: '{{city}}의 하늘은 흐리지만 무더위는 변함없습니다. {{date}} 기준 기온 {{temp}}°C, 습도 {{humidity}}%로, 후텁지근한 날씨가 계속되고 있습니다.', weight: 2 },
  { category: 'intro', condition: 'cloudy', minTemp: 25, maxTemp: null, template: '구름이 짙게 낀 {{city}}, 오늘 기온은 {{temp}}°C입니다. 습도가 {{humidity}}%로 높아 체감상 더 덥게 느껴질 수 있으니, 통풍이 잘 되는 옷을 선택하세요.', weight: 1 },

  // intro / rainy
  { category: 'intro', condition: 'rainy', minTemp: null, maxTemp: 5, template: '{{city}}에 차가운 겨울비가 내리고 있습니다. {{date}} 기준 기온 {{temp}}°C, 체감 {{apparentTemp}}°C로, 방수와 보온을 동시에 챙겨야 하는 하루입니다. 강수량 {{precipitation}}mm가 예보되어 있습니다.', weight: 2 },
  { category: 'intro', condition: 'rainy', minTemp: null, maxTemp: 5, template: '{{date}}, {{city}}에 얼어붙는 듯한 비가 내리고 있습니다. 기온 {{temp}}°C에 체감 {{apparentTemp}}°C, 동파와 노면 결빙에 주의하시기 바랍니다.', weight: 1 },
  { category: 'intro', condition: 'rainy', minTemp: 5, maxTemp: 15, template: '{{city}}에 비 소식이 전해졌습니다. 현재 기온 {{temp}}°C, 체감 온도 {{apparentTemp}}°C를 보이고 있으며, 강수량 {{precipitation}}mm가 예보되어 있습니다.', weight: 3 },
  { category: 'intro', condition: 'rainy', minTemp: 5, maxTemp: 15, template: '{{date}} {{city}}에 봄비가 내립니다. 기온 {{temp}}°C에 습도 {{humidity}}%, 포근하면서도 촉촉한 빗소리가 함께하는 하루가 될 것입니다.', weight: 2 },
  { category: 'intro', condition: 'rainy', minTemp: 5, maxTemp: 15, template: '빗방울이 떨어지는 {{city}}, 오늘의 기온은 {{temp}}°C입니다. 체감 온도 {{apparentTemp}}°C에 강수량 {{precipitation}}mm로, 우산과 방수 아우터를 꼭 준비하세요.', weight: 1 },
  { category: 'intro', condition: 'rainy', minTemp: 15, maxTemp: 25, template: '{{city}}의 {{date}}, 따스한 빗줄기가 도시를 적시고 있습니다. 기온 {{temp}}°C에 습도 {{humidity}}%로, 우산 속 패션을 즐기기에 좋은 날씨입니다.', weight: 2 },
  { category: 'intro', condition: 'rainy', minTemp: 15, maxTemp: 25, template: '{{date}} {{city}}에 가랑비가 내리고 있습니다. 현재 기온 {{temp}}°C, 강수량 {{precipitation}}mm의 잔잔한 비 속에서 여유로운 하루를 계획해 보세요.', weight: 1 },
  { category: 'intro', condition: 'rainy', minTemp: 25, maxTemp: null, template: '{{city}}에 장마철 폭우가 쏟아지고 있습니다. {{date}} 기준 기온 {{temp}}°C에 습도 {{humidity}}%, 강수량 {{precipitation}}mm로, 실내 활동을 권장합니다.', weight: 2 },
  { category: 'intro', condition: 'rainy', minTemp: 25, maxTemp: null, template: '무더운 여름 비가 내리는 {{city}}, 기온 {{temp}}°C에 습도 {{humidity}}%까지 치솟았습니다. 열대야와 함께 찾아온 소나기에 대비한 옷차림이 필요합니다.', weight: 1 },

  // intro / snowy
  { category: 'intro', condition: 'snowy', minTemp: null, maxTemp: 0, template: '{{city}}에 하얀 눈이 펑펑 내리고 있습니다. {{date}} 기준 기온 {{temp}}°C, 체감 {{apparentTemp}}°C로, 빙판길 안전과 방한에 만전을 기해야 합니다.', weight: 3 },
  { category: 'intro', condition: 'snowy', minTemp: null, maxTemp: 0, template: '눈 내리는 {{city}}의 겨울 풍경이 아름답지만, 기온 {{temp}}°C에 체감 온도 {{apparentTemp}}°C의 혹한이 기다리고 있습니다. 완벽한 방한 장비를 갖추세요.', weight: 2 },
  { category: 'intro', condition: 'snowy', minTemp: null, maxTemp: 5, template: '{{date}}, {{city}}에 눈 소식이 전해졌습니다. 기온 {{temp}}°C에 체감 {{apparentTemp}}°C, 풍속 {{windSpeed}}m/s의 매서운 바람과 함께 눈이 날리고 있습니다.', weight: 2 },
  { category: 'intro', condition: 'snowy', minTemp: null, maxTemp: 5, template: '{{city}}의 하늘에서 눈꽃이 내려앉고 있습니다. 현재 기온 {{temp}}°C, 체감 온도 {{apparentTemp}}°C의 겨울 날씨 속에서 따뜻하면서도 멋스러운 방한 코디를 소개합니다.', weight: 1 },
  { category: 'intro', condition: 'snowy', minTemp: 0, maxTemp: 5, template: '포근한 눈이 {{city}}을(를) 덮고 있습니다. 기온 {{temp}}°C로 큰 추위는 아니지만, 습기를 동반한 체감 {{apparentTemp}}°C의 날씨에 발 시림 방지 대책이 필요합니다.', weight: 1 },

  // intro / all (범용)
  { category: 'intro', condition: 'all', minTemp: null, maxTemp: null, template: '{{city}}의 오늘 날씨를 분석합니다. {{date}} 기준 기온 {{temp}}°C, 체감 온도 {{apparentTemp}}°C, 습도 {{humidity}}%, 풍속 {{windSpeed}}m/s를 기록하고 있습니다.', weight: 2 },
  { category: 'intro', condition: 'all', minTemp: null, maxTemp: null, template: '{{date}}, {{city}}의 날씨 리포트를 전합니다. 현재 기온 {{temp}}°C에 체감 온도 {{apparentTemp}}°C, 습도는 {{humidity}}%입니다. 오늘의 {{conditionDesc}}한 날씨에 맞는 최적의 코디를 제안해 드리겠습니다.', weight: 3 },
  { category: 'intro', condition: 'all', minTemp: null, maxTemp: null, template: '오늘 {{city}}의 날씨 정보를 꼼꼼히 살펴보겠습니다. {{date}} 현재 기온 {{temp}}°C, 체감 {{apparentTemp}}°C이며, 습도 {{humidity}}%와 풍속 {{windSpeed}}m/s가 관측되고 있습니다.', weight: 1 },
  { category: 'intro', condition: 'all', minTemp: null, maxTemp: null, template: '{{city}} 거주자 여러분, {{date}} 오늘의 날씨 브리핑입니다. 기온 {{temp}}°C, 체감 {{apparentTemp}}°C로, 날씨에 맞는 옷차림을 함께 알아보겠습니다.', weight: 2 },
  { category: 'intro', condition: 'all', minTemp: null, maxTemp: null, template: '{{date}} {{city}}의 기상 상황을 종합하면, 기온 {{temp}}°C에 습도 {{humidity}}%, 풍속 {{windSpeed}}m/s입니다. 체감 온도 {{apparentTemp}}°C 기준으로 오늘의 복장을 추천해 드립니다.', weight: 1 },
  { category: 'intro', condition: 'all', minTemp: null, maxTemp: 10, template: '{{city}}의 {{date}}, 아침 공기가 차갑게 느껴집니다. 기온 {{temp}}°C에 체감 온도 {{apparentTemp}}°C, 겨울 채비를 단단히 하셔야 할 것 같습니다.', weight: 1 },
  { category: 'intro', condition: 'all', minTemp: 10, maxTemp: 20, template: '{{city}}의 오늘 기온은 {{temp}}°C로, 체감 온도 {{apparentTemp}}°C의 쾌적한 날씨가 예상됩니다. {{date}}, 가벼운 겉옷 하나면 충분한 하루입니다.', weight: 1 },
  { category: 'intro', condition: 'all', minTemp: 20, maxTemp: null, template: '{{city}}의 {{date}}, 기온 {{temp}}°C에 습도 {{humidity}}%로 다소 덥게 느껴지는 하루입니다. 체감 온도 {{apparentTemp}}°C 기준으로 시원한 차림을 추천합니다.', weight: 1 },
  { category: 'intro', condition: 'all', minTemp: null, maxTemp: null, template: '매일 달라지는 {{city}}의 날씨, 오늘은 어떨까요? {{date}} 기준 기온 {{temp}}°C, 체감 {{apparentTemp}}°C, 습도 {{humidity}}%를 기록 중입니다. 자세한 분석과 함께 패션 가이드를 제공해 드립니다.', weight: 2 },
  { category: 'intro', condition: 'all', minTemp: null, maxTemp: null, template: '날씨에 맞는 옷차림, 고민되시죠? {{date}} {{city}}의 기온은 {{temp}}°C, 체감 온도는 {{apparentTemp}}°C입니다. 오늘의 날씨 분석과 패션 팁을 확인해 보세요.', weight: 2 },

  // ──────────────────────────────────────────────────────────
  // CATEGORY: health_guide (본론1 - 체감 온도별 건강 가이드) — 55 templates
  // ──────────────────────────────────────────────────────────

  // health_guide / extreme cold (below -10°C)
  { category: 'health_guide', condition: 'all', minTemp: null, maxTemp: -10, template: '현재 체감 온도 {{apparentTemp}}°C로 매우 추운 날씨입니다. 동상과 저체온증에 주의하시고, 피부 노출을 최소화하는 것이 건강 관리의 핵심입니다.', weight: 3 },
  { category: 'health_guide', condition: 'all', minTemp: null, maxTemp: -10, template: '체감 온도가 {{apparentTemp}}°C까지 떨어진 혹한입니다. 외출 시 귀, 코, 손가락, 발가락 등 말단 부위의 동상 예방에 특히 신경 쓰셔야 합니다. 핫팩과 보온 장갑은 필수입니다.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: null, maxTemp: -10, template: '{{apparentTemp}}°C의 극심한 추위가 지속되고 있습니다. 장시간 외부 노출을 삼가고, 따뜻한 음료를 수시로 섭취하여 체온을 유지하는 것이 중요합니다.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: null, maxTemp: -10, template: '체감 온도 {{apparentTemp}}°C의 강추위에는 저체온증 위험이 높아집니다. 외출 전 내복을 착용하고 머리, 목, 손, 발 등 열 손실이 큰 부위를 반드시 감싸주세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: null, maxTemp: -10, template: '영하 {{apparentTemp}}°C의 혹한 속에서는 심혈관 질환의 위험도 증가합니다. 급격한 온도 변화를 피하고, 외출 전 준비 운동으로 몸을 충분히 풀어주세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: null, maxTemp: -10, template: '체감 온도 {{apparentTemp}}°C에서는 호흡기 점막이 건조해지기 쉽습니다. 마스크를 착용하여 찬 공기를 직접 들이마시지 않도록 하고, 실내 습도를 50% 이상 유지하세요.', weight: 1 },

  // health_guide / cold (-10 to 5°C)
  { category: 'health_guide', condition: 'all', minTemp: -10, maxTemp: 0, template: '체감 온도 {{apparentTemp}}°C의 추운 날씨입니다. 실내외 온도 차이로 면역력이 떨어지기 쉬우니, 비타민 C가 풍부한 과일을 충분히 섭취해 주세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: -10, maxTemp: 0, template: '{{apparentTemp}}°C의 영하 날씨에서는 혈관이 수축하여 혈압이 올라갈 수 있습니다. 고혈압 환자분들은 아침 외출 시 특히 주의하시고, 따뜻한 옷을 입고 천천히 움직여 주세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: -10, maxTemp: 0, template: '체감 온도 {{apparentTemp}}°C에서는 손발이 쉽게 시려옵니다. 방한 장갑과 기모 양말을 착용하고, 실내에서 손발을 자주 움직여 혈액 순환을 도와주세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: -10, maxTemp: 0, template: '현재 체감 온도 {{apparentTemp}}°C입니다. 건조한 겨울 공기가 피부 장벽을 손상시킬 수 있으니, 보습 크림을 수시로 바르고 입술 보호제도 챙겨주세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 0, maxTemp: 5, template: '체감 온도 {{apparentTemp}}°C의 쌀쌀한 날씨입니다. 감기와 독감이 유행하기 쉬운 시기이므로, 손 씻기와 충분한 수면으로 면역력을 지켜주세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 0, maxTemp: 5, template: '{{apparentTemp}}°C의 차가운 공기 속에서도 건강을 유지하려면 규칙적인 실내 운동이 중요합니다. 스트레칭과 가벼운 요가로 혈액 순환을 촉진하세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 0, maxTemp: 5, template: '체감 온도 {{apparentTemp}}°C인 날에는 관절 통증이 심해질 수 있습니다. 무릎과 허리를 따뜻하게 감싸고, 관절에 무리가 가지 않는 활동을 선택하세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 0, maxTemp: 5, template: '오늘 체감 온도 {{apparentTemp}}°C로 초겨울 날씨입니다. 급격한 기온 변화에 적응하기 위해 레이어드 착용으로 체온을 효과적으로 조절하시기 바랍니다.', weight: 1 },

  // health_guide / cool (5 to 15°C)
  { category: 'health_guide', condition: 'all', minTemp: 5, maxTemp: 10, template: '체감 온도 {{apparentTemp}}°C의 선선한 날씨입니다. 일교차가 크니 아침저녁으로 가디건이나 얇은 재킷을 걸치시면 체온 관리에 도움이 됩니다.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 5, maxTemp: 10, template: '{{apparentTemp}}°C의 서늘한 공기가 흐르는 날입니다. 환절기 알레르기에 주의하시고, 외출 후 손을 깨끗이 씻는 습관을 유지하세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 5, maxTemp: 10, template: '체감 온도 {{apparentTemp}}°C에서는 목 주위를 따뜻하게 해주는 것이 감기 예방의 첫걸음입니다. 가벼운 목도리나 넥워머를 활용해 보세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 10, maxTemp: 15, template: '체감 온도 {{apparentTemp}}°C의 쾌적한 날씨 속에서도 건강 관리는 계속되어야 합니다. 미세먼지 농도를 확인하시고, 필요시 마스크를 착용해 주세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 10, maxTemp: 15, template: '{{apparentTemp}}°C의 가을 날씨에는 피부 건조가 시작됩니다. 하루 2리터 이상의 수분을 섭취하고, 보습에 신경 쓰시면 건강한 피부를 유지할 수 있습니다.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 10, maxTemp: 15, template: '체감 온도 {{apparentTemp}}°C의 선선한 날씨는 야외 운동에 적합합니다. 가벼운 조깅이나 산책으로 활력을 충전하되, 준비 운동은 꼭 하세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 10, maxTemp: 15, template: '오늘 체감 온도 {{apparentTemp}}°C로 아침저녁 일교차가 큰 날씨입니다. 냉방병과 유사한 증상이 나타날 수 있으니, 실내 온도를 적절히 관리해 주세요.', weight: 1 },

  // health_guide / mild (15 to 25°C)
  { category: 'health_guide', condition: 'all', minTemp: 15, maxTemp: 20, template: '체감 온도 {{apparentTemp}}°C의 포근한 날씨입니다. 활동하기 좋은 기온이지만, 자외선 차단제를 바르는 것을 잊지 마세요. SPF 30 이상의 제품을 권장합니다.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 15, maxTemp: 20, template: '{{apparentTemp}}°C의 온화한 날씨 속에서도 꽃가루 알레르기에 주의가 필요합니다. 야외 활동 후 샤워를 하고 옷을 갈아입는 것이 좋습니다.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 15, maxTemp: 20, template: '체감 온도 {{apparentTemp}}°C인 오늘, 봄 나들이에 최적의 날씨입니다. 다만, 일교차에 대비하여 얇은 겉옷을 가방에 넣어두시면 안심입니다.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 20, maxTemp: 25, template: '체감 온도 {{apparentTemp}}°C의 따뜻한 날씨입니다. 체온 조절이 쉬운 날이지만, 습도가 {{humidity}}%로 높다면 땀 흡수가 잘 되는 소재의 옷을 선택하세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 20, maxTemp: 25, template: '{{apparentTemp}}°C의 쾌적한 기온이 이어지고 있습니다. 야외 활동 시 적절한 수분 섭취를 잊지 마시고, 모자나 양산으로 직사광선을 피해 주세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 20, maxTemp: 25, template: '체감 온도 {{apparentTemp}}°C로 활동하기 좋은 날씨입니다. 하지만 자외선 지수가 높을 수 있으니, 외출 시 선크림과 선글라스를 꼭 챙기세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 20, maxTemp: 25, template: '오늘 체감 온도 {{apparentTemp}}°C에 습도 {{humidity}}%입니다. 쾌적한 날씨이지만, 냉방 시설이 가동되는 실내에서는 얇은 가디건을 준비하시면 좋습니다.', weight: 1 },

  // health_guide / warm (25 to 30°C)
  { category: 'health_guide', condition: 'all', minTemp: 25, maxTemp: 28, template: '체감 온도 {{apparentTemp}}°C의 더운 날씨입니다. 땀을 많이 흘리게 되므로, 수분과 전해질을 수시로 보충해 주세요. 이온 음료나 과일이 도움됩니다.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 25, maxTemp: 28, template: '{{apparentTemp}}°C의 기온에서는 식중독 위험이 높아집니다. 음식 보관에 주의하시고, 야외에서 장시간 방치된 음식은 섭취를 자제해 주세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 25, maxTemp: 28, template: '체감 온도 {{apparentTemp}}°C의 여름 날씨에는 냉방병 예방이 중요합니다. 실내 냉방 온도는 26°C 전후로 설정하시고, 바깥과의 온도 차이를 5°C 이내로 유지하세요.', weight: 1 },
  { category: 'health_guide', condition: 'all', minTemp: 28, maxTemp: 30, template: '체감 온도 {{apparentTemp}}°C로 무더위가 이어지고 있습니다. 야외 활동은 오전 10시~오후 3시를 피하시고, 통풍이 잘 되는 밝은 색 옷을 입으세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 28, maxTemp: 30, template: '{{apparentTemp}}°C의 찜통더위 속에서는 열사병에 주의해야 합니다. 어지러움이나 메스꺼움이 느껴지면 즉시 서늘한 곳으로 이동하여 휴식을 취하세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 28, maxTemp: 30, template: '체감 온도 {{apparentTemp}}°C에 습도 {{humidity}}%가 겹치면 불쾌지수가 급상승합니다. 린넨이나 면 소재의 헐렁한 옷으로 체온 조절을 도와주세요.', weight: 1 },

  // health_guide / hot (above 30°C)
  { category: 'health_guide', condition: 'all', minTemp: 30, maxTemp: 35, template: '체감 온도 {{apparentTemp}}°C의 무더운 날씨에는 탈수 예방이 무엇보다 중요합니다. 외출 시 반드시 물을 충분히 섭취하시고, 직사광선을 피해 그늘에서 휴식을 취하세요.', weight: 3 },
  { category: 'health_guide', condition: 'all', minTemp: 30, maxTemp: 35, template: '{{apparentTemp}}°C의 폭염 속에서는 심한 자외선이 피부 노화와 일광 화상을 유발할 수 있습니다. SPF 50 이상의 선크림을 2시간마다 덧바르고, 긴소매 옷으로 피부를 보호하세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 30, maxTemp: 35, template: '체감 온도 {{apparentTemp}}°C를 넘기는 폭염 주의보 수준입니다. 노약자와 어린이는 가능한 외출을 삼가시고, 에어컨이 있는 실내에서 시원하게 보내시기 바랍니다.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 35, maxTemp: null, template: '체감 온도 {{apparentTemp}}°C의 극심한 폭염입니다. 열탈진과 열사병 위험이 극도로 높으니, 야외 활동을 최소화하고 30분마다 물을 한 잔씩 마셔주세요.', weight: 3 },
  { category: 'health_guide', condition: 'all', minTemp: 35, maxTemp: null, template: '{{apparentTemp}}°C를 기록하는 살인적인 더위입니다. 한낮 외출은 절대 피하시고, 시원한 실내에서 에어컨 온도를 적정 수준으로 유지하며 건강을 지켜주세요.', weight: 2 },
  { category: 'health_guide', condition: 'all', minTemp: 35, maxTemp: null, template: '체감 온도 {{apparentTemp}}°C에 달하는 극한 더위 속에서는 수면의 질도 크게 떨어집니다. 취침 전 미지근한 샤워를 하고, 쿨매트 등을 활용하여 숙면을 취하시기 바랍니다.', weight: 1 },

  // health_guide / rainy specific
  { category: 'health_guide', condition: 'rainy', minTemp: null, maxTemp: null, template: '비가 오는 날에는 습도가 올라가면서 곰팡이와 세균 번식이 활발해집니다. 외출 후에는 젖은 옷을 빨리 갈아입고, 신발을 잘 말려주세요.', weight: 2 },
  { category: 'health_guide', condition: 'rainy', minTemp: null, maxTemp: null, template: '비 오는 날 습도 {{humidity}}%의 눅눅한 환경에서는 관절 통증과 두통이 심해질 수 있습니다. 충분한 휴식과 따뜻한 차 한 잔으로 몸을 달래주세요.', weight: 1 },
  { category: 'health_guide', condition: 'rainy', minTemp: null, maxTemp: null, template: '우천 시 미끄러운 노면 위에서의 낙상 사고에 주의하세요. 바닥이 미끄럽지 않은 신발을 신고, 우산 사용 시 전방 시야를 확보하는 것이 안전합니다.', weight: 1 },

  // health_guide / snowy specific
  { category: 'health_guide', condition: 'snowy', minTemp: null, maxTemp: null, template: '눈길에서의 보행은 평소보다 2배의 주의가 필요합니다. 보폭을 줄이고 발바닥 전체로 땅을 디디면서 걸으면 미끄러질 위험을 줄일 수 있습니다.', weight: 2 },
  { category: 'health_guide', condition: 'snowy', minTemp: null, maxTemp: null, template: '눈이 내리는 날에는 도로 결빙에 각별히 주의하셔야 합니다. 특히 아침 일찍이나 해질 무렵 그늘진 곳은 빙판이 되기 쉬우니, 방한화에 미끄럼 방지 패드를 부착하세요.', weight: 1 },

  // ──────────────────────────────────────────────────────────
  // CATEGORY: outfit_tip (본론2 - TPO 및 복장 레이어드 팁) — 65 templates
  // ──────────────────────────────────────────────────────────

  // outfit_tip / extreme cold
  { category: 'outfit_tip', condition: 'all', minTemp: null, maxTemp: -10, template: '체감 온도 {{apparentTemp}}°C의 혹한에는 다운 패딩이나 롱 패딩이 필수입니다. 이너로 히트텍 소재의 내복을 착용하고, 기모 니트와 두꺼운 목도리까지 겹겹이 레이어드하세요.', weight: 3 },
  { category: 'outfit_tip', condition: 'all', minTemp: null, maxTemp: -10, template: '{{temp}}°C 이하의 극심한 추위에는 보온력이 검증된 아이템이 필요합니다. 구스다운 패딩에 양털 안감 장갑, 방한 부츠, 그리고 귀를 덮는 비니까지 빈틈없는 방한을 해주세요.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: null, maxTemp: -10, template: '혹한기 외출 코디의 핵심은 \'겹겹이 입기\'입니다. 피부에 닿는 첫 번째 층은 흡습속건 소재, 중간층은 플리스나 니트, 바깥층은 방풍·방한 패딩으로 구성하면 체온을 효과적으로 유지할 수 있습니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: null, maxTemp: -10, template: '기온 {{temp}}°C 이하에서는 발의 보온이 특히 중요합니다. 기모 안감의 방한 부츠에 두꺼운 울 양말을 신고, 핫팩을 깔창 아래 넣어 발 시림을 방지하세요.', weight: 1 },

  // outfit_tip / cold (-10 to 0°C)
  { category: 'outfit_tip', condition: 'all', minTemp: -10, maxTemp: 0, template: '기온 {{temp}}°C의 추운 날에는 두툼한 패딩 점퍼에 기모 팬츠를 매치하는 것이 정석입니다. 니트 머플러와 장갑으로 포인트를 주면 따뜻하면서도 세련된 겨울 룩을 완성할 수 있습니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: -10, maxTemp: 0, template: '체감 온도 {{apparentTemp}}°C에서는 울 코트와 터틀넥 니트의 조합이 매력적입니다. 하의는 기모 슬랙스나 코듀로이 팬츠를 선택하고, 발에는 앵클 부츠를 매치해 보세요.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: -10, maxTemp: 0, template: '겨울 날씨 {{temp}}°C에는 무스탕 재킷이 실용성과 패션을 동시에 잡는 아이템입니다. 이너로 기모 맨투맨을 입고, 니트 비니와 가죽 장갑으로 마무리하세요.', weight: 1 },

  // outfit_tip / cold (0 to 5°C)
  { category: 'outfit_tip', condition: 'all', minTemp: 0, maxTemp: 5, template: '기온 {{temp}}°C의 쌀쌀한 날씨에는 두꺼운 코트나 숏 패딩이 좋은 선택입니다. 이너로 니트나 후드티를 걸치고, 청바지에 어그부츠를 매치하면 캐주얼하면서 따뜻합니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: 0, maxTemp: 5, template: '체감 온도 {{apparentTemp}}°C에는 트렌치코트 안에 목 넥 니트를 레이어드하는 것을 추천합니다. 머플러로 목 주위를 감싸면 보온과 스타일을 모두 잡을 수 있습니다.', weight: 1 },
  { category: 'outfit_tip', condition: 'all', minTemp: 0, maxTemp: 5, template: '{{temp}}°C의 초겨울 날씨에는 캐시미어 니트에 울 코트를 매치해 보세요. 하의는 따뜻한 기모 팬츠를 선택하고, 가죽 첼시 부츠로 단정하면서도 세련된 룩을 연출하세요.', weight: 2 },

  // outfit_tip / cool (5 to 10°C)
  { category: 'outfit_tip', condition: 'all', minTemp: 5, maxTemp: 10, template: '기온 {{temp}}°C인 날에는 자켓이나 야상 아우터가 제격입니다. 이너는 맨투맨이나 후드티, 하의는 면바지나 청바지를 선택하면 편안하면서도 멋스럽습니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: 5, maxTemp: 10, template: '체감 온도 {{apparentTemp}}°C의 쌀쌀한 날씨에는 레이어드 스타일링이 핵심입니다. 이너로 목 넥 니트를 입고, 미디엄 웨이트의 코트를 걸치면 세련되면서도 따뜻한 룩을 완성할 수 있습니다.', weight: 3 },
  { category: 'outfit_tip', condition: 'all', minTemp: 5, maxTemp: 10, template: '{{temp}}°C의 가을 날씨에는 데님 재킷에 가디건을 레이어드하는 캐주얼 룩을 시도해 보세요. 발에는 스니커즈나 로퍼가 잘 어울립니다.', weight: 1 },
  { category: 'outfit_tip', condition: 'all', minTemp: 5, maxTemp: 10, template: '기온 {{temp}}°C에서는 니트 가디건과 셔츠의 레이어드가 근사합니다. 하의는 슬랙스로 깔끔하게, 구두나 로퍼를 신으면 오피스룩으로도 손색없는 코디입니다.', weight: 1 },

  // outfit_tip / cool (10 to 15°C)
  { category: 'outfit_tip', condition: 'all', minTemp: 10, maxTemp: 15, template: '기온 {{temp}}°C의 선선한 날씨에는 얇은 가디건이나 바람막이가 딱 좋습니다. 맨투맨이나 긴팔 셔츠 위에 가볍게 걸치면, 낮에는 벗고 저녁에는 입는 유연한 코디가 가능합니다.', weight: 3 },
  { category: 'outfit_tip', condition: 'all', minTemp: 10, maxTemp: 15, template: '{{temp}}°C의 가을 날씨에는 면 소재의 셔츠에 니트 조끼를 레이어드하는 프레피 룩을 추천합니다. 하의는 치노 팬츠나 슬랙스로 단정하게 마무리하세요.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: 10, maxTemp: 15, template: '체감 온도 {{apparentTemp}}°C에서는 경량 재킷이 활용도가 높습니다. 안에 얇은 니트나 긴팔 티셔츠를 입으면 실내외 온도 차에 유연하게 대응할 수 있습니다.', weight: 1 },
  { category: 'outfit_tip', condition: 'all', minTemp: 10, maxTemp: 15, template: '{{temp}}°C의 환절기 코디 포인트는 \'탈착 가능한 아우터\'입니다. 오버핏 셔츠 재킷이나 경량 바람막이를 준비하여 기온 변화에 대처하세요.', weight: 1 },

  // outfit_tip / mild (15 to 20°C)
  { category: 'outfit_tip', condition: 'all', minTemp: 15, maxTemp: 20, template: '기온 {{temp}}°C의 포근한 날씨에는 긴팔 티셔츠에 면바지가 기본이 됩니다. 아침저녁 쌀쌀함에 대비해 가벼운 가디건이나 얇은 니트를 가방에 넣어두세요.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: 15, maxTemp: 20, template: '{{temp}}°C의 봄 날씨에는 스트라이프 셔츠에 면 슬랙스를 매치한 스마트 캐주얼이 어울립니다. 로퍼나 캔버스 스니커즈로 산뜻하게 마무리해 보세요.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: 15, maxTemp: 20, template: '체감 온도 {{apparentTemp}}°C인 오늘은 원피스나 셋업 착용에 딱 좋은 날입니다. 가벼운 소재의 아이템을 선택하되, 얇은 아우터를 함께 챙기시면 완벽합니다.', weight: 1 },
  { category: 'outfit_tip', condition: 'all', minTemp: 15, maxTemp: 20, template: '{{temp}}°C의 따뜻한 날에는 맨투맨에 와이드 팬츠를 매치한 릴렉스핏 코디가 트렌드입니다. 화이트 스니커즈로 청량감을 더하세요.', weight: 1 },

  // outfit_tip / warm (20 to 25°C)
  { category: 'outfit_tip', condition: 'all', minTemp: 20, maxTemp: 25, template: '기온 {{temp}}°C에서는 반팔 티셔츠에 얇은 면바지나 청바지를 매치하면 편안한 하루를 보낼 수 있습니다. 자외선 차단을 위해 모자나 선글라스도 챙기세요.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: 20, maxTemp: 25, template: '{{temp}}°C의 초여름 날씨에는 린넨 소재의 셔츠가 제격입니다. 통풍이 잘 되는 소재로 쾌적함을 유지하면서, 롤업한 소매로 캐주얼한 멋을 더하세요.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: 20, maxTemp: 25, template: '체감 온도 {{apparentTemp}}°C인 날에는 반팔 폴로셔츠에 치노 반바지를 매치한 스마트 캐주얼이 잘 어울립니다. 발에는 가죽 샌들이나 로퍼를 추천합니다.', weight: 1 },
  { category: 'outfit_tip', condition: 'all', minTemp: 20, maxTemp: 25, template: '{{temp}}°C 날씨에 딱 맞는 코디는 오버핏 반팔 티셔츠와 와이드 쇼츠 조합입니다. 메시 스니커즈로 발의 통풍까지 챙기면 완벽한 여름 캐주얼이 됩니다.', weight: 1 },

  // outfit_tip / hot (25 to 30°C)
  { category: 'outfit_tip', condition: 'all', minTemp: 25, maxTemp: 30, template: '오늘같이 기온이 {{temp}}°C인 날에는 얇은 면 소재의 반팔 티셔츠에 린넨 팬츠를 매치하는 것을 추천합니다. 통풍이 잘 되는 소재 선택이 쾌적한 하루의 시작입니다.', weight: 3 },
  { category: 'outfit_tip', condition: 'all', minTemp: 25, maxTemp: 30, template: '{{temp}}°C의 무더위에는 쿨맥스 소재의 기능성 반팔에 에어리즘 속옷을 입으면 쾌적함을 극대화할 수 있습니다. 하의는 통이 넓은 반바지나 7부 팬츠가 좋습니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: 25, maxTemp: 30, template: '기온 {{temp}}°C에서는 밝은 컬러의 옷을 선택하세요. 어두운 색상은 열을 흡수하여 체감 온도를 높입니다. 화이트, 라이트 블루, 베이지 톤의 옷이 시원합니다.', weight: 1 },

  // outfit_tip / very hot (30°C+)
  { category: 'outfit_tip', condition: 'all', minTemp: 30, maxTemp: null, template: '기온 {{temp}}°C 이상의 폭염에는 UV 차단 기능이 있는 래시가드나 쿨링 소재 의류를 활용하세요. 넓은 챙의 모자와 선글라스로 자외선으로부터 피부를 보호하는 것도 중요합니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: 30, maxTemp: null, template: '{{temp}}°C를 넘는 폭염 속에서는 최대한 가볍고 헐렁한 옷을 입으세요. 땀 흡수와 빠른 건조가 가능한 기능성 소재의 반팔·반바지 조합이 가장 실용적입니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'all', minTemp: 30, maxTemp: null, template: '체감 온도 {{apparentTemp}}°C의 불볕더위에는 냉감 소재의 의류가 구세주입니다. 접촉 냉감 기능이 있는 티셔츠에 메시 소재 신발을 신으면 한결 시원해집니다.', weight: 1 },
  { category: 'outfit_tip', condition: 'all', minTemp: 30, maxTemp: null, template: '폭염 {{temp}}°C 시대의 직장인 코디: 린넨 블라우스에 쿨비즈 슬랙스를 매치하고, 사무실에 비치해둔 가디건으로 냉방 대비를 하세요. 편안한 플랫슈즈면 출퇴근도 가뿐합니다.', weight: 1 },

  // outfit_tip / rainy
  { category: 'outfit_tip', condition: 'rainy', minTemp: null, maxTemp: 15, template: '비가 오는 날의 패션 포인트는 방수 소재 활용입니다. 트렌치코트나 고어텍스 재킷을 아우터로 선택하고, 발목이 짧은 레인부츠로 실용성과 스타일을 동시에 잡아보세요.', weight: 3 },
  { category: 'outfit_tip', condition: 'rainy', minTemp: null, maxTemp: 15, template: '비 오는 쌀쌀한 날에는 방수 후드 자켓이 유용합니다. 안에 플리스 재킷을 레이어드하면 보온성까지 확보할 수 있어, 비바람에도 끄떡없는 코디가 완성됩니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'rainy', minTemp: 15, maxTemp: 25, template: '따뜻한 비 오는 날에는 방수 바람막이에 반팔 티셔츠를 레이어드하세요. 방수 처리된 스니커즈와 접이식 우산으로 갑작스러운 소나기에도 스타일리시하게 대응할 수 있습니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'rainy', minTemp: 15, maxTemp: 25, template: '비가 내리는 {{temp}}°C의 날씨에는 어두운 컬러의 팬츠를 추천합니다. 빗물 얼룩이 눈에 띄지 않아 깔끔한 인상을 유지할 수 있습니다. 발에는 방수 로퍼가 좋습니다.', weight: 1 },
  { category: 'outfit_tip', condition: 'rainy', minTemp: 25, maxTemp: null, template: '여름 비 오는 날에는 빠르게 마르는 나일론 소재의 반바지와 방수 샌들이 실용적입니다. 비에 젖어도 빨리 건조되어 쾌적함을 유지할 수 있습니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'rainy', minTemp: 25, maxTemp: null, template: '장마철 패션의 핵심은 \'방수 + 통풍\'입니다. 가벼운 레인코트에 쿨링 소재의 반팔을 매치하고, 에바 소재의 슬리퍼나 레인부츠를 신어 실용성을 높이세요.', weight: 1 },
  { category: 'outfit_tip', condition: 'rainy', minTemp: null, maxTemp: null, template: '비 오는 날의 가방은 방수 소재 토트백이나 크로스백을 추천합니다. 우산을 들어야 하니 양손이 자유로운 가방 스타일이 편리합니다. 컬러풀한 우산으로 포인트를 주는 것도 좋은 방법입니다.', weight: 1 },

  // outfit_tip / snowy
  { category: 'outfit_tip', condition: 'snowy', minTemp: null, maxTemp: 0, template: '눈 오는 날에는 방수와 보온이 모두 중요합니다. 방수 패딩에 기모 팬츠, 그리고 미끄럼 방지 기능이 있는 방한 부츠를 신으세요. 장갑과 비니도 필수 아이템입니다.', weight: 3 },
  { category: 'outfit_tip', condition: 'snowy', minTemp: null, maxTemp: 0, template: '눈 내리는 {{temp}}°C의 날씨에는 롱 다운 패딩이 든든합니다. 무릎까지 오는 롱 기장은 하체 보온에 효과적이며, 안에 니트 원피스나 기모 팬츠를 입으면 완벽한 방한이 됩니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'snowy', minTemp: null, maxTemp: null, template: '눈길 위에서는 밑창이 두꺼운 트레킹 부츠가 안전합니다. 발목을 잡아주는 디자인이면 미끄러짐을 방지하는 데 효과적입니다. 방수 스프레이를 뿌려두면 눈이 스며드는 것도 막을 수 있습니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'snowy', minTemp: null, maxTemp: null, template: '눈 오는 날의 스타일 팁: 볼류미한 패딩 위에 컬러 머플러로 포인트를 주면 칙칙한 겨울 무드를 밝힐 수 있습니다. 니트 비니와 가죽 장갑으로 세련미를 더하세요.', weight: 1 },

  // outfit_tip / cloudy
  { category: 'outfit_tip', condition: 'cloudy', minTemp: 5, maxTemp: 15, template: '흐린 날의 코디는 은은한 톤온톤 매치가 잘 어울립니다. 베이지나 그레이 컬러의 니트에 같은 계열의 아우터를 걸치면 날씨와 어우러지는 세련된 룩이 완성됩니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'cloudy', minTemp: 15, maxTemp: 25, template: '구름이 많은 {{temp}}°C의 날씨에는 옷을 선택할 때 밝은 컬러로 기분 전환을 해보세요. 파스텔 톤의 상의에 화이트 하의를 매치하면 흐린 날에도 화사한 분위기를 연출할 수 있습니다.', weight: 2 },
  { category: 'outfit_tip', condition: 'cloudy', minTemp: 15, maxTemp: 25, template: '흐린 날에도 자외선은 존재합니다. UV 차단 기능이 있는 가벼운 재킷을 챙기시면 자외선 차단과 갑작스러운 기온 변화에 동시에 대비할 수 있습니다.', weight: 1 },
  { category: 'outfit_tip', condition: 'cloudy', minTemp: 25, maxTemp: null, template: '흐리지만 무더운 {{temp}}°C의 날씨에는 통풍이 잘 되는 오버핏 상의와 반바지로 편안하게 입으세요. 갑작스러운 소나기에 대비해 접이식 우산도 챙겨두면 좋습니다.', weight: 1 },

  // ──────────────────────────────────────────────────────────
  // CATEGORY: trend_conclusion (결론 - 패션 트렌드 제언) — 45 templates
  // ──────────────────────────────────────────────────────────

  // trend_conclusion / clear
  { category: 'trend_conclusion', condition: 'clear', minTemp: null, maxTemp: null, template: '화창한 {{city}}의 오늘, 날씨만큼이나 밝은 스타일로 하루를 시작해 보세요. 올해의 트렌드인 비비드 컬러 아이템 하나를 포인트로 활용하면, 맑은 하늘과 완벽한 조화를 이룹니다.', weight: 2 },
  { category: 'trend_conclusion', condition: 'clear', minTemp: null, maxTemp: null, template: '맑은 날씨에는 과감한 패턴의 셔츠나 프린팅 티셔츠로 개성을 드러내 보세요. {{city}}의 푸른 하늘 아래, 자신감 있는 패션이 최고의 액세서리가 됩니다.', weight: 1 },
  { category: 'trend_conclusion', condition: 'clear', minTemp: 20, maxTemp: null, template: '여름 맑은 날에는 자연 소재의 액세서리가 트렌드입니다. 라탄 백, 짚 모자, 우드 비즈 팔찌 등으로 시즌감을 살려보세요. {{city}}의 햇살 아래 빛나는 여름 스타일이 완성됩니다.', weight: 1 },

  // trend_conclusion / rainy
  { category: 'trend_conclusion', condition: 'rainy', minTemp: null, maxTemp: null, template: '비 오는 날이야말로 패션 감각을 뽐낼 수 있는 기회입니다. 컬러풀한 레인부츠와 투명 우산으로 우중 패션을 즐겨보세요. 빗소리와 함께하는 {{city}}의 거리가 런웨이가 됩니다.', weight: 2 },
  { category: 'trend_conclusion', condition: 'rainy', minTemp: null, maxTemp: null, template: '비 오는 날의 패션은 실용성이 곧 스타일입니다. 세련된 디자인의 방수 아우터와 레인부츠 하나면 충분합니다. {{city}}의 빗속에서도 빛나는 당신의 스타일을 응원합니다.', weight: 1 },

  // trend_conclusion / snowy
  { category: 'trend_conclusion', condition: 'snowy', minTemp: null, maxTemp: null, template: '눈 내리는 {{city}}의 겨울 풍경에 어울리는 코디로 시즌을 만끽하세요. 올겨울의 트렌드 아이템인 퍼 머플러와 울 벙거지 모자로 따뜻하면서도 트렌디한 룩을 연출해 보세요.', weight: 2 },
  { category: 'trend_conclusion', condition: 'snowy', minTemp: null, maxTemp: null, template: '눈 오는 날의 패션 키워드는 \'볼류감\'과 \'레이어드\'입니다. 두툼한 니트에 패딩 베스트를 레이어드하고, 목도리를 풍성하게 감으면 겨울의 낭만이 담긴 코디가 완성됩니다.', weight: 1 },

  // trend_conclusion / cloudy
  { category: 'trend_conclusion', condition: 'cloudy', minTemp: null, maxTemp: null, template: '흐린 날의 패션 팁은 \'무드 있는 컬러\'입니다. 차분한 어스 톤이나 머스타드, 버건디 같은 따뜻한 색감의 아이템으로 흐린 날씨에 활력을 불어넣어 보세요.', weight: 2 },
  { category: 'trend_conclusion', condition: 'cloudy', minTemp: null, maxTemp: null, template: '구름 낀 하늘 아래에서도 스타일은 계속됩니다. 오버사이즈 코트에 볼드한 액세서리를 포인트로 주면, 흐린 날씨에도 시선을 사로잡는 룩을 완성할 수 있습니다.', weight: 1 },

  // trend_conclusion / all (범용) — seasonal tips
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '패션은 결국 자신감입니다. 오늘의 날씨에 맞는 옷차림으로 편안함을 확보하되, 본인만의 포인트 아이템 하나로 개성을 표현해 보시기 바랍니다.', weight: 3 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '오늘의 날씨 정보와 코디 팁이 도움이 되셨기를 바랍니다. 매일 달라지는 {{city}}의 날씨만큼, 다양한 스타일에 도전하며 패션의 즐거움을 찾아보세요.', weight: 2 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '{{city}}의 오늘 날씨에 맞춘 최적의 코디를 제안해 드렸습니다. 날씨와 패션, 두 마리 토끼를 동시에 잡는 스마트한 하루가 되시길 응원합니다.', weight: 2 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '기온 {{temp}}°C, 체감 {{apparentTemp}}°C인 오늘, 날씨에 맞는 옷을 선택하는 것은 건강과 스타일 모두를 위한 현명한 결정입니다. {{city}}에서 멋진 하루 되세요!', weight: 2 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '날씨에 따라 옷을 바꾸는 것, 그것이 진정한 패셔니스타의 자세입니다. {{city}}의 변화무쌍한 날씨 속에서도 항상 빛나는 당신의 스타일을 응원합니다.', weight: 1 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '{{date}} {{city}}의 날씨 분석과 패션 가이드를 마칩니다. 내일은 또 어떤 날씨가 펼쳐질지, 어떤 스타일이 어울릴지, 내일 다시 만나요!', weight: 1 },

  // trend_conclusion / all — seasonal
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: 5, template: '올해 겨울 시즌의 트렌드 키워드는 \'코지 럭셔리(Cozy Luxury)\'입니다. {{city}}의 추운 날씨에 맞서면서도 고급스러운 무드를 연출할 수 있는 캐시미어, 울 소재에 주목하세요.', weight: 2 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: 5, template: '겨울 패션의 완성은 디테일에 있습니다. 니트 소재의 장갑, 우아한 머플러, 감각적인 비니 하나면 평범한 패딩 룩도 특별해집니다. {{city}}의 겨울 거리를 런웨이로 만들어 보세요.', weight: 1 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: 5, template: '추운 날일수록 액세서리의 역할이 커집니다. 따뜻한 울 머플러를 다양한 방법으로 연출하거나, 컬러 장갑으로 포인트를 주면 겨울 코디가 한층 풍성해집니다.', weight: 1 },

  { category: 'trend_conclusion', condition: 'all', minTemp: 5, maxTemp: 15, template: '올해 {{seasonTip}} 시즌의 트렌드 키워드는 \'실용적 미니멀리즘\'입니다. {{city}}의 변덕스러운 날씨에 대응하면서도 스타일을 놓치지 않는, 멀티 기능성 아이템에 주목해 보세요.', weight: 3 },
  { category: 'trend_conclusion', condition: 'all', minTemp: 5, maxTemp: 15, template: '환절기에는 \'원 마일 웨어(One Mile Wear)\' 트렌드를 활용해 보세요. 집 근처 산책부터 가벼운 외출까지 커버하는 편안하면서도 스타일리시한 아이템이 {{city}}의 거리에서 주목받고 있습니다.', weight: 2 },
  { category: 'trend_conclusion', condition: 'all', minTemp: 5, maxTemp: 15, template: '{{city}}의 환절기 패션 트렌드는 \'레이어드 맥시멀리즘\'입니다. 얇은 아이템을 겹겹이 매치하여 기온 변화에 유연하게 대응하면서, 레이어드 자체를 스타일 포인트로 삼아보세요.', weight: 1 },

  { category: 'trend_conclusion', condition: 'all', minTemp: 15, maxTemp: 25, template: '봄/가을 시즌에는 \'뉴트럴 톤의 레이어링\'이 트렌드입니다. 베이지, 크림, 카키 등 자연스러운 색감으로 레이어드하면 {{city}}의 거리에서 세련된 분위기를 연출할 수 있습니다.', weight: 2 },
  { category: 'trend_conclusion', condition: 'all', minTemp: 15, maxTemp: 25, template: '적당한 기온의 날에는 과감한 패턴 믹스에 도전해 보세요. 스트라이프와 체크, 플로럴과 도트 등 두 가지 패턴을 톤 맞춰 조합하면, {{city}}의 거리 위 패셔니스타로 거듭납니다.', weight: 1 },
  { category: 'trend_conclusion', condition: 'all', minTemp: 15, maxTemp: 25, template: '{{city}}의 포근한 날씨에는 오버사이즈 실루엣의 아이템으로 여유로운 무드를 즐겨보세요. 빅 셔츠에 슬림 팬츠, 또는 와이드 팬츠에 핏한 상의를 매치하는 볼륨 대비가 트렌드입니다.', weight: 1 },

  { category: 'trend_conclusion', condition: 'all', minTemp: 25, maxTemp: null, template: '한여름의 패션 키워드는 \'시원한 소재\'와 \'대담한 컬러\'입니다. 린넨, 모달, 텐셀 등 통기성 좋은 소재를 활용하고, 비비드한 컬러 아이템으로 {{city}}의 여름을 즐겨보세요.', weight: 2 },
  { category: 'trend_conclusion', condition: 'all', minTemp: 25, maxTemp: null, template: '여름 시즌에는 \'슬리브리스(Sleeveless)\' 아이템이 대세입니다. 민소매 블라우스나 나시 원피스를 활용하되, 실내 냉방 대비용 얇은 카디건을 항상 휴대하세요.', weight: 1 },
  { category: 'trend_conclusion', condition: 'all', minTemp: 25, maxTemp: null, template: '무더운 {{city}}의 여름에서도 스타일을 지키는 법: 심플한 모노톤 코디에 유니크한 액세서리 하나를 더하면, 미니멀하면서도 임팩트 있는 룩이 완성됩니다.', weight: 1 },

  // trend_conclusion / all — general advice
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '좋은 옷차림이란 비싼 옷이 아니라 날씨와 상황에 맞는 옷입니다. 오늘 {{city}}의 기온 {{temp}}°C에 맞춰 현명하게 선택한 코디가 바로 최고의 패션입니다.', weight: 2 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '{{city}}의 오늘 날씨 정보, 건강 가이드, 그리고 패션 코디까지 모두 확인하셨습니다. 날씨에 맞는 스마트한 옷차림으로 건강하고 멋진 하루를 보내세요!', weight: 2 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '마지막으로, 오늘의 코디 팁을 한마디로 요약하면: {{conditionDesc}}한 날씨에는 {{seasonTip}}이(가) 핵심입니다. {{city}}에서의 멋진 하루를 기대하며, 내일의 날씨와 코디 정보로 다시 찾아오겠습니다.', weight: 1 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '패션 트렌드는 매 시즌 변하지만, 날씨에 맞는 편안한 옷차림이라는 기본은 변하지 않습니다. {{city}}의 오늘 날씨와 함께, 자신만의 스타일을 찾아가시길 바랍니다.', weight: 2 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '기능성과 스타일, 두 가지를 모두 만족하는 옷차림이 현대 패션의 핵심입니다. {{city}}의 기온 {{temp}}°C에 최적화된 오늘의 코디가 여러분의 하루를 더 특별하게 만들어 줄 것입니다.', weight: 1 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '옷은 그날의 기분을 결정짓습니다. {{city}}의 {{conditionDesc}}한 날씨에 맞춘 스마트 코디로, 자신감 넘치는 하루를 시작하세요. 다음에도 유용한 날씨 패션 정보로 찾아뵙겠습니다.', weight: 1 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '오늘의 {{city}} 날씨 패션 가이드를 마무리합니다. 체감 온도 {{apparentTemp}}°C를 기준으로 알려드린 코디 팁을 참고하셔서, 실용적이면서도 스타일리시한 외출을 즐기세요!', weight: 1 },
  { category: 'trend_conclusion', condition: 'all', minTemp: null, maxTemp: null, template: '매일 아침 날씨를 확인하고 그에 맞는 옷을 선택하는 습관, 그것이 옷잘러의 첫걸음입니다. {{city}}의 날씨와 함께하는 패션 가이드, 내일도 계속됩니다!', weight: 1 },
];

// ============================================================
// OutfitRecommendation Seeds — 45+ outfit items
// ============================================================

const outfitRecommendations: OutfitSeed[] = [
  // ── top (상의) ──
  { category: 'top', itemName: '반팔 티셔츠', description: '면 소재의 기본 반팔 티셔츠. 통풍이 잘 되어 더운 날씨에 적합합니다.', tempMin: 22, tempMax: null, condition: 'all', layerOrder: 1, iconEmoji: '👕' },
  { category: 'top', itemName: '린넨 셔츠', description: '시원한 린넨 소재의 셔츠. 여름철 세미 캐주얼 룩에 제격입니다.', tempMin: 20, tempMax: null, condition: 'all', layerOrder: 1, iconEmoji: '👔' },
  { category: 'top', itemName: '긴팔 티셔츠', description: '면 소재의 긴팔 티셔츠. 선선한 날씨에 단독 또는 레이어드용으로 활용합니다.', tempMin: 12, tempMax: 22, condition: 'all', layerOrder: 1, iconEmoji: '👕' },
  { category: 'top', itemName: '니트', description: '울 블렌드 니트 스웨터. 가을·겨울 시즌의 기본 상의입니다.', tempMin: 0, tempMax: 15, condition: 'all', layerOrder: 1, iconEmoji: '🧶' },
  { category: 'top', itemName: '후드티', description: '기모 안감의 후드 스웨트셔츠. 캐주얼하면서 보온성이 좋습니다.', tempMin: 3, tempMax: 15, condition: 'all', layerOrder: 1, iconEmoji: '🧥' },
  { category: 'top', itemName: '기모 맨투맨', description: '두꺼운 기모 안감의 맨투맨 셔츠. 한겨울 이너로 최적입니다.', tempMin: null, tempMax: 8, condition: 'all', layerOrder: 1, iconEmoji: '🧥' },
  { category: 'top', itemName: '터틀넥 니트', description: '목 부분이 올라오는 터틀넥 니트. 보온성과 스타일을 동시에 잡는 아이템.', tempMin: null, tempMax: 10, condition: 'all', layerOrder: 1, iconEmoji: '🧶' },
  { category: 'top', itemName: '폴로 셔츠', description: '카라가 있는 반팔 폴로셔츠. 스마트 캐주얼 느낌의 여름 상의.', tempMin: 20, tempMax: 30, condition: 'all', layerOrder: 1, iconEmoji: '👔' },
  { category: 'top', itemName: '나시/탱크톱', description: '민소매 상의. 폭염 시 시원하게 입을 수 있는 최소 의류.', tempMin: 28, tempMax: null, condition: 'all', layerOrder: 1, iconEmoji: '🎽' },
  { category: 'top', itemName: '히트텍 이너', description: '발열 기능성 이너웨어. 혹한기 필수 베이스 레이어.', tempMin: null, tempMax: 0, condition: 'all', layerOrder: 0, iconEmoji: '🧣' },

  // ── bottom (하의) ──
  { category: 'bottom', itemName: '반바지', description: '무릎 위 길이의 면 반바지. 한여름 시원한 코디에 필수.', tempMin: 25, tempMax: null, condition: 'all', layerOrder: 1, iconEmoji: '🩳' },
  { category: 'bottom', itemName: '면바지', description: '코튼 소재의 기본 면바지. 봄·가을 시즌에 활용도가 높습니다.', tempMin: 12, tempMax: 28, condition: 'all', layerOrder: 1, iconEmoji: '👖' },
  { category: 'bottom', itemName: '청바지', description: '데님 소재의 진. 사계절 기본이 되는 하의입니다.', tempMin: 5, tempMax: 28, condition: 'all', layerOrder: 1, iconEmoji: '👖' },
  { category: 'bottom', itemName: '슬랙스', description: '깔끔한 핏의 슬랙스. 오피스룩부터 스마트 캐주얼까지 다양하게 활용.', tempMin: 8, tempMax: 28, condition: 'all', layerOrder: 1, iconEmoji: '👖' },
  { category: 'bottom', itemName: '기모 팬츠', description: '기모 안감이 있는 보온 팬츠. 추운 겨울 하체 보온의 핵심.', tempMin: null, tempMax: 5, condition: 'all', layerOrder: 1, iconEmoji: '👖' },
  { category: 'bottom', itemName: '와이드 팬츠', description: '통이 넓은 와이드 핏 팬츠. 트렌디하면서 활동성이 좋습니다.', tempMin: 10, tempMax: 28, condition: 'all', layerOrder: 1, iconEmoji: '👖' },
  { category: 'bottom', itemName: '린넨 팬츠', description: '린넨 소재의 시원한 팬츠. 여름철 통풍이 좋아 쾌적합니다.', tempMin: 22, tempMax: null, condition: 'all', layerOrder: 1, iconEmoji: '👖' },
  { category: 'bottom', itemName: '코듀로이 팬츠', description: '골덴 소재의 팬츠. 가을·겨울 클래식한 무드 연출에 적합.', tempMin: null, tempMax: 15, condition: 'all', layerOrder: 1, iconEmoji: '👖' },

  // ── outer (외투) ──
  { category: 'outer', itemName: '바람막이', description: '가벼운 방풍 재킷. 봄·가을 환절기에 휴대하기 편리합니다.', tempMin: 10, tempMax: 20, condition: 'all', layerOrder: 2, iconEmoji: '🧥' },
  { category: 'outer', itemName: '가디건', description: '가벼운 니트 가디건. 실내외 온도차에 대응하기 좋은 아이템.', tempMin: 12, tempMax: 22, condition: 'all', layerOrder: 2, iconEmoji: '🧥' },
  { category: 'outer', itemName: '트렌치코트', description: '클래식한 미디 기장의 트렌치코트. 봄·가을 세련된 아우터.', tempMin: 8, tempMax: 18, condition: 'all', layerOrder: 2, iconEmoji: '🧥' },
  { category: 'outer', itemName: '숏 패딩', description: '허리 기장의 패딩 점퍼. 활동성과 보온성의 균형이 좋습니다.', tempMin: null, tempMax: 5, condition: 'all', layerOrder: 2, iconEmoji: '🧥' },
  { category: 'outer', itemName: '롱 패딩', description: '무릎 아래까지 내려오는 롱 기장 패딩. 한겨울 최강 방한 아이템.', tempMin: null, tempMax: 0, condition: 'all', layerOrder: 2, iconEmoji: '🧥' },
  { category: 'outer', itemName: '울 코트', description: '울 소재의 클래식 코트. 포멀한 겨울 아우터의 정석.', tempMin: null, tempMax: 8, condition: 'all', layerOrder: 2, iconEmoji: '🧥' },
  { category: 'outer', itemName: '데님 재킷', description: '캐주얼한 데님 자켓. 봄·가을 가벼운 아우터로 활용도 만점.', tempMin: 12, tempMax: 22, condition: 'all', layerOrder: 2, iconEmoji: '🧥' },
  { category: 'outer', itemName: '방수 자켓', description: '고어텍스 소재의 방수 자켓. 비 오는 날 필수 아우터.', tempMin: 5, tempMax: 25, condition: 'rainy', layerOrder: 2, iconEmoji: '🧥' },
  { category: 'outer', itemName: '레인코트', description: '가볍고 방수 기능이 탁월한 레인코트. 우천 시 스타일리시한 선택.', tempMin: 10, tempMax: 30, condition: 'rainy', layerOrder: 2, iconEmoji: '🧥' },
  { category: 'outer', itemName: '플리스 재킷', description: '보온성이 뛰어난 폴라플리스 재킷. 캐주얼 무드의 가을·겨울 아우터.', tempMin: 0, tempMax: 12, condition: 'all', layerOrder: 2, iconEmoji: '🧥' },
  { category: 'outer', itemName: '경량 패딩', description: '얇고 가벼운 경량 패딩. 환절기 아침저녁 쌀쌀함에 대비.', tempMin: 5, tempMax: 15, condition: 'all', layerOrder: 2, iconEmoji: '🧥' },

  // ── shoes (신발) ──
  { category: 'shoes', itemName: '샌들', description: '통풍이 잘 되는 여름 샌들. 해변이나 캐주얼 외출에 적합.', tempMin: 25, tempMax: null, condition: 'all', layerOrder: 1, iconEmoji: '🩴' },
  { category: 'shoes', itemName: '스니커즈', description: '만능 캐주얼 스니커즈. 사계절 기본 신발.', tempMin: 5, tempMax: 30, condition: 'all', layerOrder: 1, iconEmoji: '👟' },
  { category: 'shoes', itemName: '로퍼', description: '단정한 로퍼. 스마트 캐주얼과 오피스룩에 어울립니다.', tempMin: 10, tempMax: 28, condition: 'all', layerOrder: 1, iconEmoji: '👞' },
  { category: 'shoes', itemName: '첼시 부츠', description: '사이드 밴드의 앵클 부츠. 가을·겨울 세련된 발끝을 완성.', tempMin: null, tempMax: 15, condition: 'all', layerOrder: 1, iconEmoji: '👢' },
  { category: 'shoes', itemName: '방한 부츠', description: '방수·보온 기능의 겨울 부츠. 눈길에서도 안전하고 따뜻합니다.', tempMin: null, tempMax: 0, condition: 'all', layerOrder: 1, iconEmoji: '👢' },
  { category: 'shoes', itemName: '레인부츠', description: '방수 고무 소재의 장화. 비 오는 날 발을 보호해 주는 필수 아이템.', tempMin: 0, tempMax: 30, condition: 'rainy', layerOrder: 1, iconEmoji: '👢' },
  { category: 'shoes', itemName: '캔버스 스니커즈', description: '가벼운 캔버스 소재의 스니커즈. 봄·여름 데일리 슈즈.', tempMin: 15, tempMax: 30, condition: 'all', layerOrder: 1, iconEmoji: '👟' },
  { category: 'shoes', itemName: '트레킹 부츠', description: '견고한 밑창의 트레킹화. 눈길·비탈길에서 미끄럼 방지.', tempMin: null, tempMax: 5, condition: 'snowy', layerOrder: 1, iconEmoji: '🥾' },

  // ── accessory (액세서리) ──
  { category: 'accessory', itemName: '선글라스', description: '자외선 차단 기능의 선글라스. 맑은 날 눈 보호와 스타일을 동시에.', tempMin: 15, tempMax: null, condition: 'clear', layerOrder: 0, iconEmoji: '🕶️' },
  { category: 'accessory', itemName: '양산', description: 'UV 차단 양산. 여름철 자외선으로부터 피부를 보호합니다.', tempMin: 22, tempMax: null, condition: 'clear', layerOrder: 0, iconEmoji: '☂️' },
  { category: 'accessory', itemName: '우산', description: '접이식 또는 장우산. 비 오는 날 외출 시 필수.', tempMin: null, tempMax: null, condition: 'rainy', layerOrder: 0, iconEmoji: '☔' },
  { category: 'accessory', itemName: '머플러', description: '울 소재의 보온 머플러. 목 주위 보온과 스타일 포인트.', tempMin: null, tempMax: 5, condition: 'all', layerOrder: 0, iconEmoji: '🧣' },
  { category: 'accessory', itemName: '장갑', description: '방한용 장갑. 손의 동상을 예방하고 체온을 유지합니다.', tempMin: null, tempMax: 0, condition: 'all', layerOrder: 0, iconEmoji: '🧤' },
  { category: 'accessory', itemName: '비니', description: '니트 비니 모자. 겨울 머리 보온과 패션 포인트.', tempMin: null, tempMax: 5, condition: 'all', layerOrder: 0, iconEmoji: '🧢' },
  { category: 'accessory', itemName: '모자(캡)', description: '챙이 있는 볼캡. 자외선 차단과 캐주얼 스타일링에 활용.', tempMin: 15, tempMax: null, condition: 'all', layerOrder: 0, iconEmoji: '🧢' },
  { category: 'accessory', itemName: '핫팩', description: '일회용 또는 충전식 핫팩. 극한 추위에 주머니 속 온기.', tempMin: null, tempMax: -5, condition: 'all', layerOrder: 0, iconEmoji: '🔥' },
  { category: 'accessory', itemName: '넥워머', description: '목에 두르는 넥워머. 머플러보다 간편하고 활동성이 좋습니다.', tempMin: null, tempMax: 8, condition: 'all', layerOrder: 0, iconEmoji: '🧣' },
];

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.$transaction(async (tx) => {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await tx.reportOutfit.deleteMany();
    await tx.dailyReport.deleteMany();
    await tx.outfitRecommendation.deleteMany();
    await tx.weatherTemplate.deleteMany();

    // Insert WeatherTemplates
    console.log(`📝 Inserting ${weatherTemplates.length} weather templates...`);
    await tx.weatherTemplate.createMany({
      data: weatherTemplates,
    });

    // Insert OutfitRecommendations
    console.log(`👗 Inserting ${outfitRecommendations.length} outfit recommendations...`);
    await tx.outfitRecommendation.createMany({
      data: outfitRecommendations,
    });
  });

  // Print summary
  const templateCount = await prisma.weatherTemplate.count();
  const outfitCount = await prisma.outfitRecommendation.count();

  console.log('');
  console.log('✅ Seeding complete!');
  console.log(`   📝 WeatherTemplates: ${templateCount}`);
  console.log(`   👗 OutfitRecommendations: ${outfitCount}`);
  console.log('');

  // Category breakdown
  const categories = ['intro', 'health_guide', 'outfit_tip', 'trend_conclusion'];
  for (const cat of categories) {
    const count = await prisma.weatherTemplate.count({ where: { category: cat } });
    console.log(`   📂 ${cat}: ${count} templates`);
  }

  const outfitCategories = ['top', 'bottom', 'outer', 'shoes', 'accessory'];
  console.log('');
  for (const cat of outfitCategories) {
    const count = await prisma.outfitRecommendation.count({ where: { category: cat } });
    console.log(`   👕 ${cat}: ${count} items`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
