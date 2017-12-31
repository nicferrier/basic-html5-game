function colCheck(shapeA, shapeB) {
    // get the vectors to check against
    let vX = (shapeA.x + (shapeA.width / 2)) - (shapeB.x + (shapeB.width / 2));
    let vY = (shapeA.y + (shapeA.height / 2)) - (shapeB.y + (shapeB.height / 2));
    // add the half widths and half heights of the objects
    let hWidths = (shapeA.width / 2) + (shapeB.width / 2),
        hHeights = (shapeA.height / 2) + (shapeB.height / 2),
        colDir = undefined;

    let newBox = {x: shapeA.x, y: shapeA.y};

    // if the x and y vector are less than the half width or half height,
    // they we must be inside the object, causing a collision
    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
        // figures out on which side we are colliding (top, bottom, left, or right)
        let oX = hWidths - Math.abs(vX),
	    oY = hHeights - Math.abs(vY);

        if (oX >= oY) {
	    if (vY > 0) {
                colDir = "t";
                newBox.y += oY;
	    }
	    else {
                colDir = "b";
                newBox.y -= oY;
	    }
        }
	else {
	    if (vX > 0) {
                colDir = "l";
                newBox.x += oX;
	    }
	    else {
                colDir = "r";
                newBox.x -= oX;
	    }
        }
    }
    return {colDir: colDir, box: newBox};
}

function load() {
    let witchImage = new Image();
    witchImage.src = "Witch.png";
    return {
	witch: witchImage
    };
}

function game() {
    let sprites = load();
    let canvas = document.getElementsByTagName("canvas")[0];
    let ctx = canvas.getContext("2d"),
	width = 500,
	height = 300,
	player = {
            x: width / 2,
            y: height - 32,
            width: 32,
            height: 32,
	    image: sprites.witch,
            speed: 3,
            velX: 0,
            velY: 0,
	    throwDir: 1,
	    momentum: 0,
            jumping: false,
            grounded: false
	},
	keys = [],
	friction = 0.8,
	gravity = 0.3,
	won = false,
	then = Date.now(),
	tickCount = 0;

    let spriteDraw = function (player) {
	let spriteIndex = 0;

	if (tickCount * Math.ceil(Math.abs(player.velX)) > 10) {
	    spriteIndex = 32;
	}

	if (++tickCount > 10) {
	    tickCount = 0;
	}

	// console.log("velX", Math.ceil(player.velX));
	let source_image = player.image,
	    source_x = ((player.throwDir < 0) ? 32 * 2 : 0) + spriteIndex,
	    source_y = 0,
	    source_width = player.width,
	    source_height = player.height,
	    destination_x = player.x,
	    destination_y = player.y - 1,
	    destination_width = player.width,
	    destination_height = player.height;
	ctx.drawImage(
	    source_image,
	    source_x,
	    source_y,
	    source_width,
	    source_height,
	    destination_x,
	    destination_y,
	    destination_width,
	    destination_height); 
    };

    canvas.height = height;
    canvas.width = width;

    let boxes = [{ // borders automatically computed for whatever size
	x: 0,
	y: 0,
	width: 2,
	height: height + 200 // keep the point high enough that we can always collide
    }, {
	x: 0,
	y: height - 2,
	width: width,
	height: 2
    }, {
	x: width - 2,
	y: 0,
	width: 2,
	height: height + 200
    }];

    // Draw an identifiable "door"
    let doorChoice = Math.ceil(Math.random() * 10) < 5;
    let door = {
	x: doorChoice ? 0 : width - 5,
	y: 0,
	width: 5,
	height: player.height + 10
    };
    let doorList = [door, {
	x: doorChoice ? 0 : width,
	y: (player.height + 10),
	width: doorChoice ? (player.width * 1.5) : 0 - (player.width * 1.5),
	height: player.height / 3
    }];
    doorList.forEach(doorPart => boxes.push(doorPart));
    
    // handle box creation
    let throwBox = function () {
	boxes.push({
	    x: player.x + (player.momentum * player.throwDir),
	    y: player.y - player.momentum / 2,
	    height: player.momentum,
	    width: player.momentum
	});
	player.momentum = 0;
    };
    
    // Key setup
    document.body.addEventListener("keydown", e => keys[e.keyCode] = true);
    document.body.addEventListener("keyup", e => keys[e.keyCode] = false);

    let handleInput = function () {
	// check keys
	if (keys[38] || keys[32] || keys[39] || keys[37]) {
	    if (keys[38] || keys[32]) {
		// up arrow or space
		if (!player.jumping && player.grounded) {
		    player.jumping = true;
		    player.grounded = false;
		    player.velY = -player.speed * 2;
		}
	    }

	    if (keys[39]) {
		// right arrow
		if (player.velX < player.speed) {
		    player.velX++;
		    player.throwDir = 1;
		}
	    }
	    if (keys[37]) {
		// left arrow
		if (player.velX > -player.speed) {
		    player.velX--;
		    player.throwDir = -1;
		}
	    }
	}
	else {
	    player.velX = 0;
	}

	if (keys[66]) {  // "b"
	    if (player.momentum >= 80) {
		throwBox();
	    }
	    else {
		player.momentum += 5;
	    }
	}
	else {
	    if (player.momentum > 0) {
		throwBox();
	    }
	}
    };

    let update = function (tim) {
	// console.log("tim", tim);
	if (player.momentum > 0) { // always retard the momentum a bit
	    player.momentum -= 2;
	}

	// back to the player physics
	player.velX *= friction;
	player.velY += gravity;

	ctx.clearRect(0, 0, width, height);
	ctx.fillStyle = "black";
	ctx.beginPath();
	
	player.grounded = false;
	boxes.forEach(box => {
            ctx.rect(box.x, box.y, box.width, box.height);
	    
            let {colDir: dir, box: {x: x, y: y}} = colCheck(player, box);
	    player.x = x;
	    player.y = y;

            if (dir === "l" || dir === "r") {
		player.velX = 0;
		player.jumping = false;
            }
	    else if (dir === "b") {
		player.grounded = true;
		player.jumping = false;
            }
	    else if (dir === "t") {
		player.velY *= -1;
            }

	    if (dir !== undefined && box == door) {
		won = true;
	    }
	});
	
	if (player.grounded){
            player.velY = 0;
	}

	if (player.y >= height) {
	    player.y = height - player.height;
	    player.velY = 0;
	}

	player.x += player.velX;
	player.y += player.velY;
	
	ctx.fill();
	spriteDraw(player);

	return won;
    }

    let main = function () {
	let now = Date.now();
	let delta = now - then;

	handleInput();
	let won = update(delta / 1000); 	// render();
	if (won) {
	    alert("well done!");
	}
	else {
	    then = now;
	    requestAnimationFrame(main);
	}
    };
    
    main();
}
 
window.addEventListener("load", function () {
    game();
});

// Ends here
