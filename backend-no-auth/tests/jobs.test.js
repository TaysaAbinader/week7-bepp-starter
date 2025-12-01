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

// ---------------- POST ----------------
describe("when a POST request is made to /api/jobs", () => {
  it("should create a new tour", async () => {
    const newJob = {
      title: "Full-Stack Developer",
      type: "Part-Time",
      description: "React, Node",
      company: {name: "Bye", contactEmail: "bye@world.com", contactPhone: "12345"},
    };

    const response = await api
      .post("/api/jobs")
      .send(newJob)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    expect(response.body.title).toBe(newJob.title);

    const jobsAfterPost = await Job.find({});
    expect(jobsAfterPost).toHaveLength(jobs.length + 1);
  });
});

// ---------------- PUT ----------------
describe("when a PUT request is made to /api/jobs/:id", () => {
  it("should update a job with partial data", async () => {
    const job = await Job.findOne();
    const updatedJob = {type: "Internship" };

    const response = await api
      .put(`/api/jobs/${job._id}`)
      .send(updatedJob)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body.type).toBe(updatedJob.type);

    const updatedJobCheck = await Job.findById(job._id);
    expect(updatedJobCheck.type).toBe(updatedJob.type);
  });

  it("should return 400 for invalid job ID", async () => {
    const invalidId = "000111"; // invalid format, not a valid ObjectId
    await api.put(`/api/jobs/${invalidId}`).send({}).expect(400);
  });

  it("should return 404 if job is not found with valid ID", async () => {
    const validId = "507f1f77bcf86cd799439011";
    await api.put(`/api/jobs/${validId}`).send({}).expect(404);
  });
});

// ---------------- DELETE ----------------
describe("when a DELETE request is made to /api/jobs/:id", () => {
  it("should delete a job by ID", async () => {
    const job = await Job.findOne();
    await api.delete(`/api/jobs/${job._id}`).expect(204);

    const deletedJobCheck = await Job.findById(job._id);
    expect(deletedJobCheck).toBeNull();
  });

  it("should return 400 for invalid job ID", async () => {
    const invalidId = "12345"; // invalid format
    await api.delete(`/api/jobs/${invalidId}`).expect(400);
  });

  it("should return 404 if job is not found with valid ID", async () => {
    const validId = "607f1f77bcf86cd799439011";
    await api.delete(`/api/jobs/${validId}`).send({}).expect(404);
  })
});

// Close DB connection once after all tests in this file
afterAll(async () => {
  await mongoose.connection.close();
});
