var socket;
var playerInfo = {"name": ""};
var myPlayer = null;
var gameboard = null;
var chatForm = document.getElementById('chatForm');
var chatInput = document.getElementById('chatInput');
var myCards = document.getElementById('myCards');
var suggestionModal = document.getElementById('suggestionModal');
var accusationModal = document.getElementById('accusationModal');
var suspect1 = document.getElementById('suspect1');
var weapon1 = document.getElementById('weapon1');
var room1 = document.getElementById('room1');
var suspect2 = document.getElementById('suspect2');
var weapon2 = document.getElementById('weapon2');
var room2 = document.getElementById('room2');
var inactivePlayers = {};
var currSuggestion = null;
var names = null;

// Suspect Deck
var suspectDeck = null;
// Weapon Deck
var weaponDeck = null;
// Room Deck
var roomDeck = null;

// Images
var imageSrc = new Array();
imageSrc[0] = "/client/img/gamepieces/red-gp.png";
imageSrc[1] = "/client/img/gamepieces/yellow-gp.png";
imageSrc[2] = "/client/img/gamepieces/white-gp.png";
imageSrc[3] = "/client/img/gamepieces/green-gp.png";
imageSrc[4] = "/client/img/gamepieces/blue-gp.png";
imageSrc[5] = "/client/img/gamepieces/purple-gp.png";

// Create a Match, Matchmade, Match In-Progress
function newConnection() {
	return new Promise(
		function(resolve, reject) {
			socket = io.connect();

			socket.on('connect', function() {
				socket.emit('visit');
			});

			socket.on('visitor', function(data) {
				document.getElementById('gameStatus').innerHTML = data;
				if (data === 'Match In-Progress') {
                    document.getElementById('game').style.display = 'none';
                    document.getElementById('msgDiv').style.display = 'inline-block';
                } else if (data === 'Matchmade') {
                    document.getElementById('createBtn').innerHTML = 'Matchmade';
                } else {
                    document.getElementById('game').style.display = 'inline-block';
                    document.getElementById('msgDiv').style.display = 'none';
                }
				resolve();
			});

			socket.on('newPlayer', function(data) {
				document.getElementById('playerCount').innerHTML = data.count + "/6 players";
				playerInfo.id = data.id;
                displayCharacters(data.characters);
                resolve();
			});
		});
}

function main() {
	newConnection().then(function() {
		socket.on('gameStatus', function(data) {
			document.getElementById('gameStatus').innerHTML = data;
			if (data === 'Match In-Progress') {
                document.getElementById('game').style.display = 'none';
                document.getElementById('msgDiv').style.display = 'inline-block';
                document.getElementById('gameStatus').style.display = 'none';
            } else if (data === 'Matchmade') {
                document.getElementById('createBtn').innerHTML = 'Matchmade';
            } else {
                document.getElementById('game').style.display = 'inline-block';
                document.getElementById('createBtn').innerHTML = 'New Game';
                document.getElementById('msgDiv').style.display = 'none';
            }
		});

		socket.on('playerCount', function(data) {
            document.getElementById('playerCount').innerHTML = data + "/6 players";
        });

        // A player is not able to join the game
        socket.on('joinError', function(data) {
            alert('Sorry, the match is already underway!');
            returnToMain();
        });

        socket.on('characters', function(data) {
        	if (!playerInfo.character) {
        		displayCharacters(data);
        	}
        });

        socket.on('gameReady', function(data) {
        	document.getElementById('startBtn').disabled = false;
        });


        socket.on('drawboard', function(data) {
        	document.getElementById('lobby').style.display = 'none';
            document.getElementById("character").style.display = 'none';
            document.getElementById('instruction').style.display = 'none';
        	document.getElementById('gamearea').style.display = 'inline-block';
        	// Create a new player object and set it to be an active player
            myPlayer = new Player(playerInfo.id, playerInfo.name, playerInfo.character, playerInfo.position);
            myPlayer.isActive = true;
        	myPlayer.hand = data[0];
        	names = myPlayer.cardNames();
        	for(var name in data[1]) {
                inactivePlayers[name] = new Player(0, "", name, data[1][name].position);
            }
        	var html = "";
        	for(var i = 0; i < data[0].length; i++) {
        		html += "<div>" + data[0][i].name + "</div>";
        	}
        	myCards.innerHTML = html;
        	gameboard = new Board(imageSrc);
            gameboard.clearBoard();
            // gameboard.initializeBoard();
        	var myImg = gameboard.selectCharacter(myPlayer.character);
        	document.getElementById('myImg').src = myImg;
        	document.getElementById('myCharacter').innerHTML = myPlayer.character;
        	gameboard.placeCharacters();
        });

        socket.on('setupGame', function(data) {
        	var response = setupGame(data);
        	socket.emit('setupComplete', response);
        });

        socket.on('move', function(data) {
        	gameboard.positions = data[0];
        	document.getElementById(gameboard.positions[data[1]][data[2]].room + data[3]).src = "";
        	gameboard.placeCharacters();
            var msg =  data[5] + " is now in the " + data[4];
            addToActivityLog(msg);
        });

        socket.on('suggestion', function(data) {
        	gameboard.positions = data.suggestion[0].board;
        	if (data.suggestion.length > 1) {
        		var row = data.suggestion[1];
	        	var col = data.suggestion[2];
	        	var pos = data.suggestion[3];
	        	document.getElementById(gameboard.positions[row][col].room + pos).src = "";
        	}
    		currSuggestion = [data.suggestion[0].suspect, data.suggestion[0].weapon, data.suggestion[0].room];
        	var msg = data.name + " suggests " + data.suggestion[0].suspect + " with " +
				data.suggestion[0].weapon + " in " + data.suggestion[0].room;
            addToActivityLog(msg);
        	gameboard.placeCharacters();
        });

        socket.on('beMoved', function(data) {
        	var isvalid = gameboard.checkPosition(data.suggestion[0].room, myPlayer.character);
        	if (isvalid[0]) {
        		myPlayer.position = gameboard.getRoomPosition(data.suggestion[0].room);
        		data.suggestion.push(isvalid[1][0]);
        		data.suggestion.push(isvalid[1][1]);
        		data.suggestion.push(isvalid[1][2].toString());
        		myPlayer.wasMoved = true;
        	}
        	data.suggestion[0].board = gameboard.positions;
        	socket.emit('moved', data);
        });

        socket.on('movedActivity', function(data) {
            var msg = data.suggestion[0].suspect + " has been moved to the " + data.suggestion[0].room;
            addToActivityLog(msg);
        });

        socket.on('proofActivity', function(data) {
            var msg = data + " has proved the suggestion false.";
            addToActivityLog(msg);
        });

        socket.on('startTurn', function(data) {
        	if (myPlayer.isActive) {
        		myPlayer.isTurn = true;
	        	alert('Your turn.');
	        	document.getElementById('endTurnBtn').disabled = false;

	        	var img = gameboard.selectCharacter(myPlayer.character);
        		document.getElementById('playerImg').src = img;
        		document.getElementById('turn').innerHTML = myPlayer.character;

	        	if (myPlayer.wasMoved) {
	                alert('Move, suggest, or accuse!');
	                document.getElementById('suggestion').disabled = false;
	                document.getElementById('accusation').disabled = false;
	            }
        	} else {
        		socket.emit('nextTurn');
        	}      	
        });

        socket.on('turn', function(data) {
        	var img = gameboard.selectCharacter(data);
        	document.getElementById('playerImg').src = img;
        	document.getElementById('turn').innerHTML = data;
        });

        socket.on('prove', function(data) {
        	var proofCount = 0;
        	for(var i = 0; i < currSuggestion.length; i++) {
        		if (names.includes(currSuggestion[i])) {
        			proofCount++;
        			document.getElementById('proveBtn').disabled = false;
        			alert('Disprove the suggestion!');
        			break;
        		}
        	}
        	if (proofCount === 0) {
        		socket.emit('nextChallenger');
        	}
        });

        socket.on('proven', function(data) {
        	var msg = data.name + " says " + data.proof + " is not the answer";
            addToActivityLog(msg);
            document.getElementById('suggestion').disabled = true;
   	 		document.getElementById('accusation').disabled = true;
            document.getElementById('endTurnBtn').disabled = true;
   	 		myPlayer.isTurn = false;
   	 		myPlayer.hasSuggested = false;
   	 		myPlayer.suggest = false;
            alert('Turn over.');
            // Alert server to switch turn
        	socket.emit('nextTurn');
        });

        socket.on('notProven', function(data) {
            alert('No one could disprove your suggestion! You may end your turn or make an accusation.');
            document.getElementById('accusation').disabled = false;
            document.getElementById('endTurnBtn').disabled = false;
        });

        socket.on('unproven', function(data) {
            var msg = "The suggestion could not be disproven.";
            addToActivityLog(msg);
        });

        socket.on('accusationResponse', function(data) {
            var html = "<div>The cards in the secret envelope are: ";
            for(var i = 0; i < 3; i++) {
                html += data[1].cards[i].name + ", ";
            }
            html += "</div>";
            var element = document.getElementById('activityLog');
            element.innerHTML += html;
            element.scrollTop = element.scrollHeight;
            if (data[0]) {
                alert('Mystery solved! You win!');
                socket.emit('endGame', true);
            } else {
                myPlayer.isActive = false;
                alert('Oh no...your accusation is incorrect. You lose.');
                socket.emit('nextTurn');
            }
        });

        socket.on('accusationMade', function(data) {
            var msg = data[1] + " accuses " + data[0].suspect + " in the " + data[0].room + " with the " + data[0].weapon;
            addToActivityLog(msg);
        });

        socket.on('falseAccusation', function(data) {
            var msg = "The accusation made by " + data + " was incorrect.";
            addToActivityLog(msg);
        });

        socket.on('gameOver', function(data) {
            if (data) {
                if (Array.isArray(data)) {
                    // Display the name of the character who solved the mystery
                    // and what the answer was
                    var element = document.getElementById('activityLog');
                    element.innerHTML += "<div>" + data[0] +
                                    " solved the mystery! It was " + data[1].cards[0].name +
                                    " in the " + data[1].cards[2].name + " with the " + data[1].cards[1].name + "</div>";
                    element.scrollTop = element.scrollHeight;
                    alert('Thanks for playing! Sending you back home...');
                } else {
                    var txt = "No one solved the mystery... In the end, it was " +
                                data.cards[0].name + " in the " + data.cards[2].name + " with the " +
                                data.cards[1].name + ". Sending you back home...";
                    alert(txt);
                }
                
            } else {
                alert('A player has concluded the match. Sending you back home...');
            }
            resetGame();
            returnToMain();
        });

        socket.on('disconnect', function(data) {
        	alert('Connection lost!');
        });

        socket.on('receiveMessage', function(data){
        	var element = document.getElementById('chatWindow');
        	if (data.player) {
        		element.innerHTML += "<div>" + data.player + ": " + data.message + "</div>";
        	} else {
        		element.innerHTML += "<div>" + data + "</div>";
        	}
            element.scrollTop = element.scrollHeight;
        });

        // Receive a card and add to player's hand
        socket.on('addCard', function(data) {
            myPlayer.hand.push(data);
            var element = document.getElementById('activityLog');
            element.innerHTML += "<div>You received the " + data.name + " card.</div>";
            element.scrollTop = element.scrollHeight;
            myCards.innerHTML += "<div>" + data.name + "</div>";
        });

        // Add a character to the list of inactive characters
        socket.on('inactivate', function(data) {
            var pos = gameboard.findPosition(data);
            inactivePlayers[data] = new Player(0, "", data, pos);
        });

        socket.on('insufficient', function(data) {
        	var element = document.getElementById('chatWindow');
        	element.innerHTML += "<div>Not enough players for a match!</div>";
            element.scrollTop = element.scrollHeight;
            resetGame();
        	alert('The match has concluded due to insufficient players. Sending you back home...');
        	returnToMain();
        });

        // For debugging server
		socket.on('evalAns', function(data) {
			console.log(data);
		});

		chatForm.onsubmit = function(e) {
			e.preventDefault();
			if(chatInput.value[0] === '/') {	// For debugging server side
				socket.emit('evalServer', chatInput.value.slice(1));
			} else {
				socket.emit('sendMessage', {player: myPlayer.character, message: chatInput.value});
			}
			chatInput.value = '';
		};

        document.onkeydown = function(event) {
			if(event.keyCode === 39) {			// right arrow
				movePlayer("right");
			} else if(event.keyCode === 40) {  // down arrow
				movePlayer("down");
			} else if(event.keyCode === 37) {  // left arrow
				movePlayer("left");
			} else if(event.keyCode === 38) {  // up arrow
				movePlayer("up");
			}
		}
	},
	function(err) {
		console.log(err);
	});
}

main();

function createGame() {
	document.getElementById('main').style.display = 'none';
    document.getElementById('instruction').style.display = 'none';
	document.getElementById('lobby').style.display = 'inline-block';
	socket.emit('join');
}

function startGame() {
	socket.emit('startGame');
}

function addToActivityLog(msg) {
    var element = document.getElementById('activityLog');
    element.innerHTML += "<div>" + msg + "</div>";
    element.scrollTop = element.scrollHeight;
}

function displayInstructions() {
    document.getElementById('instruction').style.display = 'inline-block';
    document.getElementById('main').style.display = 'none';
    document.getElementById('lobby').style.display = 'none';
    document.getElementById("character").style.display = 'none';
    document.getElementById('gamearea').style.display = 'none';
    document.getElementById('about').style.display = 'none';
    socket.emit('remove');
}

function displayHome() {
    document.getElementById('instruction').style.display = 'none';
    document.getElementById('main').style.display = 'inline-block';
    document.getElementById('lobby').style.display = 'none';
    document.getElementById("character").style.display = 'none';
    document.getElementById('gamearea').style.display = 'none';
    document.getElementById('about').style.display = 'none';
    socket.emit('remove');
}

function about() {
    document.getElementById('instruction').style.display = 'none';
    document.getElementById('main').style.display = 'none';
    document.getElementById('lobby').style.display = 'none';
    document.getElementById("character").style.display = 'none';
    document.getElementById('gamearea').style.display = 'none';
    document.getElementById('about').style.display = 'inline-block';
    socket.emit('remove');
}

function resetGame() {
	inactivePlayers = {};
    playerInfo = {"name": ""};
    myPlayer = null;
    gameboard = null;
    currSuggestion = null;
    names = null;
    gameboard = null;
    suspectDeck = null;
    weaponDeck = null;
    roomDeck = null;
}

function returnToMain() {
	document.getElementById('main').style.display = 'inline-block';
    document.getElementById('gamearea').style.display = 'none';
    document.getElementById('lobby').style.display = 'none';
    document.getElementById("character").style.display = 'none';
    document.getElementById('instruction').style.display = 'none';
    document.getElementById('about').style.display = 'none';
    document.getElementById('startBtn').disabled = true;
    document.getElementById('chatWindow').innerHTML = "";
    document.getElementById('activityLog').innerHTML = "";
    socket.emit('getStatus');
}

function removeCharacter(id) {
	var text = "You selected ";
    switch(id) {
        case 0:
        	document.getElementById('character0').style.display = 'none';
            playerInfo.character = "Candy Floss Angel Ears";
            playerInfo.position = [0, 3];
            socket.emit('character', "Candy Floss Angel Ears");
            text += "Candy Floss Angel Ears";
            break;
        case 1:
        	document.getElementById('character1').style.display = 'none';
            playerInfo.character = "Cookie Rainbow Dancer";
            playerInfo.position = [1, 0];
            socket.emit('character', "Cookie Rainbow Dancer");
            text += "Cookie Rainbow Dancer";
            break;
        case 2:
        	document.getElementById('character2').style.display = 'none';
            playerInfo.character = "Sunny Cloverfield";
            playerInfo.position = [1, 4];
            socket.emit('character', "Sunny Cloverfield");
            text += "Sunny Cloverfield";
            break;
        case 3:
        	document.getElementById('character3').style.display = 'none';
            playerInfo.character = "Cupcake Sugarsocks";
            playerInfo.position = [3, 0];
            socket.emit('character', "Cupcake Sugarsocks");
            text += "Cupcake Sugarsocks";
            break;
        case 4:
        	document.getElementById('character4').style.display = 'none';
            playerInfo.character = "Jingles Fizzle Flanks";
            playerInfo.position = [4, 1];
            socket.emit('character', "Jingles Fizzle Flanks");
            text += "Jingles Fizzle Flanks";
            break;
        case 5:
        	document.getElementById('character5').style.display = 'none';
            playerInfo.character = "Princess Cloudburst";
            playerInfo.position = [4, 3];
            socket.emit('character', "Princess Cloudburst");
            text += "Princess Cloudburst";
            break;
    }
    document.getElementById("characterChoice").innerHTML = text;
    document.getElementById("character").style.display = 'block';
    document.getElementById("characters").style.display = 'none';
}

function displayCharacters(characters) {
    var suspects = ['Candy Floss Angel Ears', 'Cookie Rainbow Dancer', 'Sunny Cloverfield', 'Cupcake Sugarsocks', 'Jingles Fizzle Flanks', 'Princess Cloudburst'];
    document.getElementById("characters").style.display = 'block';
    for(var i = 0; i < 6; i++) {
    	if (characters[suspects[i]]) {
    		document.getElementById('character' + i).style.display = 'block';
    	} else {
    		document.getElementById('character' + i).style.display = 'none';
    	}
    }
}

function setupGame(playerNum) {
	populateDecks();
	var response = {};
	// Shuffle the decks
	suspectDeck.shuffle();
	weaponDeck.shuffle();
	roomDeck.shuffle();

	// Get Secret Envelope
	var secretEnvelope = new Deck();
	secretEnvelope.add_card(suspectDeck.get_card(0));
	secretEnvelope.add_card(weaponDeck.get_card(0));
	secretEnvelope.add_card(roomDeck.get_card(0));
	response.secret = secretEnvelope;

	// Make a deck with the rest of the cards
	// and distribute amongst active players
	var clueDeck = new Deck();
	clueDeck.add_card(suspectDeck.not_dealt());
	clueDeck.add_card(weaponDeck.not_dealt());
	clueDeck.add_card(roomDeck.not_dealt());
	clueDeck.shuffle();
	var cardCount = Math.floor(clueDeck.cards.length / playerNum);
	var leftOver = clueDeck.cards.length % playerNum;
	for(var i = 0; i < playerNum; i++) {
		response[i] = clueDeck.deal_cards(cardCount);
	}

	if (leftOver > 0) {
		for(var i = 0; i < leftOver; i++) {
			var thisCard = clueDeck.deal_cards(1);
            response[i].push(thisCard[0]);
		}
	}

	return response;
}

function movePlayer(dir) {
	if (myPlayer !== null) {
		var newPosition, isvalid = [], msg = '';
		if (!myPlayer.isActive) {
			alert("You lost.");
		} else if (!myPlayer.isTurn) {
			alert("Hold on, it isn't your turn.");
		} else {
			// Get the new position to move to
			if (dir === 'secret') {
				if (gameboard.secretPassage(myPlayer.position)) {
					newPosition = myPlayer.moveThruPassage();
				} else {
					msg = 'No secret passage in this room, bud.';
				}
			} else {
				newPosition = myPlayer.move(dir);
			}

			if(newPosition) {
				// Stops player from reentering the same room in one turn
				if (myPlayer.lastRoom === gameboard.getRoomName(newPosition)) {
					alert("You can't move to the same room in one turn!");
				} else if (myPlayer.hasSuggested) {
					alert('Awaiting response from other players...');
				} 
				else if (myPlayer.suggest) {
					alert('Make a suggestion or accusation.');
				} else {
					isvalid = gameboard.checkPosition(newPosition, myPlayer.character);
					if (isvalid[0]) {
						var row = isvalid[1][0];
						var col = isvalid[1][1];
						var pos = isvalid[1][2].toString();
						var name = gameboard.getRoomName(newPosition);
						if (name !== 'Hallway') {
							myPlayer.lastRoom = name;
							myPlayer.suggest = true;
		        			document.getElementById('suggestion').disabled = false;
		        			document.getElementById('accusation').disabled = false;
		        			// document.getElementById('endTurnBtn').disabled = true;
						}
						myPlayer.position = newPosition;
						document.getElementById(gameboard.positions[row][col].room + pos).src = "";
						socket.emit('newPosition', [gameboard.positions, row,  col, pos, name]);
					} else {
						msg = "Invalid move.";
					}
				}
			} else {
				alert(msg);
			}
		}
	}
}

function makeSuggestion() {
	suggestionModal.style.display = 'block';
    myPlayer.wasMoved = false;
	var currRoom = gameboard.getRoomName(myPlayer.position);
	room1.innerHTML = "<option value='" + currRoom + "'>" + currRoom + "</option>";
}

function getSuggestion() {
	var isvalid = [];
	suggestionModal.style.display = 'none';
	document.getElementById('suggestion').disabled = true;
    document.getElementById('accusation').disabled = true;
    myPlayer.hasSuggested = true;
    // Check if the suspect in the suggestion is inactive
	if (inactivePlayers[suspect1.value]) {
		var target = inactivePlayers[suspect1.value];
		isvalid = gameboard.checkPosition(room1.value, target.character);
		var row = isvalid[1][0];
		var col = isvalid[1][1];
		var pos = isvalid[1][2].toString();
		socket.emit('suggest', [{"suspect": suspect1.value, "weapon": weapon1.value, "room": room1.value, "board": gameboard.positions},
								row, col, pos]);
	} else if (suspect1.value !== myPlayer.character) { // Check if the suspect in the suggestion is another active player
		socket.emit('suggest', [{"suspect": suspect1.value, "weapon": weapon1.value, "room": room1.value}]);
	} else { // The suspect in the suggestion is the current player
		socket.emit('suggest', [{"suspect": suspect1.value, "weapon": weapon1.value, "room": room1.value, "board": gameboard.positions}])
	}
}

function prove() {
	document.getElementById('proveBtn').disabled = true;
	document.getElementById('proofModal').style.display = 'block';
	var html = "";
	for(var i = 0; i < currSuggestion.length; i++) {
		if (names.includes(currSuggestion[i])) {
			html += "<option value='" + currSuggestion[i] + "'>" + currSuggestion[i] + "</option>";
		}
	}
	document.getElementById('suggestionContent').innerHTML = html;
}

function getProof() {
	document.getElementById('proofModal').style.display = 'none'
	var proof = document.getElementById('suggestionContent').value;
	socket.emit('sendProof', proof);
}

function endTurn() {
    myPlayer.isTurn = false;
    document.getElementById('endTurnBtn').disabled = true;
    alert('Your turn has ended.');
    // Alert server to switch turn
    socket.emit('nextTurn');
}

function makeAccusation() {
    accusationModal.style.display = 'block';
    myPlayer.wasMoved = false;
}

function getAccusation() {
    accusationModal.style.display = 'none';
    document.getElementById('suggestion').disabled = true;
    document.getElementById('accusation').disabled = true;
    socket.emit('accuse', {"suspect": suspect2.value, "weapon": weapon2.value, "room": room2.value});
}

function populateDecks() {
    // Suspect Deck
    suspectDeck = new Deck();
    suspectDeck.add_card(new Card("Suspect", "Candy Floss Angel Ears"));
    suspectDeck.add_card(new Card("Suspect", "Cookie Rainbow Dancer"));
    suspectDeck.add_card(new Card("Suspect", "Sunny Cloverfield"));
    suspectDeck.add_card(new Card("Suspect", "Cupcake Sugarsocks"));
    suspectDeck.add_card(new Card("Suspect", "Jingles Fizzle Flanks"));
    suspectDeck.add_card(new Card("Suspect", "Princess Cloudburst"));

    // Weapon Deck
    weaponDeck = new Deck();
    weaponDeck.add_card(new Card("Weapon", "Frostbreath"));
    weaponDeck.add_card(new Card("Weapon", "Hoove"));
    weaponDeck.add_card(new Card("Weapon", "Rainbow Fart"));
    weaponDeck.add_card(new Card("Weapon", "Horn"));
    weaponDeck.add_card(new Card("Weapon", "Love"));
    weaponDeck.add_card(new Card("Weapon", "Laserbeam"));

    // Room Deck
    roomDeck = new Deck();
    roomDeck.add_card(new Card("Room", "Bathroom"));
    roomDeck.add_card(new Card("Room", "Napping Spot"));
    roomDeck.add_card(new Card("Room", "Treasure Room"));
    roomDeck.add_card(new Card("Room", "Garden Shed"));
    roomDeck.add_card(new Card("Room", "Rainbow Room"));
    roomDeck.add_card(new Card("Room", "Unicorn Cave"));
    roomDeck.add_card(new Card("Room", "Ice Cream Shop"));
    roomDeck.add_card(new Card("Room", "Stable"));
    roomDeck.add_card(new Card("Room", "Playroom"));
}

function endGame(){
    socket.emit("endGame", false);
}

function exitGame(){
    socket.emit("exitGame");
    resetPlayer();
    alert('You have left the match. Sending you home...');
    returnToMain();
}