
var sys = require("sys");
var fs = require("fs");
var spawn = require("child_process").spawn;

exports.run = run;

function run (args) {
  sys.debug("args: "+args);
  var arg, next, watch, program;
  while (arg = args.shift()) {
    sys.debug("arg: "+arg);
    if (arg === "--help" || arg === "-h" || arg === "-?") {
      return help();
    } else if (arg === "--program" || arg === "-p") {
      next = "program";
    } else if (arg === "--watch" || arg === "-w") {
      next = "watch";
    } else if (next === "watch") {
      watch = arg;
    } else if (next === "program") {
      program = arg;
    } else {
      program = arg;
    }
  }
  // if we have a program, then run it, and restart when it crashes.
  // if we have a watch folder, then watch the folder for changes and restart the prog
  if (!program) {
    throw new Error("No program specified.");
  }
  startProgram(program);
  if (watch) watchFile(watch);
};

function print (m, n) { sys.print(m+(!n?"\n":"")); return print }

function help () {
  print
    ("Supervisor is used to restart programs when they crash.")
    ("It can also be used to restart programs when a folder or file changes.")
    ("Usage:")
    ("  supervisor [options] program")
    ("")
    ("Options:")
    ("  -w|--watch <folder>")
    ("    Watch a folder for changes. When a change occurs, reload the program")
    ("")
    ("  -p|--program <program>")
    ("    The program to run")
    ("")
    ("  -h|--help|-?")
    ("    Help")
}

function startProgram (prog) {
  sys.debug("Starting child: "+prog);
  var child = exports.child = spawn("node", [prog]);
  child.stdout.addListener("data", function (chunk) { chunk && sys.print(chunk) });
  child.stderr.addListener("data", function (chunk) { chunk && sys.debug(chunk) });
  child.addListener("exit", function () { startProgram(prog) });
}

var timer = null, counter = -1, mtime = null;
function crash (oldStat, newStat) {
  
  // we only care about modification time, not access time.
  if (
    newStat.mtime.getTime() === oldStat.mtime.getTime()
  ) return;

  if (counter === -1) {
    timer = setTimeout(stopCrashing, 1000);
  }
  counter ++;
  
  var child = exports.child;
  sys.debug("crashing child");
  process.kill(child.pid);
}

function stopCrashing () {
  if (counter > 1) throw new Error("Crashing too much, shutting down");
  else counter = -1;
}

function watchFile (watch) {
  fs.watchFile(watch, crash);
}
