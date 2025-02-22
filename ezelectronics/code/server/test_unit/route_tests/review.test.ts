import { test, expect, jest, describe } from "@jest/globals"

import request from 'supertest'
import { app } from "../../index"

import ErrorHandler from "../../src/helper"
import Authenticator from "../../src/routers/auth"



import ReviewController from "../../src/controllers/reviewController"
import { User, Role } from "../../src/components/user"
import { ProductReview } from "../../src/components/review"
import { param } from "express-validator"

const baseURL = "/ezelectronics";

let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");
let testProductReview1 = new ProductReview("model", "user", 3, "date", "comment"); 
let testProductReview2 = new ProductReview("model2", "user2", 4, "date2", "comment2");
let testProducts = [testProductReview1, testProductReview2];

// Mock dependencies
jest.mock("../../src/routers/auth");
jest.mock("../../src/controllers/reviewController");

describe("Review Routes Unit Tests", () => {

  describe("POST ezelectronics/reviews/:model", () => {

    test("It should return a 200 success code", async () => {
      const bodyRequest = { model: "test", score: 4, comment: "test" };

      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
        body: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isInt: () => ({})
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = testCustomer;
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValue();

      const response = await request(app).post(baseURL + "/reviews/Model").send(bodyRequest);
      expect(response.status).toBe(200);
      expect(ReviewController.prototype.addReview).toHaveBeenCalled();
      expect(ReviewController.prototype.addReview).toHaveBeenCalledWith("Model", testCustomer, bodyRequest.score, bodyRequest.comment);
    })

    test("It should fail if the route parameter (model) is not valid", async () => { 

      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => {
            throw new Error("Invalid value");
        }),
        body: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isInt: () => ({})
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
      })

      const response = await request(app).post(baseURL + "/reviews/Invalid");
      expect(response.status).toBe(422)
    })

    test("It should fail if the body of the request (score) is not valid", async () => { 

      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
        body: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isInt: () => { throw new Error("Invalid value") }
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
      })

      const response = await request(app).post(baseURL + "/reviews/Model");
      expect(response.status).toBe(422)
    })

    test("It should fail if the body of the request (comment) is not valid", async () => { 

      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
        body: jest.fn().mockImplementation(() => ({
          isString: () => { throw new Error("Invalid value") },
          isInt: () => ({})
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
      })

      const response = await request(app).post(baseURL + "/reviews/Model");
      expect(response.status).toBe(422)
    })

    test("It should fail if the body of the request (score, comment) is not valid", async () => { 

      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
        body: jest.fn().mockImplementation(() => ({
          isString: () => { throw new Error("Invalid value") },
          isInt: () => { throw new Error("Invalid value") }
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
      })

      const response = await request(app).post(baseURL + "/reviews/Model");
      expect(response.status).toBe(422)
    })

    test("It should fail if the user is not logged", async () => { 

      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
        body: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isInt: () => ({})
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthenticated user", status: 401 });
      });

      const response = await request(app).post(baseURL + "/reviews/Model");
      expect(response.status).toBe(401)
    })

    test("It should fail if the user is not a customer", async () => { 

      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
        body: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isInt: () => ({})
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "User is not a customer", status: 401 });
      });

      const response = await request(app).post(baseURL + "/reviews/Model");
      expect(response.status).toBe(401)
    })

    test("It should throw an error if the controller returns an error", async () => { 
      const bodyRequest = { model: "test", score: 4, comment: "test" };

      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
        body: jest.fn().mockImplementation(() => ({
            isString: () => ({ isLength: () => ({}) }),
            isInt: () => ({})
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValue(new Error("ReviewController error"));

      const response = await request(app).post(baseURL + "/reviews/Model").send(bodyRequest);
      expect(response.status).toBe(503);
    })

  })

  describe("GET ezelectronics/reviews/:model", () => {

    test("It should return an array of ProductReview objects", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValue(testProducts);

      const response = await request(app).get(baseURL + "/reviews/Model");
      expect(response.status).toBe(200);
      expect(ReviewController.prototype.getProductReviews).toHaveBeenCalled();
      expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith("Model");
      expect(response.body).toEqual(testProducts);
    })

    /*
    test("It should fail if the route parameter (model) is not valid", async () => {

      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => {
            throw new Error("Invalid model");
        }),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
      })

      const response = await request(app).get(baseURL + "/reviews/Invalid");
      expect(response.status).toBe(422);
    })*/

    test("It should fail if the user is not logged", async () => { 
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthenticated user", status: 401 });
      });

      const response = await request(app).get(baseURL + `/reviews/Model`);
      expect(response.status).toBe(401)
    })

    test("It should throw an error if the controller returns an error", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValue(new Error("ReviewController error"));

      const response = await request(app).get(baseURL + "/reviews/Model");
      expect(response.status).toBe(503);
    });

  })

  describe("DELETE ezelectronics/reviews/:model", () => {

    test("It should return a 200 success code", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = testCustomer;
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValue();

      const response = await request(app).delete(baseURL + "/reviews/Model");
      expect(response.status).toBe(200);
      expect(ReviewController.prototype.deleteReview).toHaveBeenCalled();
      expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith("Model", testCustomer);
    })

    /*
    test("It should fail if the route parameter (model) is not valid", async () => {

      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => {
            throw new Error("Invalid model");
        }),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
      })

      const response = await request(app).delete(baseURL + "/reviews/Invalid");
      expect(response.status).toBe(422);
    })*/

    test("It should fail if the user is not logged", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthenticated user", status: 401 });
      });

      const response = await request(app).delete(baseURL + `/reviews/Model`);
      expect(response.status).toBe(401);
    })

    test("It should fail if the user is not a customer", async () => { 
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "User is not a customer", status: 401 });
      });

      const response = await request(app).delete(baseURL + "/reviews/Model");
      expect(response.status).toBe(401)
    })

    test("It should throw an error if the controller returns an error", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValue(new Error("ReviewController error"));

      const response = await request(app).delete(baseURL + "/reviews/Model");
      expect(response.status).toBe(503);
    });
  })

  describe("DELETE ezelectronics/reviews/:model/all", () => {

    test("It should return a 200 success code", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValue();

      const response = await request(app).delete(baseURL + "/reviews/Model/all");
      expect(response.status).toBe(200);
      expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalled();
      expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith("Model");
    })

    /*
    test("It should fail if the route parameter (model) is not valid", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => {
            throw new Error("Invalid model");
        }),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
      })

      const response = await request(app).delete(baseURL + "/reviews/Invalid/all");
      expect(response.status).toBe(422);
    })*/
    
    test("It should fail if the user is not logged", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthenticated user", status: 401 });
      });

      const response = await request(app).delete(baseURL + `/reviews/Model/all`);
      expect(response.status).toBe(401);
    })

    test("It should fail if the user is not an Admin or a Manager", async () => { 
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "User is not an admin or manager", status: 401 })
      });

      const response = await request(app).delete(baseURL + "/reviews/Model/all");
      expect(response.status).toBe(401)
    })

    test("It should throw an error if the controller returns an error", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValue(new Error("ReviewController error"));

      const response = await request(app).delete(baseURL + "/reviews/Model/all");
      expect(response.status).toBe(503);
    })
  })

  describe("DELETE ezelectronics/reviews", () => {
    test("It should return a 200 success code", async () => {

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValue();

      const response = await request(app).delete(baseURL + "/reviews");
      expect(response.status).toBe(200);
      expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalled();
    })

    test("It should fail if the user is not logged", async () => {

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthenticated user", status: 401 });
      });

      const response = await request(app).delete(baseURL + "/reviews");
      expect(response.status).toBe(401);
    })

    test("It should fail if the user is not an Admin or a Manager", async () => { 

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "User is not an admin or manager", status: 401 })
      });

      const response = await request(app).delete(baseURL + "/reviews");
      expect(response.status).toBe(401)
    })

    test("It should throw an error if the controller returns an error", async () => {

      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return next();
      });

      jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockRejectedValue(new Error("ReviewController error"));

      const response = await request(app).delete(baseURL + "/reviews");
      expect(response.status).toBe(503);
    })

  })
    
})