import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secreto_temporal_nova_setup", {
    expiresIn: "30d",
  });
};

export default generateToken;
