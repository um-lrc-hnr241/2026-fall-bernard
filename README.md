# Team Bernard: HNR 241 website

## Preview it on your computer
Unzip the folder and double-click `index.html`. Everything works offline except the fonts, which load once you're online.

## Put it on GitHub
1. Open the repo (`um-lrc-hnr241/2026-fall-bernard`) on github.com.
2. Click **Add file > Upload files**.
3. Drag in **everything inside this folder**: the `.html` files and the images, .css and .js files. Keep the folder structure.
4. GitHub will ask to replace `index.html` and `about.html`. That's expected.
5. Click **Commit changes**. The live site updates in a minute or two.

## Add a teammate's build
Open `data.js`. The instructions are at the top. Copy the template block into the `builds` list, fill in the member id, build number, title, summary and paragraphs, and save. The maze, the builds page, that member's page and search all update automatically.

Member ids: `emily`, `sakib`, `alejandro`, `nidhi`, `leah`, `robert`. Use `team` for a group build.

## Fix a name or add a member
Edit the `members` list at the top of `data.js`.

## Add a new build number (Build 6, 7...)
Add `{"n": 6, "name": "Build 6"}` to `slots` in `data.js`. A new ring appears in the maze.

## Edit journal entries
They're in `journals.js`, one entry per prompt per member.

## Files
- `index.html`: home (hero, maze, team, readings)
- `about.html`: About us, how the site works, decisions log
- `builds.html`: the maze of builds, filters and search
- `build.html`: reader for a single build (`build.html?m=emily&n=3`)
- `journals.html`: everyone's answers to each prompt, side by side
- `member.html`: one page per person (`member.html?id=emily`)
- `search.html`: site-wide search results
- `style.css`: all styling
- `site.js`: search, maze and filters (no need to edit)
