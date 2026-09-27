import { Request, Response } from "express";

class AuthControllers {
  async signup(request: Request, response: Response) {
    try {
      const { email, password } = request.body;
    } catch (error) {}
  }
  async login() {}
}

export default new AuthControllers();
