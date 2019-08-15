//handles map rendering and collisons
var MapManager = function (mapdim, mapdata, set, isomode) {
    var mapSize = mapdim;
    var map = unpack(mapdata.data);
    var mapWidth = mapdata.dim.width;
    var mapHeight = mapdata.dim.height;
    var offset = isomode ? {x:16,y:-384} : {x:0,y:0};
    var scroll = {x:0, y:0,
        xoffset:0,yoffset:0};

    var tileset = set;

    function unpack(zip){
        var map = [];
        var v, pts;
        var sec = zip.split("|");
        for(var i = 0; i < sec.length; i++){
            pts= sec[i].split(",");
            v = parseInt(pts[0]);
            map.push(v);
            if(pts.length > 1){                
                for(var p = 1; p < pts[1]; p++){
                    map.push(v);
                }
            }
        }
        var s = "";
        for (var i = 0; i < map.length; i++) {
            s+=map[i]+","           
        }

        return map;
    }
    function hpoint(p, w){
        return Math.floor(p / w);
    }		
    function vpoint(p, h){
        return Math.floor(p / h);
    }
    function cell(x, y){
        var h = hpoint(x, mapSize.tile.width);
        var v = vpoint(y, mapSize.tile.height);
        var p = h + (v * mapWidth);
        return p;
    }
    function content(x,y){
        var cp = map[cell(x, y)];
        return cp;
    }               
    function render(level) {
        var sz = {w:mapSize.screen.width*mapSize.tile.width, h: mapSize.screen.height*mapSize.tile.height};

        // Renderer.Clear(sz.w, sz.h);
        
        var m = 0;
        var p;

        var mcols = mapWidth;
        var col = mapSize.screen.width+1;
        var row = mapSize.screen.height+1;

        if(isomode){   
            col = mapSize.iso.width;
            row = mapSize.iso.height;
        }

        var tc=0;
        for(var r = 0; r < row; r++) 
        {
            for(var c = 0; c < col; c++) 
            {
                m = ((r+scroll.yoffset) * mcols) + (c+scroll.xoffset);
                p = map[m];
                var pt;

                if(isomode){
                    pt = Util.IsoPoint( (c * mapSize.tile.width) + scroll.x + offset.x, 
                        (r * mapSize.tile.height) + scroll.y + offset.y);
                }else{
                    pt = {x:(c * mapSize.tile.width) + scroll.x+offset.x, 
                        y:(r * mapSize.tile.height) + scroll.y+offset.y};
                }                       
                  
                if(tileset[p].length){
                    tc+=Renderer.PolySprite(
                        pt.x, 
                        pt.y, 
                        tileset[p]); 
                }
                else{
                    tc+=Renderer.PolyTile(
                        pt.x, 
                        pt.y, 
                        tileset[p]);  
                }      
 
            }
        }
    }

    return {  
        Cell: function(x, y, d){
            return {x:hpoint(x,d)*d, y:vpoint(y,d)*d};
        },
        Content: function (x, y) {
            return content(x, y);
        },    
        SetMap: function (m) {
            map = m;
        }, 
        IsVisible: function (perp) {
        },  
        ScrollOffset: function () {
            return {x:(scroll.xoffset*mapSize.tile.width)-scroll.x-offset.x,
                y:(scroll.yoffset*mapSize.tile.height)-scroll.y-offset.y};
        }, 
        ScrollTo: function(x, y){
            var midx = ( mapSize.iso.width*mapSize.tile.width) / 2;
            var midy = ( mapSize.iso.height*mapSize.tile.height) / 2;
            var maxx = (mapWidth * mapSize.tile.width) - ( mapSize.iso.width*mapSize.tile.width);
            var maxy = (mapHeight * mapSize.tile.height) - ( mapSize.iso.height*mapSize.tile.height);

            var cpx = (scroll.xoffset*mapSize.tile.width)-scroll.x;
            var cpy = (scroll.yoffset*mapSize.tile.height)-scroll.y;
            var destx = Util.Lerp(cpx, (x-midx), 0.04);
            var desty = Util.Lerp(cpy, (y-midy), 0.04);

            if(destx > 0 && destx < maxx)
            {
                scroll.x = -destx % mapSize.tile.width;
                scroll.xoffset = parseInt(destx / mapSize.tile.width);
            }
            if(desty > 0 && desty < maxy)
            {
                scroll.y = -desty % mapSize.tile.height;
                scroll.yoffset = parseInt(desty / mapSize.tile.height);
            }

        },     
        Render: function () {
            render();            
        }
    }
};