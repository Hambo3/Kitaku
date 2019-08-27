(function() {
    function Game(map, titlescreen, level) {

        this.titleScreen = titlescreen;

        //tile definitions
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

            Factory.Tile('#4294C4',32)
            ];    

        this.helpCt = 500;
        this.wincnt = 0;
        this.win;
        this.level = level;    
        this.isomode = true;

        var lv = map.levels[this.level];

        //scrolling and map rendering is managed by the mapmanager
        this.scene = new MapManager(map.size, lv, (this.isomode) ? isoTileSet: t2d, this.isomode);

        //a simple object pool for all my objects
        this.assets = new ObjectPool(); 
        this.carSpawn = [];
        this.player;
        this.screen = {w:map.size.screen.width*map.size.tile.width, h:map.size.screen.height*map.size.tile.height};
        
        //initialise the asset positions and spawn points
        var spawn = lv.features.plyrspawn;
        var tw = map.size.tile.width;
        var th = map.size.tile.height;
        this.player = new Player(spawn.x*tw, spawn.y*th);
        this.assets.Add(this.player);
        this.tosave = lv.features.doodspawn.length;

        for (var i = 0; i < this.tosave; i++) {
            spawn = lv.features.doodspawn[i];
            var d = new Dood(spawn.x*tw, spawn.y*th, spawn.t);

            d.target = this.player;
            this.assets.Add(d);
        }

        //mapped stumps
        for (var i = 0; i < lv.features.hard.length; i++) {
            spawn = lv.features.hard[i];
            var d = new Stump(spawn.x*tw, spawn.y*th);
            this.assets.Add(d);
        }

        //rnd stumps
        for (var i = 0; i < lv.st; i++) {            
            do{
                spawn = {x:Util.RndI(0, lv.dim.width),
                    y:Util.RndI(0, lv.dim.height)};
                var t = this.scene.Content(spawn.x*tw, spawn.y*th);
                var tl = this.scene.Content((spawn.x-1)*tw, spawn.y*th);        //check for close to water 13,14,15
                var tr = this.scene.Content((spawn.x+1)*tw, spawn.y*th);        //we want space next to water to be clear of obstructions
                var d = this.assets.Get([Const.actors.dood,Const.actors.stump]);//for easy log exit    
                var dz = d.filter(l => (l.x == spawn.x*tw && l.y == spawn.y*th) );
               
            }while(t > 1 || tl>12 || tr>12 || dz.length != 0);
            var d = new Stump(spawn.x*tw, spawn.y*th);
            this.assets.Add(d);
        }

        AssetUtil.CarSpawn(this.carSpawn, lv.features.carhl, Const.actors.carhl, tw, th);
        AssetUtil.CarSpawn(this.carSpawn, lv.features.carhr, Const.actors.carhr, tw, th);
        AssetUtil.CarSpawn(this.carSpawn, lv.features.carvu, Const.actors.carvu, tw, th);
        AssetUtil.CarSpawn(this.carSpawn, lv.features.carvd, Const.actors.carvd, tw, th);  
        AssetUtil.CarSpawn(this.carSpawn, lv.features.boat, Const.actors.log, tw, th);   
    };

    Game.prototype = {
        Update: function(dt){
            //spawn cars etc
            for (var i = 0; i < this.carSpawn.length; i++) {
                if(this.carSpawn[i].ready == 0){
                    if(this.carSpawn[i].type ==  Const.actors.log){
                        var x = this.carSpawn[i].x;
                        var y =  this.carSpawn[i].y;
                        for (var p = 0; p < Util.RndI(2,4); p++) {
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
                asses[e].Logic(dt);     //do logic
                asses[e].Collider(asses);//check for collisions
                asses[e].Update(dt);        //update positions
            }        

            this.scene.ScrollTo(this.player.x, this.player.y);

            var doods = this.assets.Get([Const.actors.dood]);

            var h = doods.filter(d=>d.status == Const.game.status.home);

            //determine level end
            if( this.wincnt > 0 ){
                this.wincnt--;
                if( this.wincnt == 0 )  {
                    this.titleScreen(this.win, (this.tosave - doods.length));
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
                                    if(d>400){
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

            // if(input.isUp('ESC')){
            //     this.titleScreen(false);
            // }
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
            Renderer.Text("score:"+plyrScore, 32, 24, Const.game.h2, "#fff");
        }
    };

    window.Game = Game;
})();

//title and ancilary screens
(function() {
    function Title(map, gamestart, level, over, lost) {
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
        this.lost = "";
        this.time = 400;
        this.intro = 0;
        this.level = level;
        this.aseq = (level==0);
        var cols =  dCols;
        var fcc = ["#b5af00","#f00","#c10000","#999"];
        this.fc = fcc;
        if(lost > 0){
            var ps = ["Graham","Trevor","Colin","Martin","Geoff"];
            //this.lost 

            var x = "";
            if(lost==1){
                x = Util.OneOf(ps)+ " ";
            }
            else{
                for(var s = 0; s<lost; s++){                                
                    if(s==lost-1){
                        x+="and ";
                    }
                    x+=ps[s]+ " ";
                }
            }

            this.lost = x + Util.OneOf(["didn't make it", "was lost"]);
        }

        this.txt = [      
            [
                {font:font[0], txt:"Kitaku", col:this.fc[0]},
                {txt:null},
                {font:font[2], txt:"Tony, your friends have become lost, again."},
                {font:font[2], txt:"You must save them and bring them back home"},
                {txt:null},
                {font:font[2], txt:"    [W]", col:this.fc[3]},
                {font:font[2], txt:"[A] [S] [D] / [arrow keys] Movement", col:this.fc[3]}
            ],
            [
                {font:font[1], txt:"find your friends"},             
                {img: h1()}
            ],
            [
                {font:font[1], txt:"bring them back"},                
                {img: h2()}
            ],
            [
                {font:font[1], txt:"one at a time"},                
                {img: h3()}
            ],
            [
                {font:font[1], txt:"or altogether"},                
                {img: h4()}
            ]          
        ];
        
        this.lvlInfo = [
            [
                {font:font[0], txt:"level 1"},
                {img: l1([Factory.Boy1(0,cols[0]),Factory.Boy1(0,cols[1])])}
            ],
            [
                {font:font[0], txt:"Level 2"},
                {img: l1([Factory.Boy1(0,cols[0]), Factory.Boy1(0,cols[0]), Factory.Boy1(0,cols[1]), Factory.Boy1(0,cols[2])])}
            ],
            [
                {font:font[0], txt:"Congratulations"},
                {txt:null},
                {font:font[1], txt:"Your a real hero now"},
                {txt:null},
                {font:font[1], txt:"Score: [score]"},
                {txt:null},
                {font:font[1], txt:"[lost]"}
            ],
            [
                {font:font[0], txt:"Game Over"},
                {txt:null},
                {font:font[1], txt:"Everyone is disappointed in you Tony"},
                {txt:null},
                {font:font[1], txt:"Score: [score]"},
                {txt:null},
                {font:font[1], txt:"[lost]"}
            ]    
        ];

        this.chars = Util.ImgTxtArr(["@@@@@@@@@@AIIII@@@A@@@H@H@AHIII@H@A@@@H@H@AIIII@H@A@@@@@H@IIIIIAH@I@@@@AHHH@H@@A@H@IIII@@H@AH@H@@A@AH@H@HA@AH@I@@@@@@@@@@@@@@@@@",
        "@@@@@@@@@@@h@@@@@@@H@@@@@mmmmmm@@A@@@@H@@A@@@IH@@@@II@@@@HIH@@@@@@@H@HIA@@HIIA@@HIAH@@@@@@@H@@@@@@@H@@hE@@@H@@H@@@@Hmmm@@@@@@@@@"
        ]);     

        function l1(spr){
            var tr = helpbg();
            var pt ={x:308,y:116};
            for(var i =0;i<spr.length;i++)
            {
                tr.r.PolySprite(pt.x+(32*i), pt.y-(16*i), spr[i]);    
            }
            return tr.c;
        }

        function h1(){
            var tr = helpbg();
            var pt ={x:308,y:116};
            tr.r.PolySprite(pt.x, pt.y, Factory.Man2() );
            tr.r.PolySprite(pt.x, pt.y-60, Factory.Hat() );
            tr.r.PolySprite(pt.x+192, pt.y-16, Util.FlipX(Factory.Boy1(0)) );

            return tr.c;
        }

        function h2(){
            var tr = helpbg(1);
            var pt ={x:244,y:116};
            tr.r.PolySprite(pt.x, pt.y, Util.FlipX(Factory.Man1(0)) );
            tr.r.PolySprite(pt.x, pt.y-60, Factory.Hat() );
            tr.r.PolySprite(pt.x+96, pt.y-16, Util.Scale(Util.FlipX(Factory.Man1(0)),0.7) );
            return tr.c;
        }

        function h3(){
            var tr = helpbg(1);
            var pt ={x:116,y:148};
            tr.r.PolySprite(pt.x, pt.y, Util.FlipX(Factory.Man1(0)) );
            tr.r.PolySprite(pt.x, pt.y-60, Factory.Hat() );

            tr.r.PolySprite(pt.x+96, pt.y-16, Util.Scale(Util.FlipX(Factory.Man1(0)),0.7) );
            tr.r.ImgText(22, scrs[0], pt.x+80, pt.y-112, 2, fcc[1]);
            return tr.c;
        }
        
        function h4(){
            var tr = helpbg(1);
            var pt ={x:116,y:148};
            tr.r.PolySprite(pt.x, pt.y, Util.FlipX(Factory.Man1(0)) );
            tr.r.PolySprite(pt.x, pt.y-60, Factory.Hat() );

            tr.r.PolySprite(pt.x+64, pt.y-16, Util.Scale(Util.FlipX(Factory.Man1(0)),0.7) );
            tr.r.PolySprite(pt.x+128, pt.y, Util.Scale(Util.FlipX(Factory.Man1(0)),0.7) );

            tr.r.ImgText(22, scrs[0], pt.x+48, pt.y-112, 2, fcc[1]);
            tr.r.ImgText(22, scrs[1], pt.x+112, pt.y-96, 2, fcc[1]);
            return tr.c;
        }
        
        
        function helpbg(h){
            var cv = document.createElement("canvas");
            cv.width = 600;
            cv.height = 200;
    
            this.ctx = cv.getContext("2d");
            var tr = new Rendering(this.ctx);
            tile(tr, -364, 0, 16,16, [ 
                Factory.Tile('#69EA5D',32),
                Factory.Tile('#61D856',32)                
            ], 1, 0);
            if(h)tile(tr, 114, 144, 3,3, [Factory.Tile('#00FFFF',32)], 0,1);
            return {r:tr,c:cv};
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
                    this.time = 400;
                }
            }

            if(this.level <= this.max){
                if(input.isUp('SPACE')){
                    if(this.level == this.max)
                    {
                        this.gover = false;
                        this.time = 400;
                        this.intro = 0;
                        this.level = 0;
                        this.aseq = true;
                    }
                    else if(this.gover){
                        this.gover = false;
                        this.time = 400;
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
                Renderer.ImgText(16, this.chars[i], (16+(i*16))*12, 0, 12, this.fc[2]); 
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

            Renderer.Text("Press [SPACE]", 20, this.screen.h - 32, this.fnt[1], this.fc[3]);
        },
        Screen: function(ct){
            var y = 260;
            for(var i = 0; i < ct.length; i++){    
                var x = 200;               
                if(ct[i].txt){
                    var t = ct[i].txt;
                    t = t.replace("[score]",plyrScore);
                    t = t.replace("[lost]",this.lost);
                    
                    Renderer.Text(t, x, y, ct[i].font, ct[i].col || this.fc[0]);
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