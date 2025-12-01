const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app"); // Express app (already connects to DB)
const api = supertest(app);
const Job = require("../models/jobModel");

// Seed data for tests
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

// Reset the tours collection before each test
beforeEach(async () => {
  await Job.deleteMany({});
  await Job.insertMany(jobs);
});

// ---------------- GET ----------------
describe("when a GET request is made to /api/jobs", () => {
  it("should return all tours as JSON", async () => {
    const response = await api
      .get("/api/jobs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body).toHaveLength(jobs.length);
    expect(response.body[0].title).toBe(jobs[0].title);
  });
});

describe("when a GET request is made to /api/jobs/:id", () => {
  it("should return one job by ID", async () => {
    const job = await Job.findOne();
    const response = await api
      .get(`/api/jobs/${job._id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body.title).toBe(job.title);
  });

  it("should return 404 for a non-existing job ID", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    await api.get(`/api/jobs/${nonExistentId}`).expect(404);
  });
});

