from unittest import TestCase
from app import app, check_high_score
from flask import session, json
from boggle import Boggle

app.config['TESTING'] = True
app.config['DEBUG_TB_HOSTS'] = ['dont-show-debug-toolbar']


class FlaskTests(TestCase):

    def test_show_game(self):
        """
        Tests that we get a successful response at the '/' route.
        Also checks that high score is 0 initally, and the same as the session when we have a high score stored there.
        """
        with app.test_client() as client:
            # First test with no previous high score
            response1 = client.get('/')
            html1 = response1.get_data(as_text=True)
            self.assertEqual(response1.status_code, 200)
            self.assertIn('High score: <span id="high-score">0</span>', html1)

            # Then, test with stored high score
            with client.session_transaction() as change_session:
                change_session['high_score'] = 20
            response2 = client.get('/')
            html2 = response2.get_data(as_text=True)
            self.assertIn('High score: <span id="high-score">20</span>', html2)

    def test_validation(self):
        """
        Tests that we get the expected JSON response given the query string passed to /guess.
        Uses a mock board since we can't know which words will be valid on a random board.
        """
        mock_board = [
            ['H', 'E', 'L', 'L', 'O'],
            ['H', 'E', 'L', 'L', 'O'],
            ['H', 'E', 'L', 'L', 'O'],
            ['H', 'E', 'L', 'L', 'O'],
            ['H', 'E', 'L', 'L', 'O']
        ]
        with app.test_client() as client:
            with client.session_transaction() as change_session:
                change_session['board'] = mock_board
            
            #Check valid guess "hello"
            response1 = client.get('/guess?guess=hello')
            json1 = json.loads(response1.get_data(as_text=True))
            self.assertEqual(response1.status_code, 200)
            self.assertEqual(response1.content_type, 'application/json')
            self.assertEqual(json1, {"result": "ok"})

            #Check valid word not on board "the"
            response2 = client.get('/guess?guess=the')
            json2 = json.loads(response2.get_data(as_text=True))
            self.assertEqual(response2.status_code, 200)
            self.assertEqual(response2.content_type, 'application/json')
            self.assertEqual(json2, {"result": "not-on-board"})

            #Check invalid word
            response3 = client.get('/guess?guess=asdfg')
            json3 = json.loads(response3.get_data(as_text=True))
            self.assertEqual(response3.status_code, 200)
            self.assertEqual(response3.content_type, 'application/json')
            self.assertEqual(json3, {"result": "not-word"})

    def test_stats(self):
        """
        Test that the update_stats view function is incrementing the saved 
        number of games played and returning JSON
        """
        with app.test_client() as client:
            #First check that we save 1 game played if there are no existing games saved in the session.
            response1 = client.post('/game-stats', json={'score': 20})
            self.assertEqual(response1.status_code, 200)
            self.assertEqual(response1.content_type, 'application/json')
            self.assertEqual(session['games_played'], 1)

            #Next set a number of games played in the session and check that this function increments it
            with client.session_transaction() as change_session:
                change_session['games_played'] = 10
            response2 = client.post('/game-stats', json={'score': 25})
            self.assertEqual(response2.status_code, 200)
            self.assertEqual(response2.content_type, 'application/json')
            self.assertEqual(session['games_played'], 11)
    
    def test_high_score(self):
        """
        In the context of an HTTP request, runs 3 tests for the high score:
        1. Returns true and saves our score when we have no saved score and we pass a score > 0
        2. Returns true and saves a new high score when we have a saved score and we pass a higher score
        3. Returns false when we have a saved score and we pass a lower score
        """
        with app.test_request_context('/'):
            self.assertTrue(check_high_score(10))
            self.assertEqual(session['high_score'], 10)

            self.assertTrue(check_high_score(25))
            self.assertEqual(session['high_score'], 25)

            self.assertFalse(check_high_score(5))
            self.assertEqual(session['high_score'], 25)