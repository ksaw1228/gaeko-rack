# 게코 랙 매니저 (Gecko Rack Manager)

크레스티드 게코 랙 사육장 관리를 위한 웹 애플리케이션입니다.

![Gecko Logo](https://img.shields.io/badge/🦎-Gecko_Rack_Manager-4ade80?style=for-the-badge)

## 주요 기능

- **랙 관리**: 여러 개의 랙을 등록하고 각 랙의 행/열 구성 설정
- **개체 관리**: 게코 개체 등록, 수정, 삭제
  - 이름, 모프, 성별, 생년월일, 체중, 메모
  - 사진 업로드
- **관리 기록**: 다양한 관리 활동 기록
  - 급여, 청소, 물 교체, 탈피, 체중, 메이팅, 산란, 건강
- **상태 표시**: 관리 필요 여부를 색상으로 표시
  - 🟢 초록: 최근 3일 내 관리 완료
  - 🔴 빨강: 관리 필요 (3일 이상 경과)
- **드래그 앤 드롭**: 개체를 드래그하여 위치 이동 및 교환
- **반응형 디자인**: 모바일/데스크탑 지원

## 기술 스택

### Frontend
- React 19
- Vite
- Tailwind CSS
- @dnd-kit/core (드래그 앤 드롭)
- Axios

### Backend
- Node.js
- Express
- Prisma ORM
- SQLite
- Multer (파일 업로드)

## 설치 방법

### 1. 저장소 클론
```bash
git clone https://github.com/ksaw1228/gaeko-rack.git
cd gaeko-rack
```

### 2. 의존성 설치
```bash
# 클라이언트 의존성 설치
cd client
npm install

# 서버 의존성 설치
cd ../server
npm install
```

### 3. 데이터베이스 설정
```bash
cd server

# .env 파일 생성
echo 'DATABASE_URL="file:./dev.db"' > .env

# 데이터베이스 마이그레이션
npx prisma migrate dev
```

### 4. 실행
```bash
# 루트 디렉토리에서 클라이언트와 서버 동시 실행
cd ..
npm run dev
```

또는 개별 실행:
```bash
# 터미널 1 - 서버 실행
cd server
npm run dev

# 터미널 2 - 클라이언트 실행
cd client
npm run dev
```

### 5. 접속
브라우저에서 http://localhost:5173 접속

## 프로젝트 구조

```
gecko-rack-manager/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   │   ├── AddRackModal.jsx
│   │   │   ├── GeckoCell.jsx
│   │   │   ├── GeckoLogo.jsx
│   │   │   ├── GeckoModal.jsx
│   │   │   └── RackGrid.jsx
│   │   ├── api/            # API 클라이언트
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
├── server/                 # Express 백엔드
│   ├── prisma/
│   │   └── schema.prisma   # 데이터베이스 스키마
│   ├── uploads/            # 업로드된 사진
│   └── index.js            # API 서버
└── package.json
```

## API 엔드포인트

### 랙 (Rack)
- `GET /api/racks` - 모든 랙 조회
- `POST /api/racks` - 새 랙 생성
- `PUT /api/racks/:id` - 랙 수정
- `DELETE /api/racks/:id` - 랙 삭제

### 게코 (Gecko)
- `GET /api/geckos` - 모든 게코 조회
- `POST /api/geckos` - 새 게코 등록
- `PUT /api/geckos/:id` - 게코 정보 수정
- `PATCH /api/geckos/:id/move` - 게코 위치 이동
- `POST /api/geckos/swap` - 두 게코 위치 교환
- `DELETE /api/geckos/:id` - 게코 삭제
- `POST /api/geckos/:id/photo` - 사진 업로드
- `DELETE /api/geckos/:id/photo` - 사진 삭제

### 관리 기록 (Care Log)
- `GET /api/geckos/:id/logs` - 게코의 관리 기록 조회
- `POST /api/geckos/:id/logs` - 관리 기록 추가
- `DELETE /api/logs/:id` - 관리 기록 삭제

## 스크린샷

### 메인 화면
랙별로 게코들의 상태를 한눈에 확인할 수 있습니다.

### 개체 관리
개체 정보 확인, 수정, 관리 기록 추가가 가능합니다.

## 라이선스

MIT License
