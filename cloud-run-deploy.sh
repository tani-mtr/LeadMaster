#!/bin/bash
# Cloud Runにデプロイするためのスクリプト

# コンソールに色付きで表示する関数
print_green() {
  echo -e "\033[0;32m$1\033[0m"
}

print_yellow() {
  echo -e "\033[0;33m$1\033[0m"
}

print_red() {
  echo -e "\033[0;31m$1\033[0m"
}

# プロジェクトIDの設定
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
  print_red "プロジェクトIDが設定されていません。"
  print_yellow "gcloud config set project YOUR_PROJECT_ID を実行してプロジェクトを設定してください。"
  exit 1
fi

# サービス名の設定
SERVICE_NAME="leadmaster"
REGION="asia-northeast1"

# イメージ名の設定
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# イメージビルド
print_yellow "Dockerイメージをビルド中..."
docker build -t $IMAGE_NAME .

# Google Container Registryにプッシュ
print_yellow "イメージをGoogle Container Registryにプッシュ中..."
docker push $IMAGE_NAME

# Cloud Runにデプロイ
print_yellow "Cloud Runにデプロイ中..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT_ID=m2m-core,BIGQUERY_DATASET=zzz_taniguchi,BIGQUERY_TABLE=lead_property,BIGQUERY_LOCATION=US,REACT_APP_API_URL=/api" \
  --set-env-vars="BIGQUERY_BUILDINGS_QUERY=WITH AddressCheck AS (SELECT ROOMTYPE.lead_property_id, COUNT(DISTINCT CONCAT(IFNULL(prefectures, ''), IFNULL(city, ''), IFNULL(town, ''))) AS unique_addresses FROM \`m2m-core.zzz_taniguchi.lead_room_type\` ROOMTYPE GROUP BY lead_property_id), AreaZonedForUseCheck AS (SELECT ROOMTYPE.lead_property_id, COUNT(DISTINCT IFNULL(area_zoned_for_use, '')) AS unique_area_zoned_for_use FROM \`m2m-core.zzz_taniguchi.lead_room_type\` ROOMTYPE GROUP BY lead_property_id), routeOneCheck AS (SELECT ROOMTYPE.lead_property_id, COUNT(DISTINCT IFNULL(route_1, '')) AS unique_route_1 FROM \`m2m-core.zzz_taniguchi.lead_room_type\` ROOMTYPE GROUP BY lead_property_id), stationOneCheck AS (SELECT ROOMTYPE.lead_property_id, COUNT(DISTINCT IFNULL(station_1, '')) AS unique_station_1 FROM \`m2m-core.zzz_taniguchi.lead_room_type\` ROOMTYPE GROUP BY lead_property_id), walkMinOneCheck AS (SELECT ROOMTYPE.lead_property_id, COUNT(DISTINCT IFNULL(CAST(walk_min_1 AS STRING), '')) AS unique_walk_min_1 FROM \`m2m-core.zzz_taniguchi.lead_room_type\` ROOMTYPE GROUP BY lead_property_id), oldest_records AS (SELECT PROPERTY.id, PROPERTY.name, PROPERTY.tag, PROPERTY.mt_representative, PROPERTY.create_date, CASE WHEN AddressCheck.unique_addresses = 1 THEN CASE WHEN ROOMTYPE.prefectures IS NULL AND ROOMTYPE.city IS NULL AND ROOMTYPE.town IS NULL THEN NULL ELSE CONCAT(IFNULL(ROOMTYPE.prefectures, ''), IFNULL(ROOMTYPE.city, ''), IFNULL(ROOMTYPE.town, '')) END WHEN AddressCheck.unique_addresses IS NULL THEN NULL ELSE '部屋タイプ別' END AS adress, CASE WHEN AreaZonedForUseCheck.unique_area_zoned_for_use = 1 THEN ROOMTYPE.area_zoned_for_use WHEN AreaZonedForUseCheck.unique_area_zoned_for_use IS NULL THEN NULL ELSE '部屋タイプ別' END AS area_zoned_for_use, CASE WHEN routeOneCheck.unique_route_1 = 1 THEN ROOMTYPE.route_1 WHEN routeOneCheck.unique_route_1 IS NULL THEN NULL ELSE '部屋タイプ別' END AS route_1, CASE WHEN stationOneCheck.unique_station_1 = 1 THEN ROOMTYPE.station_1 WHEN stationOneCheck.unique_station_1 IS NULL THEN NULL ELSE '部屋タイプ別' END AS station_1, CASE WHEN walkMinOneCheck.unique_walk_min_1 = 1 THEN CAST(ROOMTYPE.walk_min_1 AS STRING) WHEN walkMinOneCheck.unique_walk_min_1 IS NULL THEN CAST(NULL AS STRING) ELSE '部屋タイプ別' END AS walk_min_1, ROW_NUMBER() OVER (PARTITION BY PROPERTY.name ORDER BY PROPERTY.create_date ASC) AS rn FROM \`m2m-core.zzz_taniguchi.lead_property\` PROPERTY LEFT JOIN \`m2m-core.zzz_taniguchi.lead_room_type\` ROOMTYPE ON PROPERTY.id = ROOMTYPE.lead_property_id LEFT JOIN AddressCheck ON PROPERTY.id = AddressCheck.lead_property_id LEFT JOIN AreaZonedForUseCheck ON PROPERTY.id = AreaZonedForUseCheck.lead_property_id LEFT JOIN routeOneCheck ON PROPERTY.id = routeOneCheck.lead_property_id LEFT JOIN stationOneCheck ON PROPERTY.id = stationOneCheck.lead_property_id LEFT JOIN walkMinOneCheck ON PROPERTY.id = walkMinOneCheck.lead_property_id WHERE PROPERTY.name IS NOT NULL) SELECT id, name, tag, mt_representative, create_date, adress, area_zoned_for_use, route_1, station_1, walk_min_1 FROM oldest_records WHERE rn = 1 ORDER BY create_date DESC"

if [ $? -eq 0 ]; then
  print_green "デプロイが完了しました！"
  SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format="value(status.url)")
  print_green "アプリケーションURL: $SERVICE_URL"
else
  print_red "デプロイに失敗しました。"
fi
