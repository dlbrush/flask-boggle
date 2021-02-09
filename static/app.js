$(function() {
    const boggle = Boggle.startGame()
    $('#guess-form').on('submit', boggle.handleGuess);
});