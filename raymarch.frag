#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D texture;
uniform float time;
uniform vec2 resolution;
uniform vec4 mouse;

#define saturate(i) clamp(i,0.,1.)
#define lofi(i,j) i-mod(i,1.0/j)

float hash( float _i ){
  return fract( sin( _i * 2718.45 ) * 67124.34 );
}

float smin( float a, float b, float k ){
  float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
  return mix( b, a, h ) - k*h*(1.0-h);
}

mat2 rotate( float _i ){
  return mat2( cos( _i ), sin( _i ), -sin( _i ), cos( _i ) );
}

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
  float dist = 1E6;
  vec3 p = _p;
  p.xy = rotate( floor( p.z / 0.6 - 0.5 ) + 0.5 ) * p.xy;
  p = mod( p - 0.3 + vec3( time, 0.0, 0.0 ), 0.6 ) - 0.3;
  vec2 d = vec2(
    bitmapRaymarcher( texture, vec2( 512.0, 128.0 ), saturate( p.xy * vec2( 1.0, -4.0 ) + 0.5 ) ),
    abs( p.z ) - 0.05
  );
  return min( max( d.x, d.y ), 0.0 ) + length( max( d, 0.0 ) );
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

  vec3 camPos = vec3( 0.0, 0.0, 0.4 ) + vec3( mouse.xy / resolution.xy - 0.5, 0.0 );
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

  for( int i=0; i<72; i++ ){
    dist = distFunc( rayPos );
    rayLen += dist * 0.5;
    rayPos = rayBeg + rayLen * rayDir;
  }

  if( dist < 1E-2 ){
    vec3 nor = normalFunc( rayPos );
    vec3 ligPos = vec3( 4.0, 3.0, 5.0 );
    vec3 ligDir = normalize( rayPos - ligPos );
    float dif = saturate( dot( -nor, ligDir ) ) * 0.5 + 0.5;
    float spe = pow( saturate( dot( -nor, normalize( ligDir + rayDir ) ) ), 40.0 );
    rayCol = ( vec3( 1.0 ) * dif + spe ) * exp( -rayLen * 0.1 );
  }
  gl_FragColor = vec4( rayCol, 1.0 );
}