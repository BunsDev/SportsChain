import { FaX } from "react-icons/fa6";
import { useEffect, useState } from "react";
const StandingsModal = ({ setShowModal }) => {
  const [standingsData, setStandingsData] = useState([]);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const res = await fetch("/api/standings");
        const standings = await res.json();
        console.log(standings);
      } catch (error) {
        console.error("Error fetching standings:", error);
      }
    };
    fetchStandings();
  }, []);
  return (
    <div className="text-white w-full h-full absolute top-0 right-0 bg-black bg-opacity-80">
      <p>StandingsModal</p>
      <FaX
        className="cursor-pointer absolute top-0 right-4"
        onClick={() => setShowModal(false)}
      />
    </div>
  );
};
export default StandingsModal;
