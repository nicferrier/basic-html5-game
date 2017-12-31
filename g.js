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


function game() {
    let canvas = document.getElementsByTagName("canvas")[0];
    let ctx = canvas.getContext("2d"),
	width = 500,
	height = 300,
	player = {
            x: width / 2,
            y: height - 16,
            width: 16,
            height: 16,
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
	then = Date.now();

    canvas.height = height;
    canvas.width = width;

    let boxes = [{ // borders automatically computed for whatever size
	x: 0,
	y: 0,
	width: 2,
	height: height + 100
    }, {
	x: 0,
	y: height - 2,
	width: width,
	height: 2
    }, {
	x: width - 2,
	y: 0,
	width: 2,
	height: height
    }];

    // Draw an identifiable "door"
    let door = {
	x: (Math.ceil(Math.random() * 10) < 5) ? 0 : width - 5,
	y: 0,
	width: 5,
	height: player.height + 10
    };
    boxes.push(door);

    // Key setup
    document.body.addEventListener("keydown", e => keys[e.keyCode] = true);
    document.body.addEventListener("keyup", e => keys[e.keyCode] = false);

    function update(tim) {
	// console.log("tim", tim);

	// check keys
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

	if (keys[66]) {
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

	if (player.momentum > 0) {
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

	if (player.y <= 0 || player.x < 0) {
	    console.log("less than 0", player.y, player.x);
	}

	player.x += player.velX;
	player.y += player.velY;
	
	ctx.fill();
	ctx.fillStyle = "red";
	ctx.fillRect(player.x, player.y, player.width, player.height);

	return won;
    }


    let main = function () {
	let now = Date.now();
	let delta = now - then;
	
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
