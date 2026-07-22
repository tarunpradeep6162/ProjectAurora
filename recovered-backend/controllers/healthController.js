export const getHealth = (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend server is active and glowing with cinematic love! ❤️",
    timestamp: new Date().toISOString(),
  });
};

export const getHome = (req, res) => {
  res.json({
    success: true,
    message: "Birthday Website Backend API 🚀",
  });
};
