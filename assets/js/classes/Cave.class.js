/* global JSZip: false, JSZipUtils: false, saveAs: false */

function Cave()
{
  this.I_seed = 0;
  this.I_width = 64;
  this.I_height = 64;
  this.I_r1Cutoff = 5;
  this.I_r2Cutoff = 2;
  this.I_wallProb = 40;
  this.I_generations = 5;
  this.I_borderSize = 1;

  this.B_r2Cutoff = true;

  this.O_tiles = new Image();
  this.O_tiles.src="assets/img/tiles.png";
  this.I_tileWidth = 16;
  this.I_tileHeight = 16;
  this.B_tileset = false;

  this.A_cells = [];
  this.curGeneration = 0;
}


/*
 * CONSTANTS
 */

Cave.CELL_TYPE_MASK = 0xff0000;
Cave.CELL_TILE_MASK = 0x00ff00;
Cave.CELL_MISC_MASK = 0x0000ff;

// Cells types
Cave.CELL_FLOOR     = 0x010000;
Cave.CELL_WALL      = 0x020000;
Cave.CELL_TREASURE  = 0x040000;

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
  this.B_tileset = false;
  var I_cell;

  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      if (this.I_borderSize > 0 &&
            ( this.I_borderSize > x || this.I_width-this.I_borderSize <= x ||
              this.I_borderSize > y || this.I_height-this.I_borderSize <= y ) )
      {
        I_cell = Cave.CELL_WALL;
      }
      else
      {
        I_cell = (Math.random() * 100 <= this.I_wallProb) ? Cave.CELL_WALL : Cave.CELL_FLOOR;
      }

      this.A_cells.push( I_cell );
    }
  }
};

Cave.prototype.getNeighborWallCount = function(I_x, I_y, I_rang)
{
  I_rang = (typeof I_rang !== 'undefined') ? I_rang : 1;

  var I_count = 0;
  var I_cellX, I_cellY, A_dir, I_cell;
  var A_dirs = (I_rang > 0 ? Cave.R1_DIRS : Cave.DIRS);

  for (var S_dir in A_dirs)
  {
    A_dir = A_dirs[S_dir];
    I_cellX = I_x + A_dir.x * (I_rang > 0 ? I_rang : 1);
    I_cellY = I_y + A_dir.y * (I_rang > 0 ? I_rang : 1);

    I_cell = this.getCell(I_cellX, I_cellY);

    if (I_cell === false || (I_cell & Cave.CELL_WALL) )
    {
      I_count ++;
    }
  }

  return I_count;
};

Cave.prototype.generate = function()
{
  this.B_tileset = false;

  var I_gen = this.I_generations;
  var I_r0WallCount, I_r1WallCount, I_r2WallCount;

  while(I_gen > 0)
  {
    for (var y=0; y<this.I_height; y++)
    {
      for (var x=0; x<this.I_width; x++)
      {
        I_r1WallCount = this.getNeighborWallCount(x, y, 1);
        I_r2WallCount = this.getNeighborWallCount(x, y, 2);

        if (I_r1WallCount >= this.I_r1Cutoff ||
                  (this.B_r2Cutoff && (I_r2WallCount <= this.I_r2Cutoff)) )
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
  this.B_tileset = false;

  var I_cell, I_newCell = 0x01;

  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      I_cell = this.getCell(x, y);

      if (I_cell === Cave.CELL_FLOOR)
      {
        this.floodFill(x, y, I_cell, I_newCell | Cave.CELL_FLOOR);

        I_newCell = Math.min(I_newCell + 0x01, 0xff);
      }
    }
  }
};

Cave.prototype.removeDisconnectedCaves = function()
{
  this.B_tileset = false;

  var I_mainCellID = this.getMainCaveCellID();
  var I_cell;

  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      I_cell = this.getCell(x, y);

      if (I_cell === (Cave.CELL_FLOOR + I_mainCellID))
      {
        this.setCell(x, y, Cave.CELL_FLOOR);
      }
      else
      {
        this.setCell(x, y, Cave.CELL_WALL);
      }
    }
  }
};

Cave.prototype.placeTreasure = function()
{
  //How hidden does a spot need to be for treasure?
  //I find 5 or 6 is good. 6 for very rare treasure.
  var I_treasureHiddenLimit = 5;
  var I_cell;

  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      I_cell = this.getCell(x, y);

      if(I_cell & Cave.CELL_FLOOR)
      {
          var I_nbs = this.getNeighborWallCount(x, y);
          if(I_nbs >= I_treasureHiddenLimit){
              this.setCell(x, y, Cave.CELL_TREASURE);
          }
      }
    }
  }
};

Cave.prototype.applyTileset = function()
{
  var I_cell, I_tile, A_neighbor;

  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      I_cell = this.getCell(x, y);

      if (I_cell & Cave.CELL_WALL)
      {
        I_tile = 0;
        A_neighbor = this.findNeighborWall(x, y);

        if (A_neighbor.N)
        {
          I_tile += 1;
        }

        if (A_neighbor.S)
        {
          I_tile += 4;
        }

        if (A_neighbor.E)
        {
          I_tile += 2;
        }

        if (A_neighbor.W)
        {
          I_tile += 8;
        }

        this.setCell(x, y, Cave.CELL_WALL + (I_tile << 8));
      }

    }
  }

  this.B_tileset = true;
};

Cave.prototype.getMainCaveCellID = function()
{
  var I_curCellID = 1;
  var I_curCaveCellCount = 0;
  var I_mainCellID = I_curCellID;
  var I_mainCaveCellCount = I_curCaveCellCount;
  var I_cell;

  do
  {
    I_curCaveCellCount = 0;

    for (var y=0; y<this.I_height; y++)
    {
      for (var x=0; x<this.I_width; x++)
      {
        I_cell = this.getCell(x, y);

        if ( (I_cell & Cave.CELL_FLOOR) && (I_cell & Cave.CELL_MISC_MASK) === I_curCellID)
        {
          I_curCaveCellCount ++;
        }
      }
    }

    if (I_curCaveCellCount > I_mainCaveCellCount)
    {
      I_mainCaveCellCount = I_curCaveCellCount;
      I_mainCellID = I_curCellID;
    }

    I_curCellID ++;

  } while(I_curCaveCellCount > 0);

  return I_mainCellID;
};

Cave.prototype.floodFill = function(I_cellX, I_cellY, I_oldCell, I_newCell)
{
  if (I_oldCell === I_newCell)
  {
    return;
  }

  var I_cell = this.getCell(I_cellX, I_cellY);

  var A_cells = [];

  A_cells.push([I_cellX, I_cellY, I_cell]);

  while (A_cells.length > 0)
  {
    var A_cellData = A_cells.pop();

    if (A_cellData[2] === I_oldCell)
    {
      this.setCell(A_cellData[0], A_cellData[1], I_newCell);

      for (var S_Key in Cave.DIRS)
      {
        var A_dir = Cave.DIRS[S_Key];

        var I_x = A_cellData[0] + A_dir.x;
        var I_y = A_cellData[1] + A_dir.y;

        I_cell = this.getCell(I_x, I_y);

        if (I_cell !== false && I_cell === I_oldCell)
        {
          A_cells.push([I_x, I_y, I_cell]);
        }
      }
    }
  }

  return;
};

Cave.prototype.floodFillRecursive = function(I_cellX, I_cellY, I_oldCell, I_newCell)
{
  var I_cell = this.getCell(I_cellX, I_cellY);

  if (I_oldCell === I_newCell || I_cell !== I_oldCell)
  {
    return;
  }

  this.setCell(I_cellX, I_cellY, I_newCell);

  var A_dir;

  for (var S_dir in Cave.DIRS)
  {
    A_dir = Cave.DIRS[S_dir];

    this.floodFill(I_cellX+A_dir.x, I_cellY+A_dir.y, I_oldCell, I_newCell);
  }

  return;
};

Cave.prototype.findNeighborWall = function(I_x, I_y)
{
  var A_neighbor = {};
  var I_cellX, I_cellY, A_dir, I_cell;

  for (var S_dir in Cave.DIRS)
  {
    A_dir = Cave.DIRS[S_dir];
    I_cellX = I_x + A_dir.x;
    I_cellY = I_y + A_dir.y;

    I_cell = this.getCell(I_cellX, I_cellY);

    A_neighbor[S_dir] = (I_cell === false || (I_cell & Cave.CELL_WALL) );
  }

  return A_neighbor;
};

Cave.prototype.exportToTiledJSON = function()
{
  var A_tiled = {};

  A_tiled.version = 1;
  A_tiled.orientation = "orthogonal";
  A_tiled.width = this.I_width;
  A_tiled.height = this.I_height;
  A_tiled.tilewidth = this.I_tileWidth;
  A_tiled.tileheight = this.I_tileHeight;

  // layers
  A_tiled.layers = [];

  A_tiled.layers[0] = {};
  A_tiled.layers[0].x = 0;
  A_tiled.layers[0].y = 0;
  A_tiled.layers[0].width = A_tiled.width;
  A_tiled.layers[0].height = A_tiled.height;
  A_tiled.layers[0].visible = true;
  A_tiled.layers[0].opacity = 1;
  A_tiled.layers[0].type = "tilelayer";
  A_tiled.layers[0].name = "Cave";
  A_tiled.layers[0].data = [];

  //properties
  A_tiled.properties = {};

  //tilesets
  A_tiled.tilesets = [];

  A_tiled.tilesets[0] = {};
  A_tiled.tilesets[0].firstgid = 1;
  A_tiled.tilesets[0].image = "tiles.png";
  A_tiled.tilesets[0].imagewidth = A_tiled.tilewidth * 16;
  A_tiled.tilesets[0].imageheight = A_tiled.tileheight;
  A_tiled.tilesets[0].tilewidth = A_tiled.tilewidth;
  A_tiled.tilesets[0].tileheight = A_tiled.tileheight;
  A_tiled.tilesets[0].margin = 0;
  A_tiled.tilesets[0].spacing = 0;
  A_tiled.tilesets[0].name = "tiles";
  A_tiled.tilesets[0].properties = {};

  var I_cell, I_tile, A_neighbor;

  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      I_cell = this.getCell(x, y);
      I_tile = 0;

      if (I_cell & Cave.CELL_WALL)
      {
        I_tile = (I_cell & Cave.CELL_TILE_MASK) >> 8;
        I_tile += 1;
      }

      A_tiled.layers[0].data.push(I_tile);
    }
  }




  JSZipUtils.getBinaryContent(this.O_tiles.src, function (err, data) {
      if(err) {
        console.log(err);
        throw err; // or handle the error
      }

      var zip = new JSZip();

      zip.file("cave.tmx.json", JSON.stringify(A_tiled));

      zip.file(A_tiled.tilesets[0].image, data, {binary:true});

      var content = zip.generate({type:"blob"});

      saveAs(content, "cave.json.zip");
  });
};

Cave.prototype.exportToPhaserLayer = function(map, layer)
{
  var I_cell, I_tile, A_neighbor;

  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      I_cell = this.getCell(x, y);
      I_tile = null;

      if (I_cell & Cave.CELL_WALL)
      {
        I_tile = 0;
        A_neighbor = this.findNeighborWall(x, y);

        if (A_neighbor.N)
        {
          I_tile += 1;
        }

        if (A_neighbor.S)
        {
          I_tile += 4;
        }

        if (A_neighbor.E)
        {
          I_tile += 2;
        }

        if (A_neighbor.W)
        {
          I_tile += 8;
        }
      }

      map.putTile(I_tile, x, y, layer);
    }
  }
};

Cave.prototype.draw = function(O_canvas)
{
  //var I_cellWidth = O_canvas.width / this.I_width;
  var I_cellWidth = this.I_tileWidth;
  var I_cellHeight = I_cellWidth;

  O_canvas.width = I_cellWidth * this.I_width;
  O_canvas.height = I_cellHeight * this.I_height;

  var ctx = O_canvas.getContext("2d");

  ctx.clearRect(0, 0, O_canvas.width, O_canvas.height);
  ctx.fillStyle = "#555";
  ctx.fillRect(0, 0, O_canvas.width, O_canvas.height);

  var I_cell, I_tile;
  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      I_cell = this.getCell(x, y);
      I_tile = -1;

      if (I_cell & Cave.CELL_FLOOR)
      {
        var I_floorID = I_cell - Cave.CELL_FLOOR;

        switch (I_floorID)
        {
          case 0:
            ctx.fillStyle = "#555";
            break;
          case 1:
            ctx.fillStyle = "#aaf";
            break;
          case 2:
            ctx.fillStyle = "#faf";
            break;
          case 3:
            ctx.fillStyle = "#afa";
            break;
          case 4:
            ctx.fillStyle = "#ffa";
            break;
          case 5:
            ctx.fillStyle = "#7ff";
            break;
          case 6:
            ctx.fillStyle = "#f7a";
            break;
          default:
            ctx.fillStyle = "#ff0";
            break;
        }

      }
      else if (I_cell & Cave.CELL_WALL)
      {
        if (this.B_tileset)
        {
          I_tile = (I_cell & Cave.CELL_TILE_MASK)  >> 8;

          ctx.drawImage(this.O_tiles, I_tile*this.I_tileWidth, 0, this.I_tileWidth, this.I_tileHeight,
                          x*I_cellWidth, y*I_cellHeight, I_cellWidth, I_cellHeight);

          continue;
        }

        ctx.fillStyle = "#000";
      }
      else
      {
        ctx.fillStyle = "#f0f";
      }

      ctx.fillRect(x*I_cellWidth, y*I_cellHeight, I_cellWidth, I_cellHeight);
    }
  }

};

Cave.prototype.toString = function(S_nl, S_sep)
{
  S_nl = (typeof S_nl === 'string') ? S_nl : "\n";
  S_sep = (typeof S_sep === 'string') ? S_sep : "";

  var S_string = "";
  var I_cell;

  for (var y=0; y<this.I_height; y++)
  {
    for (var x=0; x<this.I_width; x++)
    {
      I_cell = this.getCell(x, y);

      if (I_cell & Cave.CELL_FLOOR)
      {
        S_string += "00";
      }
      else if (I_cell & Cave.CELL_WALL)
      {
        // S_string += "2";
        var I_tile = (I_cell & Cave.CELL_TILE_MASK)  >> 8;
        S_string += (I_tile+10).toString();
      }

      S_string += S_sep;
    }

    S_string += S_nl;
  }

  return S_string;
};

Cave.prototype.toHTML = function()
{
  return this.toString("\n", ", ");
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
