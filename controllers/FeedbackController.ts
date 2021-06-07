import { BadRequestError, MyRequestHandler } from "../types";

import { Feedback } from "../db/models";

import { __DEV__ } from "../constants";

export default class FeedbackController {
  static create: MyRequestHandler = async (req, res) => {
    const {
      name,
      email,
      text,
    }: {
      name: string;
      email: string;
      text: string;
    } = req.body;

    console.log(name, email, text);

    if (!name || !email || !text)
      throw new BadRequestError(
        "Udfyld venligst alle felter",
        "",
        true,
        __DEV__
          ? "http://localhost:3000/feedback"
          : "https://admin.booktid.net/feedback"
      );

    await Feedback.create({
      name,
      email,
      text,
    });

    res.redirect(
      `${
        __DEV__
          ? "http://localhost:3000/feedback"
          : "https://admin.booktid.net/feedback"
      }?success=Tak for din feedback`
    );
  };
}
