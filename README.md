# justified-columns
Adds vertical justification to elements using the [CSS column layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Columns/Using_multi-column_layouts) to achieve a [Pinterest-style "Masonry" effect](https://css-tricks.com/seamless-responsive-photo-grid/).

Elements within each grid item are vertically stretched in proportion to their height; additional width is then trimmed by overflow

Does not require jQuery or any other external library; runs in all modern browsers (IE9+). 

## Initialization

Baseline implementation is a one-liner:

```
var J = new JustifiedColumns('#myColumns');
```

This assumes that you'll want to "stretch" the `<img>` in each of the item in your layout.  The height of each of the grid's children

Alternately, you get some additional control via explicit configuration:

```
var J = new JustifiedColumns({
	grid: '#myColumns',
	stretch: '.col-item-img',
	autoResize: false
});
```

The configuration properties available are

* `grid` **(required)** &mdash; the element using CSS columns. Accepts a selector string, HTMLElement, or jQuery object.
* `stretch` (optional string, defaults to `'img'`) &mdash; selector that identifies the element within each grid item to grow vertically in order to justify each column
* `autoResize` (optional boolean, defaults to `true`) &mdash; if you don't need your columns to re-calc justification during every resize event, you can disable that behavior as a performance optimization.

When the `JustifiedColumns` object is 

##Justifier

The `JustifiedColumns` constructor automatically adds a `Justifier` object to the grid's DOM element (this is the same object as `J` in the examples above).  The following methods are exposed by the `Justifier` object:

* `justify` &mdash; does what it says on the box.
* `reset` &mdash; removes any styling added by the library. It does **not** remove any auto-resize listeners.
* `disable` &mdash; fully deactivates the Justifier, removing resize event listeners and calling `reset()`.
* `enable` &mdash; fully activates the Justifier, re-adding resize event listeners and calling `justify()`

## Examples
[http://codepen.io/aboutuser/pen/RKwmZW](http://codepen.io/aboutuser/pen/RKwmZW)