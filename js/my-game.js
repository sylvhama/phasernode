var game;
var player;
var platforms;
var stars;
var score = 0;
var scoreText;

var onLeft = false;
var onRight = false;
var onUp = false;

function preload() {
  game.load.image('bg', 'assets/bg.png');
  game.load.image('ground', 'assets/ground.png');
  game.load.image('star', 'assets/star.png');
  game.load.spritesheet('mario', 'assets/mario.png', 16, 20);        
}
 
function create() {	
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.add.sprite(0, 0, 'bg');
  platforms = game.add.group();
  platforms.enableBody = true;
  for (i = 0; i < game.width/16; i++) { 
	var ground = platforms.create(i*16, game.world.height - 15, 'ground');
	ground.body.immovable = true;
  }    
  
  player = game.add.sprite(game.world.width/2, game.world.height/2, 'mario');  
  game.physics.arcade.enable(player);
  player.body.gravity.y = 300;
  player.body.collideWorldBounds = true;
  player.animations.add('left', [0, 1], 10, true);
  player.animations.add('right', [3,4], 10, true);
  
  stars = game.add.group();
  stars.enableBody = true;     
  createStar();
  
  scoreText = game.add.text(16, 16, 'Score: '+score, { fontSize: '32px', fill: '#000' });
}
 
function update() {
  game.physics.arcade.collide(player, platforms);
  game.physics.arcade.collide(stars, platforms);     	
  game.physics.arcade.overlap(player, stars, collectStar, null, this);

  player.body.velocity.x = 0;  
  if (onLeft) {
	  player.body.velocity.x = -150;  
	  player.animations.play('left');
  }else if (onRight) {
	  player.body.velocity.x = 150;
	  player.animations.play('right');
  }else {
	  player.animations.stop();
	  player.frame = 2;
  }
  if (onUp && player.body.touching.down) {
	  player.body.velocity.y = -150;
	  onUp = false;
  }
}

function createStar() {
  var rand = Math.floor(Math.random() * (game.width-30));
  var star = stars.create(rand, game.height/2, 'star');
  star.body.gravity.y = 300;
  star.body.bounce.y = 0.5;
}

function collectStar (player, star) {
  star.kill(); 
  score += 10;
  scoreText.text = 'Score: ' + score;      
  createStar();
}