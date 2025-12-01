const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app"); // app.js already connects to DB
const api = supertest(app);
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

// Clean the users collection before each test
beforeEach(async () => {
  await User.deleteMany({});
});

const LOGIN_USER_CREDENTIALS = {
    name: "Leo",
    email: "login@example.com",
    password: "R3g5T7#gh",
    phone_number: "09-123-47890",
    gender: "male",
    date_of_birth: "1999-01-01",
    membership_status: "Active",
  };


describe("while using the User API routes", () => {
  describe("when a POST request is made to /api/users/signup", () => {

    it("should signup a new user with valid credentials", async () => {
      const userData = {
        name: "Valid",
        email: "valid@example.com",
        password: "R3g5T7#gh",
        phone_number: "09-123-47890",
        gender: "male",
        date_of_birth: "1999-01-01",
        membership_status: "Active",
      };

      const result = await api.post("/api/users/signup").send(userData);

      expect(result.status).toBe(201);
      expect(result.body).toHaveProperty("token");

      // Extra check: user is actually saved in DB
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).not.toBeNull();
    });

    it("should return an error when password is too short", async () => {
        const userData = {
          name: "Invalid",
          email: "invalid@example.com",
          password: "short", // too short, fails validation
          phone_number: "1234567890",
          gender: "female",
          date_of_birth: "1990-01-01",
          membership_status: "Active",
        };

        const result = await api.post("/api/users/signup").send(userData);

        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
      });
    });

    it("should return an error when email is invalid", async () => {
        const userData = {
          name: "Invalid",
          email: "invalid.example.com", //invalid email format
          password: "Shor@t123",
          phone_number: "1234567890",
          gender: "female",
          date_of_birth: "1990-01-01",
          membership_status: "Active",
        };

        const result = await api.post("/api/users/signup").send(userData);

        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
      });

      it("should return an error when email is missing", async () => {
        const userData = {
          name: "Invalid",
          email: "", //missing email
          password: "Shor@t123",
          phone_number: "1234567890",
          gender: "female",
          date_of_birth: "1990-01-01",
          membership_status: "Active",
        };

        const result = await api.post("/api/users/signup").send(userData);

        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
      });

      it("should return an error when email is duplicated", async () => {
        const duplicateEmail = "duplicate@example.com";
        const userData = {
          ...LOGIN_USER_CREDENTIALS,
          email: duplicateEmail,
          name: "First Signup",
        };

        await api.post("/api/users/signup").send(userData).expect(201);

        const duplicateData = {
            ...userData,
            name: "Second Signup",
        };
        const result = await api.post("/api/users/signup").send(duplicateData);


        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
        expect(result.body.error).toContain("User already exist")
      });
    });


  describe("when a POST request is made to /api/users/login", () => {

    beforeEach(async () => {
        await api.post("/api/users/signup").send(LOGIN_USER_CREDENTIALS).expect(201);
      });

    it("should login a user with valid credentials", async () => {
      // Then login
      const result = await api.post("/api/users/login").send({
        email: LOGIN_USER_CREDENTIALS.email,
        password: LOGIN_USER_CREDENTIALS.password,
      });

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty("token");
    });

    it("should return an error with invalid email", async () => {
        const result = await api.post("/api/users/login").send({
          email: "login.example.com",
          password: "R3g5T7#gh",
        });

        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
      });

    it("should return an error with missing email or password", async () => {
        const result = await api.post("/api/users/login").send({
          email: "",
          password: LOGIN_USER_CREDENTIALS.password,
        });

        expect(result.status).toBe(400);
        expect(result.body).toHaveProperty("error");
      });


    it("should return an error with wrong password", async () => {
      const result = await api.post("/api/users/login").send({
        email: "login@example.com",
        password: "wrongpassword",
      });

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty("error");
    });



    it("should login a user with valid credentials and return a valid JWT", async () => {
        const result = await api.post("/api/users/login").send({
            email: LOGIN_USER_CREDENTIALS.email,
            password: LOGIN_USER_CREDENTIALS.password,
        });

        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty("token");

        const token = result.body.token;

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET);
        } catch (err) {
            decoded = null;
        }

        expect(decoded).not.toBeNull();
        expect(decoded).toHaveProperty("_id"); //
    });
});


// Close DB connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});
