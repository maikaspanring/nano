/**
 * Settings
 */

// DEBUG LEVELS
const ERROR = 1
const WARNING = 2
const INFO = 3
const NOTE = 4
const DEBUG_LEVEL = ERROR // set minimal debug level

// Start ID
var world_id = 0
// seed for random functions
var seed = "5345345"

/**
 * Requires
 */

// Require all classes and data files
require('./js/lib/seedrandom.min.js');
require('./js/lib/functions.lib.js')(); // the "()" activates the functions in the library and puts them into the global functions
const syllables = require('./data/syllables.json')

// Third Party

const { NanoManager } = require('./js/class/nanoManager.class.js');
const { ResourcesManager } = require('./js/class/resourcesManager.class.js');

/**
 * View
 */

// Fires when document is loaded
$( document ).ready(function() {
  Crafty.init(window.innerWidth,window.innerHeight , document.getElementById('game'));
  Crafty.viewport.clampToEntities = false;
  Crafty.viewport.scale(0.8)
  Crafty.viewport.mouselook(1);
  Crafty.bind("MouseWheelScroll", function(evt) {
    Crafty.viewport.scale(Crafty.viewport._scale * (1 + evt.direction * 0.1));
  });
  Crafty.e('2D, Canvas, Color').attr({z: -10, x: 0, y: 0, w: window.innerWidth, h: window.innerHeight}).color('#AAA');

  log(NOTE, "--- START ---")
  log(NOTE, "Node: "+process.versions.node )
  log(NOTE, "Chrome: "+process.versions.chrome )
  log(NOTE, "Electron: "+process.versions.electron )

  Math.random = new Math.seedrandom(seed) // start random seed Math.random()

  Resources = new ResourcesManager();
  Nano = new NanoManager();

  Resources.addResources("fuel");
  Resources.addResources("carbon"); // to make nanotubes

  //Nano.addNanobotHangar("red");
  Nano.addNanobotHangar(1);
  for (i = 0; i < 25; i++) Nano.addNanobot(1);
  //for (i = 0; i < 10; i++) Nano.add("green");
})
