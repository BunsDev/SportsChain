"use client";
import { useState, useEffect } from "react";
import Team from "../components/Team";
const Teams = () => {
  const [teamsData, setTeamsData] = useState([]);
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("/api/teams");
        const teams = await res.json();
        setTeamsData(teams.data);
      } catch (error) {}
    };
    fetchTeams();
  }, []);

  return (
    <div className="flex flex-wrap">
      {teamsData.map(team => (
        <Team key={team.id} team={team} />
      ))}
    </div>
  );
};
export default Teams;
