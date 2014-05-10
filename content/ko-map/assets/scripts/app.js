(function() {
    define(['jquery-2.1.0', 'knockout-2.2.0.debug', 'underscore-min',
        'mousetrap.min'], function (jq, ko, us, mt) {
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
    });
})();
