# Ember

A minigame which is about the light should stay alive from getting dark.

**Play:** open `index.html`

## Controls
- Mouse or touch: move the ember
- Click: start / retry
- `M`: sound on/off

## How it's built
- Plain HTML, CSS and JavaScript, no libraries.

## Structure
```
index.html
css/style.css
js/config.js     all tuning values and the colour palette
js/font.js       bitmap font
js/audio.js      sound effects and music
js/input.js      mouse / touch / keyboard
js/world.js      cave background
js/entities.js   player, rain, sparks, particles
js/lighting.js   dithered darkness
js/game.js       game states and rules
js/main.js       canvas setup and game loop
```


