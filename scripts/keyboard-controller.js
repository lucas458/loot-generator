var movementController = {

    Shift: {
        pressed: false,
        call: () => {
            PLAYER_OBJECT.speed = 4;
        }
    },

    ArrowLeft: {
        pressed: false,
        call: () => {
            PLAYER_OBJECT.position.x -= PLAYER_OBJECT.speed;
        }
    },

    ArrowRight: {
        pressed: false,
        call: () => {
            PLAYER_OBJECT.position.x += PLAYER_OBJECT.speed;
        }
    },

    ArrowUp: {
        pressed: false,
        call: () => {
            PLAYER_OBJECT.position.y -= PLAYER_OBJECT.speed;
        }
    },

    ArrowDown: {
        pressed: false,
        call: () => {
            PLAYER_OBJECT.position.y += PLAYER_OBJECT.speed;
        }
    }

};