import Matter from 'matter-js';

export function createEllipseVertices(
	cx: number,
	cy: number,
	rx: number,
	ry: number,
	segments: number = 24
): Matter.Vector[] {
	const vertices: Matter.Vector[] = [];
	for (let i = 0; i < segments; i++) {
		const angle = (i / segments) * Math.PI * 2;
		vertices.push({
			x: cx + rx * Math.cos(angle),
			y: cy + ry * Math.sin(angle),
		});
	}
	return vertices;
}
