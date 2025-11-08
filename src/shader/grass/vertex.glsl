varying vec2 vUv;
varying vec3 vPosition;

// https://stackoverflow.com/questions/55582846/how-do-i-implement-an-instanced-billboard-in-three-js
vec3 billboard(vec3 v,mat4 view){
    vec3 up=vec3(view[0][1],view[1][1],view[2][1]);
    up.x = 0.0;
    up.z = 0.0;
    vec3 right=vec3(view[0][0],view[1][0],view[2][0]);
    vec3 pos=right*v.x+up*v.y;
    return pos;
}


void main(){
    
    #include <begin_vertex>

    // instanceMatrix instand of modelMatrix
    vec4 modelPosition = instanceMatrix * vec4(position, 1.0);
   
    vec3 billboardPos = billboard(transformed, modelViewMatrix);

 
    #include <project_vertex>

    // Varying
    vUv       = uv;
    vPosition = modelPosition.xyz;
}