JustifiedColumns = (function(window) {

	function pxAsNum(px) {
	    return 1 * px.split('px')[0];
	 }
    
	function stretch(s, plus) {
	    var sHeight = s.offsetHeight;
	    var sWidth = s.offsetWidth;
	    var newHeight = sHeight + plus;
	    var newWidth = sWidth * (newHeight / sHeight);
	    s.style.minHeight = newHeight + 'px';
	    s.style.minWidth = newWidth + 'px';
	}

	function Justifier(config) {
        this.setGrid(config.grid || config);
        this.stretchSelector = config.stretch || 'img';
        this.autoResize = config.hasOwnProperty('autoResize') ? config.autoResize : true;
        this.grid.Justifier = this;
        this.boundReset = this.reset.bind(this);
        this.boundJustify = this.justify.bind(this);
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
                    stretchable.parentNode.style.overflowX = 'hidden';
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
		this.grid.querySelectorAll(this.stretchSelector).forEach(function(s) {
			s.style.minWidth = '';
			s.style.minHeight = '';
            s.parentNode.style.overflowX = '';
		})
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