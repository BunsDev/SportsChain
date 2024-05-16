import Image from "next/image";
const Team = ({ team }) => {
  const { statistics } = team;
  console.log(team);
  const draws = statistics[0].details.find(detail => detail.type.id === 215);
  const wins = statistics[0].details.find(detail => detail.type.id === 214);
  const losts = statistics[0].details.find(detail => detail.type.id === 216);

  return (
    <div className="bg-white p-2 flex flex-col  items-center">
      <Image src={team.image_path} width={200} height={200} priority={true} />
      <h2 className="my-2 font-semibold text-xl text-center">{team.name}</h2>
      <div>
        <span>D: {draws.value.all.count} </span>
        <span className="text-orange-600">
          L: {losts.value.all.count} {"  "}
        </span>
        <span className="text-green-500">W: {wins.value.all.count}</span>
      </div>
      <div className="flex gap-x-6">
        <button className="mt-4 bg-green-500 text-white py-1 px-3 rounded-md">
          BUY
        </button>
        <div>
          <button className="mt-4 bg-red-500 text-white py-1 px-3 rounded-md">
            SELL
          </button>
        </div>
      </div>
    </div>
  );
};
export default Team;
