### Demo
https://c9.io/leodutra/moby-tools/workspace/components/slider/index.html

### Methods
    Slider(slider, initialValue = 0, max = 100, min = 0, modifier = 1, snapping = false, valueCallback = null, vertical = false, disabled = false, paddingMode = false, paddingModifier:Number)
    
    update(skipRedraw:Boolean):void
    
    snapping(value:Boolean, skipRedraw:Boolean):Boolean
        
    max(value:Number, skipRedraw:Boolean):Number
    
    min(value:Number, skipRedraw:Boolean):Number
    
    modifier(value:Number, skipRedraw:Boolean):Number
    
    vertical(value:Boolean, skipRedraw:Boolean):Boolean
    
    value(value:Number, skipRedraw:Boolean):Number
    
    disabled(bool:Boolean, skipRedraw:Boolean):Boolean
        
    paddingMode(bool:Boolean, paddingModifier:Number):Boolean
    
    redraw(skip:Boolean):void
    
    destroy():void *** 
    
    *** Remember to use destroy(), avoiding memory leaks.

### Overridables
    onEnd(value:Number) - fired when user finishes sliding