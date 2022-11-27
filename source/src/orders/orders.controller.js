const { stat } = require("fs");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Validation functions
function orderExists(req, res, next) {
  const { orderId } = req.params;

  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found ${orderId}`,
  });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: propertyName });
  };
}

function dishPropertyIsValid(req, res, next) {
  //Dish property must exist AND must be an Array Object AND Dish isn't empty
  const { data: { dishes } = {} } = req.body;

  if (dishes && Array.isArray(dishes) && dishes.length != 0) {
    res.locals.dishes = dishes;
    return next();
  }

  next({
    status: 400,
    message: `dish`,
  });
}

function quantityPropertyIsValid(req, res, next) {
  //dishes' Quantity property must exist AND must be an integer AND must be more than 1 unit

  const dishes = res.locals.dishes;

  dishes.forEach(function (dish, index) {
    if (
      !dish.quantity ||
      !Number.isInteger(dish.quantity) ||
      !(dish.quantity > 0)
    ) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  return next();
}

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res, next) {
  res.json({ data: orders });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };

  orders.push(newOrder);

  res.status(201).json({ data: newOrder });
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    dishPropertyIsValid,
    quantityPropertyIsValid,
    create,
  ],
  read: [orderExists, read],
};
