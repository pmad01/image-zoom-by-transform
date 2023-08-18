# Image Zoom By Transform

Image Zoom and Pan is a lightweight and versatile JavaScript library that allows you to seamlessly incorporate interactive zooming and panning functionality into your web applications.
With this library, you can provide your users with a good experience when exploring images or other visual content.

# Features

- Effortless zooming and panning for images within an HTML container.

- Seamlessly handle mouse wheel events for zooming.

- Intuitive drag-and-drop functionality for panning.

- Customizable upper zoom constraint to prevent excessive zooming.

- Ability to set a boundary element for the zooming and panning area.

- Lightweight and easy-to-use.

# How to use

## Getting Started

Follow these steps to integrate Zoomy into your project:

1\. Include the `Zoomy.js` file in your HTML:

```html

<script src="path/to/Zoomy.js"></script>

```

2\. Create an HTML container with an image you want to enable zooming for:

```html

<div id="zoomy-container">

    <img src="path/to/your/image.jpg" alt="Zoomable Image">

</div>

```

3\. Initialize Zoomy by creating an instance with the container element's ID and optional configuration options:

```javascript

const options = {

    boundaryElementId: 'boundary-container', // ID of the boundary element (optional)

    zoomUpperConstraint: 4, // Upper limit for zooming (optional)

};

const zoomyInstance = new Zoomy('zoomy-container', options);

```

4\. Enjoy zooming and panning capabilities for your image!

## Configuration Options

Zoomy provides configuration options to customize its behavior:

- `boundaryElementId`: Specifies the ID of the boundary element to constrain the zoom and pan area. If not provided, the entire body is used as the boundary.

- `zoomUpperConstraint`: Sets the upper limit for zooming. Images will not be scaled beyond this value.

## Methods

Zoomy offers additional methods to control its behavior:

- `enable()`: Enables zooming and panning functionality (enabled by default).

- `disable()`: Disables zooming and panning functionality.

- `detach()`: Removes event listeners and disables Zoomy.

# Demo

This is a [Demo](http://htmlpreview.github.io/?https://github.com/pmad01/image-zoom-by-transform/blob/main/demo.html)
