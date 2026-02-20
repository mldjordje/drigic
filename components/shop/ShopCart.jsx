"use client";
import { useContextElement } from "@/context/Context";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function ShopCart() {
  const { cartProducts, setCartProducts, totalPrice, updateQuantity } =
    useContextElement();
  const removeItem = (id) => {
    setCartProducts((pre) => [...pre.filter((elm) => elm.id != id)]);
  };

  const setQuantity = (id, quantity) => {
    if (quantity >= 1) {
      updateQuantity(id, quantity);
    }
  };
  return (
    <div className="cart-wrapper space-top space-extra-bottom">
      <div className="container">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="woocommerce-cart-form"
        >
          {cartProducts.length ? (
            <table className="cart_table">
              <thead>
                <tr>
                  <th colSpan={3} className="cart-col-productname">
                    PRODUCT
                  </th>
                  <th className="cart-col-price">PRICE</th>
                  <th className="cart-col-quantity">QUANTITY</th>
                  <th className="cart-col-total">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {cartProducts.map((elm, i) => (
                  <tr key={i} className="cart_item">
                    <td data-title="Remove">
                      <a onClick={() => removeItem(elm.id)} className="remove">
                        <i className="fas fa-times" />
                      </a>
                    </td>
                    <td data-title="Product">
                      <Link
                        className="cart-productimage"
                        href={`/shop-details/${elm.id}`}
                      >
                        <Image
                          width={100}
                          height={108}
                          alt="Image"
                          src={elm.imgSrc}
                        />
                      </Link>
                    </td>
                    <td data-title="Name">
                      <Link
                        className="cart-productname"
                        href={`/shop-details/${elm.id}`}
                      >
                        {elm.title}
                      </Link>
                    </td>
                    <td data-title="Price">
                      <span className="amount">
                        <bdi>
                          <span>€</span>
                          {elm.price.toFixed(2)}
                        </bdi>
                      </span>
                    </td>
                    <td data-title="Quantity">
                      <div className="quantity">
                        <span className="title">Quantity</span>
                        <button
                          className="quantity-minus qty-btn"
                          onClick={() => setQuantity(elm.id, elm.quantity - 1)}
                        >
                          <i className="fas fa-minus" />
                        </button>
                        <input
                          type="number"
                          name="number"
                          value={elm.quantity}
                          min={1}
                          className="qty-input"
                          max={99}
                          onChange={(e) => setQuantity(elm.id, e.target.value)}
                        />
                        <button
                          className="quantity-plus qty-btn"
                          onClick={() => setQuantity(elm.id, elm.quantity + 1)}
                        >
                          <i className="fas fa-plus" />
                        </button>
                      </div>
                    </td>
                    <td data-title="Total">
                      <span className="amount">
                        <bdi>
                          <span>€</span> {(elm.price * elm.quantity).toFixed(2)}
                        </bdi>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="row justify-content-start mb-5 align-items-center">
              <div className="col-6 text-start">Your cart is empty</div>
              <Link href={`/shop`} className="btn col-auto">
                <span className="link-effect">
                  <span className="effect-1">Explore Products</span>
                  <span className="effect-1">Explore Products</span>
                </span>
              </Link>{" "}
            </div>
          )}
        </form>
        {cartProducts.length ? (
          <div className="row gy-30 justify-content-between">
            <div className="col-xl-4 col-lg-6">
              <div className="cart-coupon">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Coupon Code..."
                />
                <button type="submit" className="btn">
                  <span className="link-effect">
                    <span className="effect-1">APPLY</span>
                    <span className="effect-1">APPLY</span>
                  </span>
                </button>
              </div>
            </div>
            <div className="col-auto">
              <button type="submit" className="btn">
                <span className="link-effect">
                  <span className="effect-1">UPDATE CART</span>
                  <span className="effect-1">UPDATE CART</span>
                </span>
              </button>
            </div>
          </div>
        ) : (
          ""
        )}
        <div className="row justify-content-end">
          <div className="col-12">
            <h3 className="fw-semibold summary-title mt-90 mb-2">
              Cart Totals
            </h3>
            <table className="cart_totals">
              <tbody>
                <tr>
                  <td>SUBTOTAL</td>
                  <td data-title="Cart Subtotal">
                    <span className="amount">
                      <bdi>
                        <span>€</span>
                        {totalPrice.toFixed(2)}
                      </bdi>
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="order-total">
                  <td>TOTAL</td>
                  <td data-title="Total">
                    <strong>
                      <span className="amount">
                        <bdi>
                          <span>€</span> {totalPrice.toFixed(2)}
                        </bdi>
                      </span>
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>
            <div className="wc-proceed-to-checkout mb-30">
              <Link href={`/checkout`} className="btn">
                <span className="link-effect">
                  <span className="effect-1">PROCEED TO CHECKOUT</span>
                  <span className="effect-1">PROCEED TO CHECKOUT</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
