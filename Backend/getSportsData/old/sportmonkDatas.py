
import requests

API_TOKEN = 'bFmPEsWn6EQXYkEyy1zfuTi3WhQWD2dKcoxeKyhhb5Ya1TqzCDQuSAbKSkkM'

LEAGUE_ID = 271  # Danish Superliga ID
SEASON_ID = 21644  # Current season ID
TEAM_IDS = {
    'FC Copenhagen': 85,
    'Midtjylland': 939,
    'Brøndby': 293,
    'AGF': 2905,
    'Randers': 2356,
    'Hvidovre': 8657,
    'Nordsjælland': 2394,
    'Vejle': 7466, 
    'Lyngby': 2650
}


def fetch_match_results(start_date, end_date, team_id):
    """
    start date (string): start date of the analysed macthes
    end_date (string): end date of the analysed macthes
    team_IDs (dict): Sportmonk ID of the analysed team
    """
    response = requests.get(
        f'https://api.sportmonks.com/v3/football/fixtures/between/{start_date}/{end_date}/{team_id}', #sort by date 
        params={'api_token': API_TOKEN,'sort': 'starting_at','order': 'desc'}
    )
    return response.json()

def fetch_odds(fixture_id):
    """
    fixture_id (string): Sportmonk ID of the analysed match
    """
    response = requests.get(
        f'https://api.sportmonks.com/v3/football/odds/pre-match/fixtures/{fixture_id}',
        params={'api_token': API_TOKEN}
    )
    return response.json()

def fetch_player_statistics(team_id):
    """
    team_id (string): Sportmonk ID of the analysed team
    """
    response = requests.get(
        f'https://api.sportmonks.com/v3/football/players/team/{team_id}',
        params={'api_token': API_TOKEN, 'include': 'stats'}
    )
    return response.json()

def get_winner_loser(match):
    """
    match (dict): All datas corresponding to the analysed match through the fixture API request
    """
    teams = match['name']
    result_info = match['result_info']

    # Assuming result_info format: "FC Copenhagen won after full-time."
    winner = None
    loser = None
    draw = False
    if 'vs' in teams:
        team1, team2 = teams.split(' vs ')
        if result_info is None:
            print(f"Match {match['id']} result not yet received")
        elif 'won' in result_info:
            winner = result_info.split(' won')[0].strip()
            loser = team1 if winner != team1 else team2
        elif 'draw' in result_info:
            winner = team1
            loser = team2
            draw = True
        else:
            print("Error Match result")
    else:
        print("No match")
    return winner, loser, draw

def filter_odds(odds_data):
    """
    odds_data (dict): All pre-match odds data for the analysed match through the pre-match odds API request
    """
    relevant_odds = {
        'home_win': None,
        'away_win': None,
        'draw': None,
        'home_lose': None,
        'away_lose': None
    }

    if 'data' in odds_data:
        for bookmaker in odds_data['data']:
            market_description = bookmaker.get('market_description', '').lower()
            label = bookmaker.get('label', '').lower()
            
            if 'match winner' in market_description:
                if label == 'home':
                    relevant_odds['home_win'] = bookmaker['value']
                    relevant_odds['away_lose'] = bookmaker['value']  # away lose is same as home win
                elif label == 'away':
                    relevant_odds['away_win'] = bookmaker['value']
                    relevant_odds['home_lose'] = bookmaker['value']  # home lose is same as away win
                elif label == 'draw':
                    relevant_odds['draw'] = bookmaker['value']

    return relevant_odds

#maximum 100 days
start_date = '2024-05-07'
end_date = '2024-05-15'

def Result_summury(start_date, end_date, team_IDs):
    """
    start date (string): start date of the analysed macthes
    end_date (string): end date of the analysed macthes
    team_IDs (dict): Table of analysed team matches and their corresponding Sportmonk IDs
    """
    for team_name, team_id in team_IDs.items():
        print(f"Processing team: {team_name} (ID: {team_id})")
        match_results = fetch_match_results(start_date, end_date, team_id)
        
        if 'data' in match_results:
            for match_result in match_results['data']:
                match_result_id = match_result['id']
                winner, loser, draw = get_winner_loser(match_result)
                if winner is None:
                    continue
                
                odds_data = fetch_odds(match_result_id)
                match_odds = filter_odds(odds_data)
                if draw:
                    print(f'{team_name} Match Result: {winner} ended in a draw against {loser}, Odds: {match_odds}')
                else: 
                    if winner == team_name:
                        print(f'{team_name} Match Result: {winner} won against {loser}, Odds: {match_odds}')
                    elif loser == team_name:
                        print(f'{team_name} Match Result: {loser} lost against {winner}, Odds: {match_odds}')
                    else:
                        print(f"Failed to fetch match results for {team_name}")
        else:
            print(f"Failed to fetch match results for {team_name}")

Result_summury(start_date, end_date, TEAM_IDS)

'''
# Fetch player statistics
for team_name, team_id in TEAM_IDS.items():
    players = fetch_player_statistics(team_id)
    
    if 'data' in players:
        for player in players['data']:
            player_id = player['id']
            player_stats_response = requests.get(
                f'https://api.sportmonks.com/v3/football/players/{player_id}',
                params={'api_token': API_TOKEN, 'include': 'stats'}
            )
            player_stats = player_stats_response.json()
            print(f'{team_name} Player Stats: {player_stats}')
    else:
        print(f"Failed to fetch player statistics for {team_name}")
'''