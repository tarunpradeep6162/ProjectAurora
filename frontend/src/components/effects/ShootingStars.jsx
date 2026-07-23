import ShootingStar from "./ShootingStar";

const desktopStars = [
  {
    top: "7%",
    left: "-8%",
    delay: 1.4,
    duration: 1.9,
    repeatDelay: 11,
    distanceX: 920,
    distanceY: 430,
    trailLength: 185,
    rotation: 27,
    scale: 1,
    showHeart: true,
  },
  {
    top: "25%",
    left: "22%",
    delay: 7.8,
    duration: 1.55,
    repeatDelay: 14,
    distanceX: 780,
    distanceY: 340,
    trailLength: 140,
    rotation: 24,
    scale: 0.78,
    showHeart: false,
  },
  {
    top: "46%",
    left: "-12%",
    delay: 13.6,
    duration: 2.15,
    repeatDelay: 17,
    distanceX: 1050,
    distanceY: 470,
    trailLength: 205,
    rotation: 25,
    scale: 1.08,
    showHeart: true,
  },
  {
    top: "68%",
    left: "42%",
    delay: 19.2,
    duration: 1.65,
    repeatDelay: 16,
    distanceX: 730,
    distanceY: 310,
    trailLength: 135,
    rotation: 22,
    scale: 0.72,
    showHeart: false,
  },
];

const mobileStars = [
  {
    top: "12%",
    left: "-25%",
    delay: 2,
    duration: 1.65,
    repeatDelay: 13,
    distanceX: 610,
    distanceY: 290,
    trailLength: 125,
    rotation: 27,
    scale: 0.8,
    showHeart: true,
  },
  {
    top: "54%",
    left: "-20%",
    delay: 10.5,
    duration: 1.8,
    repeatDelay: 18,
    distanceX: 660,
    distanceY: 305,
    trailLength: 110,
    rotation: 25,
    scale: 0.7,
    showHeart: false,
  },
];

function ShootingStars({
  isMobile = false,
  motionEnabled = true,
  qualityLevel = "high",
}) {
  if (
    !motionEnabled ||
    qualityLevel === "reduced"
  ) {
    return null;
  }

  const stars =
    isMobile || qualityLevel === "low"
      ? mobileStars
      : desktopStars;

  return (
    <div
      className="
        fixed
        inset-0
        z-[1]
        overflow-hidden
        pointer-events-none
      "
      aria-hidden="true"
    >
      {stars.map((star, index) => (
        <ShootingStar
          key={`${star.top}-${star.delay}-${index}`}
          {...star}
        />
      ))}
    </div>
  );
}

export default ShootingStars;
