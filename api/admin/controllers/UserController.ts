import { AdminClient } from "db/models"
import { MyRequestHandler } from "types"

export class UserController {
  static read: MyRequestHandler = async (req, res) => {
    res.json(req.user)
  }

  static update: MyRequestHandler = async (req, res) => {
    delete req.body._id

    console.log(req.body)

    const user = await AdminClient.findByIdAndUpdate(req.user._id, req.body)

    console.log(user)

    res.json(user)
  }
}
