import bcrypt from "bcrypt";

const encryptPassword = async (password: string) => {
  const saltRounds = 12;
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  console.log(hash);
};

encryptPassword(process.argv[2]);
