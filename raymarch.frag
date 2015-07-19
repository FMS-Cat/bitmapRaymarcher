#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D texture;
uniform float time;
uniform vec2 resolution;

#define saturate(i) clamp(i,0.,1.)
#define lofi(i,j) i-mod(i,1.0/j)

float fromColor( vec4 _i ){
  float ret = 0.0;
  ret += _i.x / 256.0 / 256.0;
  ret += _i.y / 256.0;
  ret += _i.z;
  if( 0.5 <= _i.w ){ ret = -ret; }
  return ret;
}

float extrude( vec2 _p ){
  vec2 reso = vec2( 512.0, 512.0 );
  vec2 phase = fract( _p * reso );
  float v00 = fromColor( texture2D( texture, ( floor( _p * reso ) + vec2( 0.5, 0.5 ) ) / reso ) );
  float v01 = fromColor( texture2D( texture, ( floor( _p * reso ) + vec2( 0.5, 1.5 ) ) / reso ) );
  float v10 = fromColor( texture2D( texture, ( floor( _p * reso ) + vec2( 1.5, 0.5 ) ) / reso ) );
  float v11 = fromColor( texture2D( texture, ( floor( _p * reso ) + vec2( 1.5, 1.5 ) ) / reso ) );
  return mix( mix( v00, v10, phase.x ), mix( v01, v11, phase.x ), phase.y );
}

float distFunc( vec3 _p ){
  vec3 p = mod( _p - 0.5 + time * vec3( 0.25, 0.25, 1.0 ) * 0.5, 1.0 ) - 0.5;
  float distXY = extrude( saturate( p.xy * vec2( 1.0, -1.0 ) * 0.7 + 0.5 ) );
  float distZ = abs( p.z ) - 0.1;
  if( 0.0 <= distXY && 0.0 <= distZ ){
    return length( vec2( distXY, distZ ) );
  }else{
    return max( distXY, distZ );
  }
}

vec3 normalFunc( vec3 _p ){
  vec2 d = vec2( 0.0, 1E-3 );
  return normalize( vec3(
    distFunc( _p + d.yxx ) - distFunc( _p - d.yxx ),
    distFunc( _p + d.xyx ) - distFunc( _p - d.xyx ),
    distFunc( _p + d.xxy ) - distFunc( _p - d.xxy )
  ) );
}

void main(){
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.x;

  vec3 camPos = vec3( 0.0, 0.0, 1.0 );
  vec3 camCen = vec3( 0.0, 0.0, 0.0 );
  vec3 camDir = normalize( camCen - camPos );
  vec3 camAir = vec3( 0.0, 1.0, 0.0 );
  vec3 camSid = normalize( cross( camDir, camAir ) );
  vec3 camTop = normalize( cross( camSid, camDir ) );

  vec3 rayDir = normalize( p.x * camSid + p.y * camTop + camDir );
  vec3 rayBeg = camPos;
  float rayLen = 0.01;
  vec3 rayPos = rayBeg + rayLen * rayDir;
  vec3 rayCol = vec3( 0.0, 0.0, 0.0 );

  float dist = 0.0;

  for( int i=0; i<80; i++ ){
    dist = distFunc( rayPos );
    rayLen += dist * 0.8;
    rayPos = rayBeg + rayLen * rayDir;
  }

  if( dist < 1E-2 ){
    vec3 nor = normalFunc( rayPos );
    vec3 ligPos = vec3( 4.0, 3.0, 5.0 );
    vec3 ligDir = normalize( rayPos - ligPos );
    float dif = saturate( dot( -nor, ligDir ) );
    float spe = pow( saturate( dot( -nor, normalize( ligDir + rayDir ) ) ), 40.0 );
    rayCol = ( vec3( 1.0 ) * dif + spe ) * exp( -rayLen * 0.5 );
  }
  gl_FragColor = vec4( rayCol, 1.0 );
}
