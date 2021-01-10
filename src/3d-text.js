import { Mesh, Group, MeshNormalMaterial, FontLoader, TextGeometry } from "three";
import { makeCentered } from "./positioning";

export function createFontGroup({ text, size, height, fontJson }) {
	const font = new FontLoader().parse(fontJson);
	const fontGeometry = new TextGeometry(text, {
		font,
		size,
		height,
		curveSegments: 12,
		bevelEnabled: false,
	});
	const fontMaterial = new MeshNormalMaterial();
	const fontMesh = new Mesh(fontGeometry, fontMaterial);
	makeCentered(fontMesh);

	const fontGroup = new Group();
	fontGroup.add(fontMesh);
	return fontGroup;
}
