'''
Fetch Team IDs :
GET /v3/football/teams/seasons/{season_id}?api_token=YOUR_API_TOKEN
https://api.sportmonks.com/v3/football/teams/seasons/{season_id}?api_token=YOUR_API_TOKEN

Fetch Match Results :
GET /v3/football/fixtures/between/{start_date}/{end_date}?api_token=YOUR_API_TOKEN&team_ids={team_id}
https://api.sportmonks.com/v3/football/fixtures/between/{start_date}/{end_date}?api_token=YOUR_API_TOKEN&team_ids={team_id}

Fetch Odds :
GET /v3/football/odds/fixture/{fixture_id}?api_token=YOUR_API_TOKEN
https://api.sportmonks.com/v3/football/odds/fixture/{fixture_id}?api_token=YOUR_API_TOKEN


Fetch Player Statistics : 
GET /v3/football/players/{player_id}?api_token=YOUR_API_TOKEN&include=stats
https://api.sportmonks.com/v3/football/players/{player_id}?api_token=YOUR_API_TOKEN&include=stats
'''

import requests

API_TOKEN = 'API_TOKEN'
TEAM_IDS = {
    'PSG': 85,
    'Monaco': 72,
    'Brest': 91,
    'LOSC': 79,
    'Nice': 84,
    'Lens': 77,
    'Lyon': 89,
    'Rennes': 94,
    'Marseille': 81
}

def fetch_match_results(start_date, end_date, team_id):
    response = requests.get(
        f'https://api.sportmonks.com/v3/football/fixtures/between/{start_date}/{end_date}',
        params={'api_token': API_TOKEN, 'team_ids': team_id}
    )
    return response.json()

def fetch_odds(fixture_id):
    response = requests.get(
        f'https://api.sportmonks.com/v3/football/odds/fixture/{fixture_id}',
        params={'api_token': API_TOKEN}
    )
    return response.json()

def fetch_player_statistics(team_id):
    response = requests.get(
        f'https://api.sportmonks.com/v3/football/players/team/{team_id}',
        params={'api_token': API_TOKEN, 'include': 'stats'}
    )
    return response.json()

# Fetch match results and odds
start_date = '2023-08-11'
end_date = '2024-05-19'

for team_name, team_id in TEAM_IDS.items():
    match_results = fetch_match_results(start_date, end_date, team_id)
    
    if 'data' in match_results:
        for match_result in match_results['data']:
            match_result_id = match_result['id']
            
            odds = fetch_odds(match_result_id)
            
            # Process match results and odds
            result = match_result['scores']['ft_score']
            match_odds = odds.get('data', [])

            print(f'{team_name} Match Result: {result}, Odds: {match_odds}')
    else:
        print(f"Failed to fetch match results for {team_name}")

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