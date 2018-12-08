function Board(images) {
    this.images = images;
    this.positions = [
        [
            {"room": "bathroom", "characters": ["", "", "", "", "", ""]}, 
            {"room": "SH", "characters": [""]}, 
            {"room": "napping-spot", "characters": ["", "", "", "", "", ""]}, 
            {"room": "HL", "characters": ["Candy Floss Angel Ears"]}, 
            {"room": "treasure-room", "characters": ["", "", "", "", "", ""]}
        ],
        [
            {"room": "SL", "characters": ["Cookie Rainbow Dancer"]}, 
            {"room": null, "characters": []}, 
            {"room": "HB", "characters": [""]}, 
            {"room": null, "characters": []}, 
            {"room": "LD", "characters": ["Sunny Cloverfield"]}
        ],
        [
            {"room": "garden-shed", "characters": ["", "", "", "", "", ""]}, 
            {"room": "LB", "characters": [""]}, 
            {"room": "rainbow-room", "characters": ["", "", "", "", "", ""]}, 
            {"room": "BD", "characters": [""]}, 
            {"room": "unicorn-cave", "characters": ["", "", "", "", "", ""]}
        ],
        [
            {"room": "LC", "characters": ["Cupcake Sugarsocks"]}, 
            {"room": null, "characters": []}, 
            {"room": "BB", "characters": [""]}, 
            {"room": null, "characters": []}, 
            {"room": "DK", "characters": [""]}
        ],
        [
            {"room": "ice-cream-shop", "characters": ["", "", "", "", "", ""]}, 
            {"room": "CB", "characters": ["Jingles Fizzle Flanks"]}, 
            {"room": "stable", "characters": ["", "", "", "", "", ""]}, 
            {"room": "BK", "characters": ["Princess Cloudburst"]}, 
            {"room": "playroom", "characters": ["", "", "", "", "", ""]}
        ]
    ];
}

Board.prototype.findPosition = function(name) {
    for(var i = 0; i < this.positions.length; i++) {
        for(var j = 0; j < this.positions[i].length; j++) {
            var myarr = this.positions[i][j].characters;
            if (myarr.includes(name)) {
                return [i, j];
            }
        }
    }
};

Board.prototype.checkPosition = function(pos, name) {
    var oldPos = [];
    var row, col;
    if (Array.isArray(pos)) {
        row = pos[0];
        col = pos[1];
    }
    else {
        var newPos = this.getRoomPosition(pos);
        row = newPos[0];
        col = newPos[1];
    }
    if (row >= 0 && row < 5 && col >= 0 && col < 5
        && this.positions[row][col].room !== null) {
        for(var i = 0; i < this.positions.length; i++) {
            for(var j = 0; j < this.positions[i].length; j++) {
                var myarr = this.positions[i][j].characters;
                if(myarr.includes(name)) {
                    for(var k = 0; k < this.positions[row][col].characters.length; k++) {
                        if (this.positions[row][col].characters[k] === "") {
                            oldPos = [i, j];
                            oldPos.push(myarr.indexOf(name) + 1);
                            myarr.splice(myarr.indexOf(name), 1, '');
                            this.positions[row][col].characters[k] = name;
                            return [true, oldPos];
                        }
                    }
                    return [false, oldPos];
                }
            }
        }
    } else {
        return [false, oldPos];
    }
};

Board.prototype.getRoomPosition = function(name) {
    if (name === 'Bathroom') {
        return [0, 0];
    } else if (name === 'Napping Spot') {
        return [0, 2];
    } else if (name === 'Treasure Room') {
        return [0, 4];
    } else if (name === 'Garden Shed') {
        return [2, 0];
    } else if (name === 'Rainbow Room') {
        return [2, 2];
    } else if (name === 'Unicorn Cave') {
        return [2, 4];
    } else if (name === 'Ice Cream Shop') {
        return [4, 0];
    } else if (name === 'Stable') {
        return [4, 2];
    } else if (name === 'Playroom') {
        return [4, 4];
    } else if (name === 'SH') {
        return [0, 1];
    } else if (name === 'HL') {
        return [0, 3];
    } else if (name === 'SL') {
        return [1, 0];
    } else if (name === 'HB') {
        return [1, 2];
    } else if (name === 'LD') {
        return [1, 4];
    } else if (name === 'LB') {
        return [2, 1];
    } else if (name === 'BD') {
        return [2, 3];
    } else if (name === 'LC') {
        return [3, 0];
    } else if (name === 'BB') {
        return [3, 2];
    } else if (name === 'DK') {
        return [3, 4];
    } else if (name === 'CB') {
        return [4, 1];
    } else if (name === 'BK') {
        return [4, 3];
    }
};

Board.prototype.getRoomName = function(pos) {
    if (pos[0] === 0 && pos[1] === 0) {
        return 'Bathroom';
    } else if(pos[0] === 0 && pos[1] === 2) {
        return 'Napping Spot';
    } else if (pos[0] === 0 && pos[1] === 4) {
        return 'Treasure Room';
    } else if (pos[0] === 2 && pos[1] === 0) {
        return 'Garden Shed';
    } else if (pos[0] === 2 && pos[1] === 2) {
        return 'Rainbow Room';
    } else if (pos[0] === 2 && pos[1] === 4) {
        return 'Unicorn Cave';
    } else if (pos[0] === 4 && pos[1] === 0) {
        return 'Ice Cream Shop';
    } else if (pos[0] === 4 && pos[1] === 2) {
        return'Stable';
    } else if (pos[0] === 4 && pos[1] === 4) {
        return 'Playroom';
    } else {
        return 'Hallway';
    }
};

// Returns true if there is a secret passage
// at the position provided otherwise it returns false
Board.prototype.secretPassage = function(pos) {
    var row = pos[0];
    var col = pos[1];
    if ((row === 0 && col === 0) ||
        (row === 0 && col === 4) ||
        (row === 4 && col === 0) ||
        (row === 4 && col === 4)) {
        return true;
    } else {
        return false;
    }
};

Board.prototype.selectCharacter = function(name) {
    switch (name){
        case "Sunny Cloverfield":
            return this.images[1];
            break;
        case "Candy Floss Angel Ears":
            return this.images[0];
            break;
        case "Cookie Rainbow Dancer":
            return this.images[5];
            break;
        case "Cupcake Sugarsocks":
            return this.images[4];
            break;
        case "Jingles Fizzle Flanks":
            return this.images[3];
            break;
        case "Princess Cloudburst":
            return this.images[2];
            break;
    }
};

Board.prototype.placeCharacters = function() {
    var img;
    for (var i = 0; i < this.positions.length; i++) {
        for (var j = 0; j < this.positions[i].length; j++) {
            var temp = this.positions[i][j];
            if(temp.room != null) {
                for(var k = 0; k < temp.characters.length; k++) {
                    if (temp.characters[k] !== "") {
                        img = this.selectCharacter(temp.characters[k]);
                        document.getElementById(temp.room + (k + 1).toString()).src = img;
                    }
                }
            }
        }
    }
};

Board.prototype.clearBoard = function() {
    for(var i = 0; i < this.positions.length; i++) {
        for(var j = 0; j < this.positions[i].length; j++) {
            var temp = this.positions[i][j];
            if (temp.room != null) {
                for(var k = 0; k < temp.characters.length; k++) {
                    document.getElementById(temp.room + (k + 1).toString()).src = "";
                }
            }
        }
    }
};

Board.prototype.initializeBoard = function() {
    this.positions = [
        [
            {"room": "bathroom", "characters": ["", "", "", "", "", ""]}, 
            {"room": "SH", "characters": [""]}, 
            {"room": "napping-spot", "characters": ["", "", "", "", "", ""]}, 
            {"room": "HL", "characters": ["Candy Floss Angel Ears"]}, 
            {"room": "treasure-room", "characters": ["", "", "", "", "", ""]}
        ],
        [
            {"room": "SL", "characters": ["Cookie Rainbow Dancer"]}, 
            {"room": null, "characters": []}, 
            {"room": "HB", "characters": [""]}, 
            {"room": null, "characters": []}, 
            {"room": "LD", "characters": ["Sunny Cloverfield"]}
        ],
        [
            {"room": "garden-shed", "characters": ["", "", "", "", "", ""]}, 
            {"room": "LB", "characters": [""]}, 
            {"room": "rainbow-room", "characters": ["", "", "", "", "", ""]}, 
            {"room": "BD", "characters": [""]}, 
            {"room": "unicorn-cave", "characters": ["", "", "", "", "", ""]}
        ],
        [
            {"room": "LC", "characters": ["Cupcake Sugarsocks"]}, 
            {"room": null, "characters": []}, 
            {"room": "BB", "characters": [""]}, 
            {"room": null, "characters": []}, 
            {"room": "DK", "characters": [""]}
        ],
        [
            {"room": "ice-cream-shop", "characters": ["", "", "", "", "", ""]}, 
            {"room": "CB", "characters": ["Jingles Fizzle Flanks"]}, 
            {"room": "stable", "characters": ["", "", "", "", "", ""]}, 
            {"room": "BK", "characters": ["Princess Cloudburst"]}, 
            {"room": "playroom", "characters": ["", "", "", "", "", ""]}
        ]
    ];
};