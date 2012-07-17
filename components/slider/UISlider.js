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

(function (window) {

    "use strict"; // Strict Mode compilant

    function UISlider(slider, initialValue, max, min, modifier, snapping, valueCallback, vertical, disabled) {
        if (this instanceof UISlider && slider && slider.nodeType === 1 /* MUST BE AN ELEMENT */ ) {
            this.slider = slider;

            // GLOBAL TO LOCAL
            var document = window.document;

            if (typeof modifier === 'number') this._modifier = modifier;
            if (typeof min === 'number') this._min = min;
            if (typeof max === 'number') this._max = max;
            if (typeof initialValue === 'number') this._value = initialValue;
            if (typeof valueCallback === 'function') this.valueCallback = valueCallback;
            if (typeof snapping === 'boolean') this._snapping = snapping;
            if (typeof vertical === 'boolean') this._vertical = vertical;
            if (typeof disabled === 'boolean') this._disabled = disabled;

            // INNER AREA
            var innerArea = this.innerArea = slider.appendChild(document.createElement('div')); // needs append to get offsets
            innerArea.className = 'innerArea';

            // FILLER
            var filler = innerArea.appendChild(document.createElement('div'));
            filler.className = 'filler';
            this.fillerStyle = filler.style;

            // KNOT
            var knot = this.knot = innerArea.appendChild(document.createElement('div')); // needs append to get offsets
            knot.className = 'knot';
            this.knotStyle = knot.style;

            this.update();
            this.slider.addEventListener(this.eventStart, this, false);
        }
    }

    UISlider.prototype = {

        hasTouch: 'ontouchend' in window,

        // DEFAULT VALUES (underscored for use on getters and setters)
        _value: 0,
        _max: 100,
        _min: 0,
        _modifier: 1,
        _snapping: false,
        _vertical: false,
        _disabled: false,
        _lastDisabled: false,
        valueCallback: null,

        // VARS
        globalOffset: 0,
        steps: 0,
        snapGap: 0,
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
        lastTime: 0,

        update: function (skipRedraw) {
            this._updateSizes();
            this.value(this._value, skipRedraw);
        },
        
        _updateSizes: function() {
            var knotSize;
            if (this._vertical) {
                this.innerAreaSize = this.innerArea.offsetHeight;
                knotSize = this.knot.offsetHeight;
            }
            else {
                this.innerAreaSize = this.innerArea.offsetWidth;
                knotSize = this.knot.offsetWidth;
            }
            this.knotHalfSize = 0.5 * knotSize;
            this.snapGap = (this.valuableArea = Math.max(this.innerAreaSize - knotSize, 0)) / (this.steps = Math.ceil((this._max - this._min) / this._modifier));  
        },

        snapping: function (bool, skipRedraw) {
            if (typeof bool === 'boolean') {
                this._snapping = bool;
                this.update(skipRedraw);
            }
            return this._snapping;
        },

        max: function (max, skipRedraw) {
            if (typeof max === 'number') {
                this._max = max;
                this.update(skipRedraw);
            }
            return this._max;
        },

        min: function (min, skipRedraw) {
            if (typeof min === 'number') {
                this._min = min;
                this.update(skipRedraw);
            }
            return this._min;
        },

        vertical: function (bool, skipRedraw) {
            if (typeof bool === 'boolean') {
                this._vertical = bool;
                this.update(skipRedraw);
            }
            return this._vertical;
        },

        value: function (value, skipRedraw) {
            var min = this._min;
            var stepsFromOrigin = Math.round(((typeof value == 'number' ? value : this._value) - min) / this._modifier);

            this._value = this.limit(stepsFromOrigin * this._modifier + min, min, this._max);
            if (this.valueCallback) this.valueCallback(this._value);

            this.knotPosition = this.limit(stepsFromOrigin * this.snapGap, 0, this.valuableArea);
            this.redraw(skipRedraw);
            return this._value;
        },

        disabled: function (bool, skipRedraw) {
            if (typeof bool === 'boolean') {
                this._disabled = bool;
                this.update(skipRedraw);
            }
            return this._disabled;
        },

        // GENERAL EVENT HANDLER
        handleEvent: function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (this._disabled) return;

            // smart and optimum force
            if (e.touches === void 0) {
                e.touches = [{
                    pageX: e.pageX,
                    pageY: e.pageY
                }];
            }

            if (e.type === this.eventMove) 
                this._onMove(e);
            else if (e.type === this.eventStart) 
                this._onStart(e);
            else if (e.type === this.eventEnd) 
                this._onEnd(e);
        },

        _onStart: function (e) {
            var offset = this.getGlobalOffset(this.slider);
            this.globalOffset = this._vertical ? offset.y : offset.x;
            this._updateSizes();
            this._onMove(e);
            document.addEventListener(this.eventEnd, this, false);
            window.addEventListener(this.eventMove, this, false);
        },

        _onMove: function (e) {
            var pointerRelativePosition = this.limit((this._vertical ? e.touches[0].pageY : e.touches[0].pageX) - this.globalOffset - this.knotHalfSize, 0, this.valuableArea);
            var stepsFromOrigin = Math.round(pointerRelativePosition / this.snapGap);
            this._value = this.limit(stepsFromOrigin * this._modifier + this._min, this._min, this._max);
            if (this.valueCallback) this.valueCallback(this._value);

            this.knotPosition = this._snapping ? this.limit(stepsFromOrigin * this.snapGap, 0, this.valuableArea) : pointerRelativePosition;
            this.redraw();
        },

        _onEnd: function (e) {
            this._removeVolatileListeners();
            if (this.onEnd) this.onEnd(this._value);
        },

        _removeVolatileListeners: function () {
            window.removeEventListener(this.eventMove, this, false);
            document.removeEventListener(this.eventEnd, this, false);
        },
        
        redraw: function (skip) {
            if (skip) return;
            if (this._lastDisabled !== this._disabled) {
                if ((this._lastDisabled = this._disabled)) {
                    this.slider.className += ' disabled';
                }
                else {
                    this.slider.className = this.slider.className.replace(/\bdisabled\b/, '');
                }
            }

            if (this._vertical) {
                this.knotStyle.top = (this.knotPosition >> 0) + 'px';
                this.fillerStyle.height = (this.knotPosition + this.knotHalfSize >> 0) + 'px';
            }
            else {
                this.knotStyle.left = (this.knotPosition >> 0) + 'px';
                this.fillerStyle.width = (this.knotPosition + this.knotHalfSize >> 0) + 'px';
            }
        },

        destroy: function () {
            this._removeVolatileListeners();
            document.removeEventListener(this.eventStart, this, false);
            var slider = this.slider;
            var children = slider.childNodes;
            var i = children.length;
            while (i--) slider.removeChild(children[i]);
            this.slider = this.knot = this.knotStyle = this.fillerStyle = this.valueCallback = this.onEnd = this.innerArea = slider = null;
        },

        getGlobalOffset: function (el) {
            var x = 0, y = 0;
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

        limit: function (num, min, max) {
            // Tip: NaN < 0 === false and NaN > 0 === false
            // this order avoids NaN
            return num > max ? max : min < num ? num : min;
        }
    };

    var proto = UISlider.prototype;
    // compatibilize event types
    if (!proto.hasTouch) {
        proto.eventStart = 'mousedown';
        proto.eventMove = 'mousemove';
        proto.eventEnd = 'mouseup';
        proto.eventLeave = 'mouseout';
        proto.eventCancel = 'mouseout';
    }

    window.UISlider = UISlider;

})(this);