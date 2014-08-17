function Cave()
{
  this.I_seed = 0;
  this.I_width = 64;
  this.I_height = 64;
  this.I_r1Cutoff = 5;
  this.I_r2Cutoff = 2;
  this.I_wallProb = 40;
  this.I_generations = 1;

  this.B_r2Cutoff = true;

  this.A_cells = [];
  this.curGeneration = 0;
}


/*
 * CONSTANTS
 */

Cave.CELL_FLOOR     = 0x0000100;
Cave.CELL_WALL      = 0x0000200;

Cave.DIRS     = {
                  N: { x:  0, y: -1 },
                  S: { x:  0, y:  1 },
                  E: { x:  1, y:  0 },
                  W: { x: -1, y:  0 }
                };

Cave.R1_DIRS  = {
                  X:  { x:  0, y:  0 },
                  N:  { x:  0, y: -1 },
                  S:  { x:  0, y:  1 },
                  E:  { x:  1, y:  0 },
                  W:  { x: -1, y:  0 },
                  NE: { x:  1, y: -1 },
                  NW: { x: -1, y: -1 },
                  SE: { x:  1, y:  1 },
                  SW: { x: -1, y:  1 },
                };


/*
 * METHODS
 */

Cave.prototype.init = function()
{
  this.I_seed = Math.round(Math.random() * 999999);
  this.A_cells = [];
  this.curGeneration = 0;

  for (var i=0; i<this.I_width*this.I_height; i++)
  {
    this.A_cells.push( (Math.random() * 100 <= this.I_wallProb) ? Cave.CELL_WALL : Cave.CELL_FLOOR );
  }
};

Cave.prototype.getNeighborWallCount = function(I_x, I_y, I_rang)
{
  I_rang = (typeof I_rang !== 'undefined') ? I_rang : 1;

  var I_count = 0;
  var I_cellX, I_cellY, A_dir, I_cell;

  for (var S_dir in Cave.R1_DIRS)
  {
    A_dir = Cave.R1_DIRS[S_dir];
    I_cellX = I_x + A_dir.x * I_rang;
    I_cellY = I_y + A_dir.y * I_rang;

    I_cell = this.getCell(I_cellX, I_cellY);

    if (I_cell === false || (I_cell === Cave.CELL_WALL) )
    {
      I_count ++;
    }
  }

  return I_count;
};

Cave.prototype.generate = function()
{
  var I_gen = this.I_generations;

  while(I_gen > 0)
  {
    for (var y=0; y<this.I_height; y++)
    {
      for (var x=0; x<this.I_width; x++)
      {
        var I_r1WallCount = this.getNeighborWallCount(x, y);
        var I_r2WallCount = this.getNeighborWallCount(x, y, 2);

        if (
            I_r1WallCount >= this.I_r1Cutoff ||
            (this.B_r2Cutoff && (I_r2WallCount <= this.I_r2Cutoff))
          )
          {
            this.setCell(x, y, Cave.CELL_WALL);
          }
          else
          {
            this.setCell(x, y, Cave.CELL_FLOOR);
          }
      }
    }

    I_gen --;
    this.curGeneration ++;
  }
};

Cave.prototype.identifyCaves = function()
{
  var I_cell, I_newCell = 0x01;

  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      I_cell = this.getCell(x, y);

      if (I_cell === Cave.CELL_FLOOR)
      {
        this.floodFill(x, y, I_cell, I_newCell | Cave.CELL_FLOOR);

        I_newCell = I_newCell + 0x01;
      }
    }
  }
};

Cave.prototype.floodFill = function(I_cellX, I_cellY, I_oldCell, I_newCell)
{
  var I_cell = this.getCell(I_cellX, I_cellY);

  if (I_oldCell === I_newCell || I_cell !== I_oldCell)
  {
    return;
  }

  this.setCell(I_cellX, I_cellY, I_newCell);

  var A_dir;

  for (var S_dir in Cave.R1_DIRS)
  {
    A_dir = Cave.R1_DIRS[S_dir];

    this.floodFill(I_cellX+A_dir.x, I_cellY+A_dir.y, I_oldCell, I_newCell);
  }

  return;
};

Cave.prototype.draw = function(O_canvas)
{
  //var I_cellWidth = O_canvas.width / this.I_width;
  var I_cellWidth = 4;
  var I_cellHeight = I_cellWidth;

  O_canvas.width = I_cellWidth * this.I_width;
  O_canvas.height = I_cellHeight * this.I_height;

  var ctx = O_canvas.getContext("2d");


  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      // switch (this.getCell(x, y))
      // {
      //   case Cave.CELL_FLOOR:
      //     ctx.fillStyle = "#ccc";
      //     break;
      //   case Cave.CELL_WALL:
      //     ctx.fillStyle = "#444";
      //     break;
      //   default:
      //     ctx.fillStyle = "#f0f";
      //     break;
      // }

      var I_cell = this.getCell(x, y);

      if (I_cell & Cave.CELL_FLOOR)
      {
        var I_floorID = I_cell - Cave.CELL_FLOOR;

        switch (I_floorID)
        {
          case 0:
            ctx.fillStyle = "#ccc";
            break;
          case 1:
            ctx.fillStyle = "#aaf";
            break;
          case 2:
            ctx.fillStyle = "#faa";
            break;
          case 3:
            ctx.fillStyle = "#afa";
            break;
          case 4:
            ctx.fillStyle = "#ffa";
            break;
          case 5:
            ctx.fillStyle = "#aff";
            break;
          case 6:
            ctx.fillStyle = "#faf";
            break;
          default:
            ctx.fillStyle = "#ff0";
            break;
        }

      }
      else if (I_cell & Cave.CELL_WALL)
      {
        ctx.fillStyle = "#444";
      }
      else
      {
        ctx.fillStyle = "#f0f";
      }

      ctx.fillRect(x*I_cellWidth, y*I_cellHeight, I_cellWidth, I_cellHeight);
    }
  }

};

Cave.prototype.toString = function(S_nl)
{
  S_nl = (typeof S_nl === 'string') ? S_nl : "\n";

  var S_string = "";

  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      switch (this.getCell(x, y))
      {
        case Cave.CELL_FLOOR:
          S_string += ".";
          break;
        case Cave.CELL_WALL:
          S_string += "#";
          break;
        default:
          S_string += "'" + this.getCell(x, y) + "'";
          break;
      }
    }
    S_string += S_nl;
  }

  return S_string;
};

Cave.prototype.toHTML = function()
{
  return this.toString("<br/>\n");
};

// Getters & Setters
Cave.prototype.outOfBounds = function(I_x, I_y)
{
  return (I_x < 0 || I_x >= this.I_width ||
      I_y < 0 || I_y >= this.I_height);
};

Cave.prototype.getCell = function(I_x, I_y)
{
  if (this.outOfBounds(I_x, I_y))
  {
    return false;
  }

  return this.A_cells[I_x + this.I_width * I_y];
};

Cave.prototype.setCell = function(I_x, I_y, I_value)
{
  if (this.outOfBounds(I_x, I_y))
  {
    return false;
  }

  this.A_cells[I_x + this.I_width * I_y] = I_value;

  return this;
};
