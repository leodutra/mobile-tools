/*
    Moby Tools UISlider
    (https://github.com/LeoDutra/Moby-Tools/tree/master/components/slider)
	
	MIT License:
	Copyright (c) 2012 Leonardo Dutra Constancio
	 
	Permission is hereby granted, free of charge, to any person
	obtaining a copy of this software and associated documentation
	files (the "Software"), to deal in the Software without
	restriction, including without limitation the rights to use,
	copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following
	conditions:
	 
	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.
	 
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
	OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
	HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.
 */

(function(window) {

    "use strict"; // Strict Mode compilant

    function UISlider(slider, initialValue, max, min, modifier, snapping, valueCallback, vertical) {
        if (this instanceof UISlider && slider && slider.nodeType === 1 /* MUST BE AN ELEMENT */ ) {
            this.slider = slider;
            
            // GLOBAL TO LOCAL
            var document = window.document;
            
            if (typeof modifier === 'number') this._modifier = modifier;
            if (typeof min === 'number') this._min = min;
            if (typeof max === 'number') this._max = max;
            if (typeof initialValue === 'number') this._value = initialValue;
            if (typeof valueCallback === 'function') this.valueCallback = valueCallback;
            if (typeof snapping==='boolean') this._snapping = snapping;
            if (typeof vertical==='boolean') this._vertical = vertical;

            // INNER AREA
            var innerArea = this.innerArea = slider.appendChild(document.createElement('div')); // needs append to get offsets
            innerArea.className = 'innerArea';

            // FILLER
            var filler = innerArea.appendChild(document.createElement('div'));
            filler.className = 'filler';
            this.fillerStyle = filler.style;

            // KNOT
            this.knot = innerArea.appendChild(document.createElement('div')); // needs append to get offsets
            this.knot.className = 'knot';
            this.knotStyle = this.knot.style;
           
            this.update();
            this.slider.addEventListener(this.eventStart, this, false);
        }
    }

    UISlider.prototype = {

        hasTouch: 'ontouchend' in window,

        // DEFAULT VALUES (setter/getter wrappable for instant updates)
        _value: 0,
        _max: 100,
        _min: 0,
        _modifier: 1,
        _snapping: false,
        _vertical: false,
        valueCallback: null,

        // VARS
        globalOffset: 0,
        steps: 0,
        snapGap: 0,
        knotSize: 0,
        knotHalfSize: 0,
        knotPosition: 0,
        valuableArea: 0,
        innerArea: null,
        innerAreaSize: 0,
        slider: null,
        knot: null,
        knotStyle: null,
        fillerStyle: null,

        // DEFAULT EVENT TYPES
        eventStart: 'touchstart',
        eventMove: 'touchmove',
        eventEnd: 'touchend',
        eventCancel: 'touchcancel',
        eventLeave: 'touchleave',

        // REDRAW LOCK
        redrawLocked: false,
        
        update: function(skipRedraw) {
            
            this.innerAreaSize = this._vertical ? this.innerArea.offsetHeight : this.innerArea.offsetWidth;
            this.knotSize = this._vertical ? this.knot.offsetHeight : this.knot.offsetWidth;
            this.knotHalfSize = this.knotSize * 0.5;
            var valueVariation = this._max - this._min;
            this.steps = /* ceil to threat a possible remainder value */Math.ceil(valueVariation / this._modifier);

            this.valuableArea = this.limit(this.innerAreaSize - this.knotSize, 0);
            this.snapGap = this.valuableArea / this.steps;

            this.value(this._value, skipRedraw);
        },
        
        snapping: function(snapping, skipRedraw) {
            if (typeof snapping==='boolean') {
                this._snapping = snapping;
                this.update(skipRedraw);
            }
            return this._snapping;
        },
        
        max: function(max, skipRedraw) {
            if (typeof max==='number') {
                this._max = max;
                this.update(skipRedraw);
            }
            return this._max;
        },
        
        min: function(min, skipRedraw) {
            if (typeof min==='number') {
                this._min = min;
                this.update(skipRedraw);
            }
            return this._min;
        },
        
        
        vertical: function(vertical, skipRedraw) {
            if (typeof vertical==='boolean') {
                this._vertical = vertical;
                this.update(skipRedraw);
            }
            return this._vertical;
        },
        
        value: function(value, skipRedraw) {
            var variableValue = (typeof value=='number' ? value : this._value) - this._min;
            var stepsFromOrigin = Math.round(variableValue / this._modifier);
            
            this._value = this.limit(stepsFromOrigin * this._modifier + this._min, this._min, this._max);
            if (this.valueCallback) this.valueCallback(this._value);
            
            this.knotPosition = this.limit(stepsFromOrigin * this.snapGap, 0, this.valuableArea);
            this.redraw(skipRedraw);
            return this._value;
        },

        redraw: function(skip) {
            if (skip) return;
            var that = this;
            this._requestBrowserRedraw(function() {
                that.knotStyle.cssText = (that._vertical ? 'top:' : 'left: ') + (that.knotPosition >> 0) + 'px';
                that.fillerStyle.cssText = (that._vertical ? 'height:' : 'width: ') + (that.knotPosition + that.knotHalfSize >> 0) + 'px';
                that = null; // avoids scope counting leak
            });
        },

        // GENERAL EVENT HANDLER
        handleEvent: function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // smart and optimum force
            if (e.touches) {
                e = e.changedTouches[0];
            }

            switch (e.type) {
            case this.eventStart:
                return this.onStart(e);
            case this.eventMove:
                 return this.onMove(e);
            case this.eventEnd:
            case this.eventCancel:
            case this.eventLeave:
                return this.onEnd(e);
            }

        },

        onStart: function(e) {
            var offset = this.getGlobalOffset(this.slider);
            this.globalOffset = this._vertical ? offset.y : offset.x;
            this.onMove(e);
            document.addEventListener(this.eventEnd, this, false);
            document.addEventListener(this.eventMove, this, false);
        },

        onMove: function(e) {
            var pointerRelativePosition = this.limit((this._vertical ?  e.pageY : e.pageX) - this.globalOffset - this.knotHalfSize, 0, this.valuableArea);
            var stepsFromOrigin = Math.round(pointerRelativePosition / this.snapGap);
        
            this._value = this.limit(stepsFromOrigin * this._modifier + this._min, this._min, this._max);
            if (this.valueCallback) this.valueCallback(this._value);
            
            this.knotPosition = this._snapping ? this.limit(stepsFromOrigin * this.snapGap, 0, this.valuableArea) : pointerRelativePosition;
            this.redraw();
        },

        onEnd: function(e) {
            this._removeVolatileListeners();
        },
        
        _removeVolatileListeners: function() {
            document.removeEventListener(this.eventMove, this, false);
            document.removeEventListener(this.eventEnd, this, false);    
        },

        destroy: function() {
            this._removeVolatileListeners();
            document.removeEventListener(this.eventStart, this, false);
            var slider = this.slider;
            var children = slider.childNodes;
            var i = children.length;
            while(i--) slider.removeChild(children[i]);
            this.slider = this.knot = this.knotStyle = this.fillerStyle = this.valueCallback = this.innerArea = slider = null;
        },

        getGlobalOffset: function(el) {
            var x = 0;
            var y = 0;
            while (el) {
                x += el.offsetLeft;
                y += el.offsetTop;
                el = el.offsetParent;
            }
            return {
                x: x,
                y: y
            };
        },

        limit: function(num, min, max) {
            // Tip: NaN < 0 === false and NaN > 0 === false
            // this order avoids NaN
            max = typeof max === 'number' ? max : Infinity;
            return num > max ? max : min < num ? num : min;
        },
    
        _requestBrowserRedraw: function(callback) {
            if (!this.redrawLocked) {
                this.redrawLocked = true;
                var that = this;
                this._requestAnimFrame(function(time) {
                    if (callback) callback(time);
                    that.redrawLocked = callback = false; // avoids memory leak
                });
            }
        },

        _requestAnimFrame:function(callback) {
            window.setTimeout(callback, 17);
        }
    };


    // compatibilize event types
    var proto = UISlider.prototype;
    if (!proto.hasTouch) {
        proto.eventStart = 'mousedown';
        proto.eventMove = 'mousemove';
        proto.eventEnd = 'mouseup';
        proto.eventLeave = 'mouseout';
        proto.eventCancel = 'mouseout';
    }

    window.UISlider = UISlider;

})(this);