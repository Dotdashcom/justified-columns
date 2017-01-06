JustifiedColumns = (function(window) {

    var DEFAULT_THROTTLE = 25;

	function pxAsNum(px) {
	    return 1 * px.split('px')[0];
	 }
    
    function stretch(s, plus) {
        var sHeight = s.offsetHeight;
        var sWidth = s.offsetWidth;
        var newHeight = sHeight + plus;
        s.style.minHeight = newHeight + 'px';
        if (s.nodeName === 'IMG') {
            var newWidth = sWidth * (newHeight / sHeight);
            s.parentNode.style.overflowX = 'hidden';
            s.style.minWidth = newWidth + 'px';
            s.style.marginLeft = -0.5 * (newWidth - sWidth) + 'px';
        }
    }

    function shrink(s) {
        s.style.minWidth = '';
        s.style.minHeight = '';
        s.style.marginLeft = '';
        s.parentNode.style.overflowX = '';
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
        this.autoResize = config.hasOwnProperty('autoResize') ? config.autoResize : true;
        this.grid.Justifier = this;
        this.boundReset = config.throttle === 0 ? this.reset.bind(this) : throttle(this.reset.bind(this), config.throttle || DEFAULT_THROTTLE);
        this.boundJustify = config.throttle === 0 ? this.justify.bind(this) : throttle(this.justify.bind(this), config.throttle || DEFAULT_THROTTLE);
        this.enable();
	}

	Justifier.prototype.setGrid = function(grid) {
        if (typeof grid === 'string') {
            this.grid = document.querySelector(grid);
        }
        else {
    		this.grid = grid.jquery ? grid[0] : grid;
        }
	};

	Justifier.prototype.justify = function() {
	    var self = this,
	    	columns = [], 
	        currentColumn = -1,
	        tallestColumn = 0,
	        currentOffset;
	    
	    //sort the grid into columns based on offsetLeft; cache column height
	    [].slice.call(this.grid.children).forEach(function(gridItem) {
	        var gridItemStyle = window.getComputedStyle(gridItem);
	        var gridItemOffsetLeft = gridItem.offsetLeft; //saves like 40% of execution time to cache this
	        if (gridItemOffsetLeft !== currentOffset) {
	            if (currentColumn !== -1) tallestColumn = Math.max(columns[currentColumn].height, tallestColumn);
	            currentColumn++;
	            currentOffset = gridItemOffsetLeft;
	            columns.push({
		            items: [],
		            height: pxAsNum(gridItemStyle.getPropertyValue('margin-top'))
		        });
	        }
	        gridItem.cachedHeight = gridItem.offsetHeight;
	        columns[currentColumn].items.push(gridItem);
	        columns[currentColumn].height += (gridItem.cachedHeight + pxAsNum(gridItemStyle.getPropertyValue('margin-bottom')));
	    });
	    tallestColumn = Math.max(columns[currentColumn].height, tallestColumn); //last column could be tallest, too
	    
	    //expand "things" in each of the non-tallest columns' items to fit
	    columns.forEach(function(column, index) {
	        if (column.height < tallestColumn) {
	            var columnDelta = tallestColumn - column.height;
	            //console.log("columnDelta", index, columnDelta);
	            column.items.forEach(function(gridItem) {
	                var stretchable = gridItem.querySelector(self.stretchSelector);
	                var stretchablePercent = gridItem.cachedHeight / column.height;
	                var stretchableDelta = stretchablePercent * columnDelta;
	                stretch(stretchable, stretchableDelta);
	                //sometimes JS gets the math very slightly wrong.  In that case, fill in the last stretchable.
	                if (index === column.length - 1) {
	                    var remainderDelta = tallestColumn - column.height;
	                    if (remainderDelta > 0) {
	                        stretch(stretchable, remainderDelta);
	                    }
	                }
	            });
	        }
	    });
	};

	Justifier.prototype.reset = function() {
		this.grid.querySelectorAll(this.stretchSelector).forEach(shrink);
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