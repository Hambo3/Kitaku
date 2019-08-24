//Player
(function() {

    function Player(x, y) {
        this.type = Const.actors.player;
        this.enabled = true;

        this.home = {x:x,y:y};
        this.x = x;
        this.y = y;
        this.z = 0;
        this.width = 32;
        this.length = 32;

        this.dx = 0;
        this.dy = 0; 
        this.dz = 0;

        this.bonus = 0;
        this.amount = 1;
        this.death = false;
        this.jumping = false;
        this.dest = {x:0, y:0};

        this.accel = 90;  

        this.action = Const.actions.up;
        this.status = 0;

        this.anims = [];
        this.anims.push(new AnimObj(0, -60, 0, Factory.Hat()));

        this.ride ={on:null, a:0};
        this.help = null;
        
        this.shadow = [ Factory.Tile('rgba(100, 100, 100, 0.3)', this.width) ];        
        this.body= [
            Factory.Man2(0),
            Util.FlipX(Factory.Man1(0)),            
            Util.FlipX(Factory.Man2(0)),
            Factory.Man1(0),
            [],
            [],
            Factory.Flat()];

            this.reset = function(die){
                if(die==true){
                    this.death = die;
                }
                this.jumping = false;
                this.dx = 0;
                this.dy = 0;
                this.z = 0;
            }
    };

    Player.prototype = {
        
        Logic: function(dt){
            var speed = this.accel * dt;

            if(this.death == false){
                if(!this.jumping){
                    var inp = {
                                up: this.ride.a != 2 && (input.isDown('UP') || input.isDown('W') ),
                                down: this.ride.a != 2 && (input.isDown('DOWN') || input.isDown('S') ),
                                left: (input.isDown('LEFT') || input.isDown('A') ),
                                right: (input.isDown('RIGHT') || input.isDown('D') )
                            };

                
                    AssetUtil.InputLogic(inp, this, speed, 32);
                    if(this.ride.a == 2)
                    {
                        if(this.ride.on !=null && !this.ride.on.enabled)
                        {
                            this.ride.a = 0;
                            this.reset(true);
                        }
                        if(this.jumping){
                            this.ride = {on:null, a:3};
                        }

                    }
                }
                else
                {
                    var t = AssetUtil.HopLogic(this, 32, 16);
                    if(!this.jumping)// landed
                    {
                        this.status = 0;
                        //check what landed on
                        if(map.colliders.over.indexOf(t) != -1){ 
                            
                            if(t > 12 && t < 16){//water
                                if(this.ride.a == 1){
                                    this.ride.a = 2;
                                }
                                else{
                                    this.ride.a = 0;
                                    this.action = Const.actions.splash; 
                                    this.anims[0].enabled = false;
                                    for(var i=0;i<8;i++){                                              
                                        this.anims.push(new AnimObj(0, 0, 60, 
                                            Factory.Cube(['#2BA6FF','#49B3FF','#77C6FF'], Util.RndI(6,8)), true )
                                        );
                                    }
                                }
                            }
                            else{
                                this.action = Const.actions.fall;
                                for(var i=0;i<this.anims.length;i++){                                              
                                    this.anims[i].d.x = 0;
                                    this.anims[i].d.y = -48;
                                    this.anims[i].ct = 80;
                                    this.anims[i].die = true;
                                }
                            }  
                            if(this.ride.a == 0){
                                this.reset(true);
                            }

                        }
                        else{
                            this.ride = {on:null, a:0};
                            var c = gameAsset.scene.Cell(this.x, this.y, 16);
                            this.x = c.x;
                            this.y = c.y;
                        }

                        if(map.colliders.home.indexOf(t) != -1){  //is home
                            this.status = Const.game.status.home;
                        }                        
                    }
                }
            }

        },
        Update: function(dt){
            if(this.ride.a == 2){
                this.x = this.ride.on.x;
                this.y = this.ride.on.y;
            }
            else{
                this.x += this.dx;
                this.y += this.dy;
            }

            for(var i=0;i<this.anims.length;i++){
                if(this.anims[i].enabled){                    
                    this.anims[i].Update(dt);
                }
            }
            if(this.bonus > 0){
                this.bonus--;
                if(this.bonus == 0){
                    this.amount = 1;
                }
            }

        },
        Collider: function(perps){
                
            if(this.ride.a == 0){
                if(this.jumping){
                    //determine if can jump
                    var d = AssetUtil.Collisions(this, perps, this.jumping);

                    if(d && (d.type == Const.actors.stump || d.type == Const.actors.dood)){
                        this.reset();
                    }
                } 

                //if hit something
                var d = AssetUtil.Collisions(this, perps, false);
                if(d && d.type == Const.actors.log){
                    this.ride = {on:d, a:1};
                }
                else if(d && d.type >= Const.actors.carhr && d.type <= Const.actors.drone){
                    this.reset(true);

                    this.action = Const.actions.squash;
                    for(var i=0;i<this.anims.length;i++){                                              
                        this.anims[i].ct = 80;
                    }
                }
            }

        },
        Render: function(os){
                var x = this.x;
                var y = this.y;

                var pt = Util.IsoPoint(x-os.x, y-os.y);
                if(!this.death){
                    Renderer.PolySprite(pt.x, pt.y, this.shadow);
                }
                Renderer.PolySprite(pt.x, pt.y-this.z, this.body[this.action] );
                for(var i=0;i<this.anims.length;i++){
                    if(this.anims[i].enabled){   
                        this.anims[i].p.y = pt.y-this.z;   
                        this.anims[i].p.x = pt.x;                   
                        this.anims[i].Render();
                    }
                }

                if(this.help != null){
                    var s = this.help.c.S();    
                    var d = this.help.d;   
                    var x = 400;
                    var y = 300;             
                    if(s.v){
                        if(d.right){
                            x=600;y=458;
                        }
                        else if (d.left){
                            x=150;y=100;
                        }else if (d.up){
                            y=100;x=600;
                        }else if (d.down){
                            y=458;x=150;
                        }
                        Renderer.ImgText(29, go[this.help.t], x, y, 2, "rgba(255,0,0,1)"); 
                    }
                    if(!s.a)this.help = null;
                }
        }
    };

    window.Player = Player;
})();

//dood
(function() {

    function Dood(x, y, t) {
        this.type = Const.actors.dood;
        this.enabled = true;
        this.death = 0;
        this.hold = 0;
        this.x = x;
        this.y = y;
        this.z = 0;
        this.width = 24;
        this.length = 24;
        this.ol = false;
        this.range ={ see: (7*32),
                     follow:{min:(2*32), max:(5*32)}
                 };

        this.accel = 70;  
        var col = dCols[t];
        t=0;

        this.ride ={on:null, a:0};//0 none, 1 before ride, 2 riding, 3 after ride

        this.dx = 0;
        this.dy = 0; 
        this.dz = 0;

        this.jumping = false;
        this.dest = {x:0, y:0};        

        this.status = Const.game.status.lost;

        this.target = null;
        this.shadow = [ Factory.Tile('rgba(100, 100, 100, 0.3)', this.width) ]; 
 
        this.action = Const.actions.up;

        this.anims = [];  
        
        this.value = {val:0,x:0,y:0,f:0};

        var bodies = [
            [
                Factory.Boy2(0, col),
                Util.FlipX(Factory.Boy1(0, col)),
                Util.FlipX(Factory.Boy2(0, col)),
                Factory.Boy1(0, col),
                [],
                [],
                Factory.Flat(col),
                Factory.Boy2(1, col),
                Util.FlipX(Factory.Boy1(1, col)),
                Util.FlipX(Factory.Boy2(1, col)),
                Factory.Boy1(1, col)
            ]
        ];

        this.body = bodies[t];
    };

    Dood.prototype = {
        Logic: function(dt){
            var speed = this.accel * dt;
            if(this.death > 0){
                this.death--;
                if(this.death == 0){
                    this.enabled = false;
                }
            }
            else{
                if(this.target){ 
                    if(this.hold > 0){
                        this.jumping = false;
                        this.hold--;
                    }   
                    else{
                        if(!this.jumping){
                            var inp = AssetUtil.Dir(this.target, this)
    
                            if( inp.d < this.range.follow.max && inp.d > this.range.follow.min ){
                                if(this.status == Const.game.status.lost){
                                    this.status = Const.game.status.follow;
                                }
                                this.range.follow.max = 10000;
                
                                AssetUtil.InputLogic(inp, this, speed, 16); 
                                if(this.ride.a == 2 && this.jumping){
                                    this.ride = {on:null, a:3};
                                }
                            }
                            else if( inp.d < this.range.see && this.status != Const.game.status.follow){
                                if(inp.right){
                                    this.action = this.ol ? Const.actions.waveleft : Const.actions.waveright;
                                }
                                else if (inp.left){
                                    this.action =  this.ol ? Const.actions.waveright : Const.actions.waveleft;
                                }
                                else if (inp.up){
                                    this.action = this.ol ? Const.actions.wavedown : Const.actions.waveup;
                                }else if (inp.down){
                                    this.action = this.ol ? Const.actions.waveup : Const.actions.wavedown; 
                                }
                            }
                    
                        }
                        else{
                            var t = AssetUtil.HopLogic(this, this.ride.a==2 ? 32 : 16, this.ride.a==2 ? 16 : 8);
                            if(this.status !=  Const.game.status.home){
                                if(!this.jumping)// landed
                                {
                                    if(map.colliders.over.indexOf(t) != -1){                                     
                                        if(t > 12 && t < 16){//water
                                            if(this.ride.a == 1){
                                                this.ride.a = 2;
                                            }
                                            else{
                                                this.action = Const.actions.splash; 
                                                for(var i=0;i<8;i++){                                              
                                                    this.anims.push(new AnimObj(0, 0, 60, 
                                                        Factory.Cube(['#2BA6FF','#49B3FF','#77C6FF'], Util.RndI(6,8)), true )
                                                    );
                                                }
                                            }
                                        }
                                        else{
                                            this.action = Const.actions.fall;
                                            for(var i=0;i<this.anims.length;i++){                                              
                                                this.anims[i].ct = 80;
                                            }
                                        } 
    
                                        if(this.ride.a == 0){
                                            this.death = 5000;
                                            this.jumping = false;
                                            this.dx = 0;
                                            this.dy = 0;
                                            this.z = 0;
                                            this.type = Const.actors.null;
                                        }
                                    }
                                    else{
                                        if(this.ride.a == 3){
                                        this.ride = {on:null, a:0};
                                        var c = gameAsset.scene.Cell(this.x, this.y,32);
                                        this.x = c.x;
                                        this.y = c.y;
                                        }
                                    }
    
                                    if(map.colliders.home.indexOf(t) != -1){  //is home
                                        this.status = Const.game.status.home;
                                        
                                        if(this.target.bonus > 0){
                                            this.target.amount ++;
                                        }
                                        plyrScore += (100 * this.target.amount);
                                        this.target.bonus = 500;
                                        this.value = {val:this.target.amount, x:-16, y:-112, f:64};
                                        this.target = this.target.home;
                                        this.range.follow.min = 32;
                                    }
                                }
                            }
                        }
                    }            

                }
            }
        },
        Update: function(dt){
            if(this.ride.a == 2){
                this.x = this.ride.on.x;
                this.y = this.ride.on.y;
            }
            else{
                this.x += this.dx;
                this.y += this.dy;
            }

            for(var i=0;i<this.anims.length;i++){
                if(this.anims[i].enabled){                    
                    this.anims[i].Update(dt);
                }
            }
            
        },
        Collider: function(perps){
            if(this.ride.a == 0){
                if(this.jumping){
                    var d = AssetUtil.Collisions(this, perps, this.jumping);

                    if(d && (d.type == Const.actors.stump || d.type == Const.actors.player || d.type == Const.actors.dood)) {
                        this.jumping = false;
                        this.dx = 0;
                        this.dy = 0;
                        this.z = 0;
                    }
                }
                //if hit something
                var d = AssetUtil.Collisions(this, perps, false);
                if(d && d.type == Const.actors.log){
                    this.ride = {on:d, a:1};
                }
                else if(d && d.type >= Const.actors.carhr && d.type <= Const.actors.drone){
                    //this.enabled = false;
                    this.death = 5000;
                    this.jumping = false;
                    this.dx = 0;
                    this.dy = 0;
                    this.z = 0;
                    this.action = Const.actions.squash;
                    this.type = Const.actors.null;
                }
            }
        },
        Render: function(os){
                var x = this.x;
                var y = this.y;    

                var pt = Util.IsoPoint(x-os.x, y-os.y);
                if(this.death==0){
                    Renderer.PolySprite(pt.x, pt.y, this.shadow);
                }
                Renderer.PolySprite(pt.x, pt.y-this.z,  this.body[this.action]);

                if(this.value.f > 1 && this.value.val > 0){
                    Renderer.ImgText(22, scrs[this.value.val-1], pt.x-16, pt.y-112, 2, "rgba(255,0,0,"+((this.value.f--)/100)+")"); 
                }

                for(var i=0;i<this.anims.length;i++){
                    if(this.anims[i].enabled){   
                        this.anims[i].p.y = pt.y-this.z;   
                        this.anims[i].p.x = pt.x;   
                   
                        this.anims[i].Render();
                    }
                }
        }
    };

    window.Dood = Dood;
})();

//car
(function() {

    function Car(x, y, maxs, type) {
        this.type = type;
        this.enabled = true;
        this.x = x;
        this.y = y;
        this.z = 0;
        this.width = 32;
        this.length = 32;

        this.dx = 0;
        this.dy = 0; 
        this.dz = 0;

        this.skip = 0;
        this.stop = 0;
        this.driving = 0;
        this.dest = {x:0, y:0};

        this.accel = 2;  
        this.max = maxs;

        var c = maxs<2 ? 0 : (maxs < 3.2 ? 1 : 2);
        this.cols = [
            ["#6287BF","#4D67A7","#94B7CD"],
            ["#FDB42B","#B46219","#FFC030"],
            ["#DA4938","#831816","#F16152"]
        ];
        this.color = this.cols[c];
        var b = [Util.Scale( Factory.CarF(this.cols[c]) ,1),
                Util.Scale( Factory.CarB(this.cols[c]) ,1),
                Util.Scale( Util.FlipX(Factory.CarB(this.cols[c])) ,1),
                Util.Scale( Util.FlipX(Factory.CarF(this.cols[c])) ,1)];

        this.body = b[this.type- Const.actors.carhr];       
    };

    Car.prototype = {
        Logic: function(dt){
            var speed = this.accel * dt;
            var friction = Const.game.friction * dt; 

            if(this.driving==0){ 
                if(this.type == Const.actors.carhl){
                    this.dx -= (this.dx > -this.max) ? speed : 0;   
                    this.dest = {x: this.x-64, y: this.y};
                }
                else if(this.type == Const.actors.carhr){
                    this.dx += (this.dx < this.max) ? speed : 0;  
                    this.dest = {x: this.x+64, y: this.y};
                }
                else if(this.type == Const.actors.carvu){
                    this.dy -= (this.dy > -this.max) ? speed : 0;  
                    this.dest = {x: this.x, y: this.y-64};
                }
                else if(this.type == Const.actors.carvd){
                    this.dy += (this.dy < this.max) ? speed : 0;  
                    this.dest = {x: this.x, y: this.y+64};
                }

                var t = gameAsset.scene.Content(this.x, this.y);
                if(map.colliders.fend.indexOf(t) != -1){  
                    this.enabled = false;
                }
                
            }
            else{
                if(this.dx < 0){
                    this.dx = ((this.dx + friction) > 0) ? 0 : this.dx + friction;
                }
                else if(this.dx > 0){
                    this.dx = ((this.dx - friction) < 0) ? 0 : this.dx - friction;
                }
               
                if(this.dy < 0){
                    this.dy = ((this.dy + friction) > 0) ? 0 : this.dy + friction;
                }
                else if(this.dy > 0){
                    this.dy = ((this.dy - friction) < 0) ? 0 : this.dy - friction;
                }
                this.driving--;
            }

            if(this.stop > 100){
                this.driving = 0;
                this.stop = 0;
                this.skip = 64;
            }

            if(this.skip > 1){
                this.skip--;
            }
        },
        Update: function(dt){
            this.x += this.dx;
            this.y += this.dy;
        },
        Collider: function(perps){
            //predictive collison only with cars
            var d = AssetUtil.Collisions(this, perps, true);

            if(d && (d.type >= Const.actors.carhr && d.type <= Const.actors.drone)){
                if(this.skip == 0){
                    this.driving = 64;
                    this.max = d.max;
                    this.stop++;
                }else{
                    this.stop = 0;
                }
            }
       
        },
        Render: function(os){
                var x = this.x;
                var y = this.y;    

                var pt = Util.IsoPoint(x-os.x, y-os.y);
                Renderer.PolySprite(pt.x, pt.y-this.z,  this.body);
        }
    };

    window.Car = Car;
})();

(function() {

    function Drone(driver) {
        this.type = Const.actors.Drone;
        this.enabled = true;

        this.x;
        this.y;
        this.z = 0;

        this.width = 32;
        this.length = 32;
        this.target = driver;
        this.offset = {x:0, y:0};
        if(this.target.type == Const.actors.carvu){
            this.body =  Util.Scale( Util.FlipX(Factory.CarF(this.target.color)) ,1);
            this.offset.y = 32;
        }else if(this.target.type == Const.actors.carvd){
            this.body =  Util.Scale( Util.FlipX(Factory.CarB(this.target.color)) ,1);
            this.offset.y = -32;
        }else if(this.target.type == Const.actors.carhl){
            this.body =  Util.Scale( Factory.CarF(this.target.color) ,1);
            this.offset.x = 32;
        }else if(this.target.type == Const.actors.carhr){
            this.body =  Util.Scale( Factory.CarB(this.target.color) ,1);
            this.offset.x = -32;
        }
        this.dx = 0;
        this.dy = 0; 
        this.dz = 0; 
        this.max = this.target.max;   
    };

    Drone.prototype = {
        Logic: function(dt){
            
        },
        Update: function(dt){
            this.x = this.target.x + this.offset.x;
            this.y = this.target.y + this.offset.y;
            this.max = this.target.max;
            this.enabled = this.target.enabled;
        },
        Collider: function(perps){
        },
        Render: function(os){
            var x = this.target.x + this.offset.x;
             var y = this.target.y + this.offset.y;

                var pt = Util.IsoPoint(x-os.x, y-os.y);
                Renderer.PolySprite(pt.x, pt.y-this.z,  this.body);
        }
    };

    window.Drone = Drone;
})();

//Stump - feature item
(function() {

    function Stump(x, y) {
        this.type = Const.actors.stump;
        this.enabled = true;

        this.x = x;
        this.y = y;
        this.z = 0;
        this.width = 32;
        this.length = 32;

        this.dx = 0;
        this.dy = 0; 
        this.dz = 0;
   
        this.body = Util.OneOf([Factory.Rock1(),Util.FlipX(Factory.Rock1()), Factory.Rock(),Factory.Tree1(),Factory.Tree2()]);
     
    };

    Stump.prototype = {
        Logic: function(dt){
        },
        Update: function(dt){
        },
        Collider: function(perps){
        },
        Render: function(os){
                var pt = Util.IsoPoint(this.x-os.x, this.y-os.y);
                Renderer.PolySprite(pt.x, pt.y-this.z,  this.body);
        }
    };

    window.Stump = Stump;
})();

(function() {
    function Log(x, y) {
        this.type = Const.actors.log;
        this.enabled = true;

        this.x = x;
        this.y = y;
        this.z = 0;
        this.width = 12;
        this.length = 12;

        this.dx = 0;
        this.dy = 0; 
        this.dz = 0;
        this.accel = 2;  
        this.max = 1;
        this.body = Factory.Log();
    };

    Log.prototype = {
        Logic: function(dt){
            var speed = this.accel * dt;

            this.dy -= (this.dy > -this.max) ? speed : 0;  

            var t = gameAsset.scene.Content(this.x, this.y);
                if(map.colliders.fend.indexOf(t) != -1){  
                    this.enabled = false;
                }
        },
        Update: function(dt){
            this.x += this.dx;
            this.y += this.dy;
        },
        Collider: function(perps){
        },
        Render: function(os){
            var pt = Util.IsoPoint(this.x-os.x, this.y-os.y);
            Renderer.PolySprite(pt.x, pt.y-this.z,  this.body);
        }
    };

    window.Log = Log;
})();

(function() {
    function AnimObj(x, y, c, b, q) {
        this.type = Const.actors.null;
        this.enabled = true;

        this.p = {x:0, y:0};
        this.o = {x:x, y:y};
        this.ct = c;
        this.d = {x: Util.Rnd(64)-32, y: -(Util.Rnd(64)+32)};  
        this.body = b;
        this.die = q;
    };

    AnimObj.prototype = {
        Update: function(dt){
            if(this.ct > 0){
                this.ct--;
                this.o.y += (this.d.y*dt);
                this.o.x += (this.d.x*dt);
                this.d.y+=2.5;
                if(this.ct==0 && this.die)
                {
                    this.enabled = false;
                }
            }
        },
        Render: function(){
            Renderer.PolySprite(this.p.x + this.o.x, this.p.y+this.o.y,  this.body);
        }
    };

    window.AnimObj = AnimObj;
})();