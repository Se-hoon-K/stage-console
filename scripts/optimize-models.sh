#!/usr/bin/env bash
# Optimise the Sketchfab sources in assets-src/ (git-ignored) into public/models/*.glb.
# Run by hand when a source model changes; not part of CI.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/models
opt() { npx -y @gltf-transform/cli@4 optimize "$1" "public/models/$2" \
  --compress meshopt --texture-compress webp --simplify true "${@:3}"; }

# Named Base/Support/Head nodes stay separate (join-named defaults to false) so the loader can assign roles.
opt assets-src/moving_head_beam_high_poly/scene.gltf moving-head.glb --texture-size 512 --simplify-ratio 0.5
opt assets-src/stage_light/scene.gltf par.glb --texture-size 512 --simplify-ratio 0.75
opt assets-src/square_truss_straight_segment_21/scene.gltf truss.glb --texture-size 512 --simplify-ratio 0.75
opt assets-src/line_array/scene.gltf line-array.glb --texture-size 256 --simplify-ratio 0.75 --join-named true
