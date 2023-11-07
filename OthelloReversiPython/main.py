###############
### IMPORTS ###
###############

import pygame
from pygame.locals import *



###############
### CLASSES ###
###############

# contains all other elements so everything is accessible from here
class GameManager:
    def __init__(self):
        # initialise the game manager
        self.board = Board()
        self.display = Display()
        self.ruleMaster = RuleMaster()
        self.actionListener = ActionListener()
        self.inGame = True

# dictates the rules of the game
class RuleMaster:
    def __init__(self):
        self.turn = 1

    # returns True if the move is valid, returns False otherwise
    def checkIfMoveIsValid(self, x, y, ActIfValid = True):
        if GAME_MANAGER.board.boardGrid[x][y] != 0:
            print("Invalid move: space already occupied")
            return False

        return self.CheckIfMoveTurnsPieces(x, y, ActIfValid)

    # returns True if the move turned something, returns False otherwise
    def CheckIfMoveTurnsPieces(self, x, y, ActIfValid):
        somethingTurned = False
        # get all direction from the piece and and call ActIfDirectionTurnPieces on them
        for xOffset in range (-1,2):
            for yOffset in range (-1,2):
                if self.CheckIfDirectionTurnPieces(x, y, xOffset, yOffset, ActIfValid):
                    somethingTurned = True
       
        if (not somethingTurned):
            print("Invalid move, didn't turn anything")
        # if ActIfDirectionTurnPieces returned True, then the move is valid because it turned something
        return somethingTurned

    # returns True if the move turned something on a specific direction and apply the movement, returns False otherwise
    def CheckIfDirectionTurnPieces(self, x, y, xOffset, yOffset, ActIfValid):
        length = 2

        # get playerColor
        playerColor = GAME_MANAGER.ruleMaster.turn%2
        if playerColor == 0:
            playerColor = -1

        # check if the piece isn't itself
        if x+xOffset == x and y+yOffset == y:
            return False

        # check if the piece is in bounds and isn't empty
        if self.isPieceInBound(x+xOffset, y+yOffset) and GAME_MANAGER.board.boardGrid[x+xOffset][y+yOffset] != 0:
            # check if the piece is the opposite color
            if GAME_MANAGER.board.boardGrid[x+xOffset][y+yOffset] == -playerColor:
                # "HARD" PART HERE, this part checks for part while they are from opposite color so we can know if there is a piece of the same color at the end
                # and if there is, we can turn all the pieces in between
                while self.isPieceInBound(x+length*xOffset, y+length*yOffset) and GAME_MANAGER.board.boardGrid[x+length*xOffset][y+length*yOffset] != 0:
                    if GAME_MANAGER.board.boardGrid[x+length*xOffset][y+length*yOffset] == playerColor:
                        if ActIfValid:
                            self.TurnPieces(x, y, xOffset, yOffset, length)
                        return True
                    length += 1 
        return False
            
    # turns pieces between 2 pieces of same color
    def TurnPieces(self, x, y, xOffset, yOffset, length):
        for i in range (length):
            GAME_MANAGER.board.boardGrid[x+i*xOffset][y+i*yOffset] = -GAME_MANAGER.board.boardGrid[x+i*xOffset][y+i*yOffset]

    # returns True if the piece is in bounds, returns False otherwise
    def isPieceInBound(self, x, y):
        if x < 0 or x > 7 or y < 0 or y > 7:
            return False
        return True
    
    # simply checks if the game is over
    def TestGameOver(self):
        if GAME_MANAGER.board.isBoardFull(): GAME_MANAGER.inGame = False
        if not self.TestPlayerCanPlay(False, False) and not self.TestPlayerCanPlay(False, True): GAME_MANAGER.inGame = False
        return None

    # checks if the player can play, if updateTurn is True, it will update the turn, if addTurn is True, it will add a turn to the turn counter temporarily
    def TestPlayerCanPlay(self, updateTurn = True, addTurn = False):
        # add temporary turn if addTurn is True
        if (addTurn):
            self.turn += 1

        # check for every space if the player can play and stop if it finds one
        for i in range(8):
            for j in range(8):
                if (GAME_MANAGER.ruleMaster.checkIfMoveIsValid(i, j, False)):
                    return True

        # remove temporary turn if addTurn is True        
        if addTurn:
            self.turn -= 1
        # add turn if updateTurn is True
        if updateTurn:
            self.turn += 1
        return False

class ActionListener:
    def __init__(self):
        self.wasPressingLastFrame = False

    def checkForMouseAction(self):
        if pygame.mouse.get_pressed()[0] and not self.wasPressingLastFrame:
            # turn mouse position into grid position
            gridPosition = pygame.mouse.get_pos()
            gridPosition = (int(gridPosition[0]/75), int(gridPosition[1]/75))
            if gridPosition[0] > 7:
                gridPosition = (7, gridPosition[1])
            if gridPosition[1] > 7:
                gridPosition = (gridPosition[0], 7)

            # check if the move is valid and update the board if it is
            if (GAME_MANAGER.ruleMaster.checkIfMoveIsValid(gridPosition[0], gridPosition[1])):
                if GAME_MANAGER.ruleMaster.turn%2 == 1:
                    GAME_MANAGER.board.boardGrid[gridPosition[0]][gridPosition[1]] = 1
                else:
                    GAME_MANAGER.board.boardGrid[gridPosition[0]][gridPosition[1]] = -1

                # check for no soft lock or if the game ender
                GAME_MANAGER.ruleMaster.turn += 1
                GAME_MANAGER.ruleMaster.TestGameOver()
                GAME_MANAGER.ruleMaster.TestPlayerCanPlay()

        
        if pygame.mouse.get_pressed()[0]:
            self.wasPressingLastFrame = True
        else:
            self.wasPressingLastFrame = False

    # checks if the player clicked on the screen to restart the game
    def checkForRestart(self):
        if pygame.mouse.get_pressed()[0]:
            GAME_MANAGER.board = Board()
            GAME_MANAGER.inGame = True

class Board:
    def __init__(self):
        # initialise the empty board
        self.boardGrid = [[0 for x in range(8)] for y in range(8)]

        # fill the center with pieces. 1 = white, -1 = black, 0 = empty
        self.boardGrid[3][3] = 1
        self.boardGrid[4][4] = 1
        self.boardGrid[3][4] = -1
        self.boardGrid[4][3] = -1

    # returns the score of the board in the form of a list [whiteScore, blackScore]
    def getScore(self):
        # initialise the score
        score = [0, 0]

        # count the pieces
        for i in range(8):
            for j in range(8):
                if self.boardGrid[i][j] == 1:
                    score[0] += 1
                elif self.boardGrid[i][j] == -1:
                    score[1] += 1

        return score
    
    # returns the color of the current player in text form
    def getPlayerColor(self):
        if GAME_MANAGER.ruleMaster.turn%2 == 1:
            return 'White'
        else:
            return 'Black'
    
    # returns True if the board is has no empty space, returns False otherwise
    def isBoardFull(self):
        for i in range(8):
            for j in range(8):
                if self.boardGrid[i][j] == 0:
                    return False
        return True

class Display:
    def __init__(self):
        # initialise color palette
        self.boardColor = (100, 200, 100)
        self.borderSize = 30
        self.whitePieceColor = (240, 240, 240)
        self.blackPieceColor = (15, 15, 15)
        self.lineColor = (255, 255, 255)

        # initialise display variables
        self.lineWidth = 1
        self.font = pygame.font.Font('freesansbold.ttf', 15)
        self.display = pygame.display.set_mode((600, 600+self.borderSize))

    # draws the board (lines and background)
    def drawBoard(self):
        # draw the background
        self.display.fill(self.boardColor)
        pygame.draw.rect(self.display, self.blackPieceColor, (0, 600, 600, self.borderSize))


        # draw the lines
        for i in range (1,8):
            pygame.draw.rect(self.display, self.lineColor, (i*75-(self.lineWidth/2), 0, self.lineWidth, 600))
            pygame.draw.rect(self.display, self.lineColor, (0, i*75-(self.lineWidth/2), 600, self.lineWidth))

    # draws the pieces on the board
    def drawPieces(self):
        # draw the pieces
        for i in range(8):
            for j in range(8):
                if GAME_MANAGER.board.boardGrid[i][j] == 1:
                    pygame.draw.circle(self.display, self.whitePieceColor, (i*75+37, j*75+37), 33)
                elif GAME_MANAGER.board.boardGrid[i][j] == -1:
                    pygame.draw.circle(self.display, self.blackPieceColor, (i*75+37, j*75+37), 33)

    # draws the score and the current player turn at the bottom of the screen
    def drawStats(self):
        # draw player score
        scoreWhite, scoreBlack = GAME_MANAGER.board.getScore()
        content = "White score: " + str(scoreWhite) + "     Black score: " + str(scoreBlack)
        text = self.font.render(content, False, (255,255,255))
        textRect = text.get_rect()
        textRect.center = (120, 615)
        self.display.blit(text, textRect)

        # draw current player turn
        content = "Current Player: " + GAME_MANAGER.board.getPlayerColor()
        text = self.font.render(content, False, (255,255,255))
        textRect = text.get_rect()
        textRect.center = (510, 615)
        self.display.blit(text, textRect)

        



######################
### INITIALISATION ###
######################

pygame.init()
FramePerSec = pygame.time.Clock()
pygame.display.set_caption("Game")

GAME_MANAGER = GameManager()



#################
### MAIN LOOP ###
#################

while pygame.event.wait().type != pygame.QUIT:
    # draw the board
    GAME_MANAGER.display.drawBoard()
    GAME_MANAGER.display.drawPieces()
    GAME_MANAGER.display.drawStats()

    # check for mouse action
    if GAME_MANAGER.inGame:
        GAME_MANAGER.actionListener.checkForMouseAction()
    else:
        GAME_MANAGER.actionListener.checkForRestart()

        content = "Game Over\n\nRestart ?"
        text = GAME_MANAGER.display.font.render(content, False, (0,0,0))
        textRect = text.get_rect()
        textRect.center = (300, 300)
        GAME_MANAGER.display.display.blit(text, textRect)

    # update the screen
    pygame.display.update()
    FramePerSec.tick(60)