var AssetUtil = {
    Dir: function(perp, prot){      //calc direction and movemnt towards
        var inp = {
            up: false,
            down: false,
            left: false,
            right: false,
            d:0
        };
        var distx = Util.AbsDist( perp.x, prot.x);
        var disty = Util.AbsDist( perp.y, prot.y);
        inp.d = Util.PDist(distx, disty);
        if(distx > disty){
            if(perp.x > prot.x){
                inp.right = true;
            }
            else if(perp.x < prot.x){
                inp.left = true;      
            }
        }else{
            if(perp.y > prot.y){
                inp.down = true;           
            }
            else if(perp.y < prot.y){
                inp.up = true;
            }
        }
        return inp;
    },
    RectHit: function (prot, perp){ //if 2 rects overlap
        prot.x -= (prot.width/2);
        prot.y -= (prot.length/2);
        perp.x -= (perp.width/2);
        perp.y -= (perp.length/2);
        return (prot.x < perp.x + perp.width &&
            prot.x + prot.width > perp.x &&
            prot.y < perp.y + perp.length &&
            prot.length + prot.y > perp.y);
    },    
    Collisions: function(prot, perps, dest){

        for(var i = 0; i < perps.length; i++) {
            if(prot != perps[i]){
                var p = {x:(dest) ? prot.dest.x : prot.x, y:(dest) ? prot.dest.y : prot.y, width: prot.width, length: prot.length};
                var e = {
                    x:perps[i].x, 
                    y:perps[i].y, 
                    width: perps[i].width, 
                    length: perps[i].length};

                if(AssetUtil.RectHit(p, e)){
                    return perps[i];
                }
            }
        }            

        return null;
    },
    InputLogic: function(inp, prop, speed, step){       //determine action from input
        var x = prop.x;
        var y = prop.y;
        var dx = prop.dx;
        var dy = prop.dy;

        if( inp.up ) {
            dy = -speed;
            y = prop.y - step;
            prop.action = Const.actions.up;
        }
        else if(inp.down) {
            dy = speed;
            y = prop.y + step;
            prop.action = Const.actions.down;
        }    
        else if(inp.left) {
            dx = -speed;
            x = prop.x - step;
            prop.action = Const.actions.left;
        }
        else if(inp.right) {
            dx = speed;
            x = prop.x + step;
            prop.action = Const.actions.right;
        } 

        if(x != prop.x || y != prop.y){
            var c = gameAsset.scene.Content(x, y); //check for obstructions
            if(map.colliders.hit.indexOf(c) == -1){  
                prop.dest.x = x;
                prop.dest.y = y;
                prop.dx = dx;
                prop.dy = dy;
                prop.jumping = true;
            }
        }
    },
    HopLogic: function(asset, step, ht){        //everyone hops so create a reusable hop function
        if(asset.dy > 0){
            if(asset.y > asset.dest.y){
                asset.y = asset.dest.y;
                asset.dy = 0;
                asset.jumping = false;
                asset.z = 0;
            }else{
                asset.z = Util.Arc(asset.dest.y - asset.y, step, ht);
            }
        }
        else if(asset.dy < 0){
            if(asset.y < asset.dest.y){
                asset.y = asset.dest.y;
                asset.dy = 0;
                asset.jumping = false;
                asset.z = 0;
            }else{
                asset.z = Util.Arc(asset.y - asset.dest.y, step, ht);
            }
        }
        if(asset.dx > 0){
            if(asset.x > asset.dest.x){
                asset.x = asset.dest.x;
                asset.dx = 0;
                asset.jumping = false;
                asset.z = 0;
            }else{
                asset.z = Util.Arc(asset.dest.x - asset.x, step, ht);
            }
        }
        else if(asset.dx < 0){
            if(asset.x < asset.dest.x){
                asset.x = asset.dest.x;
                asset.dx = 0;
                asset.jumping = false;
                asset.z = 0;
            }else{
                asset.z = Util.Arc(asset.x - asset.dest.x, step, ht);
            }
        }
        return gameAsset.scene.Content(asset.x, asset.y);
    },
    CarSpawn: function(list, assets, type, tw, th){     //adds a spawn point of a type
        for (var i = 0; i < assets.length; i++) {
            list.push({ready:100, 
                x:assets[i].x*tw, 
                y:assets[i].y*th,
                type:type});
        }  
    }
}


var Util = {
    OneIn: function(c){
        return Util.RndI(0,c)==0;
    },
    OneOf: function(arr){
        return arr[Util.RndI(0,arr.length)];
    },
    //int min to max-1
    RndI: function (min, max){
        return parseInt(Math.random() * (max-min)) + min;
    },
    Rnd: function (max){
        return Math.random() * max;
    },     
    Lerp: function(start, end, amt)
    {
        return (end-start) * amt+start;
    },
    AbsDist: function(p1, p2){
        return Math.abs( p1 - p2);
    },   
    Dist: function(x1,y1,x2,y2){
        var x = x2 - x1, y = y2 - y1;
        return Util.PDist(x, y);
    },
    PDist: function(x, y){        
        return Math.sqrt(x*x + y*y);
    },
    IsoPoint: function(x, y)        //turns a 2d to iso point
    {
        return {x: (x - y) * 1, y: (x + y)*0.5};
    },
    Arc: function(i, items, radius)     
    {
        return (radius * Math.sin( Math.PI * i / items));
    },
    FlipX: function(src) //flips a factory item
    {
        var poly = src;
        for (let p = 0; p < poly.length; p++) {
            for (let i = 0; i < poly[p].pt.length; i++) {
                poly[p].pt[i].x=-poly[p].pt[i].x;              
            }
        }
        return poly;
    },
    Scale: function(src, sc)    //scales a factory item
    {
        var poly = src;
        for (let p = 0; p < poly.length; p++) {
            for (let i = 0; i < poly[p].pt.length; i++) {
                poly[p].pt[i].x *= sc;
                poly[p].pt[i].y *= sc;
            }
        }
        return poly;
    },
    ImgTxtArr:function(t){      //constructs an image from compressed data
        var ch =[];
        for (var i = 0; i < t.length; i++){
            var px=[];
            t[i].replace(/./g,a=>{
                z=a.charCodeAt()
                px.push(z&7)
                px.push((z>>3)&7)
              });
              ch.push(px);
        }
        return ch;
    },
    Build:function(src){
        var b = [];
        for (var i = 0; i < src.length; i+=2){

            var pts = [];
            for (var p = 0; p < src[i+1].length; p+=2){
                pts.push({x: src[i+1][p],y:src[i+1][p+1]})
            }
            b.push({col:PAL[src[i]], pt: pts});
        }

        return b;
    }
}




// a quick and dirty function to help with call outs
var N = function (t,n){
    var ct = t;
    var i = 0;
    var s = 0;
    return{
        S:function(){
            i++;
            if(i==ct){
                n=(s==0)?n-1:n;
                i=0;
                s=1-s;
            }
            return {v:s==0,a:n>0};
        }
    }
};

// a v simple object pooler
//only gets enabled assets and adds new ones into disabled slot or adds to list
var ObjectPool = function () {
    var list = [];

    return {
        Add: function(obj){
            for (var i = 0; i < list.length; i++) {
                if (list[i].enabled == false && list[i].type == obj.type)
                {
                    list[i] = obj;
                    return list[i];
                }
            }
            list.push(obj);         
        },
        Get: function(type){
            if(type){
                return list.filter(l => l.enabled && type.indexOf(l.type) != -1)
            }else{
                return list.filter(l => l.enabled);
            }

        },
        Count: function(all){
            return (all) ? list : list.filter(l => l.enabled).length;
        }      
    }
};

var Const = {
    game:{
        friction:6,
        status:{
            lost:0,
            follow:1,
            home:2
        },
        h2:"24px Arial"
    },   
    actors:{
        null:0,
        player:1,
        dood:2,
        carhr:3,
        carhl:4,
        carvu:5,
        carvd:6,
        drone:7,
        stump:8,
        log:9
    },
    actions:{
        up:0,
        down:1,
        left:2,
        right:3,
        fall:4,
        splash:5,
        squash:6,
        waveup:7,
        wavedown:8,
        waveleft:9,
        waveright:10
    }
}

var Fac = [];

//using a more compact data source, these assets are uncompressed into the Fac Factory
//for space saving
var Sources = {
    tree1:function(){
        return [
            5,[0,8,0,-16,-16,-24,-16,0],
            6,[0,-16,0,-16,16,-24,16,0,0,8],
            7,[-32,-26,-32,-69,0,-53,0,-10],
            8,[0,-10,0,-53,32,-69,32,-26],
            9,[-32,-69,0,-85,32,-69,0,-53]
        ];
    },
    tree2:function(){
        return [
            5,[0,8,0,-29,-16,-36,-16,0],
            6,[0,-16,0,-28,16,-36,16,0,0,8],
            7,[-56,-52,-56,-67,0,-39,0,-23],
            8,[0,-23,0,-39,56,-67,56,-52],
            9,[-56,-67,0,-95,56,-67,0,-39],
            7,[-27,-68,-27,-87,0,-74,0,-55],
            8,[0,-55,0,-74,28,-87,28,-68],
            9,[-27,-87,0,-100,28,-87,0,-74]
        ];
    },
    rock:function(){
        return [
            2,[-32,0,-32,-16,0,0,0,16],
            3,[0,16,0,0,32,-16,32,0],
            4,[32,-16,0,0,-32,-16,0,-32],
            2,[-20,-22,-20,-38,0,-29,0,-12],
            3,[0,-12,0,-30,20,-38,20,-22],
            4,[0,-29,-20,-38,1,-48,20,-38]
        ];
    },
    rock1:function(){
        return [
            2,[-32,0,-32,-16,0,0,0,16],
            3,[0,16,0,0,32,-16,32,0],
            4,[32,-16,0,0,-32,-16,0,-32],
            2,[-32,-16,-32,-32,-12,-23,-12,-6],
            3,[-12,-5,-12,-23,8,-32,8,-15],
            4,[-12,-23,-32,-32,-11,-42,8,-32]
        ];
    },
    Log:function(){
        return [
            22,[-28,-1,4,-17,28,-5,-4,11],
            22,[-4,11,-4,14,28,-2,28,-5],
            22,[-4,11,-28,-1,-28,2,-4,14],
            23,[-10,5,-6,7,4,2,0,0],
            23,[-12,1,-16,-1,-4,-7,0,-5],
            23,[5,-5,9,-3,15,-6,11,-8]
        ];
    }
};

//all my assets are gotten from the asset factory
var Factory = {
    Cube: function (col, size){
        var half = size/2;
        return [
            {col: col[0], pt: [{x:-size, y:-size},{x:0, y:-half},{x:0, y:half},{x:-size, y:0}] }
            ,{col: col[1], pt: [{x:0, y:-half},{x:size, y:-size},{x:size, y:0},{x:0, y:half}] }
            ,{col: col[2], pt: [{x:0, y:-(size+half)},{x:size, y:-size},{x:0, y:-half},{x:-size, y:-size}] }
            ];
    }, 
    Tile: function(col, size)
    {
        var half = size/2;
        return {col: col, pt: [{x:0, y:-half},{x:size, y:0},{x:0, y:half},{x:-size, y:0}] }
    },
    Hole: function(col, size)
    {
        var half = size/2;
         return [
             {col: col[0], pt: [{x:0, y:-half},{x:0, y:half},{x:-size, y:0}] },
             {col: col[1], pt: [{x:0, y:-half},{x:size, y:0},{x:0, y:half}] }
         ];
    },
    CarB: function(col){

        return [{col:col[0],pt:[{x:-32,y:-5},{x:0,y:11},{x:0,y:-21},{x:-17,y:-29},{x:-17,y:-13},{x:-32,y:-21}]},
            {col:col[2],pt:[{x:-17,y:-13},{x:-17,y:-29},{x:-32,y:-21}]},
            {col:col[2],pt:[{x:1,y:-21},{x:33,y:-36},{x:16,y:-45},{x:-17,y:-29}]},
            {col:PAL[0],pt:[{x:-10,y:11},{x:-22,y:5},{x:-22,y:-6},{x:-10,y:0}]},
            {col:PAL[0],pt:[{x:-10,y:11},{x:-5,y:8},{x:-10,y:5}]}];
    },
    CarF: function(col){
        return [
            {col:col[0],pt:[{x:-32,y:-5},{x:-32,y:-37},{x:-16,y:-29},{x:-16,y:-13},{x:0,y:-5},{x:0,y:11}]},
            {col:col[1],pt:[{x:0,y:11},{x:0,y:-5},{x:32,y:-21},{x:32,y:-5}]},
            {col:PAL[1],pt:[{x:-16,y:-13},{x:-16,y:-29},{x:16,y:-45},{x:16,y:-29}]},
            {col:col[2],pt:[{x:16,y:-29},{x:32,y:-21},{x:0,y:-5},{x:-16,y:-13}]},
            {col:col[2],pt:[{x:-16,y:-29},{x:-32,y:-37},{x:0,y:-53},{x:16,y:-45}]},
            {col:PAL[0],pt:[{x:-10,y:11},{x:-22,y:5},{x:-22,y:-6},{x:-10,y:0}]},
            {col:PAL[0],pt:[{x:-10,y:11},{x:-5,y:8},{x:-10,y:5}]}];
    },
    Man1: function(a, c){
        a = a || 0;
        var cl = c || [PAL[25],PAL[26],PAL[27],PAL[28]];
        var arm = [           
                [
                    {col:cl[2],pt:[{x:-20,y:-29},{x:-15,y:-31},{x:-9,y:-28},{x:-14,y:-26}]},
                    {col:cl[0],pt:[{x:-9,y:-9},{x:-9,y:-28},{x:-14,y:-26},{x:-14,y:-7}]},
                    {col:cl[2],pt:[{x:-14,y:-7},{x:-14,y:-26},{x:-20,y:-29},{x:-20,y:-10}]}
                ],
                [
                    {col:cl[2],pt:[{x:-20,y:-45},{x:-15,y:-47},{x:-9,y:-44},{x:-14,y:-42}]},
                    {col:cl[0],pt:[{x:-9,y:-25},{x:-9,y:-44},{x:-14,y:-42},{x:-14,y:-23}]},
                    {col:cl[2],pt:[{x:-14,y:-23},{x:-14,y:-42},{x:-20,y:-45},{x:-20,y:-26}]}
                ]
            ];

        var b = [
            {col:PAL[14],pt:[{x:8,y:2},{x:8,y:-3},{x:14,y:-6},{x:14,y:-1}]},
            {col:PAL[15],pt:[{x:8,y:-3},{x:0,y:-7},{x:0,y:-2},{x:8,y:2}]},
            {col:PAL[13],pt:[{x:0,y:-7},{x:6,y:-10},{x:14,y:-6},{x:8,y:-3}]},
            {col:PAL[14],pt:[{x:-3,y:7},{x:-3,y:2},{x:3,y:-1},{x:3,y:4}]},
            {col:PAL[15],pt:[{x:-3,y:2},{x:-11,y:-2},{x:-11,y:3},{x:-3,y:7}]},
            {col:PAL[13],pt:[{x:-11,y:-2},{x:-5,y:-5},{x:3,y:-1},{x:-3,y:2}]},
            {col:PAL[20],pt:[{x:0,y:-7},{x:5,y:-5},{x:5,y:-9}]},
            {col:PAL[21],pt:[{x:5,y:-5},{x:10,y:-8},{x:10,y:-12},{x:5,y:-9}]},
            {col:PAL[20],pt:[{x:-11,y:-2},{x:-11,y:-12},{x:-5,y:-9},{x:-5,y:1}]},
            {col:PAL[21],pt:[{x:-5,y:1},{x:-5,y:-8},{x:0,y:-10},{x:0,y:-2}]},
            {col:cl[2],pt:[{x:-22,y:-16},{x:-22,y:-38},{x:0,y:-27},{x:0,y:-5}]},
            {col:cl[0],pt:[{x:0,y:-5},{x:0,y:-27},{x:22,y:-38},{x:22,y:-16}]},
            {col:PAL[18],pt:[{x:-22,y:-38},{x:-22,y:-60},{x:0,y:-49},{x:0,y:-27}]},
            {col:PAL[19],pt:[{x:0,y:-27},{x:0,y:-49},{x:22,y:-60},{x:22,y:-38}]},
            {col:cl[1],pt:[{x:-22,y:-60},{x:0,y:-71},{x:22,y:-60},{x:0,y:-49}]},
            {col:cl[3],pt:[{x:-22,y:-60},{x:0,y:-49},{x:0,y:-41},{x:-7,y:-44},{x:-7,y:-41},{x:-15,y:-45},{x:-15,y:-37},{x:-22,y:-41}]},
            {col:cl[1],pt:[{x:0,y:-49},{x:22,y:-60},{x:22,y:-53},{x:0,y:-41}]},
            {col:PAL[20],pt:[{x:-22,y:-16},{x:-22,y:-23},{x:0,y:-12},{x:0,y:-5}]},
            {col:PAL[21],pt:[{x:0,y:-5},{x:0,y:-12},{x:22,y:-22},{x:22,y:-15}]},
            {col:PAL[11],pt:[{x:3,y:-39},{x:7,y:-41},{x:7,y:-37},{x:3,y:-35}]},
            {col:PAL[11],pt:[{x:15,y:-40},{x:15,y:-44},{x:19,y:-46},{x:19,y:-42}]}
        ];

        for(var i=0;i<arm[a].length;i++){
            b.push(arm[a][i]);
        }
        
        return b;
    },
    Man2: function(a, c){
        a = a || 0;
        var cl = c || [PAL[25],PAL[26],PAL[27],PAL[28]];
        var arm = [
                [
                    {col:cl[0],pt:[{x:7,y:-27},{x:13,y:-30},{x:17,y:-28},{x:12,y:-25}]},
                    {col:cl[0],pt:[{x:17,y:-9},{x:17,y:-28},{x:12,y:-26},{x:12,y:-7}]},
                    {col:cl[2],pt:[{x:12,y:-7},{x:12,y:-25},{x:7,y:-27},{x:7,y:-10}]}
                ],
                [
                    {col:cl[0],pt:[{x:7,y:-45},{x:13,y:-48},{x:17,y:-46},{x:12,y:-43}]},
                    {col:cl[0],pt:[{x:17,y:-27},{x:17,y:-46},{x:12,y:-44},{x:12,y:-25}]},
                    {col:cl[2],pt:[{x:12,y:-25},{x:12,y:-43},{x:7,y:-45},{x:7,y:-28}]}
                ]
            ];

        var b = [
            {col:PAL[13],pt:[{x:-7,y:-4},{x:-13,y:-7},{x:-3,y:-12},{x:4,y:-9}]},
            {col:PAL[15],pt:[{x:-7,y:1},{x:-7,y:-4},{x:4,y:-9},{x:4,y:-4}]},
            {col:PAL[15],pt:[{x:-7,y:-4},{x:-13,y:-7},{x:-13,y:-2},{x:-7,y:1}]},
            {col:PAL[17],pt:[{x:-2,y:-6},{x:-2,y:-19},{x:-7,y:-17},{x:-7,y:-4}]},
            {col:PAL[17],pt:[{x:-7,y:-4},{x:-7,y:-17},{x:-13,y:-20},{x:-13,y:-7}]},
            {col:PAL[13],pt:[{x:3,y:1},{x:-3,y:-2},{x:8,y:-7},{x:14,y:-4}]},
            {col:PAL[14],pt:[{x:3,y:6},{x:3,y:1},{x:14,y:-4},{x:14,y:1}]},
            {col:PAL[15],pt:[{x:3,y:1},{x:-3,y:-2},{x:-3,y:3},{x:3,y:6}]},
            {col:PAL[16],pt:[{x:8,y:-1},{x:8,y:-14},{x:3,y:-12},{x:3,y:1}]},
            {col:PAL[17],pt:[{x:3,y:1},{x:3,y:-12},{x:-3,y:-15},{x:-3,y:-2}]},
            {col:cl[2],pt:[{x:-22,y:-16},{x:-22,y:-38},{x:0,y:-27},{x:0,y:-5}]},
            {col:cl[0],pt:[{x:0,y:-5},{x:0,y:-27},{x:22,y:-38},{x:22,y:-16}]},
            {col:PAL[18],pt:[{x:-22,y:-38},{x:-22,y:-60},{x:0,y:-49},{x:0,y:-27}]},
            {col:PAL[19],pt:[{x:0,y:-27},{x:0,y:-49},{x:22,y:-60},{x:22,y:-38}]},
            {col:cl[1],pt:[{x:-22,y:-60},{x:0,y:-71},{x:22,y:-60},{x:0,y:-49}]},
            {col:cl[1],pt:[{x:0,y:-49},{x:0,y:-30},{x:-22,y:-41},{x:-22,y:-60}]},
            {col:cl[3],pt:[{x:0,y:-49},{x:22,y:-60},{x:22,y:-53},{x:16,y:-50},{x:16,y:-46},{x:9,y:-43},{x:9,y:-34},{x:0,y:-30}]}
        ];
        for(var i=0;i<arm[a].length;i++){
            b.push(arm[a][i]);
        }
        
        return b;
    },
    Boy1: function(a,c){
        return Util.Scale(Factory.Man1(a,c),0.7);
    },
    Boy2: function(a,c){
        return Util.Scale(Factory.Man2(a,c),0.7);
    },    
    Hat:function(){
        return [{col:PAL[10],pt:[{x:-15,y:0},{x:0,y:-7},{x:14,y:0},{x:0,y:7}]},
            {col:PAL[11],pt:[{x:-9,y:0},{x:-9,y:-7},{x:0,y:-3},{x:0,y:4}]},
            {col:PAL[12],pt:[{x:0,y:-3},{x:8,y:-7},{x:8,y:0},{x:0,y:4}]},
            {col:PAL[10],pt:[{x:-9,y:-7},{x:0,y:-11},{x:8,y:-7},{x:0,y:-3}]}];
    },
    Flat: function(c){
        var cl = c||[PAL[25],PAL[26]];
        return [{col:cl[0],pt:[{x:-32,y:0},{x:0,y:-16},{x:32,y:0},{x:0,y:16}]},
        {col:cl[1],pt:[{x:-16,y:0},{x:0,y:-8},{x:16,y:1},{x:0,y:8}]}]
    }
}

//pallette
var PAL = [
    "#000000",
    "#C8C8C8",
    "#aaaaaa",
    "#999999",
    "#cccccc",
    "#4a3030",
    "#402929",
    "#368122",
    "#225216",
    "#4ab230",
    "#545454",//10
    "#333333",
    "#282828",
    "#938f8e",
    "#645b5c",
    "#3d3435",
    "#b44528",
    "#9d2817",
    "#ef7e52",
    "#ffac6c",
    "#9c2615",//20
    "#b4442a",
    "#8E5451",
    "#5C373B",
    "#80413E",
    "#69b9c8",//25
    "#855120",
    "#2b8596",
    "#784614"
    ];