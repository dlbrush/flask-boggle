$(function() {
    let score = 0;

    let secondsRemaining = 60;
    let gameOver = false;

    const timer = setInterval(async function(){
        if (secondsRemaining === 0) {
            clearInterval(timer)
            gameOver = true;
            $('#timer').text(`Time's up! Final score is ${score}.`)
            const scoreData = await postScore()
            updateHighScore(scoreData)
        } else {
            secondsRemaining--;
            $('#timer').text(`Time remaining: ${secondsRemaining} seconds`)
        }
    }, 1000)

    async function makeGuess(evt) {
        evt.preventDefault()
        //Only execute the following code if there's time left in the game!
        if (!gameOver){
            const guess = $('#guess').val();

            //Do nothing if the guess is an empty string
            if (guess === '') {
                return
            }

            const result = await getResult(guess);
            $('#result').text(getResultText(result, guess));

            updateScore(guess, result);

            $('#guess').val('');
        }
    }
    
    async function getResult(guess) {
        const response = await axios.get('/guess', {params: {guess}});
        return response.data.result;
    }
    
    function getResultText(result, guess) {
        switch (result) {
            case 'ok':
                return `Nice work, ${guess} is on the board. ${guess.length} points added.`;
            case 'not-on-board':
                return 'Sorry, that word is not on this board.';
            case 'not-word':
                return 'Invalid word.'
        }
    }

    function updateScore(guess, result) {
        if (result === 'ok') {
            score += guess.length;
            $('#score').text(score);
        }
    }

    async function postScore() {
        const response = await axios.post('/game-stats', {score})
        return response.data
    }

    function updateHighScore({newHighScore}) {
        if (newHighScore) {
            $('#score').append('<span id="new-high">New high score!</span>')
        }
    }
    
    $('#guess-form').on('submit', makeGuess);
})

