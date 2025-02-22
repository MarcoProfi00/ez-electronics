import { test, expect, jest, describe } from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import { User, Role } from "../../src/components/user"
//import { Cart, ProductInCart } from "../../src/components/cart"
import { ProductReview } from "../../src/components/review"
//import { Category } from "../../src/components/product"

jest.mock("../../src/dao/reviewDAO");

const controller = new ReviewController();

let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");
let testProductReview1 = new ProductReview("model", "user", 3, "date", "comment"); 
let testProductReview2 = new ProductReview("model2", "user2", 4, "date2", "comment2");
let testProductReviews = [testProductReview1, testProductReview2];
const testParam = { model: "test", score: 4, comment: "test" };

describe("Review Controller Unit Tests", () => {

  describe("addReview Method", () => {
      test("It should return void", async () => {
        jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValueOnce();

        const response = await controller.addReview(testParam.model, testCustomer, testParam.score, testParam.comment);
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalled();
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(testParam.model, testCustomer, testParam.score, testParam.comment);
        expect(response).toBe(undefined);
      })
  })

  describe("getProductReviews Method", () => {
    test("It should return an array of ProductReview", async () => {
      jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce(testProductReviews);

      const response = await controller.getProductReviews(testParam.model);
      expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalled();
      expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(testParam.model);
      expect(response).toBe(testProductReviews);
    })
  })

  describe("deleteReview Method", () => {
    test("It should return void", async () => {
      jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce();

      const response = await controller.deleteReview(testParam.model, testCustomer);
      expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalled();
      expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(testParam.model, testCustomer);
      expect(response).toBe(undefined);
    })
  })

  describe("deleteReviewsOfProduct Method", () => {
    test("It should return void", async () => {
      jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce();

      const response = await controller.deleteReviewsOfProduct(testParam.model);
      expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalled();
      expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(testParam.model);
      expect(response).toBe(undefined);
    })
  })

  describe("deleteAllReviews Method", () => {
    test("It should return void", async () => {
      jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce();

      const response = await controller.deleteAllReviews();
      expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalled();
      expect(response).toBe(undefined);
    })
  })

})