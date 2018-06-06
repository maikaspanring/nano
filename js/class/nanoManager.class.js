class NanoManager extends Entity{
	constructor(grid_x = 0, grid_y = 0){
		super() // call constructor of Entity

		this.queue = [];

		// init component
		this.component();
	}

	add(group){
		var sq1 = Crafty.e("Square")
		    .setgroup(group)
				.place(window.innerWidth - (Math.floor(Math.random() * window.innerWidth)), window.innerHeight - (Math.floor(Math.random() * window.innerHeight)))
		//if(follow) Crafty.viewport.follow(sq1, 0, 0);
	}

	component(){
		Crafty.c("Square", {
		    // This function will be called when the component is added to an entity
		    // So it sets up the things that both our entities had in common
		    init: function() {
		        this.addComponent("2D, Canvas, Color, Collision, Solid");
		        this.w = 30;
		        this.h = 30;
						this.place_queue_x = 0;
						this.place_queue_y = 0;
						this.checkHits('Solid');

						this.group = "red";

						this.data = [];
						this.data["touched"] = [];
						this.data["population"] = [];
						this.data["population"]["names"] = [];
						this.data["population"]["names"][this[0]] = this[0];
						this.data["population"]["count"] = 1;
						this.data["population"]["timestamp"] = +new Date;
		    },
				events: {
					"UpdateFrame": "action",
					"HitOn": "ping",
					"HitOff": "lost"
				},

				// recived a ping
				ping: function(from){

					// ID from the next nano: from[0].obj[0]]
					for (var i = from.length - 1; i >= 0; i--) {
						if(from[i].obj.group == this.group ){
							this.color("white")

							this.data["touched"][from[i].obj[0]] = from[i].obj[0];
							this.data["population"]["names"].concat(from[i].obj.data["population"]["names"]);
							this.data["population"]["names"][from[i].obj[0]] = from[i].obj[0];
							this.data["population"]["count"] = this.data["population"]["names"].length;
							this.data["population"]["timestamp"] = +new Date;
							
							//Crafty.log(this[0], from[i].obj[0], this.data["touched"]);
							//Crafty.log(this[0], from[i].obj[0], this.data["population"]["names"]);
						}
					}
				},
				// try to connect "to"
				lost: function(from){
					this.color(this.group)
				},

				// do something every frame
				action: function(eventData){
					//Crafty.log(eventData);

					var speed = 10;

					if(this.place_queue_x == 0) this.place_queue_x =  window.innerWidth - (Math.floor(Math.random() * window.innerWidth) );
					if(this.place_queue_y == 0) this.place_queue_y =  window.innerHeight - (Math.floor(Math.random() * window.innerHeight) );
					var move_x = (eventData.dt / speed);
					var move_y = (eventData.dt / speed);

					if(this.x < this.place_queue_x && this.x + move_x > this.place_queue_x) move_x = this.place_queue_x - this.x;
					if(this.x > this.place_queue_x && this.x - move_x < this.place_queue_x) move_x = this.x - this.place_queue_x;
					if(this.y < this.place_queue_y && this.y + move_y > this.place_queue_y) move_y = this.place_queue_y - this.y;
					if(this.y < this.place_queue_y && this.y - move_y > this.place_queue_y) move_y = this.y - this.place_queue_y;

					if(this.x < this.place_queue_x) this.x = this.x + move_x;
					if(this.x > this.place_queue_x) this.x = this.x - move_x;
					if(this.y < this.place_queue_y) this.y = this.y + move_y;
					if(this.y > this.place_queue_y) this.y = this.y - move_y;

					if(this.x == this.place_queue_x && this.y == this.place_queue_y){
						this.place_queue_x=0;
						this.place_queue_y=0;
					}

				},

		    // This function will be called when the component is removed from an entity
		    // or right before entity is destroyed.
		    // Useful for doing custom cleanup.
		    remove: function() {
		        // This function serves for logging.
		        // Once your game is release ready you can disable logging
		        // by setting Crafty.loggingEnabled to false
		        Crafty.log('Square was removed!');
		    },

				setgroup: function(group){
					this.group = group;
					this.color(group);

					return this;
				},
		    // Our two entities had different positions,
		    // so we define a method for setting the position
		    place: function(x, y) {
		        this.x = x;
		        this.y = y;

		        // There's no magic to method chaining.
		        // To allow it, we have to return the entity!
		        return this;
		    }
		})
	}

}
exports.NanoManager = NanoManager
