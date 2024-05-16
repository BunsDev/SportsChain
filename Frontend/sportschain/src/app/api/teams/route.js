// GET/api/teams
export async function GET() {
  try {
    const res = await fetch(
      `https://api.sportmonks.com/v3/football/teams/seasons/21644?api_token=${process.env.SPORTMONK_API_TOKEN}&include=statistics.details.type`
    );
    const teamsData = await res.json();
    console.log(teamsData);
    return new Response(JSON.stringify(teamsData), { status: 200 });
  } catch (error) {}
}
