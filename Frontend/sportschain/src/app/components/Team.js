import Image from "next/image";
const Team = ({ team }) => {
  console.log(team.statistics);
  return (
    <div>
      <Image src={team.image_path} width={250} height={250} priority={true} />
    </div>
  );
};
export default Team;
