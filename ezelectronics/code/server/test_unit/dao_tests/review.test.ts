import { describe, test, expect, afterEach, jest } from "@jest/globals"
import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Category } from "../../src/components/product"
import { User, Role } from "../../src/components/user"
import { ProductReview } from "../../src/components/review"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import { ProductNotFoundError } from "../../src/errors/productError"

jest.mock("../../src/db/db.ts");

afterEach(() => {
    jest.resetAllMocks();
});

const testCustomer = new User("username", "mario", "pippo", Role.CUSTOMER, "", "");

const productRow = { model: "Iphone13", category: Category.SMARTPHONE, arrivalDate: "2024-01-01", sellingPrice: 1199, quantity: 10, details: ""};

const reviewRow = { model: "Iphone13", username: testCustomer.username, score: 3, date: "2024-03-01", comment: "comment1" };

const review = new ProductReview(reviewRow.model, testCustomer.username, reviewRow.score, reviewRow.date, reviewRow.comment);

const DBerr ="DB Error";
const tryBlockError = "Error in Try block";

describe("ReviewDAO", () => {
  const reviewDAO = new ReviewDAO();

  describe("addReview", () => {

    test("It should resolve with void if everything goes well", async () => {

      jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, productRow);
        return {} as Database
      }).mockImplementationOnce((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database
      })

      jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null);
        return {} as Database
      });

      const result = await reviewDAO.addReview(review.model, testCustomer, review.score, review.comment);
      expect(result).toBe(undefined);
      expect(db.get).toHaveBeenCalledTimes(2);
      expect(db.run).toHaveBeenCalledTimes(1);
    });

    test("It should throw DB Error (db.run)", async () => {
      
      jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, productRow);
        return {} as Database
      }).mockImplementationOnce((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database
      })

      jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error(DBerr));
        return {} as Database
      });

      await expect(reviewDAO.addReview(review.model, testCustomer, review.score, review.comment)).rejects.toThrowError(DBerr);
      expect(db.get).toHaveBeenCalledTimes(2);
      expect(db.run).toHaveBeenCalledTimes(1);
    });

    test("It should throw an ExistingReviewError if review already exists", async () => {
      
      jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, productRow);
        return {} as Database
      }).mockImplementationOnce((sql, params, callback) => {
        callback(null, reviewRow);
        return {} as Database
      })

      await expect(reviewDAO.addReview(review.model, testCustomer, review.score, review.comment)).rejects.toThrowError(ExistingReviewError);
      expect(db.get).toHaveBeenCalledTimes(2);
      expect(db.run).toHaveBeenCalledTimes(0);
    });

    test("It should throw DB Error (second db.get)", async () => {
      
      jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, productRow);
        return {} as Database
      }).mockImplementationOnce((sql, params, callback) => {
        callback(new Error(DBerr));
        return {} as Database
      })

      await expect(reviewDAO.addReview(review.model, testCustomer, review.score, review.comment)).rejects.toThrowError(DBerr);
      expect(db.get).toHaveBeenCalledTimes(2);
      expect(db.run).toHaveBeenCalledTimes(0);
    });

    test("It should throw a ProductNotFoundError if product does not exist", async () => {
      
      jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database
      })

      await expect(reviewDAO.addReview(review.model, testCustomer, review.score, review.comment)).rejects.toThrowError(ProductNotFoundError);
      expect(db.get).toHaveBeenCalledTimes(1);
      expect(db.run).toHaveBeenCalledTimes(0);
    });

    test("It should throw DB Error (first db.get)", async () => {
      
      jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(new Error(DBerr));
        return {} as Database
      })

      await expect(reviewDAO.addReview(review.model, testCustomer, review.score, review.comment)).rejects.toThrowError(DBerr);
      expect(db.get).toHaveBeenCalledTimes(1);
      expect(db.run).toHaveBeenCalledTimes(0);
    });
    
    test("It should throw an error if throw in the try block", async () => {
      
      jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        throw new Error(tryBlockError);
      })

      await expect(reviewDAO.addReview(review.model, testCustomer, review.score, review.comment)).rejects.toThrowError(tryBlockError);
      expect(db.get).toHaveBeenCalledTimes(1);
      expect(db.run).toHaveBeenCalledTimes(0);
    });

    describe("getProductReviews", () => {

      test("It should resolve with an array of ProductReview if everything goes well", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(null, productRow);
          return {} as Database
        })

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
          callback(null, [reviewRow]);
          return {} as Database
        })
  
        const result = await reviewDAO.getProductReviews(review.model);
        expect(result).toEqual([review]);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.all).toHaveBeenCalledTimes(1);
      });  

      
      test("It should throw a NoReviewProductError if there are no reviews for the product", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(null, productRow);
          return {} as Database
        })

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
          callback(null, []);
          return {} as Database
        })
  
        const result = await reviewDAO.getProductReviews(review.model);
        expect(result).toEqual([]);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.all).toHaveBeenCalledTimes(1);
      });
      
      test("It should throw DB Error (db.all)", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(null, productRow);
          return {} as Database
        })

        jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
          callback(new Error(DBerr));
          return {} as Database
        })
  
        await expect(reviewDAO.getProductReviews(review.model)).rejects.toThrowError(DBerr);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.all).toHaveBeenCalledTimes(1);
      });

      test("It should throw a ProductNotFoundError if product does not exist", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(null, undefined);
          return {} as Database
        })
  
        await expect(reviewDAO.getProductReviews(review.model)).rejects.toThrowError(ProductNotFoundError);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.all).toHaveBeenCalledTimes(0);
      });

      test("It should throw DB Error (db.get)", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(new Error(DBerr));
          return {} as Database
        })
  
        await expect(reviewDAO.getProductReviews(review.model)).rejects.toThrowError(DBerr);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.all).toHaveBeenCalledTimes(0);
      });

      test("It should throw an error if throw in the try block", async () => {
      
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          throw new Error(tryBlockError);
        })
  
        await expect(reviewDAO.getProductReviews(review.model)).rejects.toThrowError(tryBlockError);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledTimes(0);
      });

    })

    describe("deleteReview", () => {

      test("It should resolve with void if everything goes well", async () => {

        jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
          callback(null, productRow);
          return {} as Database
        }).mockImplementationOnce((sql, params, callback) => {
          callback(null, reviewRow);
          return {} as Database
        })

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
          callback(null);
          return {} as Database
        })
  
        const result = await reviewDAO.deleteReview(review.model, testCustomer);
        expect(result).toBeUndefined();
        expect(db.get).toHaveBeenCalledTimes(2);
        expect(db.run).toHaveBeenCalledTimes(1);
      });
      
      test("It should throw DB Error (db.run)", async () => {

        jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
          callback(null, productRow);
          return {} as Database
        }).mockImplementationOnce((sql, params, callback) => {
          callback(null, reviewRow);
          return {} as Database
        })

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
          callback(new Error(DBerr));
          return {} as Database
        })
  
        await expect(reviewDAO.deleteReview(review.model, testCustomer)).rejects.toThrowError(DBerr);
        expect(db.get).toHaveBeenCalledTimes(2);
        expect(db.run).toHaveBeenCalledTimes(1);
      });

      test("It should throw a NoReviewProductError if there are no reviews for the product", async () => {

        jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
          callback(null, productRow);
          return {} as Database
        }).mockImplementationOnce((sql, params, callback) => {
          callback(null, undefined);
          return {} as Database
        })
  
        await expect(reviewDAO.deleteReview(review.model, testCustomer)).rejects.toThrowError(NoReviewProductError);
        expect(db.get).toHaveBeenCalledTimes(2);
        expect(db.run).toHaveBeenCalledTimes(0);
      });

      test("It should throw DB Error (second db.get)", async () => {

        jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
          callback(null, productRow);
          return {} as Database
        }).mockImplementationOnce((sql, params, callback) => {
          callback(new Error(DBerr));
          return {} as Database
        })
  
        await expect(reviewDAO.deleteReview(review.model, testCustomer)).rejects.toThrowError(DBerr);
        expect(db.get).toHaveBeenCalledTimes(2);
        expect(db.run).toHaveBeenCalledTimes(0);
      });

      test("It should throw a ProductNotFoundError if product does not exist", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(null, undefined);
          return {} as Database
        })
  
        await expect(reviewDAO.deleteReview(review.model, testCustomer)).rejects.toThrowError(ProductNotFoundError);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledTimes(0);
      });

      test("It should throw DB Error (first db.get)", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(new Error(DBerr));
          return {} as Database
        })
  
        await expect(reviewDAO.deleteReview(review.model, testCustomer)).rejects.toThrowError(DBerr);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledTimes(0);
      });

      test("It should throw an error if throw in the try block", async () => {
      
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          throw new Error(tryBlockError);
        })
  
        await expect(reviewDAO.deleteReview(review.model, testCustomer)).rejects.toThrowError(tryBlockError);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledTimes(0);
      });

    })

    describe("deleteReviewsOfProduct", () => {

      test("It should resolve with void if everything goes well", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(null, productRow);
          return {} as Database
        })

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
          callback(null);
          return {} as Database
        })
  
        const result = await reviewDAO.deleteReviewsOfProduct(review.model);
        expect(result).toBeUndefined();
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledTimes(1);
      });

      test("It should throw DB Error (db.run)", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(null, productRow);
          return {} as Database
        })

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
          callback(new Error(DBerr));
          return {} as Database
        })
  
        await expect(reviewDAO.deleteReviewsOfProduct(review.model)).rejects.toThrowError(DBerr);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledTimes(1);
      });

      test("It should throw a ProductNotFoundError if product does not exist", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(null, undefined);
          return {} as Database
        })
  
        await expect(reviewDAO.deleteReviewsOfProduct(review.model)).rejects.toThrowError(ProductNotFoundError);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledTimes(0);
      });

      test("It should throw DB Error (db.get)", async () => {

        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          callback(new Error(DBerr));
          return {} as Database
        })
  
        await expect(reviewDAO.deleteReviewsOfProduct(review.model)).rejects.toThrowError(DBerr);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledTimes(0);
      });

      test("It should throw an error if throw in the try block", async () => {
      
        jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
          throw new Error(tryBlockError);
        })
  
        await expect(reviewDAO.deleteReviewsOfProduct(review.model)).rejects.toThrowError(tryBlockError);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledTimes(0);
      });

    })

    describe("deleteAllReviews", () => {

      test("It should reesolve with void if everything goes well", async () => {

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
          callback(null);
          return {} as Database
        })

        const result = await reviewDAO.deleteAllReviews();
        expect(result).toBeUndefined();
        expect(db.run).toHaveBeenCalledTimes(1);
      });

      test("It should throw DB Error (db.run)", async () => {

        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
          callback(new Error(DBerr));
          return {} as Database
        })
  
        await expect(reviewDAO.deleteAllReviews()).rejects.toThrowError(DBerr);
        expect(db.run).toHaveBeenCalledTimes(1);
      });

      test("It should throw an error if throw in the try block", async () => {
      
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
          throw new Error(tryBlockError);
        })
  
        await expect(reviewDAO.deleteAllReviews()).rejects.toThrowError(tryBlockError);
        expect(db.run).toHaveBeenCalledTimes(1);
      });

    })
    
  })
  
})