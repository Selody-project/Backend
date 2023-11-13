# Backend

Selody Project

# Getting Started

Clone the repo

```
git clone https://github.com/xERN-shareANDcommunity/Backend.git
```

Create `.env` file:
```
cp .env.sample .env
```

Install dependencies:

```
npm install
```

Run the application:

```
npm run dev
```

## Running Using Docker
```
docker compose up
```
docker-compose.yml 파일에서 서비스에 필요한 모든 컨테이너를 생성하고 시작한다. 만약 컨테이너가 빌드되지 않았거나, 혹은 빌드 된 이후 도커파일의 변동으로 다시 빌드되야 하는 경우, 이미지를 빌드한 후 컨테이너를 생성, 시작한다.

만약 모든 이미지를 새로 빌드해서 컨테이너를 생성하고 싶다면, 아래 명령어를 사용한다.
```
docker compose up --build
```
일괄로 중단(stop)하고 싶다면 Ctrl + C !!
