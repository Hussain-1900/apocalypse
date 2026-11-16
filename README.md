# APOCALYPSE

A lightweight mobile-friendly zombie survival prototype built in plain HTML, CSS, and JavaScript.

## How to run locally

Open `index.html` in a browser, or run a tiny local web server:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## How to publish with GitHub Pages

1. Push this repository to GitHub.
2. Open the repo on GitHub.
3. Go to `Settings` -> `Pages`.
4. Set Source to `Deploy from a branch`.
5. Choose the `main` branch and `/ (root)` folder.
6. Save.
7. GitHub will generate a URL like:

```text
https://<your-user>.github.io/apocalypse/
```

## Controls

- Move: left on-screen joystick
- Fire: right fire button
- Desktop fallback: WASD + space

## Notes

This is the first prototype stage and is intentionally simple so it is easy to expand later with:

- more zombie types
- more upgrades
- boss waves
- weapon variety
- save system
- full 3D version in a future iteration

## Current gameplay loop

- survive as long as possible
- collect XP and level up
- choose one of three random upgrades
- fight increasing waves
- try to beat your score


