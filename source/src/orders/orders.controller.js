const { dirxml } = require("console");
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
    next({ status: 400, message: `Order must include a ${propertyName}` });
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

function idMatches(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (!id) {
    return next();
  }
  if (id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  return next();
}

function statusIsValid(req, res, next) {
  const { data = {} } = req.body;

  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];

  if (validStatus.includes(data[`status`])) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

function statusIsDelivered(req, res, next) {
  const { data = {} } = req.body;
  if (data[`status`] !== "delivered") {
    return next();
  }
  next({
    status: 400,
    message: `A delivered order cannot be changed`,
  });
}

function isOrderPending(req, res, next) {
  //If so, delete
  if (res.locals.order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending. `,
  });
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

function update(req, res, next) {
  const order = res.locals.order;

  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.id = req.params.orderId;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);

  const deletedOrders = orders.splice(index, 1);

  res.sendStatus(204);
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
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    idMatches,
    statusIsValid,
    dishPropertyIsValid,
    quantityPropertyIsValid,
    statusIsDelivered,
    update,
  ],
  delete: [orderExists, isOrderPending, destroy],
};
