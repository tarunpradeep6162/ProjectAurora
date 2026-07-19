import ShootingStar from "./ShootingStar";

function ShootingStars() {
  return (
    <>
      <ShootingStar top="15%" left="10%" delay={0} />
      <ShootingStar top="30%" left="60%" delay={2} />
      <ShootingStar top="50%" left="20%" delay={4} />
      <ShootingStar top="70%" left="80%" delay={6} />
    </>
  );
}

export default ShootingStars;
