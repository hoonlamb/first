# 09 Figma: DANGQ design system file

**New file:** https://www.figma.com/design/hVf75nORi4pMlShmha3Hts
Name: `댕큐 리프로젝트 — DANGQ Design System (2026)`. It sits in the drafts of the Figma team **Hoonlamab** (account makzm1130@konkuk.ac.kr, student plan, `team::1380229219340981925`).

This is a new, separate file. The original team file (Dangkyu, key `4dPmKvcezjlNoqSP5rw4A1`) and every other existing file were not opened or changed.

## Pages

| Page | Contents |
|---|---|
| 00 Cover | Ink cover (1920×1080). It has the outlined Pretendard horizontal logo, the file title, the concept line "가까워지는 데는 순서가 있어요.", a two-lane graphic, a note that this file is separate from the original team file, and a contents list. |
| 01 Foundations | **Variables:** the collection `DANGQ` (mode `Default`) holds 15 `color/*` variables with role descriptions and WEB code syntax `var(--name)`, 10 `space/s1–s10` variables and 4 `radius/*` variables. **Text styles:** `DANGQ/display, h1, h2, h3, body, small, eyebrow`. **Documentation:** color swatches grouped by role, each labelled with name, hex, `var()` and role, plus the color rules. The page also has a type specimen, a spacing scale bound to the space variables, radius shapes bound to the radius variables, and motion tokens. **Logo components (vector):** `Logo/Mark tone=ink`, `Logo/Mark tone=paper`, `Logo/Horizontal tone=ink` and `Logo/Horizontal tone=paper`. They are rebuilt from the geometry in `Logo.tsx`, the wordmark comes from the Pretendard Black outlines in `04_brand/render/wordmark-paths.json`, and the colors are bound to the variables. Instances show the mark at 80, 48 and 20 px. |
| 02 Screens | Flow: Site → Card → Show → Walk → 나란히 → 사이. There are 15 frames at true size (1440×900 and 390×844). Each frame is named after its PNG and has a short Korean caption. |
| 03 Brand applications | The app icon as a vector, imported from `app-icon.svg`. There are true-size frames for og-1200x630, kv-1920x1080, kv-1080x1350, insta-1/2/3, poster-a-ratio and tag-bandana-mockup, each with a caption. |

## Limitations

1. **The PNG images are not in the file.** `upload_assets` returned upload URLs, but every POST to `mcp.figma.com` failed with `CONNECT tunnel failed, response 403`. This session's network egress policy blocks that host. The figma-use skill does not support creating images inside `use_figma`, so the frames on 02 Screens and 03 Brand applications are placeholders.
   - Each placeholder is named after its PNG and has the right size.
   - To fill one by hand in Figma, drag the PNG in or use Fill → Image, then delete the child layer named "Placeholder label (delete after image fill)".
   - To fill them from a session that can reach mcp.figma.com, run `upload_assets` with `nodeIds`, using the target IDs below.
2. **Pretendard is not available** in this Figma account's font list. The text styles use Noto Sans KR instead: display and h1 use Black, h2, h3 and eyebrow use Bold, body uses Regular and small uses Medium. Each style's description says so. The logo wordmark is unaffected because it uses the outlined Pretendard paths.
3. **The team was chosen for you.** The Figma account has several teams, and the file went to the personal team "Hoonlamab". The file can be moved in Figma if another team is preferred.

## Image target node IDs (for `upload_assets` with `nodeIds`, `scaleMode: FILL`)

02 Screens (page `2:3`):

| file | node |
|---|---|
| site-home-desktop.png | 3:42 |
| site-home-mobile.png | 3:46 |
| app-01-empty.png | 3:57 |
| app-03-comfort.png | 3:61 |
| app-06-done.png | 3:65 |
| app-07-home.png | 3:69 |
| app-08-show.png | 3:80 |
| app-10-walk.png | 3:91 |
| app-11-summary.png | 3:95 |
| app-14-list.png | 3:106 |
| app-15-detail.png | 3:110 |
| app-19-walking.png | 3:114 |
| app-21-tense.png | 3:118 |
| app-23-done.png | 3:122 |
| app-24-bond.png | 3:133 |

03 Brand applications (page `6:2`), with files in `outputs/04_brand/assets/`:

| file | node |
|---|---|
| og-1200x630.png | 6:21 |
| kv-1920x1080.png | 6:30 |
| kv-1080x1350.png | 6:36 |
| insta-1-problem.png | 6:45 |
| insta-2-idea.png | 6:51 |
| insta-3-product.png | 6:57 |
| poster-a-ratio.png | 6:66 |
| tag-bandana-mockup.png | 6:72 |

After an image is filled, delete that frame's placeholder label child. Every frame has auto layout with centered alignment, so the label would otherwise sit on top of the image.
