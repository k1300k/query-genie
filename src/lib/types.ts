// AI Agent Query Management Types

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueryItem {
  id: string;
  categoryId: string;
  text: string;
  tags: string[];
  source: 'generated' | 'manual';
  status: 'active' | 'archived';
  answer?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'weather', name: '기상', description: '날씨 및 기상 관련 질의어', icon: 'Cloud', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'traffic', name: '교통', description: '교통 상황 관련 질의어', icon: 'Car', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'poi_crowding', name: 'POI 혼잡', description: '장소 혼잡도 관련 질의어', icon: 'Users', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'incident', name: '유고', description: '사고 및 유고 관련 질의어', icon: 'AlertTriangle', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'hazard', name: '위험구간', description: '위험구간 감지 관련 질의어', icon: 'ShieldAlert', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'map', name: '지도', description: '지도 관련 질의어', icon: 'Map', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'route', name: '경로탐색', description: '경로 탐색 관련 질의어', icon: 'Navigation', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'complex', name: '복합질의', description: '여러 데이터를 복합적으로 활용하는 질의어', icon: 'Layers', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const SAMPLE_QUERIES: QueryItem[] = [
  { id: '1', categoryId: 'weather', text: '오늘 강수 확률은?', tags: ['강수', '날씨'], source: 'manual', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', categoryId: 'weather', text: '도로 결빙 위험이 있나요?', tags: ['결빙', '도로'], source: 'manual', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', categoryId: 'weather', text: '기상청 도로 기상 관측 상황 알려줘', tags: ['기상청', '관측'], source: 'generated', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', categoryId: 'traffic', text: '지금 강변북로 상태는 어때?', tags: ['강변북로', '상태'], source: 'manual', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', categoryId: 'traffic', text: '서울 시내 교통 혼잡 구간 알려줘', tags: ['서울', '혼잡'], source: 'generated', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '6', categoryId: 'poi_crowding', text: '여의도 공원의 현재 혼잡도는?', tags: ['여의도', '혼잡도'], source: 'manual', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '7', categoryId: 'poi_crowding', text: '강남역 근처 혼잡 상황 알려줘', tags: ['강남역', '혼잡'], source: 'generated', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '8', categoryId: 'incident', text: '현재 사고 발생 지역 알려줘', tags: ['사고', '지역'], source: 'manual', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '9', categoryId: 'incident', text: '도로 공사 구간 및 통제 정보 알려줘', tags: ['공사', '통제'], source: 'generated', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '10', categoryId: 'hazard', text: '위험 구간 감지 현황 보고', tags: ['위험', '감지'], source: 'manual', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '11', categoryId: 'hazard', text: '도로 위험지역 리스트 업데이트', tags: ['도로', '리스트'], source: 'generated', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '12', categoryId: 'map', text: 'A 지점에서 B 지점까지 경로 보여줘', tags: ['경로', '지점'], source: 'manual', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '13', categoryId: 'map', text: '현재 위치 주변 지도 확대해줘', tags: ['위치', '확대'], source: 'generated', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '14', categoryId: 'route', text: '최단 경로를 찾아줘', tags: ['최단', '경로'], source: 'manual', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '15', categoryId: 'route', text: '교통 혼잡 회피 경로 알려줘', tags: ['혼잡', '회피'], source: 'generated', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '16', categoryId: 'complex', text: '왜 갑자기 ETA가 30분 증가했어?', tags: ['ETA', '복합'], source: 'manual', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '17', categoryId: 'complex', text: '왜 해당 경로로 안내했어?', tags: ['경로', '이유'], source: 'generated', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
