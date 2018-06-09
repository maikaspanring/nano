class NanoManager{
	constructor(){
		this.nanobots = [];

		// init component
		this.initLine();
		this.initNanobotHangar();
		this.initNanobot();
	}

	addNanobotHangar(team){
		var sq1 = Crafty.e("NanobotHangar")
				.place(window.innerWidth - (Math.floor(Math.random() * window.innerWidth)), window.innerHeight - (Math.floor(Math.random() * window.innerHeight)))
				.color("yellow")
				.origin("center")
		    .setTeam(team)
	}

	addNanobot(team){
		var sq1 = Crafty.e("Nanobot")
		    .setTeam(team)
				.place(window.innerWidth - (Math.floor(Math.random() * window.innerWidth)), window.innerHeight - (Math.floor(Math.random() * window.innerHeight)))
				.origin("center")
		this.nanobots[sq1[0]] = sq1;
		//if(follow) Crafty.viewport.follow(sq1, 0, 0);
	}

	initNanobot(){
		Crafty.c("Nanobot", {
		    // This function will be called when the component is added to an entity
		    // So it sets up the things that both our entities had in common
		    init: function() {
		        this.addComponent("2D, Canvas, Color, Collision, Solid");
						this.id = this[0];

						var energy_visio = Crafty.e("2D, Canvas, Color")
						                     .attr({x: 0, y: 15, w: 0, h: -15})
						                     .color("green");
						this.attach(energy_visio);
						this.energy_visio = energy_visio;

						this.attach(Crafty.e("2D, Canvas, Text").text(this.id).textFont({ size: '20px'}));

		        this.w = 30;
		        this.h = 30;
						this.place_queue_x = 0;
						this.place_queue_y = 0;
						this.work_queue = "idle";
						this.next_job;
						this.next_job_dist = 0;
						this.checkHits('Solid');

						this.max_w = 5000;
						this.max_h = 5000;

						//this.text(function () { return this[0] });
						this.typ = "bot";
						this.task = this.calcTask(); // calc the life task of this bot
						this.team = 1;

						this.speed = 1;
						this.wait_time = 0;

						// energy = steps = fuel
						this.energy_max = 8000;
						this.energy = 8000;

						// A nanobot can carry/store the 4 x of its energy
						this.storage_typ = "";
						this.storage_max = this.energy_max;
						this.storage = 0;

						this.gameTime;
						this.data = [];

						this.data["hangar"] = [];
						this.next_hangar_dist = 0;
						this.next_hangar;
						this.returns_to_hangar = 0;
						this.steps_from_hangar = 0;

						this.data["resources"] = [];
						this.data["resources"]["fuel"] = []; // places where fuel could be harvest

						this.data["touched"] = [];
						this.data["population"] = [];
						this.data["population"]["names"] = [];
						this.data["population"]["names"][this.id] = this.id;
						this.data["population"]["count"] = 1;
						this.data["population"]["timestamp"] = +new Date;

						// visio
						this.flash = 0;

						this.calcGroup();

						this.path = Crafty.e("Line").attr({x: this.x, y: this.y});
						Crafty.log(this.id, "Nanobot created task:", this.task);
		    },

				calcTask: function(){
					var task_arr = [];
					task_arr[1] = "scout";
					task_arr[2] = "fuel";
					task_arr[3] = "carbon";
					task_arr[4] = "builder";
					return task_arr[getNumber(
			      [
			        //chance, min, max
			        [.25 ,1 ,1],   // 1: scout 50%
			        [.25 ,2 ,2],   // 2: fuel 50%
							[.25 ,3 ,3],   // 2: carbon 50%
							[.25 ,4 ,4],   // 2: carbon 50%
			      ]
			    )];
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
						if(from[i].obj.team == this.team){
							this.color("white")

							this.dataExchange(from[i]);

							this.wait_time = this.gameTime + (50 * this.speed);
							//Crafty.log(this[0], from[i].obj[0], this.data["touched"]);
						}else{
							this.dataExchange(from[i], false);
						}
					}
				},
				// try to connect "to"
				lost: function(from){
					this.color(this.group)
					if(this.returns_to_hangar == 1) this.color("yellow");
				},

				// give or geather data from an obj in the world (Nanobot, Hangar, resources, etc...)
				dataExchange: function(from, from_group = true){
					if(from_group){
						if(from.obj.typ == "bot"){
							this.data["touched"][from.obj.id] = from.obj.id;

						// TRANSFER HANGAR DATA
							this.data["hangar"] = extend(this.data["hangar"], from.obj.data["hangar"]);
							from.obj.data["hangar"] = this.data["hangar"];
						// TRANSFER resources ["fuel"] DATA
								this.data["resources"]["fuel"] = extend(this.data["resources"]["fuel"], from.obj.data["resources"]["fuel"]);
								from.obj.data["resources"]["fuel"] = this.data["resources"]["fuel"];
						// TRANSFER population DATA
							this.data["population"]["names"].concat(from.obj.data["population"]["names"]);
							this.data["population"]["names"][from.obj.id] = from.obj.id;
							this.data["population"]["count"] = this.data["population"]["names"].length;
							this.data["population"]["timestamp"] = this.gameTime;

						// TRANSFER ENERGY
							if(from.obj.energy < (this.energy / 3)){
								if((this.energy / 3) - ((this.w + this.h) / 2) >= this.next_hangar_dist ){
									var givable_engery = (this.energy / 3)
									if((from.obj.energy_max - from.obj.energy) < (this.energy / 3 ) ) givable_engery = (from.obj.energy_max - from.obj.energy);
									from.obj.energy+= givable_engery;
									this.energy-= givable_engery;
								}
							}

							this.getNextHangar();
						}else if(from.obj.typ == "hangar"){
							this.data["hangar"][from.obj.id] = from;
							this.next_job = "idle";
							this.getNextHangar();
						}
					}else{
						if(from.obj.resources_typ == "fuel"){
							//Crafty.log(this.id, "found fuel");
							this.data["resources"]["fuel"][from.obj.id] = from; // save where this resource is
							if(this.work_queue == "fuel"){
								this.storage_typ = "fuel";
								if(this.storage < this.storage_max){ // is ther still storage aviable
									this.storage+=10;
									this.wait_time = this.gameTime + (500 * this.speed);
									//Crafty.log(this.id, " getherd", this.storage);
									this.resetHitChecks('Solid'); // geather more
								}
							}
						}
					}
				},

				// do something every frame
				action: function(eventData){
					//Crafty.log(eventData);
					this.flash++;
					if(this.flash > 25) this.flash = -25;

					if(this.energy > 0){
						if(eventData.gameTime > this.wait_time){
							this.gameTime = eventData.gameTime;

							this.color(this.group)
							if(this.returns_to_hangar == 1) this.color("yellow");

						// CALC MISSION ABORT OR LOADING HANGAR
							if(this.next_hangar !== undefined){
								if(this.energy - 100 <= this.steps_from_hangar){  // mission aborted
									this.place_queue_x = this.next_hangar.ox;
									this.place_queue_y = this.next_hangar.oy;
									this.returns_to_hangar = 1;
									this.work_queue = "idle";
								}
								if(this.ox == this.next_hangar.ox && this.oy == this.next_hangar.oy){
									this.place_queue_x=0;
									this.place_queue_y=0;
									this.returns_to_hangar = 0;
									this.steps_from_hangar = 0;
								}
							}

						if(this.work_queue == "idle"){
							// CALC NEW Random PLACE
							if(this.place_queue_x == 0 && this.place_queue_y == 0){
								this.place_queue_x =  -this.max_w + (Math.floor(Math.random() * (this.max_w * 2)) );
								this.place_queue_y =  -this.max_h + (Math.floor(Math.random() * (this.max_h * 2)) );
								this.color(this.group)
								this.returns_to_hangar = 0;

								if(this.next_hangar !== undefined){ // test if mission is do able
									this.next_hangar_dist = this.getDistance(this.next_hangar.ox, this.next_hangar.oy, this.place_queue_x, this.place_queue_y )
									if(this.energy - (this.next_hangar_dist) <= this.next_hangar_dist){ // mission denied
										this.place_queue_x = this.next_hangar.ox;
										this.place_queue_y = this.next_hangar.oy;
										this.returns_to_hangar = 1;
									}
								}
							}
						// if there is fuel geather it
						}else if(this.work_queue == "fuel" && this.data["resources"]["fuel"].length > 0){
							this.getNextResourcesFuel(); // sets next_job and next_job_dist

							if(this.place_queue_x == 0 && this.place_queue_y == 0){
								this.place_queue_x =  this.next_job.ox;
								this.place_queue_y =  this.next_job.oy;
								this.color(this.group)
								this.returns_to_hangar = 0;

								if(this.next_hangar !== undefined){ // test if mission is do able
									this.next_hangar_dist = this.getDistance(this.next_hangar.ox, this.next_hangar.oy, this.place_queue_x, this.place_queue_y )
									if(this.energy - (this.next_hangar_dist) <= this.next_hangar_dist){ // mission denied
										this.place_queue_x = this.next_hangar.ox;
										this.place_queue_y = this.next_hangar.oy;
										this.returns_to_hangar = 1;
										this.work_queue = "idle";
									}
								}
							}
						}

						// mission abortion extra secure
						if(this.next_hangar !== undefined){
							if(this.energy - 100 <= this.steps_from_hangar){  // mission aborted
								this.place_queue_x = this.next_hangar.ox;
								this.place_queue_y = this.next_hangar.oy;
								this.returns_to_hangar = 1;
								this.work_queue = "idle";
							}
						}
						this.drawLine();

						// CALC MOVE
							var move_x = (eventData.dt / this.speed);
							var move_y = (eventData.dt / this.speed);

							if(this.ox < this.place_queue_x && this.ox + move_x > this.place_queue_x) move_x = this.place_queue_x - this.ox;
							if(this.ox > this.place_queue_x && this.ox - move_x < this.place_queue_x) move_x = this.ox - this.place_queue_x;
							if(this.oy < this.place_queue_y && this.oy + move_y > this.place_queue_y) move_y = this.place_queue_y - this.oy;
							if(this.oy < this.place_queue_y && this.oy - move_y > this.place_queue_y) move_y = this.oy - this.place_queue_y;

							if(this.ox < this.place_queue_x) this.ox = this.ox + move_x;
							if(this.ox > this.place_queue_x) this.ox = this.ox - move_x;
							if(this.oy < this.place_queue_y) this.oy = this.oy + move_y;
							if(this.oy > this.place_queue_y) this.oy = this.oy - move_y;

						// ARIVED AT PLACE
							if(this.ox == this.place_queue_x && this.oy == this.place_queue_y){
								this.place_queue_x=0;
								this.place_queue_y=0;
								//this.work_queue = "idle";
								this.getNextHangar();
							}

						// CALC ENERGY
							this.energy-= (move_x + move_y);
							this.steps_from_hangar+= (move_x + move_y + 1);

						}
					}else{ // NANOBOT HAVE NO fuel
						if(this.flash > 0)	this.color("grey");
						else this.color(this.group);
					}

					// Update energy_visio
					var percent = this.energy * 100 / this.energy_max;
					var nwidth = percent*this.w / 100;
					this.energy_visio.w = nwidth;

				},

		    remove: function() {
		        Crafty.log('Square was removed!');
		    },

				setTeam: function(team){
					this.team = team;
					return this;
				},
				setGroup: function(group){
					this.group = group;
					this.color(group);
					return this;
				},
				calcGroup: function(){
					switch(this.task){
						case "fuel": this.group = "red"; break;
						case "scout":
							this.group = "darkgreen";
							this.energy_max = this.energy_max * 10;
							this.speed = 0.5;
							break;
						case "carbon": this.group = "lightblue"; break;
						case "builder":
							this.group = "#ff00cb";
							this.w = this.w * 1.5;
							this.h = this.h * 1.5;
							this.speed = 2;
							this.energy_max = this.energy_max * 5;
							this.storage_max = this.energy_max;
						break;
						default: this.group = "silver"; break;
					}
				},
		    place: function(x, y) {
		        this.x = x;
		        this.y = y;
		        return this;
		    },

				getNextHangar: function(){
					this.next_hangar_dist = 0;
					for (var i = 0; i < this.data["hangar"].length; i++) {
						if(this.data["hangar"][i] !== undefined){
							var ndist = this.getDistance(this.data["hangar"][i].obj.ox, this.data["hangar"][i].obj.oy)
							if(this.next_hangar_dist == 0 || this.next_hangar_dist > ndist){
								this.next_hangar_dist = ndist;
								this.next_hangar = this.data["hangar"][i].obj;
							}
						}
					}
				},
				getNextResourcesFuel: function(){
					this.next_job_dist = 0;
					for (var i = 0; i < this.data["resources"]["fuel"].length; i++) {
						if(this.data["resources"]["fuel"][i] !== undefined){
							var ndist = this.getDistance(this.data["resources"]["fuel"][i].obj.ox, this.data["resources"]["fuel"][i].obj.oy)
							if(this.next_job_dist == 0 || this.next_job_dist > ndist){
								this.next_job_dist = ndist;
								this.next_job = this.data["resources"]["fuel"][i].obj;
							}
						}
					}
				},
				getDistance: function(x, y, x2 = this.ox, y2 = this.oy){
					//var a = x2 - x;
					//var b = y2 - y;
					//Crafty.log( Crafty.math.distance(x,y,x2,y2), this.energy, Math.abs( a + b ))

					return Math.round(Crafty.math.distance(x,y,x2,y2));
					//return Math.abs( a + b );
				},

				drawLine: function(){

				}
		})
	}

	initNanobotHangar(){
		Crafty.c("NanobotHangar", {
		    // This function will be called when the component is added to an entity
		    // So it sets up the things that both our entities had in common
		    init: function() {
		        this.addComponent("2D, Canvas, Color, Collision, Solid");
						this.id = this[0];
		        this.w = 100;
		        this.h = 100;
						this.z = -1;
						this.checkHits('Solid');

						this.typ = "hangar";
						this.team = 1;
						this.group = "red";

						this.energy_max = 10000000; // 10 000 000
						this.energy = 10000000; // 10 000 000

						// the hangar processes fuel to energy!
						this.storage_typ = "fuel";
						this.storage_max = this.energy_max / 2;
						this.storage = 0;

						var energy_visio = Crafty.e("2D, Canvas, Color")
					                     .attr({x: 0, y: 20, w: 0, h: 20})
					                     .color("green");
						this.attach(energy_visio);
						this.energy_visio = energy_visio;

						this.energy_visio_text = Crafty.e("2D, Canvas, Text").text(this.energy).textFont({ size: '18px'});
						this.attach(this.energy_visio_text);

		    },
				events: {
					"UpdateFrame": "action",
					"HitOn": "ping",
					"HitOff": "lost"
				},

				// recived a ping
				ping: function(from){
					for (var i = 0; i < from.length; i++) {
						//Crafty.log("Hangar[",this.id,"] -> (",from[i].obj.energy_max,") -> Nanobot[",from[i].obj.id,"]");
						var needed_energy = from[i].obj.energy_max - from[i].obj.energy;
						if(this.energy - needed_energy >= 0){
							from[i].obj.energy+=needed_energy;
							this.energy-= needed_energy;

						}else if(this.energy > 0){ // give last bit of energy
							from[i].obj.energy+=this.energy;
							this.energy-= this.energy;
						}

						//Crafty.log(from[i].obj.storage_typ, from[i].obj.storage, (this.storage_max - this.storage - from[i].obj.storage) )
						if(from[i].obj.storage_typ == "fuel" && from[i].obj.storage > 0 && (this.storage_max - this.storage - from[i].obj.storage) > 0){
							this.storage+= from[i].obj.storage;
							from[i].obj.storage = 0;
							//Crafty.log(this.storage);
						}

						var percent = this.setVisio();

						if(percent < 50 && from[i].obj.task == "fuel"){
							from[i].obj.work_queue = "fuel";
						}

						// set next hit
						this.resetHitChecks('Solid');
					}

				},
				// try to connect "to"
				lost: function(from){

				},

				setVisio: function(){
					// set visio
					this.energy_visio_text.text(Math.round(this.energy));
					var percent = this.energy * 100 / this.energy_max;
					var nwidth = percent*this.w / 100;
					this.energy_visio.w = nwidth;
					//Crafty.log(this.energy_visio);
					return percent;
				},
				// do something every frame
				action: function(eventData){
					//Crafty.log(eventData);
					if(this.storage > 0 && this.energy_max - this.energy > 0)
					{
						this.storage-= 50;
						this.energy+=5000;
						var percent = this.setVisio();
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
				setTeam: function(team){
					this.team = team;
					return this;
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
	// great storage
	initNanobotDepot(){
		Crafty.c("NanobotDepot", {
		    // This function will be called when the component is added to an entity
		    // So it sets up the things that both our entities had in common
		    init: function() {
		        this.addComponent("2D, Canvas, Color, Collision, Solid");
						this.id = this[0];
		        this.w = 150;
		        this.h = 150;
						this.checkHits('Solid');
				}
		});
	}
	// use carbon to make nanobots (needs fuel)
	initNanobotFactory(){
		Crafty.c("NanobotFactory", {
		    // This function will be called when the component is added to an entity
		    // So it sets up the things that both our entities had in common
		    init: function() {
		        this.addComponent("2D, Canvas, Color, Collision, Solid");
						this.id = this[0];
		        this.w = 200;
		        this.h = 200;
						this.checkHits('Solid');
				}
		});
	}

	initLine(){
		Crafty.c("Line", {
		    init: function () {
		        this.requires("2D, Canvas");
		        this.bind("Draw", this._draw_me);
		        this.ready = true;
		    },
		    _draw_me: function (e) {
		        var ctx = e.ctx;
		        ctx.lineWidth = 2;
		        ctx.strokeStyle = "green";
		        ctx.beginPath();
						Crafty.log(this.x, this.y)
		        ctx.moveTo(this.x, this.y);
		        ctx.lineTo(this.x + 500, this.y + 700);
		        ctx.stroke();
		    }
		});
	}
}
exports.NanoManager = NanoManager
