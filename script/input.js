//key down events
(function() {
    var pressedKeys = {};
    var releasedKeys = {};
    var keyUpevent;

    function pressed(e, status) {
        var k = setKey(e, status);
        pressedKeys[k] = status;
        return k;
    }

    function released(e, status) {
        var k = setKey(e, status);
        releasedKeys[k] = status;
    }

    function setKey(event, status) {
        var code = event.keyCode;
        var key;

        switch(code) {
        case 13:
            key = 'RET'; break;
        case 27:
            key = 'ESC'; break;                
        case 32:
            key = 'SPACE'; break;
        case 37:
            key = 'LEFT'; break;
        case 38:
            key = 'UP'; break;
        case 39:
            key = 'RIGHT'; break;
        case 40:
            key = 'DOWN'; break;                
        default:
            key = String.fromCharCode(code);
        }
        return key;
    }

    document.addEventListener('keydown', function(e) {
        pressed(e, true);
    });

    document.addEventListener('keyup', function(e) {
        var k = pressed(e, false);
        released(e, true);
        if (keyUpevent) {
            keyUpevent(k);
        }
    });

    window.addEventListener('blur', function() {
        pressedKeys = {};
    });

    window.input = {
        onKeyUp: function (handler) {
            keyUpevent = handler;
        },
        isDown: function(key) {
            return pressedKeys[key.toUpperCase()];
        },
        isUp: function(key) {
            var k = releasedKeys[key.toUpperCase()];
            return k;
        },
        Clr: function() {
            releasedKeys = [];
        }
    };
})();