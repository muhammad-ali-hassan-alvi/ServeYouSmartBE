import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Gadget from "../models/Gadget.js";
import mongoose from "mongoose";
import Fragrance from "../models/Fragrance.js";

// @desc    Create or update user's cart
// @route   POST /api/carts
// @access  Private
export const createOrUpdateCart = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user._id;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Items array is required" });
    }

    // Validate all items first
    for (const item of items) {
      if (
        !item.productId ||
        !item.quantity ||
        item.quantity <= 0 ||
        !item.category
      ) {
        return res.status(400).json({
          message:
            "Each item must have productId, positive quantity, and category",
        });
      }

      let productModel;
      switch (item.category) {
        case "Product":
        case "Interior":
        case "Exterior":
        case "Test":
          productModel = Product;
          break;
        case "Gadget":
          productModel = Gadget;
          break;
        case "Fragrance":
          productModel = Fragrance;
          break;
        default:
          return res
            .status(400)
            .json({ message: `Invalid category: ${item.category}` });
      }

      const product = await productModel.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.productId}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${product.name}`,
          productId: item.productId,
          availableStock: product.stock,
        });
      }
    }

    // Prepare cart items
    const cartItems = await Promise.all(
      items.map(async (item) => {
        let productModel;
        switch (item.category) {
          case "Product":
          case "Interior":
          case "Exterior":
          case "Test":
            productModel = Product;
            break;
          case "Gadget":
            productModel = Gadget;
            break;
          case "Fragrance":
            productModel = Fragrance;
            break;
        }

        const product = await productModel.findById(item.productId);

        return {
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: item.category,
          },
          quantity: item.quantity,
        };
      })
    );

    // Update or create cart
    let cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = cartItems;
    } else {
      cart = new Cart({ user: userId, items: cartItems });
    }

    await cart.save();

    res.status(200).json({
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    console.error("Cart update error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/carts/items
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity, category } = req.body;
    const userId = req.user._id;

    // Validate all required fields
    if (!productId || !quantity || quantity <= 0 || !category) {
      return res.status(400).json({
        message: "productId, category and positive quantity are required",
      });
    }

    // Determine the correct product model based on category
    let productModel;
    switch (category) {
      case "Product":
      case "Interior":
      case "Exterior":
      case "Test":
        productModel = Product;
        break;
      case "Gadget":
        productModel = Gadget;
        break;
      case "Fragrance":
        productModel = Fragrance;
        break;
      default:
        return res.status(400).json({ message: "Invalid category" });
    }

    // Find the product
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check stock availability
    if (product.stock <= 0) {
      return res.status(400).json({ message: "This product is out of stock" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Out of stock`,
        availableStock: product.stock,
      });
    }

    // Find or create user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product._id.toString() === productId && item.product.category === category
    );

    const newQuantity = existingItemIndex >= 0
      ? cart.items[existingItemIndex].quantity + quantity
      : quantity;

    // Verify stock can accommodate new quantity
    if (product.stock < newQuantity) {
      const available = product.stock - (existingItemIndex >= 0 ? cart.items[existingItemIndex].quantity : 0);
      return res.status(400).json({
        message: available > 0
          ? `You can only add ${available} more of this item`
          : "No additional items available",
        maxAvailable: available > 0 ? available : 0,
      });
    }

    // Prepare the product data for cart
    const productData = {
      _id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: category // Explicitly setting category is crucial
    };

    // Update or add item
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        product: productData,
        quantity
      });
    }

    // Save the cart
    await cart.save();

    return res.status(200).json({
      message: "Item added to cart",
      cart,
    });

  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/carts/items/:productId
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Positive quantity is required" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.product._id.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    // Verify stock availability
    let productModel;
    switch (item.product.category) {
      case "Product":
      case "Interior":
      case "Exterior":
      case "Test":
        productModel = Product;
        break;
      case "Gadget":
        productModel = Gadget;
        break;
      case "Fragrance":
        productModel = Fragrance;
        break;
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product no longer available" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Only ${product.stock} items available`,
        maxAvailable: product.stock,
      });
    }

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({
      message: "Cart item updated",
      cart,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/carts/items/:productId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const initialItemCount = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.product._id.toString() !== productId
    );    

    if (cart.items.length === initialItemCount) {
      return res.status(404).json({ 
        message: "Item not found in your cart",
        suggestion: "Please refresh your cart and try again"
      });
    }

    await cart.save();

    res.status(200).json({
      message: "Item removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      message: "Failed to remove item from cart",
      error: error.message,
    });
  }
};

// @desc    Clear user's cart
// @route   DELETE /api/carts
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Fetch product images concurrently using Promise.all
    const cartItemsWithImages = await Promise.all(
      cart.items.map(async (item) => {
        let productModel;

        // Determine the correct model based on category
        switch (item.product.category) {
          case "Product":
          case "Interior":
          case "Exterior":
          case "Test":
            productModel = Product;
            break;
          case "Gadget":
            productModel = Gadget;
            break;
          case "Fragrance":
            productModel = Fragrance;
            break;
          default:
            productModel = Product; // Default fallback
            break;
        }

        // Fetch product details including image
        const product = await productModel.findById(item.product._id);
        if (product) {
          item.product.image = product.images[0]; // Assuming you want the first image
        } else {
          item.product.image = null; // Set to null if product not found
        }

        return item;
      })
    );

    // Replace the cart items with updated ones
    cart.items = cartItemsWithImages;

    res.status(200).json(cart);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
