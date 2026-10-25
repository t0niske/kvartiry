#!/bin/bash
# sequential final renders (CPU-bound), log to ../out/final.log
B="/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"
OUT="$(cygpath -w "$PWD/../final")"
for job in "cx_rekord||" "cx_samolet||" "cx_reeds||" "cx_park3||" "apt_flat||turn" "apt_flat||dev" "apt_flat||rough"; do
  IFS='|' read -r mod cams var <<< "$job"
  echo "=== $mod $var $(date +%T)"
  "$B" -b --factory-startup -P run.py -- "$mod" "$OUT" final "$cams" "$var" 2>&1 | grep -E "BUILD|RENDER|SAVED|Error|Traceback|line "
done
echo "=== DONE $(date +%T)"
