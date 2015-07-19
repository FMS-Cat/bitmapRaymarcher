#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D texture;
uniform vec2 resolution;

#define saturate(i) clamp(i,0.,1.)

vec4 toColor( float _i, bool _inside ){
  if( 1.0 <= _i ){
    return vec4( vec3( 1.0 ), 0.4999 );
  }else{
    vec4 ret = vec4( 0.0 );
    ret.x = fract( abs( _i ) * 256.0 * 256.0 );
    ret.y = fract( abs( _i ) * 256.0 );
    ret.z = fract( abs( _i ) );
    if( _inside ){ ret.w = 1.0; }
    return ret;
  }
}

float fromColor( vec4 _i ){
  #ifdef HORI
    return - 1E6 + 2E6 * floor( _i.x + 0.5 );
  #endif

  #ifdef VERT
    float ret = 0.0;
    ret += _i.x / 256.0 / 256.0;
    ret += _i.y / 256.0;
    ret += _i.z;
    if( 0.5 <= _i.w ){ ret = -ret; }
    return ret;
  #endif
}

bool isSameSide( float _col, bool _inside ){
  return ( _col < 0.0 ) == _inside;
}

vec4 texel( sampler2D _tex, vec2 _p ){
  vec2 p = ( floor( _p ) + 0.5 ) / resolution;
  return texture2D( _tex, p );
}

void main(){
  vec2 p = vec2( 0.0, resolution.y ) + gl_FragCoord.xy * vec2( 1.0, -1.0 );
  vec4 tex = texel( texture, p );

  #ifdef HORI
    vec2 gap = vec2( 1.0, 0.0 );
    float reso = resolution.x;
    float coord = gl_FragCoord.x;
    bool inside = tex.x < 0.5;
  #endif

  #ifdef VERT
    vec2 gap = vec2( 0.0, 1.0 );
    float reso = resolution.y;
    float coord = gl_FragCoord.y;
    bool inside = 0.5 <= tex.w;
  #endif

  float iMax = reso / 2.0 + abs( coord - reso / 2.0 );
  float dist = abs( fromColor( tex ) );

  for( float i=1.0; i<1E3; i+=1.0 ){
    for( float ii=-1.0; ii<2.0; ii+=2.0 ){
      vec2 tCoord = p + ii * i * gap;
      if( abs( tCoord.x - resolution.x / 2.0 ) < resolution.x / 2.0 && abs( tCoord.y - resolution.y / 2.0 ) < resolution.y / 2.0 ){
        float col = fromColor( texel( texture, tCoord ) );
        float distC;
        if( isSameSide( col, inside ) ){
          distC = length( vec2( ( i - 0.5 ) / reso, col ) );
        }else{
          distC = length( vec2( ( i - 0.5 ) / reso, 0.0 ) );
        }
        dist = min( dist, distC );
      }
    }
    if( iMax < i || dist < ( i - 0.5 ) / reso ){ break; }
  }

  gl_FragColor = toColor( dist, inside );
}
