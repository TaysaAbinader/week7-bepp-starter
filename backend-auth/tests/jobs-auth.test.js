const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app"); // Express app (already connects to DB)
const api = supertest(app);
const Job = require("../models/jobModel");
const User = require("../models/userModel");

// Seed data
const jobs = [
  {
    title: "Software Developer",
    type: "Full-time",
    description: "C++ Senior Developer",
    company: {name: "HelloWorld", contactEmail: "helloworld@world.com", contactPhone: "0451203698"},
  },
  {
    title: "Accountant",
    type: "Part-time",
    description: "Financial Department of Small Company",
    company: {name: "MyMoney", contactEmail: "mymoney@money.com", contactPhone: "1258692741"},
  },
];

let token = null;

// Create a user and get a token before all tests
beforeAll(async () => {
  await User.deleteMany({});
  const res = await api.post("/api/users/signup").send({
    name: "John Doe",
    email: "john@example.com",
    password: "R3g5T7#gh",
    phone_number: "1234567890",
    gender: "Male",
    date_of_birth: "1990-01-01",
    membership_status: "Inactive",
  });
  expect(res.body).toHaveProperty("token");
  token = res.body.token;
});

beforeEach(async () => {
  await Job.deleteMany({});
const user = await User.findOne();
  await Job.insertMany(
    jobs.map(job => ({
      ...job,
      user_id: user._id
    }))
  );
});

describe("Protected Job Routes", () => {
  // ---------------- GET ----------------
  it("should return all jobs with a valid token", async () => {
    const res = await api
      .get("/api/jobs")
      .set("Authorization", "Bearer " + token)
      .expect(200);

    expect(res.body).toHaveLength(jobs.length);
  });

  it("should return 401 if no token is provided", async () => {
    await api.get("/api/jobs").expect(401);
  });

  // ---------------- POST ----------------
  it("should create one job with a valid token", async () => {
    const newJob = {
      title: "President",
      type: "Intern",
      description: "Border security",
      company: {name: "USA", contactEmail: "D@trump.com", contactPhone: "0000000"},
    };
    const res = await api
      .post("/api/jobs")
      .set("Authorization", "Bearer " + token)
      .send(newJob)
      .expect(201);

    expect(res.body.title).toBe(newJob.title);
  });

  // ---------------- GET by ID ----------------
  it("should return one job by ID", async () => {
    const job = await Job.findOne();
    const res = await api
      .get(`/api/jobs/${job._id}`)
      .set("Authorization", "Bearer " + token)
      .expect(200);

    expect(res.body.title).toBe(job.title);
  });

  // ---------------- PUT ----------------
  it("should update one job by ID with a valid token", async () => {
    const job = await Job.findOne();
    const updatedJob = { type: "Full-Time" };

    const res = await api
      .put(`/api/jobs/${job._id}`)
      .set("Authorization", "Bearer " + token)
      .send(updatedJob)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(res.body.type).toBe(updatedJob.type);

    const updatedJobCheck = await Job.findById(job._id);
    expect(updatedJobCheck.type).toBe(updatedJob.type);
  });

  // ---------------- DELETE ----------------
  it("should delete one job by ID", async () => {
    const job = await Job.findOne();
    await api
      .delete(`/api/jobs/${job._id}`)
      .set("Authorization", "Bearer " + token)
      .expect(204);

    const jobCheck = await Job.findById(job._id);
    expect(jobCheck).toBeNull();
  });
});

// Close DB connection once after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

