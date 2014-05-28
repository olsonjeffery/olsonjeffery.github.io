---
layout: post
title: "A Roguelike Hello World In Knockout.js"
date: 2014-05-26 05:20:13 -0500
comments: false
categories: knockout javascript
---

Lately, I've had the opportunity to be exposed to some web technologies with which I had little previous experience. While I've spent quite a bit of time in the world of client-side programming in the browser using tools like WebGL, Backbone.js, etc, I've yet to have occasion to get exposed to any of the new breed of DOM binding libraries.

Thankfully, one of the new tools I've had a chance to develop with has been [Knockout.js][ko]. This post is about a [hello world exercise that][RLDemo] that I worked on get some basic knowledge in the framework.

### Motivation

I wanted to make a simple, [roguelike][rl] game map that represented the UI using DOM elements, while keeping the actual state backed in a View Model. This seemed like the perfect nail in search of a Knockout-based hammer.

Aside from Knockout, I used bootstrap to style the markup. A usual coterie of utility libraries was employed (jQuery, underscore, etc). And since no self-respecting roguelike relies on the mouse, I ended up using [Mousetrap][Mousetrap] for keyboard event hooks. Also mumble mumble [require.js][require] blah blah AMD.

For the purpose of my demo, my approach was that I'd deliver a JSON payload as part of the initial document. This would be accessed from my application setup code, which would parse the data into the View Model, set up keyboard events and call `ko.applyBindings`.

### The Demo Itself

The goal is to create a simple, "roguelike" demo that consists of the venerable `@` symbol, within a grid-like map that makes up its little world. Real games have all kinds of things, like: the passage of time, hunger, combat, magic, mongsters, death etc etc ad infinitum. Ours is concerned with just presenting a basic, 6x6 grid of tiles that're passable (or not). The player's location is marked by the `@`'s location on the map. You can move the player about with the arrow keys on your keyboard. I could probably do something for mobile, but I haven't gotten around to it.

What follows is a breakdown of the [demo][RLDemo].

### HTML & Data Bindings

``` html
    <div id="map_container" class="container" data-bind="foreach: map">
        <div class="row" data-bind="foreach: Tiles">
            <div class="col-lg-2" data-bind="css: tileBackground">
                <!-- ko if: playerIsHere -->
                <h1>&#64;</h1>
                <!-- /ko-->
                <!-- ko if: unoccupied -->
                <h1>&emsp;</h1>
                <!-- /ko-->
                <!-- ko if: !Passable-->
                <h1>W</h1>
                <!-- /ko-->
            </div>
        </div>
    </div>
```

Here we see the basic outline of the knockout mapping used. At the top-level, a `div` element with a `data-bind` attribute. It uses the [foreach][ko-foreach] binding to iterate over a `map` property, provided in the View Model. Within that, another `div` element, styled as a Bootstrap `row` that will, in turn, iterate over the individual tiles within its row via its own `foreach` binding.

The contents of the cell, itself, are simple. It's a Bootstrap column, 2 units wide (6x6 map, remember), whose presentation reflects the current state of the Tile. On the column `div` itself is a `css` data-binding, which will apply a class based on the value of the `tileBackground` observable for the View Model. A series of [ko if][ko-if] comments bindings determine the content of the cell, based on a number of observables within the View Model.

### The Raw JSON Input

``` javascript
TileMap = [
    {
        Tiles: [
            { Passable: false },
            { Passable: false },
            { Passable: false },
            { Passable: false },
            { Passable: false },
            { Passable: false }
        ]
    },
    // ...
];
```

This is a snippet of a single row of the `TileMap` value, which is injected into the initial script black of our demo's HTML markup. In a real application, this would be driven by logic on the server, but it's stubbed out in this demo as a static value and attached to the `window` global.

The `TileMap` is just an array of objects, each with a single `Tiles` property that is also an array of javascript objects. This represents the layout of the map and is a small concession to the presentation, making it easier to showhorn into the knockout data-binding scheme. Most likely, an actual application would be representing the map as either a 2D-array, a flat array with multiplication/bit-shifts for y-axis access or even a tree structure for more sophisticated schemes.

### Making TileMap Usable By Knockout

``` javascript
var map = TileMap;
var positionSubscriber = new ko.subscribable();
var MapViewModel = function() {
    this.map = map;
    _.each(this.map, function(row, ty) {
        _.each(row.Tiles, function (t, tx) {
            t.playerPos = ko.observable(PlayerPos);
            positionSubscriber.subscribe(function (newPos) {
                this.playerPos(newPos);
            }, t, "move");
            t.tileBackground = ko.computed(function() {
                return this.Passable ? "bg-info" : "bg-primary";
            }, t);
            t.playerIsHere = ko.computed(function() {
                return this.playerPos().x == tx && this.playerPos().y == ty;
            }, t);
            t.unoccupied = ko.computed(function() {
                return (this.playerPos().x != tx || this.playerPos().y != ty)
                    && this.Passable;
            }, t);
        });
    });
};
```

We establish a `MapViewModel` that will contain our data. Additionally, we have set up a `ko.subscribable` to act as an event sink for input-driven changes to the `@` position on the map.

The `MapViewModel` takes, as the `map` property, the `TileMap` covered earlier in this post. It will then iterate over the entire contents of that object, bolting-on several Knockout `ko.computed` observable functions that reflect the tile's state and update dynamically with changes to the View Model. You will recognize these observables as being referenced in the HTML markup shown previously. All of the individual tiles, by virtue of function environment capture, have access to their `x` and `y` coordinates (`tx` and `ty`, respectively) to use for their logic.

* `playerPos` - an observable representing the player's global position. Changes this will update the `playerIsHere` computed observable
* `tileBackground` - Sets a bootstrap class to change the tile element's color based on whether it's a wall or a passable space
* `playerIsHere` - Indicates whether this is the space, on the map, where the player is located. Note that the tile itself doesn't carry information on the player's presence or lack thereof. Instead, the tile is listening for changes to the player's position via `positionSubscriber` subscribable. Every time the subscription event fires, the `playerPos` observable is updated, leading to `playerIsHere` being recalculated
* `unoccupied` - Naturally, the inverse of `playerIsHere`

### Using external input to drive View Model changes

``` javascript
var currPos = { x: PlayerPos.x, y: PlayerPos.y };
function findTile(coords) {
    return map[coords.y].Tiles[coords.x];
};
function moveInDir(modCoords) {
    var targetPos = { x: currPos.x + modCoords.x, y: currPos.y + modCoords.y };
    if (targetPos.y < 0) { return; }
    var targetTile = findTile(targetPos);
    if (!targetTile.Passable) { return; }
    currPos = targetPos;
    positionSubscriber.notifySubscribers(targetPos, "move");
}
Mousetrap.bind('up', function() {
    moveInDir({ x: 0, y: -1 });
})
Mousetrap.bind('down', function() {
    moveInDir({ x: 0, y: 1 });
})
Mousetrap.bind('left', function() {
    moveInDir({ x: -1, y: 0 });
})
Mousetrap.bind('right', function() {
    moveInDir({ x: 1, y: 0 });
})
var vm = new MapViewModel();
positionSubscriber.notifySubscribers(PlayerPos, "move");
ko.applyBindings(vm);
```

This code block wires up the input handling and binds the View Model to the DOM. It's pretty straightforward. The `moveInDir` function performs validation to make sure the player isn't trying to move into a wall (and if they are, prevent that from actually happening). If the player's desired destination, as per the input coords (you can see the four callers of `moveInDir` each pass in a different object with the target `x` and `y` offsets for the move), is available to be moved to. We call `positionSubscriber.notifySubscribers` with the new player position. This triggers the subscriptions, in the previous snippet, to update the View Model, triggering changes in the DOM representation.

### Improvements

There are a number of things that could be improved upon in this demo.

* General cleanup/consistency, of course
* Some duplication in the observable logic (`playerIsHere` vs `unoccupied`.. probably shouldn't duplicate the logic in these)
* Move the DOM markup into [Knockout templates][ko-template]

[RLDemo]: https://olsonjeffery.github.io/content/ko-map/index.html "Knockout.js RogueLike Map Demo"
[Mousetrap]: http://craig.is/killing/mice "Mousetrap"
[ko]: http://knockoutjs.com/ "Knockout.js"
[require]: http://www.requirejs.org/ "Require.js"
[rl]: https://en.wikipedia.org/wiki/Roguelike "Roguelike"
[ko-foreach]: http://knockoutjs.com/documentation/foreach-binding.html "Knockout - foreach"
[ko-if]: http://knockoutjs.com/documentation/if-binding.html "Knockout - if"
[ko-css]: http://knockoutjs.com/documentation/css-binding.html "Knockout - css"
[ko-template]: http://knockoutjs.com/documentation/template-binding.html "Knockout - template"
