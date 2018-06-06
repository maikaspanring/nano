class NanoManager extends Entity{
	constructor(grid_x = 0, grid_y = 0){
		super() // call constructor of Entity

		this.queue = [];

		// init component
		this.initNanobotHangar();
		this.initNanobot();
	}

	addNanobotHangar(group){
		var sq1 = Crafty.e("NanobotHangar")
				.place(150,150)
				.color("yellow")
		    .setgroup(group)
	}

	addNanobot(group){
		var sq1 = Crafty.e("Nanobot")
		    .setgroup(group)
				.place(window.innerWidth - (Math.floor(Math.random() * window.innerWidth)), window.innerHeight - (Math.floor(Math.random() * window.innerHeight)))
		//if(follow) Crafty.viewport.follow(sq1, 0, 0);
	}

	initNanobot(){
		Crafty.c("Nanobot", {
		    // This function will be called when the component is added to an entity
		    // So it sets up the things that both our entities had in common
		    init: function() {
		        this.addComponent("2D, Canvas, Color, Collision, Solid");
		        this.w = 30;
		        this.h = 30;
						this.place_queue_x = 0;
						this.place_queue_y = 0;
						this.checkHits('Solid');

						this.typ = "bot";
						this.group = "red";

						this.wait_time = 0;

						this.energy = 1000;

						this.data = [];

						this.data["hangar"] = [];
						this.next_hangar_dist = 0;
						this.next_hangar;

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
						if(from[i].obj.group == this.group){
							this.color("white")

							this.data["touched"][from[i].obj[0]] = from[i].obj[0];

							if(from[i].obj.typ == "bot"){
								this.data["hangar"].concat(from[i].obj.data["hangar"]);
								this.data["population"]["names"].concat(from[i].obj.data["population"]["names"]);
								this.data["population"]["names"][from[i].obj[0]] = from[i].obj[0];
								this.data["population"]["count"] = this.data["population"]["names"].length;
								this.data["population"]["timestamp"] = +new Date;
							}else if(from[i].obj.typ == "hangar"){
								this.data["hangar"][from[i].obj[0]] = from[i];
							}

							this.wait_time = +new Date + 500;
							//Crafty.log(this[0], from[i].obj[0], this.data["touched"]);
							Crafty.log(this.data["hangar"]);
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
					if(this.energy){ // a + b / 2
						if(eventData.gameTime > this.wait_time){

							if(this.next_hangar !== undefined)
							if(this.energy - ((this.w + this.h) / 2) <= this.next_hangar_dist){
								this.place_queue_x = this.next_hangar.x;
								this.place_queue_y = this.next_hangar.y;
							}else if(this.place_queue_x == this.next_hangar.x && this.place_queue_y == this.next_hangar.y){
								this.place_queue_x=0;
								this.place_queue_y=0;
							}

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


								for (var i = 0; i < this.data["hangar"].length; i++) {
									if(this.data["hangar"][i] !== undefined){
										var ndist = (this.data["hangar"][i].obj.x + this.data["hangar"][i].obj.y) / 2
										if(this.next_hangar_dist == 0 || this.next_hangar_dist > ndist){
											this.next_hangar_dist = ndist;
											this.next_hangar = this.data["hangar"][i].obj;
										}
									}
								}
							}

							this.energy--;
						}
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

	initNanobotHangar(){
		Crafty.c("NanobotHangar", {
		    // This function will be called when the component is added to an entity
		    // So it sets up the things that both our entities had in common
		    init: function() {
		        this.addComponent("2D, Canvas, Color, Collision, Solid");
		        this.w = 60;
		        this.h = 60;
						this.place_queue_x = 0;
						this.place_queue_y = 0;
						this.checkHits('Solid');

						this.typ = "hangar";
						this.group = "red";
		    },
				events: {
					"UpdateFrame": "action",
					"HitOn": "ping",
					"HitOff": "lost"
				},

				// recived a ping
				ping: function(from){
					for (var i = 0; i < from.length; i++) {
						from[i].obj.energy=1000;
					}

				},
				// try to connect "to"
				lost: function(from){

				},

				// do something every frame
				action: function(eventData){
					//Crafty.log(eventData);
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
