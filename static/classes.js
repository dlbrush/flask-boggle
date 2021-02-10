/**
 * Boggle class tracks the score and status of the game.
 * Making a new instance of Boggle starts a new game and starts the 60 second timer.
 */
class Boggle {
    constructor() {
        this.score = 0;
        this.handleGuess = this.handleGuess.bind(this)
        this.secondsRemaining = 60;
        this.countdown = this.countdown.bind(this)
        this.timer = setInterval(this.countdown, 1000)
    }

    /**
     * Countdown is the method passed to setInterval when we start a game.
     * We end the game when this function runs with secondsRemaining === 1
     * because the number 1 will be on-screen for a full second before this function is called
     * again - so when this function is called again, that's 0!
     * Otherwise, this function decrements secondsremaining by 1 and updates the onscreen timer.
     */
    async countdown() {
        if (this.secondsRemaining === 1) {
            await this.endGame()
        } else {
            this.secondsRemaining -= 1;
            $('#timer').text(`Time remaining: ${this.secondsRemaining} seconds`)
        }
    }

    /**
     * Event handler for when the user submits the guess form.
     * Gets the value of the guess, makes a Guess instance from it
     * and updates score and display as needed.
     */
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
            $('#result').text(guess.resultText);

            //Give the user points if they made a valid guess
            this.updateScore(guess);

            //Clear the guessing field
            $('#guess').val('');
        }
    }

    /**
     * Update score based on the result of the guess
     * If the guess was valid, user gets points equal to the length of the word.
     * This function should be passed an instance of Guess.
     */
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
        const scoreData = await this.postScore()
        this.updateHighScore(scoreData)
    }

    /**
     * Post the user's final score to the server.
     * Returns response data telling us if this score was a new high score.
     * That object looks like this: {newHighScore: (true/false)}
     */
    async postScore() {
        const response = await axios.post('/game-stats', {score: this.score})
        return response.data
    }

    /**
     * Updates the on-screen high score if the server responds to postScore with
     * {newHighScore: true}.
     * This function should be passed the response data from postScore.
     */
    updateHighScore({newHighScore}) {
        if (newHighScore) {
            $('#score').append('<span id="new-high">New high score!</span>')
        }
    }

}

/**
 * Guess class stores information about a given guess based on the word passed.
 * Guess instances should be initialized via makeGuess so that
 * we can get the result of the guess from the server asynchronously.
 */
class Guess {
    constructor(guessWord, result) {
        this.word = guessWord;
        this.result = result;
        this.resultText = this.getResultText()
    }

    /**
     * Initialize a guess based on a single word.
     * Gets the result text from the server and makes a new instance of guess.
     */
    static async makeGuess(guessWord) {
        const result = await Guess.getGuessResult(guessWord);
        return new Guess(guessWord, result);
    }

    /**
     * Gets the result text for the guess from the server and returns it.
     * Result text can be 'ok', 'not-word', or 'not-on-board'
     */
    static async getGuessResult(guessWord) {
        const response = await axios.get('/guess', {params: {guess: guessWord}});
        return response.data.result;
    }

    /**
     * Returns a string based on the result of the guess.
     * This string is displayed on-screen after the guess is processed by the server.
     */
    getResultText() {
        switch (this.result) {
            case 'ok':
                return `Nice work, ${this.word} is on the board. ${this.word.length} points added.`;
            case 'not-on-board':
                return 'Sorry, that word is not on this board.';
            case 'not-word':
                return 'Invalid word.'
            case 'played-word':
                return 'That word has already been played.'
        }
    }
}