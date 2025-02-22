import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import dayjs from "dayjs"

const routePath = "/ezelectronics" 

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }

const review = { score: 5, comment: "comment" } 

const product = {
  model: "model1",
  category: "Smartphone",
  arrivalDate: "2024-06-12",
  sellingPrice: 200,
  quantity: 2,
  details: "test"
}

let customerCookie: string
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
    await cleanup()
}) 

describe("Review routes integration tests", () => {

  describe("POST reviews/:model", () => {
    
    test("It should return a 200 success code and create a new review", async () => {

      //admin aggiunge un prodotto
      await request(app)
          .post(`${routePath}/products`)
          .set("Cookie", adminCookie)
          .send(product)
          .expect(200)

      //customer crea una recensione
      await request(app)
          .post(`${routePath}/reviews/model1`)
          .set("Cookie", customerCookie)
          .send(review) 
          .expect(200) 

      //controllo quanti utenti ho attualmente nel sistema
      const users = await request(app)  
          .get(`${routePath}/users`)
          .set("Cookie", adminCookie) 
          .expect(200)
      expect(users.body).toHaveLength(2) 
      //verifico il customer
      let cust = users.body.find((user: any) => user.username === customer.username) 
      expect(cust).toBeDefined() 
      expect(cust.name).toBe(customer.name)
      expect(cust.surname).toBe(customer.surname)
      expect(cust.role).toBe(customer.role)
      //verifico l'admin
      let adm = users.body.find((user: any) => user.username === admin.username)
      expect(adm).toBeDefined()
      expect(adm.name).toBe(admin.name)
      expect(adm.surname).toBe(admin.surname)
      expect(adm.role).toBe(admin.role)

    })

    test("It should return a 422 error code if at least one request body parameter is empty/missing or invalid", async () => { 
      
      await request(app)
          .post(`${routePath}/reviews/model1`)
          .set("Cookie", customerCookie)
          .send({ score: 5, comment: "" }) 
          .expect(422)
          
      await request(app)
        .post(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie)
        .send({ score: 5, comment: undefined }) 
        .expect(422)
        
      await request(app)
        .post(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie)
        .send({ score: 5, comment: 9 }) 
        .expect(422)

      await request(app)
        .post(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie)
        .send({ score: 7, comment: "comment" }) 
        .expect(422)

      await request(app)
        .post(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie)
        .send({ score: "stringa", comment: "comment" }) 
        .expect(422)

    })

    test("It should return a 401 error code if the user is not logged", async () => {

      await request(app)
        .post(`${routePath}/reviews/model1`)
        .send(review)
        .set("Cookie", "fakeCookie")
        .expect(401)

    })

    test("It should return a 401 error code if the user is not a Customer", async () => {

      await request(app)
        .post(`${routePath}/reviews/model1`)
        .send(review)
        .set("Cookie", adminCookie)
        .expect(401)

    })

    test("It should return a 404 error code if model does not represent an existing product in the database", async () => {

      await request(app)
        .post(`${routePath}/reviews/model2`)
        .send(review)
        .set("Cookie", customerCookie)
        .expect(404)

    })

    test("It should return a 409 error code if there is already an existing review for the product made by the customer", async () => {

      await request(app)
        .post(`${routePath}/reviews/model1`)
        .send(review)
        .set("Cookie", customerCookie)
        .expect(409)

    })

  })

  describe("GET reviews/:model", () => {
    
    test("It should return a 200 success code if everything goes well (only one review for the product)", async () => {

      //get fatta da un customer
      let responseReviews = await request(app)
          .get(`${routePath}/reviews/model1`)
          .set("Cookie", customerCookie) 
          .expect(200)
          
      expect(responseReviews.body).toHaveLength(1) //c'è solo un prodotto fin'ora
      let review1 = responseReviews.body[0]
      expect(review1.model).toBe(product.model)
      expect(review1.user).toBe(customer.username)
      expect(review1.score).toBe(review.score)
      expect(review1.date).toBe(dayjs().format("YYYY-MM-DD"))
      expect(review1.comment).toBe(review.comment)

      //get fatta da un admin
      await request(app)
          .get(`${routePath}/reviews/model1`)
          .set("Cookie", adminCookie)
          .expect(200)

      expect(responseReviews.body).toHaveLength(1) //c'è solo un prodotto fin'ora
      review1 = responseReviews.body[0]
      expect(review1.model).toBe(product.model)
      expect(review1.user).toBe(customer.username)
      expect(review1.score).toBe(review.score)
      expect(review1.date).toBe(dayjs().format("YYYY-MM-DD"))
      expect(review1.comment).toBe(review.comment)

      //controllo quanti utenti ho attualmente nel sistema
      const users = await request(app)  
        .get(`${routePath}/users`)
        .set("Cookie", adminCookie) 
        .expect(200)
      expect(users.body).toHaveLength(2) 
      //verifico il customer
      let cust = users.body.find((user: any) => user.username === customer.username) 
      expect(cust).toBeDefined() 
      expect(cust.name).toBe(customer.name)
      expect(cust.surname).toBe(customer.surname)
      expect(cust.role).toBe(customer.role)
      //verifico l'admin
      let adm = users.body.find((user: any) => user.username === admin.username)
      expect(adm).toBeDefined()
      expect(adm.name).toBe(admin.name)
      expect(adm.surname).toBe(admin.surname)
      expect(adm.role).toBe(admin.role)

    })

    test("It should return a 200 success code if everything goes well (more reviews for the product)", async () => {

      //creo un nuovo customer
      await postUser(customer2)
      customerCookie = await login(customer2)

      //customer2 crea una nuova recensione per lo stesso prodotto
      await request(app)
        .post(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie)
        .send({ score: 4, comment: "comment2" }) 
        .expect(200)

      //get fatta da un customer
      let responseReviews = await request(app)
          .get(`${routePath}/reviews/model1`)
          .set("Cookie", customerCookie) 
          .expect(200)
          
      expect(responseReviews.body).toHaveLength(2) //ci sono due prodotti fin'ora
      let review1 = responseReviews.body[0]
      expect(review1.model).toBe(product.model)
      expect(review1.user).toBe(customer.username)
      expect(review1.score).toBe(review.score)
      expect(review1.date).toBe(dayjs().format("YYYY-MM-DD"))
      expect(review1.comment).toBe(review.comment)

      let review2 = responseReviews.body[1]
      expect(review2.model).toBe(product.model)
      expect(review2.user).toBe(customer2.username)
      expect(review2.score).toBe(4)
      expect(review2.date).toBe(dayjs().format("YYYY-MM-DD"))
      expect(review2.comment).toBe("comment2")

      //controllo quanti utenti ho attualmente nel sistema
      const users = await request(app)  
        .get(`${routePath}/users`)
        .set("Cookie", adminCookie) 
        .expect(200)
      expect(users.body).toHaveLength(3) 
      //verifico il customer
      let cust = users.body.find((user: any) => user.username === customer.username) 
      expect(cust).toBeDefined() 
      expect(cust.name).toBe(customer.name)
      expect(cust.surname).toBe(customer.surname)
      expect(cust.role).toBe(customer.role)
      //verifico l'admin
      let adm = users.body.find((user: any) => user.username === admin.username)
      expect(adm).toBeDefined()
      expect(adm.name).toBe(admin.name)
      expect(adm.surname).toBe(admin.surname)
      expect(adm.role).toBe(admin.role)
      //verifico il customer2
      cust = users.body.find((user: any) => user.username === customer2.username) 
      expect(cust).toBeDefined() 
      expect(cust.name).toBe(customer2.name)
      expect(cust.surname).toBe(customer2.surname)
      expect(cust.role).toBe(customer2.role)

    })

    test("It should return a 401 error code if the user is not logged", async () => {

      //get fatta da un customer
      await request(app)
        .get(`${routePath}/reviews/model2`) 
        .expect(401)

    })

    test("It should return a 404 error code if the product specified does not exist", async () => {

      //get fatta da un customer
      await request(app)
        .get(`${routePath}/reviews/model3`) 
        .set("Cookie", customerCookie)
        .expect(404)

    })

    
    test("It should return a empty array if the product exists but there are no reviews for it", async () => {

      let testProduct = {
        model: "model3",
        category: "Smartphone",
        arrivalDate: "2024-06-12",
        sellingPrice: 200,
        quantity: 2,
        details: "test"
      }

      //admin aggiunge testProduct
      await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", adminCookie)
        .send(testProduct)
        .expect(200)

      //get fatta da un customer
      const response = await request(app)
        .get(`${routePath}/reviews/model3`) 
        .set("Cookie", customerCookie)
        .expect(200)

      expect(response.body).toHaveLength(0);
    })
  
  })

  describe("DELETE reviews/:model", () => {
    
    test("It should return a 200 success code if everything goes well", async () => {

      //delete della review fatta da un customer
      await request(app)
        .delete(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie) 
        .expect(200)

    })

    test("It should return a 401 error code if the user is not logged", async () => {

      await request(app)
        .delete(`${routePath}/reviews/model1`) 
        .expect(401)
    
    })

    test("It should return a 401 error code if the user is not a Customer", async () => {

      await request(app)
        .delete(`${routePath}/reviews/model1`) 
        .set("Cookie", adminCookie)
        .expect(401)

    })

    test("It should return a 404 error code if the product specified does not exist", async () => {

      await request(app)
        .delete(`${routePath}/reviews/model9`)
        .set("Cookie", customerCookie) 
        .expect(404)

    })

    test("It should return a 404 error code if there are no reviews for the product made by the customer", async () => {

      await request(app)
        .delete(`${routePath}/reviews/model3`)
        .set("Cookie", customerCookie) 
        .expect(404)

    })
  
  })

  describe("DELETE reviews/:model/all", () => {
    
    test("It should return a 200 success code if everything goes well", async () => {

      //per ora c'è solo una recensione per model1 quindi ne aggiungo una
      await request(app)
        .post(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie)
        .send({ score: 5, comment: "comment2" }) 
        .expect(200)
      
      let responseReviews = await request(app)
        .get(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie) 
        .expect(200)
          
      //per ora ci sono 2 recensioni per model1
      expect(responseReviews.body).toHaveLength(2)

      //admin cancella tutte le recensioni per model1
      await request(app)
        .delete(`${routePath}/reviews/model1/all`)
        .set("Cookie", adminCookie) 
        .expect(200)

      //ora ci sono 0 recensioni per model1
      responseReviews = await request(app)
        .get(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie) 
        .expect(200)

      expect(responseReviews.body).toHaveLength(0);

    })

    test("It should return a 401 error code if the user is not logged", async () => {

      await request(app)
        .delete(`${routePath}/reviews/model1/all`) 
        .expect(401)
    
    })

    test("It should return a 401 error code if the user is not an Admin or a Customer", async () => {

      await request(app)
        .delete(`${routePath}/reviews/model1/all`) 
        .set("Cookie", customerCookie)
        .expect(401)

    })

    test("It should return a 404 error code if the product specified does not exist", async () => {

      await request(app)
        .delete(`${routePath}/reviews/model9/all`) 
        .set("Cookie", adminCookie)
        .expect(404)

    })
  
  })
  
  describe("DELETE reviews/:model/all", () => {
  
    test("It should return a 200 success code if everything goes well", async () => {

      //per ora non ci sono recensioni 
      //aggiungo una recensione per model1
      await request(app)
        .post(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie)
        .send({ score: 5, comment: "comment2" }) 
        .expect(200)

      //aggiungo una recensione per model3
      await request(app)
        .post(`${routePath}/reviews/model3`)
        .set("Cookie", customerCookie)
        .send({ score: 3, comment: "comment" }) 
        .expect(200)
      
      let responseReviews = await request(app)
        .get(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie) 
        .expect(200)
          
      //ora c'è una recensione per model1
      expect(responseReviews.body).toHaveLength(1)

      responseReviews = await request(app)
        .get(`${routePath}/reviews/model3`)
        .set("Cookie", customerCookie) 
        .expect(200)
          
      //ora c'è una recensione per model3
      expect(responseReviews.body).toHaveLength(1)

      //admin cancella tutte le recensioni nel db
      await request(app)
        .delete(`${routePath}/reviews`)
        .set("Cookie", adminCookie) 
        .expect(200)

      //ora ci sono 0 recensioni per model1
      let response = await request(app)
        .get(`${routePath}/reviews/model1`)
        .set("Cookie", customerCookie) 
        .expect(200);

      expect(response.body).toHaveLength(0);
      
      //ora ci sono 0 recensioni per model3
      response = await request(app)
        .get(`${routePath}/reviews/model3`)
        .set("Cookie", customerCookie) 
        .expect(200)

      expect(response.body).toHaveLength(0);

    })

    test("It should return a 401 error code if the user is not logged", async () => {

      await request(app)
        .delete(`${routePath}/reviews`) 
        .expect(401)
    
    })

    test("It should return a 401 error code if the user is not an Admin or a Customer", async () => {

      await request(app)
        .delete(`${routePath}/reviews`) 
        .set("Cookie", customerCookie)
        .expect(401)

    })

  })

})