param([Parameter(Mandatory = $true)][string]$Key)
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$EXT = "Turn the attached plain 3D massing render into a photorealistic architectural visualization photograph, the kind a premium developer publishes for sales. " +
  "Keep EXACTLY the same camera position, angle, lens and framing; the same number of buildings, their positions, footprints, heights (floor counts), roof shapes and window rhythm. " +
  "Replace the flat grey ground with a realistic modern southern-Russian city district (Krasnodar): asphalt streets with markings, parked cars, sidewalks with tiles, lawns, young and mature deciduous trees, street lamps, a few pedestrians; the surrounding city fades into the haze at the horizon. " +
  "Realistic materials with fine detail: brick bond, window reflections, balcony glass, entrance canopies, ground-floor shops with signage-free glazing. Natural light, soft realistic shadows. " +
  "No text, no logos, no watermark. Wide 16:9 landscape image."
$YARD = "Turn the attached plain 3D render into a photorealistic eye-level photograph of a car-free landscaped residential courtyard in a new business-class housing complex in Krasnodar, Russia. " +
  "Keep EXACTLY the same camera position, angle and framing, the same buildings with the same facade rhythm, floors and balconies. " +
  "Make the courtyard rich and lived-in: granite and concrete paver paths, lush lawns, ornamental grasses and flower beds, young lindens and maples with realistic foliage instead of the low-poly spheres, wooden benches, modern lamp posts, a children's playground with colourful equipment on rubber surface, a few residents walking (parents with a stroller, children). " +
  "Warm late-afternoon sunlight, realistic shadows and reflections in windows. No text, no logos, no watermark. Wide 16:9 landscape image."
$INT = "Turn the attached plain 3D render into a photorealistic interior photograph for a real-estate listing of a new business-class apartment in Krasnodar, Russia (ceiling height 2.85 m, apartment on the 12th floor). " +
  "Keep EXACTLY the same camera position, wide-angle lens, room geometry, wall/window/door positions and window proportions, and the same furniture placement if any furniture is present. " +
  "Through the windows show a realistic view of a green modern city district under a clear sky. Natural daylight from the windows, soft bounce light, realistic exposure like a professional real-estate photo. No people, no text, no logos, no watermark. Wide 16:9 landscape image. "
$ROUGH = "Finish level: ROUGH (shell & core, 'chernovaya'). Walls are bare grey gypsum-plastered concrete with slight unevenness and trowel marks, floor is a flat grey cement-sand screed, ceiling is bare concrete slab, single bare light bulb hanging on a black cord, electrical boxes on the walls, white PVC double-glazed windows with plain white sills, white steel panel radiators under the windows. Completely empty, broom-clean, no furniture, no doors in the openings."
$DEV = "Finish level: WHITE BOX from the developer. Smooth walls painted in warm off-white matte paint, light natural-oak laminate floor, white skirting boards, white smooth ceiling with a simple round white ceiling light, white PVC windows with wide white sills, white radiators, light grey interior doors with black handles in the door openings. Clean and empty, no furniture, ready to move in."
$TURN = "Finish level: TURNKEY designer renovation. Oak herringbone parquet floor, warm white Venetian decorative plaster walls, recessed ceiling spotlights, linen curtains on the windows. Replace the simple boxes with real furniture of the same size and position: built-in handleless white kitchen with stone countertop and integrated appliances and a tall oak cabinet column, an oak kitchen island with a stone top, black bar stools and three pendant lamps above it, a soft grey sofa, an oak coffee table on a wool rug, a wall-mounted TV over a low oak media unit, a large potted fiddle-leaf fig plant; in the bedroom an upholstered double bed with linen bedding, oak nightstands with lamps and a built-in wardrobe. Cosy, styled like an interior magazine photo."

$jobs = @{
  'rekord_aerial'   = @('rekord_aerial.png',   "$EXT Project: 'Rekord 2' by DOGMA. All towers have facades of terracotta-red clinker brick with wide horizontal ribbon windows in dark graphite aluminium frames, thin dark horizontal bands at each floor, glass-balustrade balconies, a light beige stone-clad double-height ground floor with shop windows, dark roof parapets. Sunny afternoon, clear blue sky.")
  'rekord_yard'     = @('rekord_yard.png',     "$YARD The towers are terracotta-red clinker brick with wide ribbon windows in dark graphite frames and glass-balustrade balconies, light stone ground floor with large glazing.")
  'samolet7_aerial' = @('samolet7_aerial.png', "$EXT Project: 'Samolet 7' by DOGMA. The four taller towers have orange-terracotta brick facades with tall narrow windows in dark frames, light horizontal stone bands every few floors and balconies with glass rails; the lower 9-12-storey blocks are white smooth plaster with neat punched windows in dark frames and dark red accent parapets on the roofs; light stone ground floors with shop glazing. Sunny afternoon, clear blue sky.")
  'samolet7_yard'   = @('samolet7_yard.png',   "$YARD Buildings: white smooth-plaster blocks with punched windows in dark frames and a taller orange-terracotta brick tower with tall windows and glass-rail balconies in the middle; light stone ground floors with large glazing.")
  'reed_aerial'     = @('reed_aerial.png',     "$EXT Project: 'REEDS' by DOGMA near the Kuban river. Each tower is clad in a different shade of brick: deep burgundy, dark graphite, sand beige, rusty red and grey-taupe, with a regular grid of windows in black frames, dark ground floor with tall shop glazing, black parapets. A river embankment with reeds is visible beyond the complex. Sunny afternoon, clear blue sky.")
  'reed_yard'       = @('reed_yard.png',       "$YARD Buildings: towers clad in different shades of brick (burgundy, graphite, sand beige) with a regular grid of windows in black frames, dark ground floors with tall glazing.")
  'park3_aerial'    = @('park3_aerial.png',    "$EXT Project: 'Park Pobedy 3' by DOGMA. Buildings have upper floors in light cream-beige smooth plaster with tall French windows in bronze frames and slender metal French balconies, and the lower seven floors clad in dark chocolate-brown brick with tall windows and bronze details, dark ground floor shops; a large green courtyard with a playground between the buildings. Sunny afternoon, clear blue sky.")
  'park3_yard'      = @('park3_yard.png',      "$YARD Buildings: lower seven floors clad in dark chocolate-brown brick with tall windows in dark frames and thin bronze French-balcony rails, upper floors in light cream plaster with tall French windows, double-height ground floor with large glazing.")
  'apt_rough_living'  = @('apt_rough_living.png',  "$INT The room is a large kitchen-living room. $ROUGH")
  'apt_rough_bedroom' = @('apt_rough_bedroom.png', "$INT The room is a bedroom. $ROUGH")
  'apt_dev_living'    = @('apt_dev_living.png',    "$INT The room is a large kitchen-living room. $DEV")
  'apt_dev_bedroom'   = @('apt_dev_bedroom.png',   "$INT The room is a bedroom. $DEV")
  'apt_turn_living'   = @('apt_turn_living.png',   "$INT The room is a large kitchen-living room. $TURN")
  'apt_turn_bedroom'  = @('apt_turn_bedroom.png',  "$INT The room is a bedroom. $TURN")
}
$j = $jobs[$Key]
if (-not $j) { throw "unknown key $Key" }
& powershell -ExecutionPolicy Bypass -File (Join-Path $here "gen_codex.ps1") -Prompt $j[1] -OutDir (Join-Path $here 'renders\photo') -Name $Key -Image (Join-Path $here ('renders\base\' + $j[0]))

