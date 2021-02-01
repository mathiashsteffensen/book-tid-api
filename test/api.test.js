const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
require("dayjs/locale/da");
const weekOfYear = require("dayjs/plugin/weekOfYear");
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore')
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(utc);
dayjs.extend(weekOfYear);
dayjs.locale("da");
const chai = require("chai");
const chaiHttp = require("chai-http");
const { it } = require("mocha");
chai.use(chaiHttp);
chai.should();

const stripe = require('./stripe')

let assertUserError = (res) => {
  res.should.have.status(400);
  res.body.should.have.property("msg");
  res.body.msg.should.be.a("string");
};
let serviceIDs
let bookingSettings;
let calendarIDs = [];
let specialSchedule = {
            year: dayjs.utc().year(),
            week: dayjs.utc().week(),
            schedule: [
              {
                day: 0,
                schedule: {
                  open: true,
                  startOfWork: {
                    hour: 8,
                    minute: 0,
                  },
                  endOfWork: {
                    hour: 16,
                    minute: 0,
                  },
                },
              },
              {
                day: 1,
                schedule: {
                  open: true,
                  startOfWork: {
                    hour: 8,
                    minute: 0,
                  },
                  endOfWork: {
                    hour: 16,
                    minute: 0,
                  },
                },
              },
              {
                day: 2,
                schedule: {
                  open: true,
                  startOfWork: {
                    hour: 8,
                    minute: 0,
                  },
                  endOfWork: {
                    hour: 16,
                    minute: 0,
                  },
                },
              },
              {
                day: 3,
                schedule: {
                  open: true,
                  startOfWork: {
                    hour: 8,
                    minute: 0,
                  },
                  endOfWork: {
                    hour: 16,
                    minute: 0,
                  },
                },
              },
              {
                day: 4,
                schedule: {
                  open: true,
                  startOfWork: {
                    hour: 8,
                    minute: 0,
                  },
                  endOfWork: {
                    hour: 16,
                    minute: 0,
                  },
                },
              },
              {
                day: 5,
                schedule: {
                  open: true,
                  startOfWork: {
                    hour: 8,
                    minute: 0,
                  },
                  endOfWork: {
                    hour: 16,
                    minute: 0,
                  },
                },
              },
              {
                day: 6,
                schedule: {
                  open: true,
                  startOfWork: {
                    hour: 8,
                    minute: 0,
                  },
                  endOfWork: {
                    hour: 16,
                    minute: 0,
                  },
                },
              },
            ],
          };

describe("API", () =>
{
  describe("Admin API", () => {
    let requester = chai.request("http://localhost:8378/admin");
    let apiKey;
    
    describe("Test free account and features", () => {
      describe("Authorization API", () => {
        describe("POST /auth/signup/free", () => {
          it("It should fail to register a free account - no first name", (done) => {
            requester
              .post("/auth/signup/free")
              .send({
                email: "test@email.com",
                password: "testPWD",
                phoneNumber: "12345678",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to register a free account - no email", (done) => {
            requester
              .post("/auth/signup/free")
              .send({
                name: {
                  firstName: "Test",
                },
                email: "",
                password: "testPWD",
                phoneNumber: "12345678",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to register a free account - password not long enough", (done) => {
            requester
              .post("/auth/signup/free")
              .send({
                name: {
                  firstName: "Test",
                },
                email: "test@email.com",
                password: "te",
                phoneNumber: "12345678",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to register a free account - phonenumber not numeric", (done) => {
            requester
              .post("/auth/signup/free")
              .send({
                name: {
                  firstName: "Test",
                },
                email: "test@email.com",
                password: "tewdwadwa",
                phoneNumber: "1234w78",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to register a free account - phonenumber not long enough", (done) => {
            requester
              .post("/auth/signup/free")
              .send({
                name: {
                  firstName: "Test",
                },
                email: "test@email.com",
                password: "tewdwadwa",
                phoneNumber: "123478",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to register a free account - phonenumber too long", (done) => {
            requester
              .post("/auth/signup/free")
              .send({
                name: {
                  firstName: "Test",
                },
                email: "test@email.com",
                password: "tewdwadwa",
                phoneNumber: "12345678912345678",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should succesfully register a free account", (done) => {
            requester
              .post("/auth/signup/free")
              .send({
                name: {
                  firstName: "Test",
                },
                businessInfo: {
                  name: "Test Forretning",
                },
                email: "test@email.com",
                password: "testPWD",
                phoneNumber: "12345678",
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.email.should.be.eql("test@email.com");
                res.body.phoneNumber.should.be.eql("12345678");
                res.body.should.not.have.property("password");
                done();
              });
          });

          it("It should fail to succesfully register a free account - email in use", (done) => {
            requester
              .post("/auth/signup/free")
              .send({
                name: {
                  firstName: "Test",
                },
                email: "test@email.com",
                password: "testPWD",
                phoneNumber: "12345679",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to succesfully register a free account - phone number in use", (done) => {
            requester
              .post("/auth/signup/free")
              .send({
                name: {
                  firstName: "Test",
                },
                email: "test@newemail.com",
                password: "testPWD",
                phoneNumber: "12345678",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });
        });

        describe("POST /auth/login", () => {
          it("It should fail to login - invalid e-mail", (done) => {
            requester
              .post("/auth/login")
              .send({
                email: "test@gmail.com", // Test user was registered with @email.com suffix
                password: "testPWD",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to login - invalid password", (done) => {
            requester
              .post("/auth/login")
              .send({
                email: "test@email.com",
                password: "password", // Test user was registered with password 'testPWD'
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should succesfully login and receive an API key", (done) => {
            requester
              .post("/auth/login")
              .send({
                email: "test@email.com",
                password: "testPWD",
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("apiKey");
                apiKey = res.body.apiKey;
                done();
              });
          });
        });

        describe("GET /auth/verify-key/:apiKey", () => {
          it("It should fail to verify the API key", (done) => {
            requester
              .get(`/auth/verify-key/thisisntanapikey`)
              .send()
              .end((err, res) => {
                res.should.have.status(401);
                res.body.should.be.eql({});
                done();
              });
          });

          it("It should succesfully verify the API key", (done) => {
            requester
              .get(`/auth/verify-key/${apiKey}`)
              .send()
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                done();
              });
          });
        });
      });
      
      describe("Settings API", () => {
        describe("GET /settings/booking/:apiKey", () => {
          it("It should succesfully get the online booking settings for the client", (done) =>
          {
            requester
              .get(`/settings/booking/${apiKey}`)
              .end((err, res) =>
              {
                res.should.have.status(200)
                res.body.should.have.property("domainPrefix")
                bookingSettings = res.body
                done()
              })
          }) 
        })

        describe("POST /settings/booking/:apiKey", () =>
        {
          it("It should succesfully change the domainprefix", (done) =>
          {
            requester
              .post(`/settings/booking/${apiKey}`)
              .send({
                domainPrefix: 'holmweb'
              })
              .end((err, res) =>
              {
                res.should.have.status(200)
                res.body.should.not.have.property("msg");
                bookingSettings.domainPrefix = 'holmweb'
                done()
              })
          })
        })
      })
      let serviceID;
      let categoryID 
      describe("Service API", () => {
        describe("POST /service/create-category/:apiKey", () => {
          it("It should fail to create a category - no category name provided", (done) => {
            requester
              .post(`/service/create-category/${apiKey}`)
              .send({
                name: "",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it('It should succesfully create a category - "Test Category"', (done) => {
            requester
              .post(`/service/create-category/${apiKey}`)
              .send({
                name: "Test Category",
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("name");
                res.body.name.should.be.eql("Test Category");
                done();
              });
          });

          it("It should fail to create a category - category already exists", (done) => {
            requester
              .post(`/service/create-category/${apiKey}`)
              .send({
                name: "Test Category",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it('It should succesfully create another category - "Test Category 2"', (done) => {
            requester
              .post(`/service/create-category/${apiKey}`)
              .send({
                name: "Test Category 2",
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("name");
                res.body.name.should.be.eql("Test Category 2");
                done();
              });
          });
        });

        describe("GET /service/categories/:apiKey", () => {
          it("It should succesfully get all categories previously registered, including updated information", (done) => {
            requester.get(`/service/categories/${apiKey}`).end((err, res) => {
              res.should.have.status(200);
              res.body.should.not.have.property("msg");
              res.body.should.be.a("array");
              let filtered = res.body.map((category) => 
              {
                  if (category.name === 'Test Category') categoryID = category._id
                  return (category.name === "Test Category" || category.name === "Test Category 2")
              });
              filtered.forEach((category) => {
                category.should.be.eql(true);
              });
              done();
            });
          });
        });

        describe("POST /service/update-category/:apiKey", () => {
          it("It should fail to update - no category to update specified", (done) => {
            requester
              .post(`/service/update-category/${apiKey}`)
              .send({
                name: "Test Category 2",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it('It should fail to update "Test Category" - no update specified', (done) => {
            requester
              .post(`/service/update-category/${apiKey}`)
              .send({
                oldName: "Test Category",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it('It should fail to update "Test Category" to "Test Category 2" - category already exists', (done) => {
            requester
              .post(`/service/update-category/${apiKey}`)
              .send({
                name: "Test Category 2",
                id: categoryID,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it('It should succesfully update "Test Category" to "New Test Category"', (done) => {
            requester
              .post(`/service/update-category/${apiKey}`)
              .send({
                name: "New Test Category",
                id: categoryID,
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("name");
                res.body.name.should.be.eql("Test Category");
                done();
              });
          });
        });

        describe("DELETE /service/category/:apiKey", () => {
          it("It should fail to delete a category because no id was supplied", (done) => {
            requester.delete(`/service/category/${apiKey}`).end((err, res) => {
              assertUserError(res);
              done();
            });
          });

          it('It should succesfully delete the category ""', (done) => {
            requester
              .delete(`/service/category/${apiKey}`)
              .send({
                id: categoryID,
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.be.eql({});
                done();
              });
          });
        });

        describe("POST /service/create-service/:apiKey", () => {
          it("It should fail to create a service - service name not specified", (done) => {
            requester
              .post(`/service/create-service/${apiKey}`)
              .send({
                name: "",
                minutesTaken: 30,
                cost: 500,
                onlineBooking: true,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to create a service - minutes taken not specified", (done) => {
            requester
              .post(`/service/create-service/${apiKey}`)
              .send({
                name: "Test Service",
                cost: 500,
                onlineBooking: true,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to create a service - minutes taken is a string, should be number", (done) => {
            requester
              .post(`/service/create-service/${apiKey}`)
              .send({
                name: "Test Service",
                minutesTaken: "2 hours",
                cost: 500,
                onlineBooking: true,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to create a service - online booking not specified", (done) => {
            requester
              .post(`/service/create-service/${apiKey}`)
              .send({
                name: "Test Service",
                minutesTaken: 30,
                cost: 500,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to create a service - online booking not boolean", (done) => {
            requester
              .post(`/service/create-service/${apiKey}`)
              .send({
                name: "Test Service",
                onlineBooking: "hello yes please",
                minutesTaken: 30,
                cost: 500,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it('It should succesfully create a service "Test Service"', (done) => {
            requester
              .post(`/service/create-service/${apiKey}`)
              .send({
                name: "Test Service",
                onlineBooking: true,
                minutesTaken: 30,
                breakAfter: 0,
                cost: 500,
                allCalendars: true
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("adminEmail");
                done();
              });
          });

          it('It should succesfully create another service "Test Service 2"', (done) => {
            requester
              .post(`/service/create-service/${apiKey}`)
              .send({
                name: "Test Service 2",
                onlineBooking: true,
                minutesTaken: 30,
                breakAfter: 0,
                cost: 500,
                allCalendars: true
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("adminEmail");
                serviceID = res.body._id;
                done();
              });
          });
        });

        describe("POST /service/update-service/:apiKey", () => {
          it("It should fail to create a service - service name not specified", (done) => {
            requester
              .post(`/service/update-service/${apiKey}`)
              .send({
                serviceID: serviceID,
                new: {
                  name: "",
                  onlineBooking: true,
                  minutesTaken: 30,
                  cost: 500,
                },
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to create a service - minutes taken not specified", (done) => {
            requester
              .post(`/service/update-service/${apiKey}`)
              .send({
                serviceID: serviceID,
                new: {
                  name: "Test Service",
                  onlineBooking: true,
                  cost: 500,
                },
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to create a service - minutes taken is a string, should be number", (done) => {
            requester
              .post(`/service/update-service/${apiKey}`)
              .send({
                serviceID: serviceID,
                new: {
                  name: "Test Service",
                  onlineBooking: true,
                  minutesTaken: "2 hours",
                  cost: 500,
                },
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to create a service - online booking not specified", (done) => {
            requester
              .post(`/service/update-service/${apiKey}`)
              .send({
                serviceID: serviceID,
                new: {
                  name: "Test Service",
                  minutesTaken: 30,
                  cost: 500,
                },
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to update a service - online booking not boolean", (done) => {
            requester
              .post(`/service/update-service/${apiKey}`)
              .send({
                serviceID: serviceID,
                new: {
                  name: "Test Service",
                  onlineBooking: "hello yes please",
                  minutesTaken: 30,
                  cost: 500,
                },
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it('It should succesfully update a "Test Service 2" to "New Test Service"', (done) => {
            requester
              .post(`/service/update-service/${apiKey}`)
              .send({
                serviceID: serviceID,
                new: {
                  name: "New Test Service",
                  onlineBooking: true,
                  minutesTaken: 30,
                  cost: 500,
                },
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("adminEmail");
                done();
              });
          });
        });

        describe("GET /service/services/:apiKey", () => {
          it("It should succesfully get the services previously registered including the one thats created when signing up", (done) => {
            requester.get(`/service/services/${apiKey}`).end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("array");
              res.body.length.should.eql(3);
              serviceIDs = res.body.map(service => service._id)
              done();
            });
          });
        });

        describe("DELETE /service/:apiKey", () => {
          it("It should fail to delete a service because no serviceID was supplied", (done) => {
            requester.delete(`/service/${apiKey}`).end((err, res) => {
              assertUserError(res);
              done();
            });
          });

          it("It should fail to delete a service because serviceID doesnt exist", (done) => {
            requester
              .delete(`/service/${apiKey}`)
              .send({
                serviceID: "randomtextthatisntanid",
              })
              .end((err, res) => {
                res.should.have.status(500);
                res.body.should.have.property("msg");
                res.body.msg.should.be.a("string");
                done();
              });
          });

          it('It should succesfully delete the service "New Test Service"', (done) => {
            requester
              .delete(`/service/${apiKey}`)
              .send({
                serviceID: serviceID,
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.be.eql({});
                serviceIDs.filter((id) => id !== serviceID)
                done();
              });
          });
        });
      });

      let customerIDs = [];

      describe("Customer API", () => {
        describe("POST /customer/create/:apiKey", () => {
          it("It should fail to create a new customer - no name", (done) => {
            requester
              .post(`/customer/create/${apiKey}`)
              .send({
                email: "test1@email.com",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to create a new customer - no email", (done) => {
            requester
              .post(`/customer/create/${apiKey}`)
              .send({
                name: "Test 1",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it('It should succesfully create a new customer {name: "Test 1": email: "test1@email.com"}', (done) => {
            requester
              .post(`/customer/create/${apiKey}`)
              .send({
                name: "Test 1",
                email: "test1@email.com",
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("_id");
                res.body.should.have.property("name");
                res.body.name.should.be.eql("Test 1");
                customerIDs.push(res.body._id);
                done();
              });
          });

          it('It should succesfully create a new customer {name: "Test 2": email: "test2@email.com"}', (done) => {
            requester
              .post(`/customer/create/${apiKey}`)
              .send({
                name: "Test 2",
                email: "test2@email.com",
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("_id");
                res.body.should.have.property("name");
                res.body.name.should.be.eql("Test 2");
                done();
              });
          });

          it('It should succesfully create a new customer {name: "Test 3": email: "test3@email.com"}', (done) => {
            requester
              .post(`/customer/create/${apiKey}`)
              .send({
                name: "Test 3",
                email: "test3@email.com",
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("_id");
                res.body.should.have.property("name");
                res.body.name.should.be.eql("Test 3");
                customerIDs.push(res.body._id);
                done();
              });
          });
        });

        describe("POST /customer/update/:apiKey", () => {
          it("It should fail to update customer - no updates speified", (done) => {
            requester
              .post(`/customer/update/${apiKey}`)
              .send({
                customerID: customerIDs[1],
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to update customer - no update name specified", (done) => {
            requester
              .post(`/customer/update/${apiKey}`)
              .send({
                customerID: customerIDs[1],
                new: {
                  email: "newtest@email.com",
                },
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to update customer - no update email specified", (done) => {
            requester
              .post(`/customer/update/${apiKey}`)
              .send({
                customerID: customerIDs[1],
                new: {
                  name: "New Test",
                },
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it('It should succesfully update customer {name: "Test 3": email: "test3@email.com"} to {name: "New Test": email: "newtest@email.com"}', (done) => {
            requester
              .post(`/customer/update/${apiKey}`)
              .send({
                customerID: customerIDs[1],
                new: {
                  name: "New Test",
                  email: "newtest@email.com",
                },
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("_id");
                res.body.should.have.property("name");
                res.body.name.should.be.eql("Test 3");
                done();
              });
          });
        });

        describe("GET /customer/total/:apiKey", () => {
          it("It should correctly return the total number of customers", (done) => {
            requester.get(`/customer/total/${apiKey}`).end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("number");
              res.body.should.be.eql(3);
              done();
            });
          });
        });

        describe("GET /customer/list/search/:apiKey", () => {
          it("It should reject the query - no limit specified", (done) => {
            requester
              .get(
                `/customer/list/search/${apiKey}?searchTerm=te&offset=0&sortBy=-name`
              )
              .end((err, res) => {
                res.should.have.status(500);
                res.body.should.have.property("msg");
                res.body.msg.should.be.a("string");
                done();
              });
          });

          it("It should reject the query - no offset specified", (done) => {
            requester
              .get(
                `/customer/list/search/${apiKey}?searchTerm=te&limit=10&sortBy=-name`
              )
              .end((err, res) => {
                res.should.have.status(500);
                res.body.should.have.property("msg");
                res.body.msg.should.be.a("string");
                done();
              });
          });

          it("It should reject the query - no sortby specified", (done) => {
            requester
              .get(
                `/customer/list/search/${apiKey}?searchTerm=te&offset=0&limit=10`
              )
              .end((err, res) => {
                res.should.have.status(500);
                res.body.should.have.property("msg");
                res.body.msg.should.be.a("string");
                done();
              });
          });

          it("It should succesfully perform the query and all customers should be found - no search term", (done) => {
            requester
              .get(
                `/customer/list/search/${apiKey}?&offset=0&limit=10&sortBy=-name`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(3);
                done();
              });
          });

          it('It should succesfully perform the query and all customers should be found - search term "te"', (done) => {
            requester
              .get(
                `/customer/list/search/${apiKey}?&offset=0&limit=10&sortBy=-name&searchTerm=te`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(3);
                done();
              });
          });

          it('It should succesfully perform the query and 2 customers should be found - search term "te", limit 2', (done) => {
            requester
              .get(
                `/customer/list/search/${apiKey}?&offset=0&limit=2&sortBy=-name&searchTerm=te`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(2);
                done();
              });
          });
        });

        describe("DELETE /customer/:apiKey", () => {
          it("It should fail to delete since no customerID is specified", (done) => {
            requester.delete(`/customer/${apiKey}`).end((err, res) => {
              assertUserError(res);
              done();
            });
          });

          it("It should fail to delete since customerID doesnt exist", (done) => {
            requester
              .delete(`/customer/${apiKey}`)
              .send({
                customerID: "isntred",
              })
              .end((err, res) => {
                res.should.have.status(500);
                res.body.should.have.property("msg");
                res.body.msg.should.be.a("string");
                done();
              });
          });

          it('It should succesfully delete customer with name "New Test"', (done) => {
            requester
              .delete(`/customer/${apiKey}`)
              .send({
                customerID: customerIDs[1],
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("name");
                res.body.name.should.be.eql("New Test");
                done();
              });
          });
        });
      });     

      describe("Calendar API", () => {
        describe("GET /calendar/max-allowed/:apiKey", () => {
          it("It should succesfully get the max allowed calendars, which should be 1 for the free test account", (done) => {
            requester.get(`/calendar/max-allowed/${apiKey}`).end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("number");
              res.body.should.be.eql(1);
              done();
            });
          });
        });

        describe("GET /calendar/all/:apiKey", () => {
          it("It should succesfully return all registered calendars, this should be just 1 that is registered when the account is made", (done) => {
            requester.get(`/calendar/all/${apiKey}`).end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("array");
              res.body.length.should.be.eql(1);
              calendarIDs.push(res.body[0].calendarID);
              done();
            });
          });
        });

        describe("POST /calendar/update/:apiKey", () => {
          it("It should fail to update because no calendarID was provided", (done) => {
            requester
              .post(`/calendar/update/${apiKey}`)
              .send({
                new: {
                  name: "New Test Name",
                },
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should succesfully update", (done) => {
            requester
              .post(`/calendar/update/${apiKey}`)
              .send({
                calendarID: calendarIDs[0],
                new: {
                  name: "New Test Name",
                },
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property("calendarID");
                res.body.calendarID.should.be.eql(calendarIDs[0]);
                done();
              });
          });
        });

        describe("DELETE /calendar/:apiKey", () => {
          it("It should fail deleting the default calendar because no calendar ID was provided", (done) => {
            requester.delete(`/calendar/${apiKey}`).end((err, res) => {
              assertUserError(res);
              done();
            });
          });

          it("It should succesfully delete the default calendar", (done) => {
            requester
              .delete(`/calendar/${apiKey}`)
              .send({
                calendarID: calendarIDs[0],
              })
              .end((err, res) => {
                res.should.have.status(200);
                done();
              });
          });
        });

        describe("POST /calendar/create/:apiKey", () => {
          it("It should succesfully create a new default calendar", (done) => {
            requester.post(`/calendar/create/${apiKey}`).end((err, res) => {
              res.should.have.status(200);
              res.body.should.not.have.property("msg");
              res.body.should.have.property("calendarID");
              calendarIDs.push(res.body.calendarID);
              done();
            });
          });

          it("It should fail creating another default calendar - max allowed is 1", (done) => {
            requester.post(`/calendar/create/${apiKey}`).end((err, res) => {
              res.should.have.status(500);
              res.body.should.have.property("msg");
              res.body.msg.should.be.a("string");
              done();
            });
          });
        });

        describe("POST /calendar/update/:apiKey", () => {
          
          it("It should succesfully update the newly created calendar to a special schedule this week thats open all days nnad while we are at it we should set it open all days every week", (done) => {
            requester
              .post(`/calendar/update/${apiKey}`)
              .send({
                calendarID: calendarIDs[1],
                new: {
                  schedule: {
                    scheduleType: "weekly",
                    specialWeek: specialSchedule,
                    weeklySchedule: specialSchedule.schedule,
                  },
                },
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property("calendarID");
                res.body.calendarID.should.be.eql(calendarIDs[1]);
                done();
              });
          });
        });

        describe("GET /calendar/by-id/:apiKey/:calendarID", () => {
          it("It should fail to fetch a calendar since the calendar was previously deleted", (done) => {
            requester
              .get(`/calendar/by-id/${apiKey}/${calendarIDs[0]}`)
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should succesfully fetch the calendar since it was just created and should verify all the updates", (done) => {
            requester
              .get(`/calendar/by-id/${apiKey}/${calendarIDs[1]}`)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property("calendarID");
                res.body.calendarID.should.be.eql(calendarIDs[1]);
                res.body.schedule.should.have.property("scheduleType");
                res.body.schedule.scheduleType.should.be.eql("weekly");
                res.body.schedule.should.have.property("specialWeek");
                res.body.schedule.specialWeek[0].should.have.property("schedule");
                res.body.schedule.specialWeek[0].should.have.property("week");
                res.body.schedule.specialWeek[0].week.should.be.eql(
                  dayjs.utc().week()
                );
                res.body.schedule.specialWeek[0].schedule.forEach(
                  (schedule, i) => {
                    schedule.should.have.property("day");
                    schedule.day.should.be.eql(i);
                    schedule.schedule.open.should.be.eql(true);
                  }
                );
                done();
              });
          });
        });
        let pictureURL;
        describe("POST /calendar/upload-avatar/:apiKey/:calendarID", () => {
          it("It should fail to upload an avatar - wrong format (svg)", (done) => {
            requester
              .post(`/calendar/upload-avatar/${apiKey}/${calendarIDs[1]}`)
              .attach("avatar", "public/search.svg")
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should succesfully upload an avatar", (done) => {
            requester
              .post(`/calendar/upload-avatar/${apiKey}/${calendarIDs[1]}`)
              .attach("avatar", "public/default-profile.png")
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property("pictureURL");
                pictureURL = res.body.pictureURL;
                done();
              });
          });
        });

        describe("GET /calendar/avatars/:apiKey", () => {
          it("it should succesfully get an array with one url to the avatar previosuly uploaded", (done) => {
            requester.get(`/calendar/avatars/${apiKey}`).end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("array");
              res.body.length.should.be.eql(1);
              res.body[0] = pictureURL;
              done();
            });
          });
        });

        describe("DELETE /calendar/avatar/:apiKey", () => {
          it("It should delete the avatar previously uploaded", (done) => {
            requester
              .delete(`/calendar/avatar/${apiKey}`)
              .send({ pictureURL })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.eql({});
                done();
              });
          });
        });

        describe("GET /calendar/avatars/:apiKey", () => {
          it("it should succesfully get an array with no urls since the avatar was deleated", (done) => {
            requester.get(`/calendar/avatars/${apiKey}`).end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("array");
              res.body.length.should.be.eql(0);
              done();
            });
          });
        });
      });

      describe("Appointment API", () => {
        let tomorrowAt1330 = dayjs
          .utc()
          .add(1, "day")
          .set("hour", 13)
          .set("minute", 30)
          .startOf("minute")
          .toJSON();
        let tomorrowAt1400 = dayjs
          .utc()
          .add(1, "day")
          .set("hour", 14)
          .set("minute", 0)
          .startOf("minute")
          .toJSON();
        let tomorrowAt1430 = dayjs
          .utc()
          .add(1, "day")
          .set("hour", 14)
          .set("minute", 30)
          .startOf("minute")
          .toJSON();
        let appointmentIDs = [];
        describe("POST /appointment/create/:apiKey/:calendarID", () => {
          it("It should fail to register an appointment - no calendar specified to handle appointment", (done) => {
            requester
              .post(`/appointment/create/${apiKey}/`)
              .send({
                customerID: customerIDs[0],
                service: "Test Service",
                startTime: tomorrowAt1400,
                endTime: tomorrowAt1430,
              })
              .end((err, res) => {
                res.should.have.status(404);
                done();
              });
          });

          it("It should fail to register an appointment - no customer ID specified", (done) => {
            requester
              .post(`/appointment/create/${apiKey}/${calendarIDs[1]}`)
              .send({
                service: "Test Service",
                startTime: tomorrowAt1400,
                endTime: tomorrowAt1430,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to register an appointment - customer not found", (done) => {
            requester
              .post(`/appointment/create/${apiKey}/${calendarIDs[1]}`)
              .send({
                customerID: "ThisisnotacustomerID",
                service: "Test Service",
                startTime: tomorrowAt1400,
                endTime: tomorrowAt1430,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to register an appointment - no start time specified", (done) => {
            requester
              .post(`/appointment/create/${apiKey}/${calendarIDs[1]}`)
              .send({
                customerID: customerIDs[0],
                service: "Test Service",
                endTime: tomorrowAt1430,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to register an appointment - no end time specified", (done) => {
            requester
              .post(`/appointment/create/${apiKey}/${calendarIDs[1]}`)
              .send({
                customerID: customerIDs[0],
                service: "Test Service",
                startTime: tomorrowAt1400,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to register an appointment - end time is before start time", (done) => {
            requester
              .post(`/appointment/create/${apiKey}/${calendarIDs[1]}`)
              .send({
                customerID: customerIDs[0],
                service: "Test Service",
                startTime: tomorrowAt1400,
                endTime: tomorrowAt1330,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to register an appointment - outside calendar opening hours", (done) => {
            requester
              .post(`/appointment/create/${apiKey}/${calendarIDs[1]}`)
              .send({
                customerID: customerIDs[0],
                service: "Test Service",
                startTime: dayjs.utc(tomorrowAt1400).add(3, "hours").toJSON(),
                endTime: dayjs.utc(tomorrowAt1430).add(3, "hours").toJSON(),
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should succesfully register an appointment tomorrow at 14:00 to 14:30", (done) => {
            requester
              .post(`/appointment/create/${apiKey}/${calendarIDs[1]}`)
              .send({
                customerID: customerIDs[0],
                service: "Test Service",
                startTime: tomorrowAt1400,
                endTime: tomorrowAt1430,
              })
              .end((err, res) => {
                console.log(res.body.msg)
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                
                res.body.should.have.property("startTime");
                dayjs
                  .utc(res.body.startTime)
                  .toJSON()
                  .should.be.eql(tomorrowAt1400);
                res.body.should.have.property("calendarID");
                res.body.calendarID.should.be.eql(calendarIDs[1]);
                appointmentIDs.push(res.body._id);
                done();
              });
          });

          it("It should succesfully register an appointment in 1 month at 14:00 to 14:30", (done) => {
            requester
              .post(`/appointment/create/${apiKey}/${calendarIDs[1]}`)
              .send({
                customerID: customerIDs[0],
                service: "Test Service",
                startTime: dayjs.utc(tomorrowAt1400).add(1, "month").toJSON(),
                endTime: dayjs.utc(tomorrowAt1430).add(1, "month").toJSON(),
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                res.body.should.have.property("startTime");
                dayjs
                  .utc(res.body.startTime)
                  .toJSON()
                  .should.be.eql(
                    dayjs.utc(tomorrowAt1400).add(1, "month").toJSON()
                  );
                res.body.should.have.property("calendarID");
                res.body.calendarID.should.be.eql(calendarIDs[1]);
                appointmentIDs.push(res.body._id);
                done();
              });
          });

          it("It should fail to register another appointment in 1 month at 14:00 to 14:30 - calendar already has an appointment", (done) => {
            requester
              .post(`/appointment/create/${apiKey}/${calendarIDs[1]}`)
              .send({
                customerID: customerIDs[0],
                service: "Test Service",
                startTime: dayjs.utc(tomorrowAt1400).add(1, "month").toJSON(),
                endTime: dayjs.utc(tomorrowAt1430).add(1, "month").toJSON(),
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });
        });

        describe("GET /appointment/all/:apiKey/:calendarID", () => {
          it("It Should get the 2 previously registered appointments - no calendarID", (done) => {
            requester.get(`/appointment/all/${apiKey}`).end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a("array");
              res.body.length.should.be.eql(2);
              res.body[0].should.have.property("startTime");
              res.body[0].should.have.property("calendarID");
              res.body[0].calendarID.should.be.eql(calendarIDs[1]);
              done();
            });
          });

          it("It Should get the 2 previously registered appointments - calendarID specific", (done) => {
            requester
              .get(`/appointment/all/${apiKey}/${calendarIDs[1]}`)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(2);
                res.body[0].should.have.property("startTime");
                res.body[0].should.have.property("calendarID");
                res.body[0].calendarID.should.be.eql(calendarIDs[1]);
                done();
              });
          });
        });

        describe("GET /appointment/on-day/:apiKey/:dateInJSON/:calendarID", () => {
          it("It Should make a succesfull request but get no appointments since none were registered today - no calendarID", (done) => {
            requester
              .get(
                `/appointment/on-day/${apiKey}/${dayjs
                  .utc()
                  .toJSON()
                  .slice(0, 10)}`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(0);
                done();
              });
          });

          it("It Should get the 1 previously registered appointment tomorrow - no calendarID", (done) => {
            requester
              .get(
                `/appointment/on-day/${apiKey}/${dayjs
                  .utc()
                  .add(1, "day")
                  .toJSON()
                  .slice(0, 10)}`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property("startTime");
                res.body[0].should.have.property("calendarID");
                res.body[0].calendarID.should.be.eql(calendarIDs[1]);
                done();
              });
          });

          it("It Should get the 1 previously registered appointment tomorrow - calendarID specific", (done) => {
            requester
              .get(
                `/appointment/on-day/${apiKey}/${dayjs
                  .utc()
                  .add(1, "day")
                  .toJSON()
                  .slice(0, 10)}/${calendarIDs[1]}`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property("startTime");
                res.body[0].should.have.property("calendarID");
                res.body[0].calendarID.should.be.eql(calendarIDs[1]);
                done();
              });
          });
        });

        describe("GET /appointment/in-week/:apiKey/:dateInJSON/:calendarID", () => {
          it("It Should get the 1 previously registered appointment in 1 month - no calendarID", (done) => {
            requester
              .get(
                `/appointment/in-week/${apiKey}/${dayjs
                  .utc()
                  .add(1, "month")
                  .toJSON()
                  .slice(0, 10)}`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property("startTime");
                res.body[0].should.have.property("calendarID");
                res.body[0].calendarID.should.be.eql(calendarIDs[1]);
                done();
              });
          });

          it("It Should get the 1 previously registered appointment in 1 month - calendarID specific", (done) => {
            requester
              .get(
                `/appointment/in-week/${apiKey}/${dayjs
                  .utc()
                  .add(1, "month")
                  .toJSON()
                  .slice(0, 10)}/${calendarIDs[1]}`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property("startTime");
                res.body[0].should.have.property("calendarID");
                res.body[0].calendarID.should.be.eql(calendarIDs[1]);
                done();
              });
          });
        });

        describe("GET /appointment/in-month/:apiKey/:dateInJSON/:calendarID", () => {
          it("It Should get the 1 previously registered appointment in the month - no calendarID", (done) => {
            requester
              .get(
                `/appointment/in-month/${apiKey}/${dayjs
                  .utc()
                  .toJSON()
                  .slice(0, 10)}`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property("startTime");
                res.body[0].should.have.property("calendarID");
                res.body[0].calendarID.should.be.eql(calendarIDs[1]);
                done();
              });
          });

          it("It Should get the 1 previously registered appointment in the month - calendarID specific", (done) => {
            requester
              .get(
                `/appointment/in-month/${apiKey}/${dayjs
                  .utc()
                  .toJSON()
                  .slice(0, 10)}/${calendarIDs[1]}`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property("startTime");
                res.body[0].should.have.property("calendarID");
                res.body[0].calendarID.should.be.eql(calendarIDs[1]);
                done();
              });
          });

          it("It Should get the 1 previously registered appointment in the NEXT month - no calendarID", (done) => {
            requester
              .get(
                `/appointment/in-month/${apiKey}/${dayjs
                  .utc()
                  .add(1, "month")
                  .toJSON()
                  .slice(0, 10)}`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                res.body.length.should.be.eql(1);
                res.body[0].should.have.property("startTime");
                res.body[0].should.have.property("calendarID");
                res.body[0].calendarID.should.be.eql(calendarIDs[1]);
                done();
              });
          });
        });

        describe("POST /appointment/update/:apiKey/:calendarID/:appointmentID", () => {
          it("It should fail to update an appointment - customer not found", (done) => {
            requester
              .post(
                `/appointment/update/${apiKey}/${calendarIDs[1]}/${appointmentIDs[0]}`
              )
              .send({
                customerID: "ThisisnotacustomerID",
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to update an appointment - end time is before start time", (done) => {
            requester
              .post(
                `/appointment/update/${apiKey}/${calendarIDs[1]}/${appointmentIDs[0]}`
              )
              .send({
                startTime: tomorrowAt1400,
                endTime: tomorrowAt1330,
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to update an appointment - outside calendar opening hours", (done) => {
            requester
              .post(
                `/appointment/update/${apiKey}/${calendarIDs[1]}/${appointmentIDs[0]}`
              )
              .send({
                startTime: dayjs.utc(tomorrowAt1400).add(3, "hours").toJSON(),
                endTime: dayjs.utc(tomorrowAt1430).add(3, "hours").toJSON(),
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });

          it("It should fail to update - no appoinment ID", (done) => {
            requester
              .post(`/appointment/update/${apiKey}/${calendarIDs[1]}/`)
              .send({
                customerID: customerIDs[0],
                service: "Test Service",
                startTime: tomorrowAt1400,
                endTime: tomorrowAt1430,
              })
              .end((err, res) => {
                res.should.have.status(404);
                done();
              });
          });

          it("It should succesfully update the appointment tomorrow at 14:00 to 14:30 by postponing it 1 day", (done) => {
            requester
              .post(
                `/appointment/update/${apiKey}/${calendarIDs[1]}/${appointmentIDs[0]}`
              )
              .send({
                customerID: customerIDs[0],
                service: "Test Service",
                startTime: dayjs.utc(tomorrowAt1400).add(1, "day").toJSON(),
                endTime: dayjs.utc(tomorrowAt1430).add(1, "day").toJSON(),
              })
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.not.have.property("msg");
                appointmentIDs.push(res.body._id);
                done();
              });
          });

          it("It should fail to update the appointment again by adding 1 month - calendar already has an appointment", (done) => {
            requester
              .post(
                `/appointment/update/${apiKey}/${calendarIDs[1]}/${appointmentIDs[0]}`
              )
              .send({
                startTime: dayjs.utc(tomorrowAt1400).add(1, "month").toJSON(),
                endTime: dayjs.utc(tomorrowAt1430).add(1, "month").toJSON(),
              })
              .end((err, res) => {
                assertUserError(res);
                done();
              });
          });
        });

        describe("DELETE /appointment/:apiKey/:appointmentID", () => {
          it("It should succesfully delete the appointment tomorrow", (done) => {
            requester
              .delete(`/appointment/${apiKey}/${appointmentIDs[0]}`)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.eql({});
                done();
              });
          });
        });

        describe("GET /appointment/in-year/:apiKey/:dateInJSON/:calendarID", () => {
          it("It Should get the 1 previously registered appointments in this year and confirm the others deletion unless its December since the last appointment is in a month - no calendarID", (done) => {
            requester
              .get(
                `/appointment/in-year/${apiKey}/${dayjs
                  .utc()
                  .toJSON()
                  .slice(0, 10)}/${calendarIDs[1]}`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                if (dayjs.utc().month() !== 11)
                {
                  res.body.length.should.be.eql(1);
                  res.body[0].should.have.property("startTime");
                  res.body[0].should.have.property("calendarID");
                  res.body[0].calendarID.should.be.eql(calendarIDs[1]);
                } else
                {
                  res.body.length.should.be.eql(0);
                }
                
                done();
              });
          });

          it("It Should get the 1 previously registered appointments in this year and confirm the others deletion unless its December since the last appointment is in a month - calendarID specific", (done) => {
            requester
              .get(
                `/appointment/in-year/${apiKey}/${dayjs
                  .utc()
                  .toJSON()
                  .slice(0, 10)}/${calendarIDs[1]}`
              )
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a("array");
                if (dayjs.utc().month() !== 11)
                {
                  res.body.length.should.be.eql(1);
                  res.body[0].should.have.property("startTime");
                  res.body[0].should.have.property("calendarID");
                  res.body[0].calendarID.should.be.eql(calendarIDs[1]);
                } else
                {
                  res.body.length.should.be.eql(0);
                }
                done();
              });
          });
        });
      });
    });

    let priceID = 'price_1HkCLZJiYaX7uDQzqHRrCQRb';
    let customerID;
    describe("Test upgrading and premium features", () => {
      const workingCard = {
        number: '4000000000000077',
        exp_month: 11,
        exp_year: 2021,
        cvc: '314',
      }

      const noFundsCard = {
        number: '4000000000009995',
        exp_month: 11,
        exp_year: 2021,
        cvc: '314',
      }

      describe("Authorization API", () => {
        it("It should verify that a stripeCustomerID exists", (done) =>
        {
          requester
            .get(`/auth/verify-key/${apiKey}`)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.have.property("stripeCustomerID");
              customerID = res.body.stripeCustomerID
              done();
            });
        })

        it("It should attempt to create a subscription but fail due to lack of funds", (done) =>
        {
          stripe.paymentMethods
            .create({
              type: 'card',
              card: noFundsCard,
            }).then((paymentMethod) =>
            {
              requester
                .post(`/auth/createSubscription/${apiKey}`)
                .send({
                  customerId: customerID,
                  paymentMethodId: paymentMethod.id,
                  priceId: priceID,
                  quantity: 2
                })
                .end((err, res) => {
                  res.should.have.status(402);
                  res.body.should.have.property("msg");
                  done();
                });
            })
        })
      
        it("It should succesfully upgrade to a premium subscription with 2 calendars", (done) =>
        {
          stripe.paymentMethods
            .create({
              type: 'card',
              card: workingCard,
            })
            .then((paymentMethod) =>
            {
              requester
                .post(`/auth/createSubscription/${apiKey}`)
                .send({
                  customerId: customerID,
                  paymentMethodId: paymentMethod.id,
                  priceId: priceID,
                  quantity: 2
                })
                .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.have.property("id");
                  res.body.should.have.property("quantity");
                  res.body.quantity.should.be.eql(2)
                  done();
                });
            })
        })
      
        
      }) 
    });
  });

  describe("Client API", () =>
  {
    let requester = chai.request("http://localhost:8378/client");
    let thisWeek = [dayjs.utc().day(1)] 
    
    for (let i = 1; i < 7; i++) thisWeek.push(thisWeek[0].add(i, 'days'))
    thisWeek = thisWeek.map(date => date.toJSON())

    describe('GET /theme/:domainPrefix', () =>
    {
      it("It should get the correct theme for the client", (done) =>
      {
        requester.get(`/theme/${bookingSettings.domainPrefix}`).end((err, res) =>
        {
          res.should.have.status(200)
          res.body.should.have.property('bookingSettings')
          res.body.bookingSettings.should.have.property('domainPrefix')
          res.body.bookingSettings.domainPrefix.should.be.eql(bookingSettings.domainPrefix)
          done()
        })
      })

      it("It should attempt to get a nonexistent theme and return a 404", (done) =>
      {
        requester.get(`/theme/notarealsubdomain`).end((err, res) =>
        {
          res.should.have.status(404)
          done()
        })
      })
    })
  
    describe('POST /closed-dates/:domainPrefix', () => 
    {
      it('It should succesfully get the number of closed dates in the speial schedule this week - 0', (done) =>
      {
        requester
          .post(`/closed-dates/${bookingSettings.domainPrefix}`)
          .send({dateArray: thisWeek})
          .end((err, res) =>
          {
            res.should.have.status(200)
            res.body.length.should.be.eql(0)
            done()
          }) 
      })
    })
    
    const today = dayjs.utc()
    
    describe('GET /available-times/:domainPrefix/:serviceID/:date', () => {
      it('It should fail to get the available times today - nonexistent serviceID', (done) =>
      {
        requester
          .get(`/available-times/${bookingSettings.domainPrefix}/notaserviceID/${today.format('DD-MM-YYYY')}`)
          .end((err, res) =>
          {
            assertUserError(res)
            done()
          })
      })
      
      it('It should get the available times today', (done) =>
      {
        requester
          .get(`/available-times/${bookingSettings.domainPrefix}/${serviceIDs[0]}/${today.format('MM-DD-YYYY')}`)
          .end((err, res) =>
          {
            res.should.have.status(200)

            let todaysSchedule = specialSchedule.schedule.filter((day => day.day === today.day()))[0].schedule
            let {
              startOfWork,
              endOfWork
            } = todaysSchedule

            startOfWork = today.set('hour', startOfWork.hour).set('minute', startOfWork.minute).set('seconds', 0).set('ms', 0)
            endOfWork = today.set('hour', endOfWork.hour).set('minute', endOfWork.minute).set('seconds', 0).set('ms', 0)

            let numberOfReceivedTimes = res.body[0].availableTimes.length

            let actualValidTimes = res.body[0].availableTimes.filter((time) => 
            {
              const {
                startTime,
                endTime
              } = time

              if (dayjs.utc(startTime).isSameOrAfter(startOfWork) && dayjs.utc(endTime).isSameOrBefore(endOfWork))
              {
                if (dayjs.utc().add(bookingSettings.latestBookingBefore, 'minutes').isSameOrBefore(startTime)) return true
                else return false
              } else return false
            })

            numberOfReceivedTimes.should.eql(actualValidTimes.length)

            done()
          })
      })

      it('It should get the available times a day in the future', (done) =>
      {
        requester
          .get(`/available-times/${bookingSettings.domainPrefix}/${serviceIDs[0]}/${today.add(14, 'days').day(3).format('MM-DD-YYYY')}`)
          .end((err, res) =>
          {
            res.should.have.status(200)
            res.body[0].availableTimes.length.should.be.eql(16)
            done()
          })
      })
    
      it('It should get the available times too far in the future and should return no valid times', (done) =>
      {
        requester
        .get(`/available-times/${bookingSettings.domainPrefix}/${serviceIDs[0]}/${today.add(bookingSettings.maxDaysBookAhead + 1, 'days').format('MM-DD-YYYY')}`)
        .end((err, res) =>
        {
          res.should.have.status(200)
          res.body.forEach(calendar => calendar.availableTimes.length.should.be.eql(0))
          done()
        })
        
      })
    })
    
    const newCustomer = {
      name: 'Test Booking Kunde',
      email: 'testbooking@email.com'
    }

    describe('POST /new-appointment/:domainPrefix', () => {
      it('It should fail to register a new appointment - no calendarID', (done) =>
      {
        requester
          .post(`/new-appointment/${bookingSettings.domainPrefix}`)
          .send({
            service: serviceIDs[0],
            time: today.add(14, 'days').day(3).hour(10).minute(30).toJSON(),
            customer: newCustomer
          })
          .end((err, res) =>
          {
            assertUserError(res)
            done()
          })
      })

      it('It should fail to register a new appointment - invalid calendarID', (done) =>
      {
        requester
          .post(`/new-appointment/${bookingSettings.domainPrefix}`)
          .send({
            service: serviceIDs[0],
            calendar: 'NotARealCalendarID',
            time: today.add(14, 'days').day(3).hour(10).minute(30).toJSON(),
            customer: newCustomer
          })
          .end((err, res) =>
          {
            assertUserError(res)
            done()
          })
      })

      it('It should fail to register a new appointment - no serviceID', (done) =>
      {
        requester
          .post(`/new-appointment/${bookingSettings.domainPrefix}`)
          .send({
            calendar: calendarIDs[1],
            time: today.add(14, 'days').day(3).hour(10).minute(30).toJSON(),
            customer: newCustomer
          })
          .end((err, res) =>
          {
            assertUserError(res)
            done()
          })
      })

      it('It should fail to register a new appointment - invalid serviceID', (done) =>
      {
        requester
          .post(`/new-appointment/${bookingSettings.domainPrefix}`)
          .send({
            calendar: calendarIDs[1],
            service: 'NotARealServiceID',
            time: today.add(14, 'days').day(3).hour(10).minute(30).toJSON(),
            customer: newCustomer
          })
          .end((err, res) =>
          {
            assertUserError(res)
            done()
          })
      })

      it('It should fail to register a new appointment - no time specified', (done) =>
      {
        requester
          .post(`/new-appointment/${bookingSettings.domainPrefix}`)
          .send({
            calendar: calendarIDs[1],
            service: serviceIDs[0],
            customer: newCustomer
          })
          .end((err, res) =>
          {
            assertUserError(res)
            done()
          })
      })

      it('It should fail to register a new appointment - time too far in the future', (done) =>
      {
        requester
          .post(`/new-appointment/${bookingSettings.domainPrefix}`)
          .send({
            calendar: calendarIDs[1],
            service: serviceIDs[0],
            time: today.add(bookingSettings.maxDaysBookAhead + 1, 'days').toJSON(),
            customer: newCustomer
          })
          .end((err, res) =>
          {
            assertUserError(res)
            done()
          })
      })
      
      it('It should fail to register a new appointment - no customer information specified', (done) =>
      {
        requester
          .post(`/new-appointment/${bookingSettings.domainPrefix}`)
          .send({
            calendar: calendarIDs[1],
            service: serviceIDs[0],
            time: today.add(14, 'days').day(3).hour(10).minute(30).toJSON()
          })
          .end((err, res) =>
          {
            assertUserError(res)
            done()
          })
      })

      it('It should succesfully book an appointment', (done) =>
      {
        requester
          .post(`/new-appointment/${bookingSettings.domainPrefix}`)
          .send({
            calendar: calendarIDs[1],
            service: serviceIDs[0],
            time: today.add(14, 'days').day(3).hour(10).minute(30).toJSON(),
            customer: newCustomer
          })
          .end((err, res) =>
          {
            console.log({
              calendar: calendarIDs[1],
              service: serviceIDs[0],
              time: today.add(14, 'days').day(3).hour(10).minute(30).toJSON(),
              customer: newCustomer
            }, 'body');
            console.log(`/new-appointment/${bookingSettings.domainPrefix}`, 'URI');
            console.log(newCustomer, 'customer');
            res.should.have.status(200)
            res.body.should.not.have.property('msg')
            res.body.startTime.should.be.eql(today.add(14, 'days').day(3).hour(10).minute(30).toJSON())
            res.body.date.should.be.eql(today.add(14, 'days').day(3).hour(10).minute(30).toJSON().slice(0, 10))
            done()
          })
      })

      it('It should fail to book an appointment at the same time again', (done) =>
      {
        requester
          .post(`/new-appointment/${bookingSettings.domainPrefix}`)
          .send({
            calendar: calendarIDs[1],
            service: serviceIDs[0],
            time: today.add(14, 'days').day(3).hour(10).minute(30).toJSON(),
            customer: newCustomer
          })
          .end((err, res) =>
          {
            assertUserError(res)
            done()
          })
      })

      it('It should succesfully book another appointment 2 hours later', (done) =>
      {
        requester
          .post(`/new-appointment/${bookingSettings.domainPrefix}`)
          .send({
            calendar: calendarIDs[1],
            service: serviceIDs[0],
            time: today.add(14, 'days').day(3).hour(12).minute(30).toJSON(),
            customer: newCustomer
          })
          .end((err, res) =>
          {
            console.log(res.body, 'body');
            console.log(`/new-appointment/${bookingSettings.domainPrefix}`, 'URI');
            console.log(newCustomer, 'customer');
            res.should.have.status(200)
            res.body.should.not.have.property('msg')
            res.body.startTime.should.be.eql(today.add(14, 'days').day(3).hour(12).minute(30).toJSON())
            res.body.date.should.be.eql(today.add(14, 'days').day(3).hour(12).minute(30).toJSON().slice(0, 10))
            done()
          })
      })
    })
  
  })
})



