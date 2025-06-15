import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Gadget from "../models/Gadget.js";
import Fragrance from "../models/Fragrance.js";

// @desc Confirm order (checkout from cart)
// @route POST /api/orders/confirm
// @access Private
export const confirmOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingInfo } = req.body;

    // Validation for shippingInfo
    if (
      !shippingInfo ||
      !shippingInfo.firstName ||
      !shippingInfo.lastName ||
      !shippingInfo.phone ||
      !shippingInfo.address ||
      !shippingInfo.city
    ) {
      return res
        .status(400)
        .json({ message: "Incomplete shipping information" });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const orderItems = [];
    let totalPrice = 0;

    for (let item of cart.items) {
      const productId = item.product._id;

      let product =
        (await Product.findById(productId)) ||
        (await Gadget.findById(productId)) ||
        (await Fragrance.findById(productId));

      if (!product) {
        return res.status(404).json({ message: `Product not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
          availableStock: product.stock,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      totalPrice += product.price * item.quantity;
    }

    const newOrder = new Order({
      user: userId,
      shippingInfo,
      items: orderItems,
      totalPrice,
      paymentMethod: "Cash on Delivery",
      status: "Pending",
    });

    await newOrder.save();

    // Reduce stock
    for (let item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
      await Gadget.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
      await Fragrance.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    await Cart.findOneAndUpdate({ user: userId }, { items: [] });

    res.status(201).json({
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Order confirmation error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// @desc Get all user orders
// @route GET /api/orders
// @access Private
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get order by ID
// @route GET /api/orders/:id
// @access Private
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params; // Changed from orderId to id
    const order = await Order.findById(id).populate(
      "items.product",
      "name price"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc Cancel order (Only if status is pending)
// @route DELETE /api/orders/:orderId/cancel
// @access Private
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Only pending orders can be canceled" });
    }

    // Restore stock when order is canceled
    for (let item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    // Remove order from database
    await Order.findByIdAndDelete(orderId);

    res.json({ message: "Order canceled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all orders (Admin only)
// @route GET /api/orders/all
// @access Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// @desc Update order status
// @route PUT /api/orders/:orderId/status
// @access Admin (or authorized user)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate new status
    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update status
    order.status = status;
    await order.save();

    res.status(200).json({
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};