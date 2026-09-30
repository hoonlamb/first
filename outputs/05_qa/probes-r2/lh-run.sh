#!/bin/bash
# Lighthouse 13.5.0 mobile default preset (simulated throttling), same as round 1. Run sequentially, nothing else running.
SP=/tmp/claude-0/-home-user-first/6f7743f5-51d8-549e-a904-c4dc33e9827f/scratchpad
OUT=/home/user/first/outputs/05_qa/probes-r2/lh
export CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
for pair in "home|#/" "app|#/app" "brand|#/brand" "case|#/case"; do
  name=${pair%%|*}; route=${pair#*|}
  for run in 1 2; do
    $SP/node_modules/.bin/lighthouse "http://127.0.0.1:4181/${route}" --quiet --output=json --output-path=$OUT/lh-$name-$run.json --chrome-flags="--headless=new --no-sandbox" > $OUT/lh-$name-$run.log 2>&1
  done
done
echo done
