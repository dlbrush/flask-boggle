from boggle import Boggle
from flask import Flask, render_template, session, request, jsonify
from flask_debugtoolbar import DebugToolbarExtension

app = Flask(__name__)

app.config['SECRET_KEY'] = 'boggle789'
debug = DebugToolbarExtension(app)

boggle_game = Boggle()

@app.route('/')
def show_game():
    "Show the game board, the form for making guesses, and the stored high score. High score defaults to 0 if there isn't one."
    board = boggle_game.make_board()
    session['board'] = board
    high_score = session.get('high_score', 0)
    return render_template('index.html', board=board, high_score=high_score)

@app.route('/guess')
def validate_guess():
    "Check the user's submitted guess (passed as a client string) and return JSON with the result of their guess."
    guess = request.args['guess']
    result = boggle_game.check_valid_word(session['board'], guess)
    response = {'result': result}
    return jsonify(response)

@app.route('/game-stats', methods=["POST"])
def update_stats():
    """
    Increments the number of games this user has played.
    Check if the score is a new high score.
    Return JSON that passes back data about the high score.
    """
    games_played = session.get('games_played', 0) + 1
    session['games_played'] = games_played

    score = request.json['score']

    response = {'newHighScore': check_high_score(score)}
    return jsonify(response)

def check_high_score(score):
    "Returns true and updates the high score if the score passed is higher than the stored high score. Otherwise returns false."
    if score > session.get('high_score', 0):
        session['high_score'] = score
        return True
    else:
        return False