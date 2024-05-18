"use client";
import { useState, useEffect } from "react";
import Team from "../components/Team";
import StandingsModal from "../components/StandingsModal";

const Teams = () => {
  const [teamsData, setTeamsData] = useState([]);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch("/api/teams");
        const teams = await res.json();
        setTeamsData(teams.data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, []);

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-6 mx-auto w-11/12 my-6 items-center justify-center">
        <h1 className="text-white text-center text-4xl  ">
          Danish Super League Teams
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-white  py-1 px-3 rounded-md"
        >
          Get Standings
        </button>
      </div>
      <div className="flex flex-wrap gap-6 mx-auto w-11/12">
        {teamsData.map(team => (
          <Team key={team.id} team={team} />
        ))}
      </div>
      {showModal && <StandingsModal setShowModal={setShowModal} />}
    </div>
  );
};
export default Teams;
