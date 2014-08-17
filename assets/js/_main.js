/*global Cave: false*/

var getElement = function(id)
{
  return document.getElementById(id);
};

var getInput = function(id)
{
  return getElement(id).value;
};

var setInput = function(id, value)
{
  getElement(id).value = value;
};

var getCheckbox = function(id)
{
  return getElement(id).checked;
};

var setCheckbox = function(id, checked)
{
  getElement(id).checked = checked;
};

var importGenInputs = function(O_cave)
{
  var I_generations = parseInt(getInput('gen-step'));
  var I_r1Cutoff = parseInt(getInput('r1-cutoff'));
  var I_r2Cutoff = parseInt(getInput('r2-cutoff'));
  var B_r2CutOff = getCheckbox("b-r2-cutoff");

  if (!isNaN(I_generations) && I_generations > 0)
  {
    O_cave.I_generations = I_generations;
  }

  if (!isNaN(I_r1Cutoff) && I_r1Cutoff >= 0 && I_r1Cutoff <= 9)
  {
    O_cave.I_r1Cutoff = I_r1Cutoff;
  }

  if (!isNaN(I_r2Cutoff) && I_r2Cutoff >= 0 && I_r2Cutoff <= 9)
  {
    O_cave.I_r2Cutoff = I_r2Cutoff;
  }

  getElement("r2-cutoff").disabled = !B_r2CutOff;
  setCheckbox("b-r2-cutoff", B_r2CutOff);
};

var importInitInputs = function(O_cave)
{
  var I_width = parseInt(getInput('width'));
  var I_height = parseInt(getInput('height'));
  var I_wallProb = parseInt(getInput('wall-prob'));

  if (!isNaN(I_width) && I_width > 0)
  {
    O_cave.I_width = I_width;
  }

  if (!isNaN(I_height) && I_height > 0)
  {
    O_cave.I_height = I_height;
  }

  if (!isNaN(I_wallProb) && I_wallProb >= 0 && I_wallProb <= 100)
  {
    O_cave.I_wallProb = I_wallProb;
  }

  importGenInputs(O_cave);
};

var exportAllInputs = function(O_cave)
{
  setInput('width', O_cave.I_width);
  setInput('height', O_cave.I_height);
  setInput('wall-prob', O_cave.I_wallProb);
  setInput('gen-step', O_cave.I_generations);
  setInput('r1-cutoff', O_cave.I_r1Cutoff);
  setInput('r2-cutoff', O_cave.I_r2Cutoff);
  setCheckbox("b-r2-cutoff", O_cave.B_r2Cutoff);
  getElement("r2-cutoff").disabled = !O_cave.B_r2Cutoff;
};

$(document).ready(function()
{
  var O_canvas = getElement('cave');

  var O_newButton = getElement('new');
  var O_generateButton = getElement('generate');
  var O_identifyButton = getElement('identify');
  var O_r2CutoffCheckbox = getElement('b-r2-cutoff');

  O_generateButton.disabled = false;
  O_identifyButton.disabled = false;

  var O_cave = new Cave();
  O_cave.init();
  O_cave.draw(O_canvas);
  O_canvas.innerHTML = O_cave.toHTML();

  exportAllInputs(O_cave);

  O_newButton.onclick = function()
  {
    importInitInputs(O_cave);
    exportAllInputs(O_cave);

    O_generateButton.disabled = false;
    O_identifyButton.disabled = false;

    O_cave.init();
    O_cave.draw(O_canvas);
  };

  O_generateButton.onclick = function()
  {
    importGenInputs(O_cave);
    exportAllInputs(O_cave);

    O_cave.generate();
    O_cave.draw(O_canvas);
  };

  O_identifyButton.onclick = function()
  {
    O_cave.identifyCaves();
    O_cave.draw(O_canvas);
    O_canvas.innerHTML = O_cave.toHTML();

    O_generateButton.disabled = true;
    O_identifyButton.disabled = true;
  };

  O_r2CutoffCheckbox.onclick = function()
  {
    O_cave.B_r2Cutoff = O_r2CutoffCheckbox.checked;
    getElement("r2-cutoff").disabled = !O_cave.B_r2Cutoff;
  };
});


