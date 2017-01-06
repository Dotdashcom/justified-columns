JustifiedColumns = (function(window) {

    var DEFAULT_THROTTLE = 25;

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
	    
	    //sort the grid into columns based on offsetLeft; cache heights
	    [].slice.call(this.grid.children).forEach(function(gridItem) {
	        var gridItemStyle = window.getComputedStyle(gridItem);
	        var gridItemOffsetLeft = gridItem.offsetLeft; //saves like 40% of execution time to cache this
	        if (gridItemOffsetLeft !== currentOffset) {
	            if (currentColumn !== -1) tallestColumn = Math.max(columns[currentColumn].height, tallestColumn);
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
	    tallestColumn = Math.max(columns[currentColumn].height, tallestColumn); //last column could be tallest, too
	    
	    //expand "stretchable" items (if present) in each of the non-tallest columns' items
	    columns.forEach(function(column, colIndex) {
            if (column.height < tallestColumn) {
	            var columnDelta = tallestColumn - column.height;
                var stretchedImagesDelta = 0;
	            column.items.forEach(function(gridItem, itemIndex) {
	                var stretchable = gridItem.querySelector(self.stretchSelector);
                    if (stretchable) {
                        var stretchablePercent =  columnDelta / column.totalImagesHeight;
                        var stretchableDelta = gridItem.stretchableHeight * stretchablePercent;
                        var newHeight = gridItem.stretchableHeight + stretchableDelta;
                        stretchable.style.minHeight = newHeight + 'px';
                        stretchedImagesDelta += stretchableDelta;
                        if (stretchable.nodeName === 'IMG') {
                            var sWidth = stretchable.offsetWidth;
                            var newWidth = sWidth * (newHeight / gridItem.stretchableHeight);
                            stretchable.parentNode.style.overflowX = 'hidden';
                            stretchable.style.minWidth = newWidth + 'px';
                            stretchable.style.marginLeft = -0.5 * (newWidth - sWidth) + 'px';
                        }
                    }
	            });
                column.height += stretchedImagesDelta;
                column.totalImagesHeight += stretchedImagesDelta;
	        }
	    });
	};

	Justifier.prototype.reset = function() {
		this.grid.querySelectorAll(this.stretchSelector).forEach(function(s) {
            s.style.minWidth = '';
            s.style.minHeight = '';
            s.style.marginLeft = '';
            s.parentNode.style.overflowX = '';
        });
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