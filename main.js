let enJeu = true // détermine si le jeu doit continuer ou s'arrêter
let joueur = null // l'objet qui représente le joueur (pour l'instant il n'y a pas de joueur)


// la fonction setup est la fonction qui est appelée au lancement de la page. C'est une fonction native de la bibliothèque p5.js
function setup() {
    createCanvas(window.innerWidth - 4, window.innerHeight - 4) // créé un canvas de la taille de la fenêtre environ (5px de moins pour éviter les scrollbars), 
    // le canvas est la zone ou le script JS va agir, il s'ajoute automatiquement a la page HTML dans une balise de type <main> <canvas> ... </canvas> </main>

    background(120,150,220) // met le fond du canvas en noir
    frameRate(30) // fait en sorte que la page se rafraichisse 30 fois par seconde

    // création des objets
    joueur = new Birdie()
}

// la fonction draw est la fonction qui est appelée à chaque frame. C'est une fonction native de la bibliothèque p5.js
function draw() {
    if (enJeu) { // vérifie si le jeu est en cours ou si il est terminé, agit en conséquence
        background(120,150,220) // refresh l'image

        // fait agir joueur
        joueur.afficher()
        joueur.deplacement()
        joueur.collisions()
        joueur.verifSiPassagePipe()

        // fait agir les pipes
        for (p of Pipe.pipes) {
            p.afficher()
            p.deplacement()
            p.destructionPipeSiBesoin()
        }
        Pipe.creationPipeSiBesoin()
        joueur.afficherScore() // on affiche le score en dernier comme ça il est au dessus de tout sur l'image

    } else { // si le jeu est terminé, affiche le texte de fin de partie et vérifie si le joueur veut rejouer
        afficherGameOver()
        verifSiRejouer()
    }
}

class Birdie {
    position = createVector(0, 0) // position du joueur
    velociteY = 0 // vitesse verticale du joueur
    scoreActuel = 0 // score actuel du joueur
    lastClosestPipe = null // l'ancien pipe le plus proche du joueur
    closestPipe = null // le pipe le plus proche du joueur (celui dont il faut vérifier si le joueur l'a passé)

    static size = 100 // taille du joueur
    static record = 0 // record du joueur
    static gravite = 0.2 // gravité du joueur
    static puissanceSaut = 5 // puissance du saut du joueur
    static gentillesseHitBox = 3 // gentillesse de la hitbox du joueur (la hitbox est moins grande que le dessin de tant de pixel)

    // constructeur de birdie
    constructor() {
        this.position = createVector(width/3, height/2)
        this.scoreActuel = 0
        this.velociteY = 0
        this.closestPipe = null
    }

    // dessine le joueur a sa position sur l'écran
    afficher() {
        // setup affichage
        stroke(255,255,0)
        strokeWeight(Birdie.size)
        
        // dessine le joueur
        point(this.position.x, this.position.y)
    }

    // déplace le joueur en fonction de sa velocité
    deplacement() {
        this.#gravite()
        this.#sauter()

        this.position.y += this.velociteY
    }

    // applique la gravité au joueur
    #gravite() {
        this.velociteY += Birdie.gravite // augmente sa velocité verticale de la valeur de gravité
    }

    // fait sauter le joueur
    #sauter() {
        if (keyIsDown(32) /*Space*/ || keyIsDown(90) /*Z*/ || keyIsDown(87) /*W*/ || keyIsDown(38) /*ArrowUp*/ || mouseIsPressed) this.velociteY = -Birdie.puissanceSaut // verifie si le joueur a essayé de sauter et...
        // bloque sa velocité verticale a la valeur de -puissanceSaut si c'etait le cas
    }

    // vérifie si le joueur est en collision avec un obstacle et a perdu
    collisions() {
        this.#collisionSol()
        this.#collisionPipe()
    }

    // vérifie si le joueur est en collision avec le sol et a perdu
    #collisionSol() {
        if (this.position.y + Birdie.size/2 > height || this.position.y - Birdie.size/2 < 0) {
            enJeu = false
            this.updateRecord()
        }
    }

    // vérifie si le joueur est en collision avec un pipe et a perdu (LE PLUS COMPLIQUE A FAIRE)
    #collisionPipe() {
        let collision = false // détermine si il y a eu collision ou non

        // si le joueur n'a pas de pipe le plus proche, on lui en donne un
        if (this.closestPipe == null && Pipe.pipes != null) this.closestPipe = Pipe.pipes[0]
        
        // si le joueur n'a toujours pas de pipe le plus proche, on ne fait rien, sinon on vérifie si il a passé le pipe le plus proche
        if (this.closestPipe == null) return

        // verifie pour chaque coin du pipe si il est en collision avec le joueur
        else if (dist(this.position.x, this.position.y, this.closestPipe.position.x, this.closestPipe.pipeHeight) < Birdie.size/2 - Birdie.gentillesseHitBox) collision = true
        else if (dist(this.position.x, this.position.y, this.closestPipe.position.x, this.closestPipe.pipeHeight + this.closestPipe.spacement) < Birdie.size/2 - Birdie.gentillesseHitBox) collision = true
        else if (dist(this.position.x, this.position.y, this.closestPipe.position.x + Pipe.largeur, this.closestPipe.pipeHeight) < Birdie.size/2 - Birdie.gentillesseHitBox) collision = true
        else if (dist(this.position.x, this.position.y, this.closestPipe.position.x + Pipe.largeur, this.closestPipe.pipeHeight + this.closestPipe.spacement) < Birdie.size/2 - Birdie.gentillesseHitBox) collision = true

        // verifie pour les côtés du pipe s'ils sont en collision avec le joueur
        else if (Math.abs(this.position.x - this.closestPipe.position.x) < Birdie.size/2 && (this.position.y < this.closestPipe.pipeHeight + Birdie.size/2 - Birdie.gentillesseHitBox || this.position.y > this.closestPipe.pipeHeight + this.closestPipe.spacement + Birdie.size/2 - Birdie.gentillesseHitBox )) collision = true

        // si il y a eu collision, on arrête le jeu
        if (collision) {
            enJeu = false
            this.updateRecord()
        }
    }

    // vérifie si le joueur a passé un pipe et augmente son score si c'est le cas
    verifSiPassagePipe() {
        // si le joueur n'a pas de pipe le plus proche, on lui en donne un
        if (this.closestPipe == null && Pipe.pipes != null) this.closestPipe = Pipe.pipes[0]
        
        // si le joueur n'a toujours pas de pipe le plus proche, on ne fait rien, sinon on vérifie si il a passé le pipe le plus proche et que ce n'est pas le même que la fois d'avant
        if (this.closestPipe == null) return
        else if (this.position.x > this.closestPipe.position.x + Pipe.largeur/2 && this.lastClosestPipe != this.closestPipe) {
            this.scoreActuel++ // augmente le score du joueur
            this.lastClosestPipe = this.closestPipe // change le dernier pipe le plus proche du joueur
            this.closestPipe = Pipe.pipes[Pipe.pipes.indexOf(this.closestPipe) + 1] // change le pipe le plus proche du joueur
        }
    }

    // affiche le score du joueur
    afficherScore() {
        // setup affichage
        fill(255)
        noStroke()

        // affiche le score
        text('score : ' + this.scoreActuel, 10, 20)
    }

    // met a jour le record du joueur
    updateRecord() {
        if (this.scoreActuel > Birdie.record) Birdie.record = this.scoreActuel
    }
}

class Pipe {
    // variables d'objet
    position = createVector(0, 0) // position du pipe
    pipeHeight = null // hauteur du haut du pipe
    spacement = null // hauteur de l'espace entre les deux bout de pipe

    // variables statiques
    static pipes = [] // tableau qui contient tous les pipes
    static vitesse = 5 // vitesse de déplacement des pipes
    static largeur = 100 // largeur du pipe
    static cooldownCreation = 100 // combien de frames entre chaque création de pipe

    constructor() {
        this.pipeHeight = random(height/6, height/2) // détermine la hauteur du haut du pipe
        this.spacement = random(height/4, height/2) // détermine la hauteur de l'espace entre les deux bout de pipe (le pipe du bas est automatiquement deduit)

        this.position = createVector(width, 0) // positionne le pipe tout a droite de l'écran

        Pipe.pipes.push(this) // ajoute le pipe au tableau de pipes
    }

    // déplace le pipe vers la gauche de la valeur de Pipe.vitesse
    deplacement() {
        this.position.x -= Pipe.vitesse
    }


    afficher() {
        fill(0,255,0) // determine que le pipe sera vert et rempli 
        noStroke() // determine que le pipe n'aura pas de contour

        rect(this.position.x, this.position.y, Pipe.largeur, this.pipeHeight) // dessine le haut du pipe
        rect(this.position.x, this.position.y + this.pipeHeight + this.spacement, Pipe.largeur, 1000) // dessine le bas du pipe
    }

    // détruit le pipe si il est hors de l'écran et le retire du tableau
    destructionPipeSiBesoin() {
        if (this.position.x < -Pipe.largeur) Pipe.pipes.shift()  // retire le premier élément du...
        // tableau (le pipe le plus a gauche) s'il est hors de l'écran (quand sa position est inferieur a -Pipe.largeur/2)
    }

    // créé un pipe toutes les certaines unités de temps (cooldownCreation) comptées en frames
    static creationPipeSiBesoin() {
        if (frameCount % Pipe.cooldownCreation == 1) new Pipe()
    }
}

// affiche le texte de fin de partie
function afficherGameOver() {
    // setup affichage texte
    // background(120,150,220)
    noStroke()
    fill(255)

    // ecris le texte
    text("Game Over", width/2 - 50, height/2 - 20)
    text("Score : " + joueur.scoreActuel, width/2 - 50, height/2 + 20)
    text("Record : " + Birdie.record, width/2 - 50, height/2 + 40)
}

function verifSiRejouer() {
    // verifie si le joueur a appuyé sur R, Space, Z, W, ArrowUp, Enter ou si il a cliqué et si oui, relance le jeu
    if (keyIsDown(82) /*R*/ || keyIsDown(32) /*Space*/ || keyIsDown(90) /*Z*/ || keyIsDown(87) /*W*/ || keyIsDown(38) /*ArrowUp*/ || keyIsDown(13) /*Enter*/ || mouseIsPressed) {

        // réinitialise le joueur, les pipes, et le frameCount
        joueur = new Birdie()
        Pipe.pipes = []
        frameCount = 0

        enJeu = true // remet le jeu en route
    }
}