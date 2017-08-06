var gameProperties = {
    screenWidth: 640,
    screenHeight: 480,
    
    dashSize: 5,
    
    paddleLeft_x: 50,
    paddleRight_x: 590,
    paddleVelocity: 600,
    paddleSegmentsMax: 4,
    paddleSegmentHeight: 4,
    paddleSegmentAngle: 15,
    paddleTopGap: 22,
    
    ballVelocity: 500,
    ballRandomStartingAngleLeft: [-120, 120],
    ballRandomStartingAngleRight: [-60, 60],
    ballStartDelay: 2,
    ballVelocityIncrement: 25,
    ballReturnCount: 4,
    
    scoreToWin: 11,
};

var fontAssets = {
    scoreLeft_x: gameProperties.screenWidth * 0.25,
    scoreRight_x: gameProperties.screenWidth * 0.75,
    scoreTop_y: 10,
    
    scoreFontStyle:{font: '80px Arial', fill: '#FFFFFF', align: 'center'},
    instructionsFontStyle:{font: '24px Arial', fill: '#FFFFFF', align: 'center'},
};

var labels = {
    clickToStart: 'Left paddle: A to move up, Z to move down.\n\nRight paddle: UP and DOWN arrow keys.\n\n- click to start -',
    winner: 'Winner!',
};

var mainState = function(game) {
    this.backgroundGraphics;
    this.ballSprite;
    this.paddleGroup;
      
    this.missedSide;
    
    this.scoreLeft;
    this.scoreRight;
    
    this.tf_scoreLeft;
    this.tf_scoreRight;
    
    this.sndBallHit;
    this.sndBallBounce;
    this.sndBallMissed;
    
    this.instructions;
    this.winnerLeft;
    this.winnerRight;
    
    this.ballVelocity;
}

var playState = {
    preload: function () {
        game.load.image('ball', 'assets/ball.png');
        game.load.image('paddle', 'assets/paddle.png');

        game.load.audio('ballBounce', ['assets/blaster.mp3', 'assets/ballBounce.ogg']);
        game.load.audio('ballHit', ['assets/blaster.mp3', 'assets/ballHit.ogg']);
        game.load.audio('ballMissed', ['assets/blaster.mp3', 'assets/ballMissed.ogg']);
    },
    
    create: function () {
        this.paddle = {} ;
        this.initGraphics();
        this.initPhysics();
        this.initSounds();
        Client.askNewPlayer();
    },
    
    update: function () {
        this.getInput();

        if (this.master) {
            game.physics.arcade.overlap(this.ballSprite, this.paddleGroup, this.collideWithPaddle, null, this);
            Client.sendNewBall(this.ballSprite.x, this.ballSprite.y);
            
            if (this.ballSprite.body.blocked.up || this.ballSprite.body.blocked.down || this.ballSprite.body.blocked.left || this.ballSprite.body.blocked.right) {
                this.sndBallBounce.play();
            }
        }
    },
    
    initBall: function() {
        game.physics.enable(this.ballSprite, Phaser.Physics.ARCADE);
        
        this.ballSprite.checkWorldBounds = true;
        this.ballSprite.body.collideWorldBounds = true;
        this.ballSprite.body.immovable = true;
        this.ballSprite.body.bounce.set(1);
        this.ballSprite.events.onOutOfBounds.add(this.ballOutOfBounds, this);        
    },
    
    initGraphics: function () {
        this.master = false;
        
        this.backgroundGraphics = game.add.graphics(0, 0);
        this.backgroundGraphics.lineStyle(2, 0xFFFFFF, 1);
        
        for (var y = 0; y < gameProperties.screenHeight; y += gameProperties.dashSize * 2) {
            this.backgroundGraphics.moveTo(game.world.centerX, y);
            this.backgroundGraphics.lineTo(game.world.centerX, y + gameProperties.dashSize);
        }
             
        this.ballSprite = game.add.sprite(game.world.centerX, game.world.centerY, 'ball');
        this.ballSprite.anchor.set(0.5, 0.5);

        this.tf_scoreLeft = game.add.text(fontAssets.scoreLeft_x, fontAssets.scoreTop_y, "0", fontAssets.scoreFontStyle);
        this.tf_scoreLeft.anchor.set(0.5, 0);
        
        this.tf_scoreRight = game.add.text(fontAssets.scoreRight_x, fontAssets.scoreTop_y, "0", fontAssets.scoreFontStyle);
        this.tf_scoreRight.anchor.set(0.5, 0);
        
        this.instructions = game.add.text(game.world.centerX, game.world.centerY, labels.clickToStart, fontAssets.instructionsFontStyle);
        this.instructions.anchor.set(0.5, 0.5);
        
        this.winnerLeft = game.add.text(gameProperties.screenWidth * 0.25, gameProperties.screenHeight * 0.25, labels.winner, fontAssets.instructionsFontStyle);
        this.winnerLeft.anchor.set(0.5, 0.5);
        
        this.winnerRight = game.add.text(gameProperties.screenWidth * 0.75, gameProperties.screenHeight * 0.25, labels.winner, fontAssets.instructionsFontStyle);
        this.winnerRight.anchor.set(0.5, 0.5);
        
        this.hideTextFields();
    },
    
    initPhysics: function () {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.paddleGroup = game.add.group();
        this.paddleGroup.enableBody = true;
        this.paddleGroup.physicsBodyType = Phaser.Physics.ARCADE;
        
        this.paddleGroup.setAll('checkWorldBounds', true);
        this.paddleGroup.setAll('body.collideWorldBounds', true);
        this.paddleGroup.setAll('body.immovable', true);
    },
    
    initSounds: function () {
        this.sndBallHit = game.add.audio('ballHit');
        this.sndBallBounce = game.add.audio('ballBounce');
        this.sndBallMissed = game.add.audio('ballMissed');
    },
    
    startDemo: function () {
        //this.ballSprite.visible = false;
        this.resetBall();
        this.enableBoundaries(true);       
        game.input.onDown.add(this.startGame, this);
        
        this.instructions.visible = true;
    },
    
    startGame: function () {
        game.input.onDown.remove(this.startGame, this);
        this.enablePaddles(true);
        this.enableBoundaries(false);
        this.resetBall();
        this.resetScores();
        this.hideTextFields();
    },
    
    startBall: function () {
        if (this.master){
            this.ballSprite.reset(game.world.centerX, game.rnd.between(0, gameProperties.screenHeight));
            this.ballVelocity = gameProperties.ballVelocity;
            this.ballReturnCount = 0;
            this.ballSprite.visible = true;
        
            var randomAngle = game.rnd.pick(gameProperties.ballRandomStartingAngleRight.concat(gameProperties.ballRandomStartingAngleLeft));
        
            if (this.missedSide == 'right') {
                randomAngle = game.rnd.pick(gameProperties.ballRandomStartingAngleRight);
            } else if (this.missedSide == 'left') {
                randomAngle = game.rnd.pick(gameProperties.ballRandomStartingAngleLeft);
            }
        
            game.physics.arcade.velocityFromAngle(randomAngle, gameProperties.ballVelocity, this.ballSprite.body.velocity);
        }
    },
    
    resetBall: function () {
        this.ballSprite.reset(game.world.centerX, game.rnd.between(0, gameProperties.screenHeight));
        //this.ballSprite.visible = false;
        game.time.events.add(Phaser.Timer.SECOND * gameProperties.ballStartDelay, this.startBall, this);
    },
    
    enablePaddles: function (enabled) {
        this.paddleGroup.setAll('visible', enabled);
        this.paddleGroup.setAll('body.enable', enabled);            
    },
    
    enableBoundaries: function (enabled) {
        game.physics.arcade.checkCollision.left = enabled;
        game.physics.arcade.checkCollision.right = enabled;
    },
    
    addNewPlayer: function(id,master,y){
        if (id&1){
            this.paddle[id] = game.add.sprite(gameProperties.paddleLeft_x, y, 'paddle');
        } else {
            this.paddle[id] = game.add.sprite(gameProperties.paddleRight_x, y, 'paddle');
        }
        this.paddle[id].anchor.set(0.5, 0.5);
        this.paddleGroup.add(this.paddle[id]);
        console.log("test received", id, master, y);
        if (id === master){
            this.master = true;
            // immediately send x coordinate to clear master flag
            Client.sendClick(gameProperties.paddleRight_x, y);            
            this.initBall();
            this.startDemo();    
        }   
    },

    movePlayer: function(id,x,y){
        this.paddle[id].position.y = y;
    },
    
    getInput: function () {
        if (game.input.pointer1.isDown)
        {
            Client.sendClick(gameProperties.paddleRight_x, game.input.y);
        }
    },

    ballStart: function(x,y) {
        if(!this.master){
            this.ballSprite.position.x = x;
            this.ballSprite.position.y = y;
        }
            console.log("ball received", x, y); 
    },
    
    collideWithPaddle: function (ball, paddle) {
        this.sndBallHit.play();
        
        var returnAngle;
        var segmentHit = Math.floor((ball.y - paddle.y)/gameProperties.paddleSegmentHeight);
        
        if (segmentHit >= gameProperties.paddleSegmentsMax) {
            segmentHit = gameProperties.paddleSegmentsMax - 1;
        } else if (segmentHit <= -gameProperties.paddleSegmentsMax) {
            segmentHit = -(gameProperties.paddleSegmentsMax - 1);
        }
        
        if (paddle.x < gameProperties.screenWidth * 0.5) {
            returnAngle = segmentHit * gameProperties.paddleSegmentAngle;
            game.physics.arcade.velocityFromAngle(returnAngle, this.ballVelocity, this.ballSprite.body.velocity);
        } else {
            returnAngle = 180 - (segmentHit * gameProperties.paddleSegmentAngle);
            if (returnAngle > 180) {
                returnAngle -= 360;
            }
            
            game.physics.arcade.velocityFromAngle(returnAngle, this.ballVelocity, this.ballSprite.body.velocity);
        }
        
        this.ballReturnCount ++;
        
        if(this.ballReturnCount >= gameProperties.ballReturnCount) {
            this.ballReturnCount = 0;
            this.ballVelocity += gameProperties.ballVelocityIncrement;
        }
    },
    
    ballOutOfBounds: function () {
        this.sndBallMissed.play();
        
        if (this.ballSprite.x < 0) {
            this.missedSide = 'left';
            this.scoreRight++;
        } else if (this.ballSprite.x > gameProperties.screenWidth) {
            this.missedSide = 'right';
            this.scoreLeft++;
        }
        
        this.updateScoreTextFields();
        
        if (this.scoreLeft >= gameProperties.scoreToWin) {
            this.winnerLeft.visible = true;
            this.startDemo();
        } else if (this.scoreRight >= gameProperties.scoreToWin) {
            this.winnerRight.visible = true;
            this.startDemo();
        } else {
            this.resetBall();
        }
    },
    
    resetScores: function () {
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.updateScoreTextFields();
    },
    
    updateScoreTextFields: function () {
        this.tf_scoreLeft.text = this.scoreLeft;
        this.tf_scoreRight.text = this.scoreRight;
    },
    
    hideTextFields: function () {
        this.instructions.visible = false;
        this.winnerLeft.visible = false;
        this.winnerRight.visible = false;
    },
    
    removePlayer: function(id){
        this.paddle[id].destroy();
        delete this.paddle[id];
    },
};

var game = new Phaser.Game(gameProperties.screenWidth, gameProperties.screenHeight, Phaser.AUTO, 'gameDiv');
game.state.add('main', playState);
game.state.start('main');