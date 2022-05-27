import { ShaderMaterial } from 'hilo3d';

export default class BillboardMaterial extends ShaderMaterial {
	constructor(diffuse) {
		super({
			diffuse,
			uniforms: {
				u_diffuse: 'DIFFUSE',
				u_modelViewMatrix: 'MODELVIEW',
				u_projectionMatrix: 'PROJECTION',
				u_scale: {
					isDependMesh: true,
					get: function (mesh) {
						if (!mesh.__billdboardScale) {
							mesh.__billdboardScale = new Hilo3d.Vector3(1, 1, 1);
						}
						return mesh.worldMatrix.getScaling(mesh.__billdboardScale).elements;
					}
				}
			},
			attributes: {
				a_position: 'POSITION',
				a_texcoord0: 'TEXCOORD_0'
			},
			fs: `
            precision HILO_MAX_FRAGMENT_PRECISION float;
            varying vec2 v_texcoord0;
            uniform sampler2D u_diffuse;
                         
            void main(void) {
                vec4 diffuse = texture2D(u_diffuse, vec2(v_texcoord0.x, v_texcoord0.y));    
                gl_FragColor = diffuse;
            }
        `,
			vs: `
            precision HILO_MAX_VERTEX_PRECISION float;
            uniform vec3 u_scale;
            attribute vec3 a_position;
            attribute vec2 a_texcoord0;
            varying vec2 v_texcoord0;
            uniform mat4 u_modelViewMatrix;
            uniform mat4 u_projectionMatrix;
            void main(void) {
                vec4 center = u_modelViewMatrix * vec4(0, 0, 0, 1);
                center.xy += a_position.xy * u_scale.xy;
                gl_Position = u_projectionMatrix * center;
                v_texcoord0 = a_texcoord0;
            }
        `
		});
	}
}
