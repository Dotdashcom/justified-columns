JustifiedColumns = (function(window) {

    var DEFAULT_THROTTLE = 25,
        WRAPPER_CLASS = 'justified-columns-wrapper',
        NEEDS_WRAPPER = document.documentElement.style.objectFit === undefined;

    function pxAsNum(px) {
        return 1 * px.split('px')[0];
    }

    function throttle(fn, threshhold, scope) {
        threshhold || (threshhold = 250);
        var last,
            deferTimer;

        return function() {
            var context = scope || this;

            var now = +new Date,
                args = arguments;

            if (last && now < last + threshhold) {
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function() {
                    last = now;
                    fn.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                fn.apply(context, args);
            }
        };
    }

    function Justifier(config) {
        this.setGrid(config.grid || config);
        this.stretchSelector = config.stretch || 'img';
        this.shrink = config.shrink || false; //or 'shrink' (column-justify);
        this.autoResize = config.hasOwnProperty('autoResize') ? config.autoResize : true;
        this.grid.Justifier = this;
        this.boundReset = config.throttle === 0 ? this.reset.bind(this) : throttle(this.reset.bind(this), config.throttle || DEFAULT_THROTTLE);
        this.boundJustify = config.throttle === 0 ? this.justify.bind(this) : throttle(this.justify.bind(this), config.throttle || DEFAULT_THROTTLE);
        this.enable();
    }

    Justifier.prototype.setGrid = function(grid) {
        if (typeof grid === 'string') {
            this.grid = document.querySelector(grid);
        } else {
            this.grid = grid.jquery ? grid[0] : grid;
        }
    };

    Justifier.prototype.justify = function() {
        var self = this,
            refColComparator = Math[this.shrink ? 'min' : 'max'],
            columns = [],
            currentColumn = -1,
            referenceColumn = this.shrink ? Number.POSITIVE_INFINITY : 0,
            currentOffset;

        //sort the grid into columns based on offsetLeft; cache heights
        [].slice.call(this.grid.children).forEach(function(gridItem) {
            var gridItemStyle = window.getComputedStyle(gridItem);
            var gridItemOffsetLeft = gridItem.offsetLeft; //saves like 40% of execution time to cache this
            if (gridItemOffsetLeft !== currentOffset) {
                if (currentColumn !== -1) referenceColumn = refColComparator(columns[currentColumn].height, referenceColumn);
                currentColumn++;
                currentOffset = gridItemOffsetLeft;
                columns.push({
                    items: [],
                    height: pxAsNum(gridItemStyle.getPropertyValue('margin-top')),
                    totalImagesHeight: 0
                });
            }
            gridItem.stretchable = gridItem.querySelector(self.stretchSelector);
            if (gridItem.stretchable) {
                gridItem.stretchableHeight = gridItem.stretchable.offsetHeight;
            }
            columns[currentColumn].items.push(gridItem);
            columns[currentColumn].height += (gridItem.offsetHeight + pxAsNum(gridItemStyle.getPropertyValue('margin-bottom')));
            columns[currentColumn].totalImagesHeight += (gridItem.stretchableHeight ? gridItem.stretchableHeight : 0);
        });
        referenceColumn = refColComparator(columns[currentColumn].height, referenceColumn); //last column could be reference, too

        //modify height of "stretchable" items (if present) in each of the non-reference-columns' items
        columns.forEach(function(column, colIndex) {
            if (column.height < referenceColumn || (self.shrink && column.height > referenceColumn)) {
                var columnDelta = referenceColumn - column.height;
                var stretchedImagesDelta = 0;
                column.items.forEach(function(gridItem, itemIndex) {
                    var stretchable = gridItem.querySelector(self.stretchSelector);
                    if (stretchable) {
                        var stretchablePercent = columnDelta / column.totalImagesHeight,
                            stretchableDelta = gridItem.stretchableHeight * stretchablePercent,
                            newHeight = gridItem.stretchableHeight + stretchableDelta,
                            heightProperty = (self.shrink ? 'max' : 'min') + 'Height';
                        if (stretchable.nodeName !== 'IMG') {
                            // not an image, so just set max/min-height and call it a day
                            stretchable.style[heightProperty] = newHeight + 'px';
                        } else if (!NEEDS_WRAPPER) {
                            // can rely on objectFit, so set the max/min-height, then use objectFit to handle resize + overflow
                            stretchable.style[heightProperty] = newHeight + 'px';
                            stretchable.style.objectFit = 'cover';
                            stretchable.style.objectPosition = 'center';
                        } else {
                            //it's an IMG and we're in older IE, ugh
                            if (stretchable.parentNode.className !== WRAPPER_CLASS) {
                                //create overflow wrapper
                                var wrapper = document.createElement('DIV');
                                wrapper.className = WRAPPER_CLASS;
                                wrapper.style.overflow = 'hidden';
                                wrapper.style[heightProperty] = newHeight + 'px';
                                stretchable.parentNode.replaceChild(wrapper, stretchable);
                                wrapper.appendChild(stretchable);
                            }
                            //set wrapper max/min-height, position within wrapper
                            if (self.shrink) {
                                var sOffset = 0.5 * (newHeight - gridItem.stretchableHeight);
                                stretchable.style.marginTop = sOffset + 'px';
                                stretchable.style.marginBottom = -1 * sOffset + 'px';
                            } else {
                                var sWidth = stretchable.offsetWidth,
                                    newWidth = sWidth * (newHeight / gridItem.stretchableHeight);
                                stretchable.style.minHeight = newHeight + 'px';
                                stretchable.style.minWidth = newWidth + 'px';
                                stretchable.style.marginLeft = -0.5 * (newWidth - sWidth) + 'px';
                            }
                        }
                        stretchedImagesDelta += stretchableDelta;
                    }
                });
                column.height += stretchedImagesDelta;
                column.totalImagesHeight += stretchedImagesDelta;
            }
        });

        //Fix the stupid IE10/11 interactions between column-count grid and height/max-height children
        if (NEEDS_WRAPPER) {
            var resizeHeight = referenceColumn,
                gridStyle = getComputedStyle(this.grid);
            if (gridStyle.boxSizing === 'border-box') {
                ['paddingTop', 'paddingBottom', 'borderTop', 'borderBottom'].forEach(function(spacer) {
                    resizeHeight += pxAsNum(gridStyle[spacer]);
                });
            }
            if (!gridStyle.height && Math.abs(this.grid.offsetHeight - resizeHeight) >= 2) {
                this.grid.style.height = gridHeight + 'px';
            }
        }

    };

    Justifier.prototype.reset = function() {
        [].slice.call(this.grid.querySelectorAll(this.stretchSelector)).forEach(function(s) {
            s.style.maxHeight = '';
            s.style.minHeight = '';
            if (NEEDS_WRAPPER) {
                s.style.minWidth = '';
                s.style.marginLeft = '';
                s.style.marginTop = '';
            } else {
                s.style.objectFit = '';
                s.style.objectPosition = '';
            }
        });
        if (NEEDS_WRAPPER) {
            [].slice.call(this.grid.getElementsByClassName(WRAPPER_CLASS)).forEach(function(wrapper) {
                wrapper.parentNode.replaceChild(wrapper.firstChild, wrapper);
            });
            this.grid.style.height = '';
        }
    };

    Justifier.prototype.enable = function() {
        if (this.autoResize) {
            window.addEventListener('resize', this.boundReset);
            window.addEventListener('resize', this.boundJustify);
        }
        this.justify();
    };

    Justifier.prototype.disable = function() {
        if (this.autoResize) {
            window.removeEventListener('resize', this.boundReset);
            window.removeEventListener('resize', this.boundJustify);
        }
        this.reset();
    };

    return Justifier;

})(window);