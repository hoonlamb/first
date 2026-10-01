/** Demo places (멍슐랭) — fictional except public parks; no real business is implied. Photos from the original team Figma (license unrecorded — private prototype only). */
export interface Place {
  id: string
  name: string
  kind: '공원/산책로' | '카페' | '여행지' | '이색공간'
  area: string
  photo: string
  open: boolean // wide & open: suitable for a first 나란히 (see strategy: first meetings in open daylight places)
  hours: string
  address: string
  amenities: ('대형견' | '주차' | '물그릇' | '배변봉투' | '그늘')[]
  intro: string
}

export const PLACES: Place[] = [
  { id: 'mangwon-park', name: '망원한강공원 잔디마당', kind: '공원/산책로', area: '망원동', photo: 'photos/place-02-beach-dog.jpg', open: true, hours: '24시간', address: '서울 마포구 망원동 한강공원 일대', amenities: ['대형견', '주차', '배변봉투', '그늘'], intro: '넓은 잔디와 강변 산책로가 이어져 있어 멀리서 나란히 걷기 좋아요.' },
  { id: 'dongle', name: '동글 게스트하우스', kind: '여행지', area: '광진구', photo: 'photos/place-01-dongle-doorstep-dog.jpg', open: false, hours: '체크인 15:00', address: '서울 광진구 (체험용 예시 장소)', amenities: ['물그릇', '그늘'], intro: '반려견 동반 가능한 게스트하우스. 좁은 골목이라 첫 만남 장소로는 권하지 않아요.' },
  { id: 'pettime', name: '펫타임 테라스', kind: '카페', area: '광진구', photo: 'photos/place-03-terrace-cafe-pettime.jpg', open: false, hours: '10:00 – 21:00', address: '서울 광진구 (체험용 예시 장소)', amenities: ['대형견', '물그릇', '그늘'], intro: '넓은 야외 테라스가 있는 동반 카페. 두 번째 나란히 뒤 쉬어 가기 좋아요.' },
  { id: 'white-cafe', name: '하얀 오후', kind: '카페', area: '연남동', photo: 'photos/place-06-cafe-interior.jpg', open: false, hours: '11:00 – 20:00', address: '서울 마포구 연남동 (체험용 예시 장소)', amenities: ['물그릇'], intro: '실내 소형견 동반 카페. 조용한 시간대에 가기 좋아요.' },
  { id: 'road-trip', name: '춘천 반려 여행 코스', kind: '여행지', area: '강원 춘천', photo: 'photos/place-04-travel-vintage-car.jpg', open: false, hours: '상시', address: '강원 춘천시 의암호 일대', amenities: ['대형견', '주차', '배변봉투'], intro: '호숫가 산책로와 동반 숙소를 잇는 하루 코스.' },
  { id: 'tram-street', name: '레트로 트램 거리', kind: '이색공간', area: '춘천', photo: 'photos/place-05-city-tram.jpg', open: false, hours: '10:00 – 18:00', address: '강원 춘천시 (체험용 예시 장소)', amenities: ['배변봉투'], intro: '사진 찍기 좋은 이색 거리. 사람이 많아 경계하는 개에게는 붐빌 수 있어요.' },
]
