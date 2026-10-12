import { MENUS, type Menu } from "./menus";

export interface Situation {
  slug: string;
  /** 짧은 라벨 (칩, 링크) */
  label: string;
  /** H1 */
  title: string;
  /** meta description */
  description: string;
  /** 본문 도입부 */
  intro: string;
  emoji: string;
}

export const SITUATIONS: Situation[] = [
  {
    slug: "rainy", label: "비 오는 날", emoji: "🌧️",
    title: "비 오는 날 점심 메뉴 추천",
    description: "비 오는 날 점심 뭐 먹지? 칼국수·국밥·짬뽕·라멘처럼 뜨끈한 국물 메뉴를 모았어요. 내 주변 500m 안에서 바로 찾아보세요.",
    intro: "비가 오면 자연스럽게 뜨끈한 국물이 생각나요. 우산 들고 멀리 가기 귀찮은 날이니, 회사 근처에서 바로 먹을 수 있는 국물 메뉴 위주로 골랐어요.",
  },
  {
    slug: "diet", label: "다이어트", emoji: "🥗",
    title: "다이어트 중 점심 메뉴 추천",
    description: "다이어트 중에도 회사 근처에서 먹을 수 있는 점심 메뉴예요. 샐러드·비빔밥·쌀국수·초밥 등 가볍지만 포만감 있는 메뉴를 골랐어요.",
    intro: "다이어트 중이라고 점심을 거르면 오후에 더 배고파요. 탄수화물과 기름기는 줄이고 단백질과 채소는 챙길 수 있는 메뉴를 모았어요.",
  },
  {
    slug: "solo", label: "혼밥", emoji: "🧑",
    title: "혼밥하기 좋은 점심 메뉴 추천",
    description: "혼자 점심 먹기 편한 메뉴를 모았어요. 1인분 주문이 자연스럽고 카운터 좌석이 많은 국밥·라멘·규동·김밥 등을 추천해요.",
    intro: "혼자 먹는 점심은 1인분 주문이 자연스럽고, 빨리 나오고, 눈치 안 보이는 가게가 최고예요. 그런 메뉴만 골랐어요.",
  },
  {
    slug: "group", label: "팀 점심·회식", emoji: "👥",
    title: "팀 점심·점심 회식 메뉴 추천",
    description: "3~6명이 함께 먹기 좋은 점심 메뉴예요. 보쌈·닭갈비·탕수육·피자처럼 나눠 먹기 좋고 모두가 만족하는 메뉴를 골랐어요.",
    intro: "여럿이 먹는 점심은 호불호가 적고 나눠 먹기 좋은 메뉴가 정답이에요. 점심 특선이나 세트가 있는 메뉴 위주로 모았어요.",
  },
  {
    slug: "hangover", label: "해장", emoji: "🍲",
    title: "해장 점심 메뉴 추천",
    description: "전날 회식 다음 날 점심, 속 풀어주는 해장 메뉴예요. 국밥·짬뽕·순두부찌개·쌀국수 등 뜨끈하고 얼큰한 국물 메뉴를 모았어요.",
    intro: "어제 회식이 과했다면 오늘 점심은 국물이에요. 얼큰하게 땀을 빼거나 맑은 국물로 속을 달래는 메뉴를 모았어요.",
  },
  {
    slug: "hot", label: "더운 날", emoji: "☀️",
    title: "더운 날 점심 메뉴 추천",
    description: "더운 여름 점심엔 냉면·소바·샐러드·초밥처럼 시원하고 가벼운 메뉴가 좋아요. 땀 안 나고 오후에 졸리지 않는 메뉴를 모았어요.",
    intro: "더운 날엔 뜨거운 국물이 부담스러워요. 차갑거나 가벼운 메뉴로 입맛을 살리고 오후 졸음도 피해 보세요.",
  },
  {
    slug: "cold", label: "추운 날", emoji: "❄️",
    title: "추운 날 점심 메뉴 추천",
    description: "추운 겨울 점심엔 국밥·라멘·김치찌개·칼국수처럼 몸을 데워주는 메뉴가 좋아요. 뜨끈한 국물 메뉴를 모았어요.",
    intro: "추운 날 점심은 몸을 데우는 게 우선이에요. 국물이 진하고 뜨거운 메뉴 위주로 골랐어요.",
  },
  {
    slug: "quick", label: "빨리 먹기", emoji: "⚡",
    title: "빨리 먹을 수 있는 점심 메뉴 추천",
    description: "점심시간 30분밖에 없을 때 먹을 수 있는 메뉴예요. 김밥·규동·짜장면·샌드위치처럼 주문 후 10분 안에 나오는 메뉴를 모았어요.",
    intro: "회의가 붙어서 점심시간이 짧은 날엔 주문 후 바로 나오는 메뉴가 필요해요. 10~15분이면 다 먹을 수 있는 메뉴만 골랐어요.",
  },
  {
    slug: "hearty", label: "든든하게", emoji: "💪",
    title: "든든하게 먹고 싶은 날 점심 메뉴 추천",
    description: "오후에 힘쓸 일이 많은 날, 든든한 점심 메뉴예요. 제육볶음·돈까스·카레·스테이크 덮밥처럼 포만감 확실한 메뉴를 모았어요.",
    intro: "오후 일정이 빡빡하거나 아침을 걸렀다면 점심은 든든해야 해요. 양 많고 포만감 오래 가는 메뉴를 모았어요.",
  },
  {
    slug: "light", label: "가볍게", emoji: "🍃",
    title: "가볍게 먹고 싶은 날 점심 메뉴 추천",
    description: "속이 더부룩하거나 오후에 졸리고 싶지 않은 날 점심 메뉴예요. 우동·소바·샐러드·딤섬처럼 부담 없는 메뉴를 모았어요.",
    intro: "전날 과식했거나 오후 미팅이 중요한 날엔 가벼운 점심이 좋아요. 기름기 적고 소화 잘 되는 메뉴를 모았어요.",
  },
  {
    slug: "cheap", label: "가성비", emoji: "💸",
    title: "가성비 좋은 점심 메뉴 추천",
    description: "만 원 이하로 든든하게 먹을 수 있는 점심 메뉴예요. 김밥·짜장면·떡볶이·규동 등 가격 부담 없는 메뉴를 모았어요.",
    intro: "월말이거나 점심값이 부담되는 날엔 만 원 이하 메뉴가 답이에요. 싸지만 만족스러운 메뉴를 모았어요.",
  },
];

export const SITUATION_BY_SLUG: Record<string, Situation> = Object.fromEntries(SITUATIONS.map((s) => [s.slug, s]));

export function menusForSituation(slug: string): Menu[] {
  return MENUS.filter((m) => m.tags.includes(slug));
}
