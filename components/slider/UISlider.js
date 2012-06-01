/* CUSTOM SLIDER para Android/Desktop browsers (IE inclusive)
 * 
 * Como usar:
 * 
 *         // incluir o CSS slider.css
 * 
 *     	$(document).ready(function() {
 * 			new UISlider(document.getElementById('ID DO MEU SLIDER'), initialValue, max, min, modifier, snapping, function(valor) { }, vertical);
 *		});
 * 
 */

(function(window) {

    "use strict"; // Strict Mode compilant

    function UISlider(slider, initialValue, max, min, modifier, snapping, valueCallback, vertical) {
        if (this instanceof UISlider && slider && slider.nodeType === 1 /* MUST BE AN ELEMENT */ ) {
            this.slider = slider;
            this.rebuild(initialValue, max, min, modifier, snapping, valueCallback, vertical);
        }
    }

    UISlider.prototype = {

        hasTouch: 'ontouchend' in window,

        // DEFAULT VALUES
        value: 0,
        max: 100,
        min: 0,
        modifier: 1,
        snapping: false,
        vertical: false,
        valueCallback: null,

        // VARS
        globalOffset: 0,
        steps: 0,
        snapGap: 0,
        knotSize: 0,
        knotHalfSize: 0,
        knotPosition: 0,
        variationAreaStart: 0,
        valuableArea: 0,
        innerAreaSize: 0,
        slider: null,
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
        
        rebuild: function(value, max, min, modifier, snapping, valueCallback, vertical) {
            
            // GLOBALS TO LOCAL
            var document = window.document;
            
            //this.destroy();
            
            if (typeof modifier === 'number') this.modifier = modifier;
            if (typeof min === 'number') this.min = min;
            if (typeof max === 'number') this.max = max;
            if (typeof value === 'number') this.value = value;
            if (typeof valueCallback === 'function') this.valueCallback = valueCallback;
            this.snapping = !! snapping;
            this.vertical = !! vertical;

            // INNER AREA
            var innerArea = this.slider.appendChild(document.createElement('div')); // needs append to get offsets
            innerArea.className = 'innerArea';
            this.innerAreaSize = vertical ? innerArea.offsetHeight : innerArea.offsetWidth;

            // FILLER
            var filler = innerArea.appendChild(document.createElement('div'));
            filler.className = 'filler';
            this.fillerStyle = filler.style;

            // KNOT
            var knot = innerArea.appendChild(document.createElement('div')); // needs append to get offsets
            knot.className = 'knot';
            this.knotStyle = knot.style;
            this.knotSize = vertical ? knot.offsetHeight : knot.offsetWidth;
            this.knotHalfSize = this.knotSize * 0.5;

            var valueVariation = this.max - this.min;
            this.steps = /* ceil to threat a possible remainder value */Math.ceil(valueVariation / this.modifier);

            this.valuableArea = this.limit(this.innerAreaSize - this.knotSize, this.knotSize);
            this.snapGap = this.valuableArea / this.steps;

            this.setValue(this.value);
            this.slider.addEventListener(this.eventStart, this, false);
        },
        
        setValue: function(value, skipRedraw) {
            
            var variableValue = (Number(value) || this.value) - this.min;
            var stepsFromOrigin = Math.round(variableValue / this.modifier);
            
            this.value = this.limit(stepsFromOrigin * this.modifier + this.min, this.min, this.max);
            if (this.valueCallback) this.valueCallback(this.value);
            
            this.knotPosition = this.limit(stepsFromOrigin * this.snapGap, 0, this.valuableArea);
            this.redraw(skipRedraw);
        },

        redraw: function(skip) {
            if (skip) return;
            var that = this;
            this._requestBrowserRedraw(function() {
                that.knotStyle.cssText = (that.vertical ? 'top:' : 'left: ') + (that.knotPosition >> 0) + 'px';
                that.fillerStyle.cssText = (that.vertical ? 'height:' : 'width: ') + (that.knotPosition + that.knotHalfSize >> 0) + 'px';
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
            this.globalOffset = this.vertical ? offset.y : offset.x;

            document.addEventListener(this.eventEnd, this, false);
            document.addEventListener(this.eventMove, this, false);
        },

        onMove: function(e) {
            var pointerRelativePosition = this.limit((e.pageX|| e.pageY) - this.globalOffset - this.knotHalfSize, 0, this.valuableArea);
            var stepsFromOrigin = Math.round(pointerRelativePosition / this.snapGap);
        
            this.value = this.limit(stepsFromOrigin * this.modifier + this.min, this.min, this.max);
            if (this.valueCallback) this.valueCallback(this.value);
            
            this.knotPosition = this.snapping ? this.limit(stepsFromOrigin * this.snapGap, 0, this.valuableArea) : pointerRelativePosition;
            this.redraw();
        },

        onEnd: function(e) {
            this._removeVolatileListeners();
        },
        
        _removeVolatileListeners: function() {
            document.removeEventListener(this.eventMove, this, false);
            document.removeEventListener(this.eventEnd, this, false);    
        },

        setValueCallback: function(fn) {
            if (typeof fn === 'function') this.valueCallback = fn;
        },

        destroy: function() {
            this._removeVolatileListeners();
            document.removeEventListener(this.eventStart, this, false);
            var slider = this.slider;
            var children = slider.childNodes;
            var i = children.length;
            while(i--) slider.removeChild(children[i]);
            this.slider = this.knotStyle = this.fillerStyle = this.valueCallback = slider = null;
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
new window.UISlider();