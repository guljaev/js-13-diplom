'use strict';

class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	plus(moveVector) {
		// try {
		if (!(moveVector instanceof Vector)) {
			throw new Error('Можно прибавлять к вектору только вектор типа Vector');
		}
		return new Vector(this.x + moveVector.x, this.y + moveVector.y);
		// } catch(err) {
		// 	console.log(err.message);
		// }
	}

	times(multiplier) {
		return new Vector(this.x * multiplier, this.y * multiplier);
	}
}


class Actor {
	constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
		// try {
			if (!((pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector))) {
				throw new Error('В Actor переданы не объекты класса Vector');
			}
		this.pos = pos;
		this.size = size;
		this.speed = speed;
		// } catch(err) {
		// 	console.log(err);
		// }
	}

	act() {
	}

	get left() {
		return this.pos.x;
	}
	get top() {
		return this.pos.y;
	}
	get right() {
		return this.pos.x + this.size.x;
	}
	get bottom() {
		return this.pos.y + this.size.y;
	}

	get type() {
		return 'actor';
	}

	isIntersect(movingActor) {
		// try {
		if (!(movingActor instanceof Actor)) {
			throw new Error('В isIntersect передан не объект класса Actor');
		}

		if (this === movingActor) {
			return false;
		}

		const notCrossX = (this.right <= movingActor.left) || (this.left >= movingActor.right);
	// 	console.log('Непересечение по X: ' + notCrossX);
		const notCrossY = (this.top >= movingActor.bottom) || (this.bottom <= movingActor.top);
	// 	console.log('Непересечение по Y: ' + notCrossY);
		if (notCrossX || notCrossY) {
			return false;
		}
		
		return true;
		// } catch(err) {
		// 	console.log(err);
		// }
	}
}

class Level {
	constructor(grid, actors) {
		this.grid = grid;
		this.actors = actors;
		this.player = (actors === undefined) ? undefined : actors.filter((actor) => (actor.type === 'player')).pop();
		this.height = (grid === undefined) ? 0 : grid.length;
		this.width = (grid === undefined) ? 0 : grid.reduce(function(pv, cv) {
			return cv.length > pv ? cv.length : pv;
		}, 0);
		this.status = null;
		this.finishDelay = 1;
	}

	isFinished() {
		if ((this.status !== null) && (this.finishDelay < 0)) {
			return true;
		}
		return false;
	}

	actorAt(actor) {
		if (!(actor instanceof Actor) || (actor === undefined)) {
			throw new Error('В метод actorAt передан не объект класса Actor');
		}

		if (this.actors === undefined) {
			return undefined;
		}

		for (let i = 0; i < this.actors.length; i++) {
			if (actor.isIntersect(this.actors[i])) {
				return this.actors[i];
			}
		}

		// if (this.grid === undefined || this.grid[0] === undefined || this.grid[0][0] === undefined) {
		// 	return undefined;
		// }
	}

	obstacleAt(pos, size) {
		if ( !( (pos instanceof Vector) && (size instanceof Vector) ) ) {
			throw new Error('В метод obstacleAt переданы не объекты класса Vector');
		}

		if (pos.y + size.y > this.height) {
			return 'lava';
		}

		if ( (pos.y < 0) || (pos.x < 0) || (pos.x + size.x > this.width) ) {
			return 'wall';
		}

		for (let y = Math.floor(pos.y); y <= Math.ceil(pos.y + size.y) - 1; y++) {
		  for (let x = Math.floor(pos.x); x <= Math.ceil(pos.x + size.x) - 1; x++) {
		    if (this.grid[y][x]) {
		      return this.grid[y][x];
		    }
		  }
		}
	}

	removeActor(actor) {
		const actorIndex = this.actors.indexOf(actor);
		if (actorIndex !== -1) {
			this.actors.splice(actorIndex, 1);
		}
	}

	noMoreActors(actorType) {
		if ( (this.actors === []) || (this.actors === undefined) ) {
			return true;
		}

		for (let i = 0; i < this.actors.length; i++) {
			if (this.actors[i].type === actorType) {
				return false;
			}
		}
		return true;
	}

	playerTouched(type, actor) {
		if (this.status !== null) {
			return;
		}
		
		if ( (type === 'lava') || (type === 'fireball') ) {
			this.status = 'lost';
		}

		if (type === 'coin') {
			this.removeActor(actor);
			if (this.noMoreActors('coin')) {
				this.status = 'won';
			}
		}
		
	}
}