'use strict';

class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	plus(moveVector) {
		if (!(moveVector instanceof Vector)) {
			throw new Error('Можно прибавлять к вектору только вектор типа Vector');
		}
		return new Vector(this.x + moveVector.x, this.y + moveVector.y);
	}

	times(multiplier) {
		return new Vector(this.x * multiplier, this.y * multiplier);
	}
}


class Actor {
	constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
			if (!((pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector))) {
				throw new Error('В Actor переданы не объекты класса Vector');
			}
		this.pos = pos;
		this.size = size;
		this.speed = speed;
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
		if (!(movingActor instanceof Actor)) {
			throw new Error('В isIntersect передан не объект класса Actor');
		}

		if (this === movingActor) {
			return false;
		}

		const notCrossX = (this.right <= movingActor.left) || (this.left >= movingActor.right);

		const notCrossY = (this.top >= movingActor.bottom) || (this.bottom <= movingActor.top);

		if (notCrossX || notCrossY) {
			return false;
		}
		
		return true;
	}
}

class Level {
	constructor(grid, actors) {
		this.grid = grid;
		this.actors = actors;
		this.player = (actors === undefined) ? undefined : actors.filter((actor) => (actor.type === 'player')).pop();
		this.height = (grid === undefined) ? 0 : grid.length;
		this.width = (grid === undefined) ? 0 : grid.reduce(function(maxWidth, currentGridLine) {
			return currentGridLine.length > maxWidth ? currentGridLine.length : maxWidth;
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

		if (this.actors === undefined || this.actors.length === 0) {
			return undefined;
		}

		for (const movingActor of this.actors) {
		  if (actor.isIntersect(movingActor)) {
				return movingActor;
		  }
		}
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

		for (const movingActor of this.actors) {
			if (movingActor.type === actorType) {
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


class LevelParser {
	constructor(dict) {
		this.dict = dict;
	}

	actorFromSymbol(symbol) {
		if ( (symbol === undefined) || (symbol === ' ') || (symbol === 'x') || (symbol === '!') ) {
			return undefined;
		}
		return this.dict[symbol];
	}

	obstacleFromSymbol(symbol) {
		if (symbol === undefined) {
			return undefined;
		}

		switch(symbol) {
			case 'x': 
				return 'wall';
			case '!':
				return 'lava';
			default:
				return;
		}
	}

	//Array of Strings (plan of level) convert to Array of Arrays (only for grid - without Actors)
	createGrid(plan) {
		if ( (plan === undefined) || (plan.length === 0) ) {
			return [];
		}

		return plan.map( (str) => str.split('').map( (symbol) => this.obstacleFromSymbol(symbol) ) );
	}

	//return Array of Actors from Array of Strings(plan of level)
	createActors(plan) {
		if ( (plan === undefined) || (plan.length === 0) ) {
			return [];
		}

		return [].concat( ...plan.map( (str, y) => {
			return str.split('').map( (symbol, x) => {
				if ( (this.dict) && (Object.keys(this.dict).length > 0) && (symbol in this.dict) && (this.actorFromSymbol(symbol)) ) {
					const ActorConstructor = this.actorFromSymbol(symbol);
					if ( ( Actor.prototype === ActorConstructor.prototype) || ( Actor.prototype.isPrototypeOf(ActorConstructor.prototype) ) ) {
						return new ActorConstructor( new Vector(x, y) );
					}
				}
			} );
		} ) ).filter( (actorConstr) => actorConstr !== undefined );
	}

	parse(plan) {
		return new Level( this.createGrid(plan), this.createActors(plan) );
	}
}

class Player extends Actor {
	constructor(pos = new Vector(0, 0)) {
		super(pos);
		this.pos = pos.plus(new Vector(0, -0.5));
		this.size = new Vector(0.8, 1.5);
	}

	get type() {
		return 'player';
	}
}

class Fireball extends Actor {
	constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
		super(pos, undefined, speed);
	}

	get type() {
		return 'fireball';
	}

	getNextPosition(time = 1) {
		return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
	}

	handleObstacle() {
		this.speed = new Vector(-this.speed.x, -this.speed.y);
	}

	act(time, level) {
		const nextPos = this.getNextPosition(time);

		if (!level.obstacleAt(nextPos, this.size)) {
			this.pos = nextPos;
		} else {
			this.handleObstacle();
		}
	}
}


class HorizontalFireball extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos);
		this.speed = new Vector(2, 0);
	}
}


class VerticalFireball extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos);
		this.speed = new Vector(0, 2);
	}
}


class FireRain extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos);
		this.speed = new Vector(0, 3);

		Object.defineProperty(this, 'initialPos', {
			writable: false,
			enumerable: true,
			configurable: true,
			value: pos
		});
	}

	handleObstacle() {
		this.pos = this.initialPos;
	}
}

class Coin extends Actor {
	constructor(pos = new Vector(0, 0)) {
		super(pos);
		this.pos = this.initialPos = pos.plus(new Vector(0.2, 0.1));
		this.size = new Vector(0.6, 0.6);
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * 2 * Math.PI;
	}

	get type() {
		return 'coin';
	}

	updateSpring(time = 1) {
		this.spring += this.springSpeed * time;
	}

	getSpringVector() {
		return new Vector(0, this.springDist * Math.sin(this.spring));
	}

	getNextPosition(time = 1) {
		this.updateSpring(time);
		return this.initialPos.plus(this.getSpringVector());
	}

	act(time = 1) {
		this.pos = this.getNextPosition(time);
	}
}



const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball
}
const parser = new LevelParser(actorDict);

loadLevels()
	.then( (schemasJSON) => JSON.parse(schemasJSON) )
	.catch( (err) => console.log('Произошла ошибка ' + err) )
	.then( (schemas) => runGame(schemas, parser, DOMDisplay) )
	.then( () => alert('Вы победили!!!') )