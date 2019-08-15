(function() {
    function Game(map, titlescreen, level) {

        this.titleScreen = titlescreen;

        var isoTileSet = [ 
            Factory.Tile('#69EA5D',32),//grass
            Factory.Tile('#61D856',32),
            Factory.Tile('#F6C996',32),//path
            Factory.Tile('#F3B36E',32),
            Factory.Tile('#C0C0C0',32),//road
            Factory.Tile('#00FFFF',32),//home
            Factory.Tile('#00DBDB',32),

            Factory.Tile('#69EA5D',32),
            Factory.Tile('#61D856',32),
            Factory.Tile('#C0C0C0',32),

            Factory.Tile('#54311D',32),
            Factory.Hole(['#54311D','#744B31'],32),
            Factory.Tile('#744B31',32),

            Factory.Tile('#328DC1',32),
            Factory.Hole(['#328DC1','#4294C4'],32),
            Factory.Tile('#4294C4',32),

            Factory.Tile('#4800FF',32)
            ];    

        this.helpCt = 500;
        this.wincnt = 0;
        this.win;
        this.level = level;    
        this.isomode = true;
        this.scene = new MapManager(map.size, map.levels[this.level], (this.isomode) ? isoTileSet: t2d, this.isomode);
        this.assets = new ObjectPool(); 
        this.carSpawn = [];
        this.player;
        this.screen = {w:map.size.screen.width*map.size.tile.width, h:map.size.screen.height*map.size.tile.height};
        var spawn = map.levels[this.level].features.plyrspawn;
        var tw = map.size.tile.width;
        var th = map.size.tile.height;
        this.player = new Player(spawn.x*tw, spawn.y*th);
        this.assets.Add(this.player);
        this.tosave = map.levels[this.level].features.doodspawn.length;

        for (var i = 0; i < this.tosave; i++) {
            spawn = map.levels[this.level].features.doodspawn[i];
            var d = new Dood(spawn.x*tw, spawn.y*th, spawn.t);

            d.target = this.player;
            this.assets.Add(d);
        }

        //mapped stumps
        for (var i = 0; i < map.levels[this.level].features.hard.length; i++) {
            spawn = map.levels[this.level].features.hard[i];
            var d = new Stump(spawn.x*tw, spawn.y*th);
            this.assets.Add(d);
        }

        //rnd stumps
        for (var i = 0; i < 32; i++) {            
            do{
                spawn = {x:Util.RndI(0, map.levels[this.level].dim.width),
                    y:Util.RndI(0, map.levels[this.level].dim.height)};
                var t = this.scene.Content(spawn.x*tw, spawn.y*th);
                var tl = this.scene.Content((spawn.x-1)*tw, spawn.y*th);//check for close to water 13,14,15
                var tr = this.scene.Content((spawn.x+1)*tw, spawn.y*th);
                var d = this.assets.Get([Const.actors.dood,Const.actors.stump]);
                var dz = d.filter(l => (l.x == spawn.x*tw && l.y == spawn.y*th) );
               
            }while(t > 1 || tl>12 || tr>12 || dz.length != 0);
            var d = new Stump(spawn.x*tw, spawn.y*th);
            this.assets.Add(d);
        }

        AssetUtil.CarSpawn(this.carSpawn, map.levels[this.level].features.carhl, Const.actors.carhl, tw, th);
        AssetUtil.CarSpawn(this.carSpawn, map.levels[this.level].features.carhr, Const.actors.carhr, tw, th);
        AssetUtil.CarSpawn(this.carSpawn, map.levels[this.level].features.carvu, Const.actors.carvu, tw, th);
        AssetUtil.CarSpawn(this.carSpawn, map.levels[this.level].features.carvd, Const.actors.carvd, tw, th);  
        AssetUtil.CarSpawn(this.carSpawn, map.levels[this.level].features.boat, Const.actors.log, tw, th);   
    };

    Game.prototype = {
        Update: function(dt){
            //spawn cars
            for (var i = 0; i < this.carSpawn.length; i++) {
                if(this.carSpawn[i].ready == 0){
                    if(this.carSpawn[i].type ==  Const.actors.log){
                        var x = this.carSpawn[i].x;
                        var y =  this.carSpawn[i].y;
                        for (var p = 0; p < 3; p++) {
                            var c = new Log(x, y );
                            this.assets.Add(c);
                            y-=32;
                        }

                        this.carSpawn[i].ready = parseInt(150 * (5-c.max));
                    }
                    else{
                    var c = new Car(this.carSpawn[i].x, this.carSpawn[i].y, 
                        Util.Rnd(2.5)+1.5, 
                        this.carSpawn[i].type );
                        
                        this.assets.Add(c);
                        var d = new Drone(c);                   
                        this.assets.Add(d);
                        this.carSpawn[i].ready = parseInt(150 * (5-c.max));
                    }
                }
                else{
                    this.carSpawn[i].ready--;
                }
            }

            var asses = this.assets.Get();

            for(var e = 0; e < asses.length; e++) 
            {
                //do move
                asses[e].Logic(dt);
                asses[e].Collider(asses);
                asses[e].Update(dt);
            }        

            this.scene.ScrollTo(this.player.x, this.player.y);

            var doods = this.assets.Get([Const.actors.dood]);

            var h = doods.filter(d=>d.status == Const.game.status.home);

            if( this.wincnt > 0 ){
                this.wincnt--;
                if( this.wincnt == 0 )  {
                    this.titleScreen(this.win);
                }
            }
            else
            {
                if(doods.length == h.length && doods.length > 0 && !this.player.death && this.player.status == Const.game.status.home)
                {
                    this.wincnt = 128;
                    this.win = true;
                }
                else
                {
                    if(this.player.death > 0 || doods.length == 0)
                    {
                        this.wincnt = 128;   
                        this.win = false;
                    }
                }  

                if(this.helpCt>0){
                    this.helpCt--;
                    if(this.helpCt==0){
                        var n = doods.filter(d=>d.status == Const.game.status.lost);
                        if(doods.length == h.length){
                             this.player.help = {d:AssetUtil.Dir(this.player.home, this.player),t:0,c:new N(30,5)};
                        }

                        else{
                            var d = 10000;
                            for(var i = 0; i < n.length; i++) {
                                var d1 = Math.abs(Util.Dist(this.player.x, n[i].x, this.player.y, n[i].y));
                                if(d1<d){
                                    d=d1;
                                    if(d>460){
                                        this.player.help = {d:AssetUtil.Dir(n[i], this.player),t:1,c:new N(30,5)};
                                    }
                                }
                            } 
                            
                        }
                        
                    }    
                }
                else{
                    if(this.player.help == null){
                        this.helpCt = 500;
                    }
                }
            }       

            if(input.isUp('ESC')){
                this.titleScreen(false);
            }
            input.Clr();
        },
        Render: function(){   
            var mp = this.scene.ScrollOffset(); 

            var asses = this.assets.Get();

            asses.sort(function(a, b){
                var p1 = Util.IsoPoint(a.x,a.y);
                var p2 = Util.IsoPoint(b.x,b.y);
                return p1.y - p2.y;
            });

            this.scene.Render();

            for(var e = 0; e < asses.length; e++) {
                asses[e].Render(mp);
            }      
            
            //scores n stuff
            Renderer.DrawBox(0, 0, this.screen.w, 32, 'rgba(0,0,0,0.6)');
            Renderer.Text("P:"+plyrScore, 32, 24, Const.game.h2, "#fff");
        }
    };

    window.Game = Game;
})();


(function() {
    function Title(map, gamestart, level, over) {
        this.screen = {w:map.screen.width*map.tile.width,
                        h:map.screen.height*map.tile.height}; 
        this.startGame = gamestart;

        var font = [
            "bold 48px Arial",
            "24px Arial",
            "16px Arial"
        ];
        this.fnt = font;
        this.max = 2;
        this.gover = over;
        this.time = 240;
        this.intro = 0;
        this.level = level;
        this.aseq = (level==0);
        var c1 = ['#880000','#ff0000'];
        var c2 = ['#555555','#999999'];
        this.txt = [      
            [
                {font:font[0], txt:"Kitaku", col:"#c10000"},
                {txt:null},
                {font:font[2], txt:"Tony, save your family"},
                {font:font[2], txt:"bring them back home"},
                {txt:null},
                {font:font[2], txt:"    [W]"},
                {font:font[2], txt:"[A] [S] [D] / [arrow keys] Movement"}
            ],
            [
                {font:font[1], txt:"find your friends", col:"#c10000"},             
                {img: h1()}
            ],
            [
                {font:font[1], txt:"bring them back home", col:"#c10000"},                
                {img: h2()}
            ],
            [
                {font:font[1], txt:"one at a time", col:"#c10000"},                
                {img: h3()}
            ],
            [
                {font:font[1], txt:"or altogether", col:"#c10000"},                
                {img: h4()}
            ]          
        ];
        
        this.lvlInfo = [
            [
                {font:font[0], txt:"level one", col:"#c10000"},
                {img: l1([Factory.Boy1(0,c1),Factory.Boy1(0,c1)])}
            ],
            [
                {font:font[0], txt:"Level 2", col:"#c10000"},
                {img: l1([Factory.Boy1(0,c1), Factory.Boy1(0,c1), Factory.Boy1(0,c2), Factory.Boy1(0,c2)])}
            ],
            [
                {font:font[0], txt:"Congratulations", col:"#c10000"},
                {txt:null},
                {font:font[1], txt:"Your a real hero now", col:"#c10000"},
                {font:font[1], txt:"[score]", col:"#c10000"}
            ],
            [
                {font:font[0], txt:"Game Over", col:"#c10000"},
                {txt:null},
                {font:font[1], txt:"Everyone is disappointed in you Tony", col:"#c10000"},
                {font:font[1], txt:"[score]", col:"#c10000"}
            ]    
        ];

        this.chars = Util.ImgTxtArr(["@@@@@@@@@@AIIII@@@A@@@H@H@AHIII@H@A@@@H@H@AIIII@H@A@@@@@H@IIIIIAH@I@@@@AHHH@H@@A@H@IIII@@H@AH@H@@A@AH@H@HA@AH@I@@@@@@@@@@@@@@@@@",
        "@@@@@@@@@@@h@@@@@@@H@@@@@mmmmmm@@A@@@@H@@A@@@IH@@@@II@@@@HIH@@@@@@@H@HIA@@HIIA@@HIAH@@@@@@@H@@@@@@@H@@hE@@@H@@H@@@@Hmmm@@@@@@@@@"
        ]);     

        function l1(spr){
            var cv = document.createElement("canvas");
            var tr = helpbg(cv);
            var pt ={x:308,y:116};
            for(var i =0;i<spr.length;i++)
            {
                tr.PolySprite(pt.x+(32*i), pt.y-(16*i), spr[i]);    
            }
            return cv;
        }

        function h1(){
            var cv = document.createElement("canvas");
            var tr = helpbg(cv);
            var pt ={x:308,y:116};
            tr.PolySprite(pt.x, pt.y, Factory.Man2() );
            tr.PolySprite(pt.x, pt.y-60, Factory.Hat() );
            tr.PolySprite(pt.x+192, pt.y-16, Util.FlipX(Factory.Boy1(0)) );

            return cv;
        }

        function h2(){
            var cv = document.createElement("canvas");
            var tr = helpbg(cv);
            tile(tr, 114, 144, 3,3, [Factory.Tile('#00FFFF',32)], 0,1);
            var pt ={x:244,y:116};
            tr.PolySprite(pt.x, pt.y, Util.FlipX(Factory.Man1(0)) );
            tr.PolySprite(pt.x, pt.y-60, Factory.Hat() );
            tr.PolySprite(pt.x+96, pt.y-16, Util.Scale(Util.FlipX(Factory.Man1(0)),0.7) );
            return cv;
        }

        function h3(){
            var cv = document.createElement("canvas");
            var tr = helpbg(cv);
            tile(tr, 114, 144, 3,3, [Factory.Tile('#00FFFF',32)], 0,1);
            var pt ={x:116,y:148};
            tr.PolySprite(pt.x, pt.y, Util.FlipX(Factory.Man1(0)) );
            tr.PolySprite(pt.x, pt.y-60, Factory.Hat() );

            tr.PolySprite(pt.x+96, pt.y-16, Util.Scale(Util.FlipX(Factory.Man1(0)),0.7) );
            tr.ImgText(22, scrs[0], pt.x+80, pt.y-112, 2, "rgba(255,0,0,1)");
            return cv;
        }
        
        function h4(){
            var cv = document.createElement("canvas");
            var tr = helpbg(cv);
            tile(tr, 114, 144, 3,3, [Factory.Tile('#00FFFF',32)], 0,1);
            var pt ={x:116,y:148};
            tr.PolySprite(pt.x, pt.y, Util.FlipX(Factory.Man1(0)) );
            tr.PolySprite(pt.x, pt.y-60, Factory.Hat() );

            tr.PolySprite(pt.x+64, pt.y-16, Util.Scale(Util.FlipX(Factory.Man1(0)),0.7) );
            tr.PolySprite(pt.x+128, pt.y, Util.Scale(Util.FlipX(Factory.Man1(0)),0.7) );

            tr.ImgText(22, scrs[0], pt.x+48, pt.y-112, 2, "rgba(255,0,0,1)");
            tr.ImgText(22, scrs[1], pt.x+112, pt.y-96, 2, "rgba(255,0,0,1)");
            return cv;
        }
        
        
        function helpbg(cv){
            cv.width = 600;
            cv.height = 200;
    
            this.ctx = cv.getContext("2d");
            var tr = new Rendering(this.ctx);
            tile(tr, -364, 0, 16,16, [ 
                Factory.Tile('#69EA5D',32),
                Factory.Tile('#61D856',32)                
            ], 1, 0);
            return tr;
        }
        
        function tile(tr,x1, y1, rs, cs, ts, pp, y2){
            var p=0;
            for(var r = 0; r < rs; r++) 
            {
                var y=y1;
                var x=x1;
                for(var c = 0; c < cs; c++) 
                {
                    tr.PolyTile( x, y, ts[p]); 
                    x+=32;
                    y+=16;    
                }
                x1+=64;
                p=pp-p;
                if(y2){
                    x1-=32;
                    y1-=16;
                }
            }
        }
    };

    Title.prototype = {
        Update: function(dt){

            if(this.time > 0){
                this.time--;
            }
            else{
                this.intro++;
                this.time = 240;
                if(this.intro==this.txt.length){
                    this.intro = 0;
                }
            }

            if(this.level <= this.max){
                if(input.isDown('SPACE')){
                    if(this.level == this.max)
                    {
                        this.gover = false;
                        this.time = 240;
                        this.intro = 0;
                        this.level = 0;
                        this.aseq = true;
                    }
                    else if(this.gover){
                        this.gover = false;
                        this.time = 240;
                        this.intro = 0;
                        this.level = 0;
                        this.aseq = true;
                    }
                    else if(this.aseq){
                        this.aseq = false;
                    }
                    else{
                        this.startGame(this.level);
                    }
                }
            }
            
            input.Clr();
        },
        Render: function(){   
            Renderer.Clear(this.screen.w, this.screen.h);

            for(var i =0;i<this.chars.length;i++){
                Renderer.ImgText(16, this.chars[i], (10+(i*16))*12, 0, 12, "#F00"); 
            }

            if(this.gover){
                var ct = this.lvlInfo[3];
        
                this.Screen(ct);
            }else{
                if(this.aseq){
                    var ct = this.txt[this.intro];
                    this.Screen(ct);
                }
                else{
                    
                    var ct = this.lvlInfo[this.level];                            
                    this.Screen(ct);
                }
            }

            Renderer.Text("Press [START]", 20, this.screen.h - 32, this.fnt[1], '#999999');
        },
        Screen: function(ct){
            var y = 200;
            for(var i = 0; i < ct.length; i++){    
                var x = 100;               
                if(ct[i].txt){
                    var t = ct[i].txt;
                    t = t.replace("[score]",plyrScore);
                    Renderer.Text(t, x, y, ct[i].font, ct[i].col || "#b5af00");
                }
                if(ct[i].img){
                    Renderer.Image(ct[i].img, 100, 300);
                }
                y+=18;
            }
        }
    };

    window.Title = Title;
})();