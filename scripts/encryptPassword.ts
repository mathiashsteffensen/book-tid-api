import bcrypt from 'bcrypt';

let encryptPassword = async (password: string) =>
{
    let saltRounds = 12
    let salt = await bcrypt.genSalt(saltRounds)
    let hash = await bcrypt.hash(password, salt)
    console.log(hash)
}

encryptPassword(process.argv[2])