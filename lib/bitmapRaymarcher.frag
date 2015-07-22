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
