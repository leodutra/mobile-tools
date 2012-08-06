### Demo
https://c9.io/leodutra/moby-tools/workspace/components/slider/index.html

### Methods
    Slider(slider, initialValue = 0, max = 100, min = 0, modifier = 1, snapping = false, valueCallback = null, vertical = false, disabled = false, paddingMode = false, paddingModifier:Number)
        constructor
    
    update(skipRedraw:Boolean):void
        updates slider internal values and redraws
    
    snapping(value:Boolean, skipRedraw:Boolean):Boolean
        sets/gets snapping mode state (on/off = true/false) and redraws
        
    max(value:Number, skipRedraw:Boolean):Number
        sets/gets max slider value and redraws
    
    min(value:Number, skipRedraw:Boolean):Number
        sets/gets min slider value and redraws
    
    modifier(value:Number, skipRedraw:Boolean):Number
        sets/gets slider value modifier and redraws
    
    vertical(value:Boolean, skipRedraw:Boolean):Boolean
        sets/gets vertical mode state (on/off = true/false) and redraws
    
    value(value:Number, skipRedraw:Boolean):Number
        sets/gets current value and redraw
    
    disabled(bool:Boolean, skipRedraw:Boolean):Boolean
        sets/gets disabled mode (on/off = true/false) and redraws
        
    paddingMode(bool:Boolean, paddingModifier:Number):Boolean
        sets/gets padding mode (on/off = true/false) and redraws
    
    redraw(skip:Boolean):void
        sets elements style properties, causing browser redraw
    
    destroy():void *** 
        destroys the current slider, removing events, references and else
    
    *** Remember to use destroy(), avoiding memory leaks.

### Overridables
    - onEnd(value:Number) 
        override: fired when user finishes sliding