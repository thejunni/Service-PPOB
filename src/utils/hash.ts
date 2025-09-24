import bcrypt from "bcryptjs";

export const hashPassword = async (password: string, rounds: number) => {
  return await bcrypt.hash(password, rounds);
};

export const comparePassword = async (plain: string, hashed: string) => {
  return await bcrypt.compare(plain, hashed);
};
