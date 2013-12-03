(function(){
  
  var fill = function(){
    var defValue = this.__defValue__;
    var len = this.__length__;
    var isFN = typeof defValue === 'function';
    
    // SIMPLE ARRAY OBJECT
    for(var i = 0, e = len; i < e; i++){
      if( isFN ) this[i] = defValue( i, this[i] );
      else       this[i] = defValue;
    }
  };
  
  var clone = function( list ){
    var lenA = this.__length__;
    var lenB = list.__length__;
    if( typeof lenB ) lenB = list.length;

    if( lenB !== lenA ) throw Error("source and target list have different lengths");

    for(var i = 0, e = lenA; i < e; i++){
      list[i] = this[i];
    }
  };
  
  var grab = function( list ){
    var lenA = this.__length__;
    var lenB = list.__length__;
    if( typeof lenB ) lenB = list.length;

    if( lenB !== lenA ) throw Error("source and target list have different lengths");

    for(var i = 0, e = lenA; i < e; i++){
      this[i] = list[i];
    }
  };
  
  // Creates a list and fills it with default values.
  // 
  // @param {Number} len the length of the created list
  // @param defaultValue the default value that will be inserted into the list slots 
  util.list = function( len, defaultValue ){
    if( defaultValue === undefined ){ defaultValue = null; }
    
    var warr = [];
    warr.__defValue__ = defaultValue;
    warr.__length__ = len;
    warr.resetValues = fill;
    warr.cloneValues = clone;
    warr.grabValues = grab;
    
    warr.resetValues();
    
    return warr;
  };
  
  
})();