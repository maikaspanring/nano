class ResourcesManager{
	constructor(){

    this.initResources();
  }

  addResources(typ="fuel"){
    var sq1 = Crafty.e("Resources")
        .place(-1000 + (Math.floor(Math.random() * (1000*2))), -1000 + (Math.floor(Math.random() * (1000*2))))
        .typ(typ)
        .color("blue")
  }

  initResources(){
    Crafty.c("Resources", {
        // This function will be called when the component is added to an entity
        // So it sets up the things that both our entities had in common
        init: function() {
            this.addComponent("2D, Canvas, Color, Collision, Solid");
            this.id = this[0];
            this.attach(Crafty.e("2D, Canvas, Text").text("R:"+this.id).textFont({ size: '20px'}));
		        this.w = 45;
		        this.h = 45;
            this.typ;
        },
				events: {
					//"UpdateFrame": "action",
					//"HitOn": "ping",
					//"HitOff": "lost"
				},
        typ: function(typ){
          this.typ = typ;
          return this;
        },
        place: function(x, y) {
		        this.x = x;
		        this.y = y;
		        return this;
		    },
        remove: function() {
		        Crafty.log('Square was removed!');
		    },
    });
  }
}
exports.ResourcesManager = ResourcesManager
