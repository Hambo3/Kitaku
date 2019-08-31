//handles loading and keeps track of all graphics
//performs all rendering operations
var Rendering = function (context, screen, border) {
    var ctx = context;
    var scale = 1;
    var bounds = null;
    
    if(screen)
    {
        bounds ={
            minx:0, 
            maxx:screen.w, 
            miny:0,
            maxy:screen.h};
    
        if(border){
            bounds.minx -= border.x1,
            bounds.maxx += border.x2,
            bounds.miny -= border.y1,
            bounds.maxy += border.y2
        };    
    }

    function PT(p){
        return Math.round(p*scale);
    }
    function polygon(x, y, poly){
        for(var i = 0; i < poly.length; i++) 
        {
            side(x, y, poly[i]);
        } 
    }

    function side(x, y, plane){
        ctx.fillStyle = plane.col;
        ctx.beginPath();
        ctx.moveTo(PT(plane.pt[0].x + x), PT(plane.pt[0].y + y));

        for(var p = 1; p < plane.pt.length; p++) {
            ctx.lineTo(PT(plane.pt[p].x + x), PT(plane.pt[p].y + y) );   
        }
        ctx.closePath();
        ctx.fill();
    }
    function inBounds(x, y){
        return (!bounds || ((x > bounds.minx && x < bounds.maxx) && (y > bounds.miny  && y < bounds.maxy)) ); 
    }
    return {
        Clear: function(w,h,x,y){
            ctx.clearRect(x||0, y||0, w, h);
        },
        PolyTile: function(x, y, plane){        //ony renders if visible
            if(inBounds(x,y)) {
                side(x, y, plane);
                return 1;
            }
            return 0;
        },
        PolySprite: function(x, y, poly){
            if(inBounds(x,y)) {
                polygon(x, y, poly);    
                return 1;
            }
            return 0;
        },      
        Image: function(c, x, y){
            ctx.drawImage(c,x,y);
        },  
        Text: function(txt, x, y, font, col){
            ctx.font = font;
            ctx.fillStyle = col;
            ctx.fillText(txt, x, y);
        }, 
        DrawBox: function(x, y, w, h, col){
            ctx.fillStyle = col;
            ctx.fillRect(PT(x), PT(y), w, h);
        }, 
        ImgText: function(S, px, x, y, sc,c){
            for(j=0;j<S;j++){
              for(i=0;i<S;i++){
                if(px[j*S+i]){
                    ctx.fillStyle = c;
                    ctx.fillRect(x+(i*sc),y+(j*sc),sc,sc);
                }
              }
            }
        },
        IconText: function(S, px, x, y, sc){
            var C="000000f6bc7969dee2ee7777d761e0ff000453dd50";
            for(j=0;j<S;j++){
                for(i=0;i<S;i++){
                  if(px[j*S+i]){
                        ctx.fillStyle="#"+C.substr(6*(px[j*S+i]-1),6);
                        ctx.fillRect(x+(i*sc),y+(j*sc),sc,sc);
                    }
                }
            }
        }
    }
};