$(function() {
    const boggle = new Boggle()
    $('#guess-form').on('submit', boggle.handleGuess);
});