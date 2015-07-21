var frag =
"#ifdef GL_ES\n" +
"precision mediump float;\n" +
"#endif\n" +
"uniform sampler2D texture;\n" +
"uniform vec2 resolution;\n" +
"#define saturate(i) clamp(i,0.,1.)\n" +
"vec4 toColor( float _i, bool _inside ){\n" +
"  if( 1.0 <= _i ){\n" +
"    return vec4( vec3( 1.0 ), 0.4999 );\n" +
"  }else{\n" +
"    vec4 ret = vec4( 0.0 );\n" +
"    ret.x = fract( abs( _i ) * 256.0 * 256.0 );\n" +
"    ret.y = fract( abs( _i ) * 256.0 );\n" +
"    ret.z = fract( abs( _i ) );\n" +
"    if( _inside ){ ret.w = 1.0; }\n" +
"    return ret;\n" +
"  }\n" +
"}\n" +
"float fromColor( vec4 _i ){\n" +
"  #ifdef HORI\n" +
"    return - 1E6 + 2E6 * floor( _i.x + 0.5 );\n" +
"  #endif\n" +
"  #ifdef VERT\n" +
"    float ret = 0.0;\n" +
"    if( _i.xyz == vec3( 1.0 ) ){\n" +
"      ret = 1E6;\n" +
"    }else{\n" +
"      ret += _i.x / 256.0 / 256.0;\n" +
"      ret += _i.y / 256.0;\n" +
"      ret += _i.z;\n" +
"    }\n" +
"    if( 0.5 <= _i.w ){ ret = -ret; }\n" +
"    return ret;\n" +
"  #endif\n" +
"}\n" +
"bool isSameSide( float _col, bool _inside ){\n" +
"  return ( _col < 0.0 ) == _inside;\n" +
"}\n" +
"vec4 texel( sampler2D _tex, vec2 _p ){\n" +
"  vec2 p = ( floor( _p ) + 0.5 ) / resolution;\n" +
"  return texture2D( _tex, p );\n" +
"}\n" +
"void main(){\n" +
"  vec2 p = vec2( 0.0, resolution.y ) + gl_FragCoord.xy * vec2( 1.0, -1.0 );\n" +
"  vec4 tex = texel( texture, p );\n" +
"  #ifdef HORI\n" +
"    vec2 gap = vec2( 1.0, 0.0 );\n" +
"    float reso = resolution.x;\n" +
"    float coord = gl_FragCoord.x;\n" +
"    bool inside = tex.x < 0.5;\n" +
"  #endif\n" +
"  #ifdef VERT\n" +
"    vec2 gap = vec2( 0.0, 1.0 );\n" +
"    float reso = resolution.y;\n" +
"    float coord = gl_FragCoord.y;\n" +
"    bool inside = 0.5 <= tex.w;\n" +
"  #endif\n" +
"  float iMax = reso / 2.0 + abs( coord - reso / 2.0 );\n" +
"  float dist = abs( fromColor( tex ) );\n" +
"  for( float i=1.0; i<1E3; i+=1.0 ){\n" +
"    for( float ii=-1.0; ii<2.0; ii+=2.0 ){\n" +
"      vec2 tCoord = p + ii * i * gap;\n" +
"      if( abs( tCoord.x - resolution.x / 2.0 ) < resolution.x / 2.0 && abs( tCoord.y - resolution.y / 2.0 ) < resolution.y / 2.0 ){\n" +
"        float col = fromColor( texel( texture, tCoord ) );\n" +
"        float distC;\n" +
"        if( isSameSide( col, inside ) ){\n" +
"          distC = length( vec2( ( i - 0.5 ) / reso, col ) );\n" +
"        }else{\n" +
"          distC = length( vec2( ( i - 0.5 ) / reso, 0.0 ) );\n" +
"        }\n" +
"        dist = min( dist, distC );\n" +
"      }\n" +
"    }\n" +
"    if( iMax < i || dist < ( i - 0.5 ) / reso ){ break; }\n" +
"  }\n" +
"\n" +
"  gl_FragColor = toColor( dist, inside );\n" +
"}\n";

function createDistanceTexture( _image, _width, _height, _callback ){
  var itaPolyH = new ItaPoly( _width, _height );
  var itaPolyV = new ItaPoly( _width, _height );

  itaPolyH.createProgram( '#define HORI\n' + frag, function(){
    itaPolyV.createProgram( '#define VERT\n' + frag, function(){
      itaPolyH.setSampler2D( 'texture', _image );
      itaPolyH.update();
      itaPolyV.setSampler2D( 'texture', itaPolyH.canvas );
      itaPolyV.update();

      if( typeof _callback === 'function' ){ _callback( itaPolyV.canvas ); }
    } );
  } );
}
