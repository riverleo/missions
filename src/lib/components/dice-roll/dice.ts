export class Dice {
	private faces: number;

	constructor(faces: number) {
		this.faces = faces;
	}

	static get D20(): Dice {
		return new Dice(20);
	}

	roll(): number {
		return Math.floor(Math.random() * this.faces) + 1;
	}
}
