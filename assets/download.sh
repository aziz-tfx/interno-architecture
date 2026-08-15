#!/usr/bin/env bash
# Скачивает все сгенерированные ассеты лендинга с CDN Higgsfield в assets/,
# чтобы при желании захостить их локально (self-host) вместо CDN.
# Запуск: bash assets/download.sh
# После скачивания замените в index.html префикс
#   https://d8j0ntlcm91z4.cloudfront.net/user_3CLCviMVubl8pteTJQ9R4nBs27N/hf_...
# на assets/<имя файла>.
set -euo pipefail
cd "$(dirname "$0")"
B="https://d8j0ntlcm91z4.cloudfront.net/user_3CLCviMVubl8pteTJQ9R4nBs27N"

declare -A FILES=(
  # hero
  [hero-diorama.png]="hf_20260815_093319_a188b5d9-b4cf-4c1e-bd6f-57374f48c514.png"
  [hero-diorama-cut.png]="hf_20260815_093914_2e22e5ca-cb04-4972-b5de-9b4856658faf.png"
  [sat-blueprint.png]="hf_20260815_093915_68f9afdf-fd05-4f63-96fe-75cced4c7f65_min.png"
  [sat-compass.png]="hf_20260815_093916_f13bd29b-50f4-4699-b850-9f95cc2ff2f6_min.png"
  [sat-helmet.png]="hf_20260815_093917_cfa4e869-6330-47bf-ac3e-7129c4ded63b_min.png"
  [sat-house.png]="hf_20260815_093922_99cd7c5a-cc90-4085-adc9-6457666fd478_min.png"
  # section / gift icons
  [icon-laptop.png]="hf_20260815_093923_2cec07d4-57b9-47d6-9aa8-2a740a1ca42c_min.png"
  [icon-guide.png]="hf_20260815_093924_503d51f2-70d4-498c-970a-8f6c22a32489_min.png"
  [icon-checklist.png]="hf_20260815_093925_0b9230ac-2b5f-46ab-b25f-b7b6d9d0bdc3_min.png"
  [icon-coupon.png]="hf_20260815_093931_949c4f4c-eed4-4729-b8b0-880e3ab8b3a0_min.png"
  [icon-money.png]="hf_20260815_093932_e2bc1df0-63a5-4faf-a777-b751e7552dcf_min.png"
  [icon-stopwatch.png]="hf_20260815_093953_48178871-c01d-40af-8efe-c0a1cf8d9b3b_min.png"
  # mentor
  [mentor-timur.webp]="hf_20260815_093952_710aebe9-143f-4fe1-adcf-355e7f68822b_min.webp"
  [mentor-timur-full.png]="hf_20260815_093952_710aebe9-143f-4fe1-adcf-355e7f68822b.png"
  # works gallery
  [work-1-house.webp]="hf_20260815_093759_90b6e5d0-82c4-4515-aba5-6a73660d9078_min.webp"
  [work-2-courtyard.webp]="hf_20260815_093759_e5444695-d5d2-467d-946f-d634d3c562e9_min.webp"
  [work-3-coffee.webp]="hf_20260815_093759_a5a7e8d7-c1ba-4d3c-81b9-b8403510b220_min.webp"
  [work-4-villa.webp]="hf_20260815_093759_37ac2d48-e247-4c26-9087-1705b6a42c1e_min.webp"
  [work-5-office.webp]="hf_20260815_093759_f3c3ce3f-1525-41b8-a952-616eac21d0ae_min.webp"
  [work-6-mahalla.webp]="hf_20260815_093759_860ca5fc-655c-45e2-afa3-4808d23bdded_min.webp"
  # motion / 3d
  [showreel.mp4]="hf_20260815_094046_c4bf332f-10e6-4f9a-9c4c-927b9b03afca.mp4"
  [house-model.glb]="hf_20260815_094011_9fd65654-8da9-4bac-9e86-6ce8c5df5721.glb"
  [tashkent-poster.png]="hf_20260815_131059_afa4c629-6dd5-4c4b-88ac-04cccb7145c5.png"
  [tashkent-timelapse.mp4]="hf_20260815_131138_fe9267a8-c166-41e9-814e-07fa94543f32.mp4"
)

for name in "${!FILES[@]}"; do
  echo "→ $name"
  curl -fSs -o "$name" "$B/${FILES[$name]}"
done
echo "Done: $(ls -1 | wc -l) files in assets/"
