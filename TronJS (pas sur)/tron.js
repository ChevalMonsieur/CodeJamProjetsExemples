players = [] // list of players
grid = [] // list of grid positions there is "width"/"gridSize" positions in the x axis and "height"/"gridSize" positions in the y axis
inGame = true // if the game is running or not
winner = ""

function setup() {
    //remove()
    border = 10
    createCanvas(900 + border, 500 + border)
    frameRate(30)
    stroke(0, 255, 0)
    strokeWeight(5)

    player = new Player(border/2, border/2, true)
    players.push(player)
    player2 = new Player(width-border/2, height-border/2, false)
    players.push(player2)

    Player.gridSize = Player.speed * Player.gridSizeMultiplier
    grid = Array.from({ length: (width-border) / Player.gridSize + 1 }, _ => new Array((height-border) / Player.gridSize + 1).fill(false))
}

// prevents the page from scrolling when using the arrow keys
window.addEventListener("keydown", function (scroll) {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(scroll.code) > -1) scroll.preventDefault();
}, false);

function draw() {
    if (inGame) {
        console.log(Player.gridSize)
        // draw the background with low opacity to create a trail effect

        // check for the next direction the player wants to go, update the position towards it's current direction and draw it
        for (player of players) {
            // do necessary checks
            player.checkNextDirection()
            player.updatePosition()
            player.draw()

            // force the player to only change direction when it's going to a grid position
            if (frameCount % Player.gridSize == 0) player.updateDirection()
        }
    } else {
        if (winner != "") {
            noStroke()
            fill(0, 102, 153)
            textSize(28)
            text(winner + " wins !", width / 2 - 100, height / 2, 200, 200)
        }
        if (keyIsDown(13)) setup()
    }
}

class Player {
    P1 // if the player is player 1 or not

    position = createVector(0, 0) // where the player is
    direction = createVector(0, 0) // where the player is going
    nextDirection = createVector(0, 0) // where the player wants to go
    static speed = 1 // how fast the player moves

    static gridSize // the size of the grid
    static gridSizeMultiplier = 10 // how many times the player can move before going to a grid position

    // create the player at a specific position
    constructor(x, y, P1) {
        this.position.x = x;
        this.position.y = y;
        this.P1 = P1;
        if (P1) this.nextDirection.y = 1
        else this.nextDirection.y = -1
    }

    // this method checks for the next direction the player wants to go and put it in the nextDirection variable that will change the direction when possible
    checkNextDirection() {
        // check if the player is player 1 or not (P1 uses arrow keys, P2 uses ZQSD)
        if (!this.P1) {
            // keyCode 38 = up arrow, keyCode 40 = down arrow, keyCode 37 = left arrow, keyCode 39 = right arrow
            if (keyIsDown(38) && this.direction.y != 1) {
                this.nextDirection = createVector(0, -1)
            }
            if (keyIsDown(40) && this.direction.y != -1) {
                this.nextDirection = createVector(0, 1)
            }
            if (keyIsDown(37) && this.direction.x != 1) {
                this.nextDirection = createVector(-1, 0)
            }
            if (keyIsDown(39) && this.direction.x != -1) {
                this.nextDirection = createVector(1, 0)
            }
        } else {
            // keyCode 90 = Z, keyCode 83 = S, keyCode 81 = Q, keyCode 68 = D
            if (keyIsDown(90) && this.direction.y != 1) {
                this.nextDirection = createVector(0, -1)
            }
            if (keyIsDown(83) && this.direction.y != -1) {
                this.nextDirection = createVector(0, 1)
            }
            if (keyIsDown(81) && this.direction.x != 1) {
                this.nextDirection = createVector(-1, 0)
            }
            if (keyIsDown(68) && this.direction.x != -1) {
                this.nextDirection = createVector(1, 0)
            }
        }
    }

    // simply move the player towards the current direction multiplied by the speed
    updatePosition() {
        // get the last grid position of the player
        let lastGridPos = createVector(Math.floor(this.position.x / Player.gridSize), Math.floor(this.position.y / Player.gridSize))

        // test if the position of the player after the movement will be offGrid and determines if the player lost or not
        let test = this.position
        test.add(this.direction.x * Player.speed, this.direction.y * Player.speed)
        if (test.x < 0 || test.x > width || test.y < 0 || test.y > height) {
            console.log("Player " + (this.P1 ? "1" : "2") + " lost")
            winner = this.P1 ? "Player 2" : "Player 1"
            inGame = false
            return
        }

        //move the player
        this.position.add(this.direction.x * Player.speed, this.direction.y * Player.speed)
        let gridPos = createVector(Math.floor(this.position.x / Player.gridSize), Math.floor(this.position.y / Player.gridSize))

        // check if the player is touching a grid positions already touched before and if not, says that it has been touched
        if ((gridPos.x != lastGridPos.x || gridPos.y != lastGridPos.y) && grid[gridPos.x][gridPos.y]) {
            console.log("Player " + (this.P1 ? "1" : "2") + " lost")
            winner = this.P1 ? "Player 2" : "Player 1"
            inGame = false
            return
        } else grid[gridPos.x][gridPos.y] = true
    }

    // update the direction to the next direction
    updateDirection() {
        this.direction = this.nextDirection
    }

    // draw the player on canvas
    draw() {
        if (this.P1) stroke(0, 255, 0)
        else stroke(255, 0, 0)
        point(this.position.x, this.position.y)
    }
}