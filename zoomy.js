


//function handleMouseMoveAndClick(e) {
// return false;
// if (event.type === "mousedown") { mouseInfo.button = true }
// if (event.type === "mouseup" || event.type === "mouseout") { mouseInfo.button = false }
// mouseInfo.oldX = mouseInfo.x;
// mouseInfo.oldY = mouseInfo.y;
// mouseInfo.x = event.pageX;
// mouseInfo.y = event.pageY;
// if(mouseInfo.button) { // pan
// 	posX += mouseInfo.x-mouseInfo.oldX;
// 	posY += mouseInfo.y-mouseInfo.oldY;
// }
// el.style.transform = `matrix(${scale},${0},${0},${scale},${posX},${posY})`;
// event.preventDefault();
//}

/**
 * 'Resize and move image' (output) on screen based on 'mouse action' (input)
 * @param {HTMLElement} el
 * @param {Event} e
 */
function transformByMouseEvent(el, e) {

	el.isDragging = false;
	if (e.type == 'mousedown') {
		el.mouseIsDown = true;
	}
	if (e.type == 'mouseup') {
		el.mouseIsDown = false;
	}
	if (el.mouseIsDown && e.type == 'mousemove') {
		el.isDragging = true;
	}


	var currentVisualSizing = el.getBoundingClientRect();



	var enlargeOrShrinkBy = e.deltaY ? (e.deltaY > 0 ? -.1 : .1) : 0;
	var moveXBy = 0;
	var moveYBy = 0;


	var widthFromSideOfViewportToCursor = e.x;

	var heightFromSideOfViewportToCursor = e.y;

	var widthFromSideToCenterOfTransformedImage = currentVisualSizing.left + currentVisualSizing.width / 2;
	var widthFromCenterOfTransformedImageToCursor = widthFromSideOfViewportToCursor - widthFromSideToCenterOfTransformedImage;

	var heightFromTopToCenterOfTransformedImage = currentVisualSizing.top + currentVisualSizing.height / 2;
	var heightFromCenterOfTransformedImageToCursor = heightFromSideOfViewportToCursor - heightFromTopToCenterOfTransformedImage;

	var currentScaleX = currentVisualSizing.width / el.width;
	var currentScaleY = currentVisualSizing.height / el.height;

	moveXBy = -(widthFromCenterOfTransformedImageToCursor * enlargeOrShrinkBy / currentScaleX);
	moveYBy = -(heightFromCenterOfTransformedImageToCursor * enlargeOrShrinkBy / currentScaleY);

	// do not touch up


	//dragging -> happens if the mouse is still down (on the target element) when the mouse moves and it didn't release


	/*
	var panningOnXAxis;
	var panningOnYAxis;

	var panning = false;

	if (e.type === "mousedown") { panning = true }
	if (e.type === "mouseup" || e.type === "mouseout") { panning = false }

	console.log(panningOnXAxis, panningOnYAxis);

	if(panning){
		panningOnXAxis = widthFromCenterOfTransformedImageToCursor;
		panningOnYAxis = heightFromCenterOfTransformedImageToCursor;
		console.log(panning);
		moveXBy += panningOnXAxis;
		moveYBy += panningOnYAxis;
	}
	*/


	//do not touch bellow
	transform(el, moveXBy, moveYBy, enlargeOrShrinkBy);

	e.preventDefault();


}


// Do not edit below!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

/**
 * This gets the transformation matrix data in real time
 * @param {HTMLElement} el
 * @return {{scaleX: number, scaleY: number, translateY: number, translateX: number, skewX: number, skewY: number}}
 */
function getMatrix(el) {
	var matrix = el.style.transform.substring(7);
	matrix = matrix.slice(0, matrix.length-1).split(',').map(el=>el = parseFloat(el.trim()));
	return {
		scaleX: matrix[0],
		skewY: matrix[1],
		skewX: matrix[2],
		scaleY: matrix[3],
		translateX: matrix[4],
		translateY: matrix[5]
	};
}

/**
 * Side effect: transform an element's geometrical visual appearance
 * @param {HTMLElement} el
 * @param {int} moveXBy How much to move left-right, from where it already is. 0 leaves it as it is.
 * @param {int} moveYBy How much to move up-down, from where it already is. 0 leaves it as it is.
 * @param {number} enlargeOrShrinkBy How big-small it should get, compared to however it already is. In percentage compared to baseline. 1 being 100%. 0 leaves it as it is.
 * @return void
 */
function transform(el, moveXBy = 0, moveYBy = 0, enlargeOrShrinkBy = 0) {
	var m = getMatrix(el);
	m.translateX += moveXBy;
	m.translateY += moveYBy;
	m.scaleX += enlargeOrShrinkBy;
	m.scaleY += enlargeOrShrinkBy;
	el.style.transform = 'matrix('+Object.values(m).join(', ')+')';
}

/**
 * Handles all mouse events
 * @param {MouseEvent} e
 * @return {boolean}
 */
function handleMouseEvents(e) {
	transformByMouseEvent(window.el, e);
}

var el = document.getElementById('zoomMe');
el.mouseIsDown = false;
el.lastMousePos = false;

document.addEventListener("mousemove", handleMouseEvents, {passive: false});
el.addEventListener("mousedown", handleMouseEvents);
document.addEventListener("mouseup", handleMouseEvents);
document.addEventListener("mouseout", handleMouseEvents, {passive: false});
document.addEventListener("wheel", handleMouseEvents, {passive: false});