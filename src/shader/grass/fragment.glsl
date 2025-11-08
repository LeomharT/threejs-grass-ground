varying vec2 vUv;
varying vec3 vPosition;


void main(){
    vec3 color = normalize(vPosition);

    gl_FragColor = vec4(color , 1.0);
}