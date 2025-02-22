import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import * as usersErrors from "../src/errors/userError"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const admin2 = { username: "admin2", name: "admin2", surname: "admin2", password: "admin2", role: "Admin" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let customerCookie2: string
let adminCookie: string

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

beforeAll(async () => {
    await cleanup()
    await postUser(customer)
    customerCookie = await login(customer)
    await postUser(admin)
    adminCookie = await login(admin)

})


afterAll(async () => {
    await cleanup();
});

describe("User routes integration tests", () => {
    describe("POST /users", () => {
        describe("Correct test cases", () => {
            test("Should create a new user and return an empty body", async () => {
                const response = await request(app)
                    .post(`${routePath}/users`)
                    .send(customer2)
                    .expect(200)
                customerCookie2 = await login(customer2)

                expect(response.body).toEqual({})
            });
        });

        describe("Incorrect test cases", () => {
            test("Should return an error if the username already exists", async () => {
                const response = await request(app)
                    .post(`${routePath}/users`)
                    .send(customer)
                    .expect(409)

                expect(response.body).toEqual({ "error": "The username already exists", "status": 409 });
            });
        });

    });
    describe("GET /users", () => {
        describe("Correct test cases", () => {
            test("Should return an array of users", async () => {
                const response = await request(app)
                    .get(`${routePath}/users`)
                    .set("Cookie", adminCookie)
                    .expect(200);

                expect(response.body).toEqual([{
                    username: customer.username,
                    name: customer.name,
                    surname: customer.surname,
                    role: customer.role,
                    address: null,
                    birthdate: null,
                }, {
                    username: admin.username,
                    name: admin.name,
                    surname: admin.surname,
                    role: admin.role,
                    address: null,
                    birthdate: null,
                }, {
                    username: customer2.username,
                    name: customer2.name,
                    surname: customer2.surname,
                    role: customer2.role,
                    address: null,
                    birthdate: null,
                }
                ]);
            });
        });

        describe("Incorrect test cases", () => {
            test("Should return an error if the user is not logged in", async () => {
                const response = await request(app)
                    .get(`${routePath}/users`)
                    .expect(401);
            });

            test("Should return an error if the user is not an admin", async () => {
                const response = await request(app)
                    .get(`${routePath}/users`)
                    .set("Cookie", customerCookie)
                    .expect(401);
            });
        });
    });
    describe("GET /users/roles/:role", () => {
        describe("Correct test cases", () => {
            test("Should return an array of users with the specified role", async () => {
                const response = await request(app)
                    .get(`${routePath}/users/roles/` + admin.role)
                    .set("Cookie", adminCookie)
                    .expect(200);

                expect(response.body).toEqual([{
                    username: admin.username,
                    name: admin.name,
                    surname: admin.surname,
                    role: admin.role,
                    address: null,
                    birthdate: null,
                }]);
            });
            test("Should return an empty array if there are no users with the specified role", async () => {
                const response = await request(app)
                    .get(`${routePath}/users/roles/` + "Manager")
                    .set("Cookie", adminCookie)
                    .expect(200);

                expect(response.body).toEqual([]);
            })
        });

        describe("Incorrect test cases", () => {
            test("Should return an error if the role param is not customer, admin or manager", async () => {
                const response = await request(app)
                    .get(`${routePath}/users/roles/` + "test")
                    .set("Cookie", adminCookie)
                    .expect(422);
            });

            test("Should return an error if the user is not logged in", async () => {
                const response = await request(app)
                    .get(`${routePath}/users/roles/` + "Manager")
                    .expect(401);
            });

            test("Should return an error if the user is not an admin", async () => {
                const response = await request(app)
                    .get(`${routePath}/users/roles/` + "Manager")
                    .set("Cookie", customerCookie)
                    .expect(401);
            });
        });
    });
    describe("GET /users/:username", () => {
        describe("Correct test cases", () => {
            test("Should return the user with the specified username", async () => {
                const response = await request(app)
                    .get(`${routePath}/users/` + customer.username)
                    .set("Cookie", adminCookie)
                    .expect(200);

                expect(response.body).toEqual({
                    username: customer.username,
                    name: customer.name,
                    surname: customer.surname,
                    role: customer.role,
                    address: null,
                    birthdate: null,
                });
            });
        });

        describe("Incorrect test cases", () => {
            test("Should return an error if the user is not logged in", async () => {
                const response = await request(app)
                    .get(`${routePath}/users/` + "test")
                    .expect(401);
            });

            test("Should return an error if the user does not exist", async () => {
                const response = await request(app)
                    .get(`${routePath}/users/` + "test")
                    .set("Cookie", adminCookie)
                    .expect(404);

                expect(response.body).toEqual({ "error": "The user does not exist", "status": 404 });
            });

            test("Should return an error if the username of the logged user (not admin) is different from the param username", async () => {
                const response = await request(app)
                    .get(`${routePath}/users/` + "test")
                    .set("Cookie", customerCookie)
                    .expect(401);
            });
        });
    });
    describe("DELETE /users/:username", () => {
        describe("Correct test cases", () => {
            test("Should delete the user with the specified username", async () => {
                const response = await request(app)
                    .delete(`${routePath}/users/` + customer2.username)
                    .set("Cookie", adminCookie)
                    .expect(200);

                expect(response.body).toEqual({});
            });
        });
        describe("Incorrect test cases", () => {
            test("Should return an error if the user does not exist", async () => {
                const response = await request(app)
                    .delete(`${routePath}/users/` + "test")
                    .set("Cookie", adminCookie)
                    .expect(404);

                expect(response.body).toEqual({ "error": "The user does not exist", "status": 404 });
            });
            test("Should return an error if the user to delete is an admin and different from the admin logged", async () => {
                await request(app)
                    .post(`${routePath}/users`)
                    .send(admin2)
                    .expect(200);

                const response = await request(app)
                    .delete(`${routePath}/users/` + admin2.username)
                    .set("Cookie", adminCookie)
                    .expect(401);

                expect(response.body).toEqual({ "error": "Admins cannot be deleted", "status": 401 });
            });
            test("Should return an error if the username of the logged user (not admin) is different from the param username", async () => {
                const response = await request(app)
                    .delete(`${routePath}/users/` + "test")
                    .set("Cookie", customerCookie)
                    .expect(401);
            });
        });
    });
    describe("DELETE /users", () => {
        describe("Correct test cases", () => {
            test("Should delete all the users", async () => {
                const response = await request(app)
                    .delete(`${routePath}/users`)
                    .set("Cookie", adminCookie)
                    .expect(200);

                expect(response.body).toEqual({});
            });
        });

        describe("Incorrect test cases", () => {
            test("Should return an error if the user is not logged in", async () => {
                const response = await request(app)
                    .delete(`${routePath}/users`)
                    .expect(401);
            });

            test("Should return an error if the user is not an admin", async () => {
                const response = await request(app)
                    .delete(`${routePath}/users`)
                    .set("Cookie", customerCookie)
                    .expect(401);
            });
        });
    });
    describe("PATCH /users/:username", () => {
        describe("Correct test cases", () => {
            test("Should update the user with the specified username", async () => {
                await request(app)
                    .post(`${routePath}/users`)
                    .send(customer2)
                    .expect(200);
                customerCookie2 = await login(customer2)

                const response = await request(app)
                    .patch(`${routePath}/users/` + customer2.username)
                    .send({
                        name: "test",
                        surname: "test",
                        address: "test",
                        birthdate: "2001-01-01",
                    })
                    .set("Cookie", adminCookie)
                    .expect(200);

                expect(response.body).toEqual({
                    username: customer2.username,
                    name: "test",
                    surname: "test",
                    role: customer2.role,
                    address: "test",
                    birthdate: "2001-01-01",
                });
            });
        });

        describe("Incorrect test cases", () => {
            test("Should return an error if the user is not logged in", async () => {
                const response = await request(app)
                    .patch(`${routePath}/users/` + "test")
                    .send({
                        name: "test",
                        surname: "test",
                        address: "test",
                        birthdate: "2001-01-01",
                    })
                    .expect(401);
            });
            test("Should return an error if the user does not exist", async () => {
                const response = await request(app)
                    .patch(`${routePath}/users/` + "test")
                    .send({
                        name: "test",
                        surname: "test",
                        address: "test",
                        birthdate: "2001-01-01",
                    })
                    .set("Cookie", adminCookie)
                    .expect(404);

                expect(response.body).toEqual({ "error": "The user does not exist", "status": 404 });
            });
            test("Should return an error if the user to update is an user and different from calling user", async () => {
                await request(app)
                    .post(`${routePath}/users`)
                    .send(customer)
                    .expect(200);
                customerCookie = await login(customer)
                const response = await request(app)
                    .patch(`${routePath}/users/` + customer.username)
                    .send({
                        name: "test",
                        surname: "test",
                        address: "test",
                        birthdate: "2001-01-01",
                    })
                    .set("Cookie", customerCookie2)
                    .expect(401);

                expect(response.body).toEqual({ "error": "This operation can be performed only by an admin", "status": 401 });
            });
            test("Should return an error if the user to update is an admin and different from the admin logged", async () => {
                const response = await request(app)
                    .patch(`${routePath}/users/` + admin2.username)
                    .send({
                        name: "test",
                        surname: "test",
                        address: "test",
                        birthdate: "2001-01-01",
                    })
                    .set("Cookie", adminCookie)
                    .expect(401);

                expect(response.body).toEqual({ "error": "You cannot access the information of other users", "status": 401 });
            });
            test("Should return an error if the username of the logged user (not admin) is different from the param username", async () => {
                const response = await request(app)
                    .patch(`${routePath}/users/` + admin2.username)
                    .send({
                        name: "test",
                        surname: "test",
                        address: "test",
                        birthdate: "2001-01-01",
                    })
                    .set("Cookie", customerCookie)
                    .expect(401);
            });
        });
    });
});

