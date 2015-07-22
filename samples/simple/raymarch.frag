#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D texture;
uniform float time;
uniform vec2 resolution;
uniform vec4 mouse;

#define saturate(i) clamp(i,0.,1.)
#define lofi(i,j) i-mod(i,1.0/j)

float bitmapRaymarcherFromColor( vec4 _i ){
  float ret = 0.0;
  ret += _i.x / 256.0 / 256.0;
  ret += _i.y / 256.0;
  ret += _i.z;
  if( 0.5 <= _i.w ){ ret = -ret; }
  return ret;
}

float bitmapRaymarcher( sampler2D _tex, vec2 _texReso, vec2 _p ){
  vec2 reso = _texReso;
  vec2 phase = fract( _p * reso );
  float v00 = bitmapRaymarcherFromColor( texture2D( _tex, ( floor( _p * reso ) + vec2( 0.5, 0.5 ) ) / reso ) );
  float v01 = bitmapRaymarcherFromColor( texture2D( _tex, ( floor( _p * reso ) + vec2( 0.5, 1.5 ) ) / reso ) );
  float v10 = bitmapRaymarcherFromColor( texture2D( _tex, ( floor( _p * reso ) + vec2( 1.5, 0.5 ) ) / reso ) );
  float v11 = bitmapRaymarcherFromColor( texture2D( _tex, ( floor( _p * reso ) + vec2( 1.5, 1.5 ) ) / reso ) );
  return mix( mix( v00, v10, phase.x ), mix( v01, v11, phase.x ), phase.y );
}

float distFunc( vec3 _p ){
  vec3 p = _p;
  vec2 dist = vec2(
    bitmapRaymarcher( texture, vec2( 512.0, 512.0 ), saturate( p.xy * vec2( 1.0, -1.0 ) + 0.5 ) ),
    abs( p.z ) - 0.1
  );
  return min( max( dist.x, dist.y ), 0.0 ) + length( max( dist, 0.0 ) );
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

  vec3 camPos = vec3( 0.0, 0.0, 0.5 );
  vec3 camCen = vec3( 0.0, 0.0, 0.0 );
  vec3 camDir = normalize( camCen - camPos );
  vec3 camAir = vec3( 0.0, 1.0, 0.0 );
  vec3 camSid = normalize( cross( camDir, camAir ) );
  vec3 camTop = normalize( cross( camSid, camDir ) );

  vec3 rayDir = normalize( p.x * camSid + p.y * camTop + camDir );
  vec3 rayBeg = camPos;
  float rayLen = 0.01;
  vec3 rayPos = rayBeg + rayLen * rayDir;

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
    vec3 dif = saturate( dot( -nor, ligDir ) ) * vec3( 1.0 );
    gl_FragColor = vec4( dif, 1.0 );
  }else{
    gl_FragColor = vec4( vec3( 0.0 ), 1.0 );
  }
}
