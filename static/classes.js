class Boggle {
    constructor() {
        this.score = 0;
        this.secondsRemaining = 60;
        this.countdown = this.countdown.bind(this)
        this.handleGuess = this.handleGuess.bind(this)
    }

    static startGame() {
        const newGame = new Boggle();
        newGame.timer = setInterval(newGame.countdown, 1000)
        return newGame
    }

    async countdown() {
        if (this.secondsRemaining === 1) {
            await this.endGame()
        } else {
            this.secondsRemaining -= 1;
            $('#timer').text(`Time remaining: ${this.secondsRemaining} seconds`)
        }
    }

    async handleGuess(evt) {
        evt.preventDefault()
        //Only execute the following code if there's time left in the game!
        if (this.secondsRemaining > 0){
            const guessWord = $('#guess').val();

            //Do nothing if the guess is an empty string
            if (guessWord === '') {
                return
            }

            //Make a guess based on the word that was entered
            const guess = await Guess.makeGuess(guessWord)

            //Show the result on-screen
            $('#result').text(this.getResultText(guess));

            //Give the user points if they made a valid guess
            this.updateScore(guess);

            //Clear the guessing field
            $('#guess').val('');
        }
    }

    getResultText({word, result}) {
        switch (result) {
            case 'ok':
                return `Nice work, ${word} is on the board. ${word.length} points added.`;
            case 'not-on-board':
                return 'Sorry, that word is not on this board.';
            case 'not-word':
                return 'Invalid word.'
            case 'played-word':
                return 'That word has already been played.'
        }
    }

    updateScore({word, result}) {
        if (result === 'ok') {
            this.score += word.length;
            $('#score').text(this.score);
        }
    }

    /**
     * Clean up the game - show the final score, 
     * post the score data and update the high score.
     */
    async endGame() {
        clearInterval(this.timer)
        $('#timer').text(`Time's up! Final score is ${this.score}.`)
        const scoreData = await serverMethods.postScore(this.score)
        this.updateHighScore(scoreData)
    }

    updateHighScore({newHighScore}) {
        if (newHighScore) {
            $('#score').append('<span id="new-high">New high score!</span>')
        }
    }

}

class Guess {
    constructor(guessWord, result) {
        this.word = guessWord;
        this.result = result;
    }

    static async makeGuess(guessWord) {
        const result = await serverMethods.getGuessResult(guessWord);
        return new Guess(guessWord, result);
    }
}

const serverMethods = {

    async postScore(score) {
        const response = await axios.post('/game-stats', {score})
        return response.data
    },

    async getGuessResult(guess) {
        const response = await axios.get('/guess', {params: {guess}});
        return response.data.result;
    }

}