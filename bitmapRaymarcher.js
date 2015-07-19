function bitmapRaymarcher( _image, _width, _height, _callback ){
  var fragXhr = new XMLHttpRequest();
  fragXhr.open( 'GET', 'bitmapRaymarcher.frag', true );
  fragXhr.responseType = 'text';
  fragXhr.onload = function( _e ){
    var frag = this.response;

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
  };
  fragXhr.send();
}
