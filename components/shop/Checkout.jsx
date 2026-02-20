"use client";
import React from "react";
import PaymentMethod from "./PaymentMethod";
import Link from "next/link";
import { useContextElement } from "@/context/Context";

export default function Checkout() {
  const { cartProducts, totalPrice } = useContextElement();
  return (
    <div className="checkout-wrapper space-top space-extra-bottom">
      <div className="container">
        <form action="#" className="woocommerce-checkout">
          <div className="row gx-60 gy-60">
            <div className="col-lg-6">
              <h2 className="h3 fw-semibold mt-n2 mb-40">Billing Details</h2>
              <div className="row">
                <div className="col-md-12 form-group">
                  <label>FIRST NAME *</label>
                  <input type="text" className="form-control" placeholder="" />
                </div>
                <div className="col-md-12 form-group">
                  <label>LAST NAME *</label>
                  <input type="text" className="form-control" placeholder="" />
                </div>
                <div className="col-12 form-group">
                  <label>COMPANY NAME (OPTIONAL)</label>
                  <input type="text" className="form-control" placeholder="" />
                </div>
                <div className="col-12 form-group">
                  <label>COUNTRY / REGION&nbsp;*</label>
                  <select className="form-select">
                    <option>United State (US)</option>
                    <option>United Kingdom (UK)</option>
                    <option>Equatorial Guinea (GQ)</option>
                    <option>Australia (AU)</option>
                    <option>Germany (DE)</option>
                  </select>
                </div>
                <div className="col-12 form-group">
                  <label>STREET ADDRESS *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="House number and street name"
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Apartment, suite, unit, etc. (optional)"
                  />
                </div>
                <div className="col-12 form-group">
                  <label>TOWN / CITY *</label>
                  <select className="form-select">
                    <option>California</option>
                    <option>United Kingdom</option>
                    <option>Equatorial Guinea</option>
                    <option>Australia</option>
                    <option>Germany</option>
                  </select>
                </div>
                <div className="col-12 form-group">
                  <label>ZIP CODE *</label>
                  <input type="text" className="form-control" placeholder="" />
                </div>
                <div className="col-12 form-group">
                  <label>PHONE *</label>
                  <input type="text" className="form-control" placeholder="" />
                </div>
                <div className="col-12 form-group">
                  <label>EMAIL ADDRESS *</label>
                  <input type="text" className="form-control" placeholder="" />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <h2 className="h3 fw-semibold mt-n2 mb-40">
                Additional information
              </h2>
              <div className="shipping_address">
                <div className="row">
                  <div className="col-12 form-group">
                    <label className="mb-3">ORDER NOTES (OPTIONAL)</label>
                    <textarea
                      name="message"
                      placeholder="Notes about your order, e.g. special notes for delivery."
                      className="form-control"
                      defaultValue={""}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        <h3 className="fw-semibold mt-60 mb-35">Your Order</h3>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="woocommerce-cart-form"
        >
          {cartProducts.length ? (
            <table className="cart_table mb-20">
              <thead>
                <tr>
                  <th className="cart-col-productname">PRODUCT</th>
                  <th className="cart-col-total">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {cartProducts.map((product, i) => (
                  <tr key={i} className="cart_item">
                    <td data-title="Name">
                      <Link
                        className="cart-productname"
                        href={`/shop-details/${product.id}`}
                      >
                        {product.title} <span>x{product.quantity}</span>
                      </Link>
                    </td>
                    <td data-title="Price">
                      <span className="amount">
                        <bdi>
                          <span>€</span>
                          {(product.price * product.quantity).toFixed(2)}
                        </bdi>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="checkout-ordertable">
                <tr className="cart-subtotal">
                  <th>SUBTOTAL</th>
                  <td data-title="Subtotal">
                    <span className="woocommerce-Price-amount amount">
                      <bdi>
                        <span className="woocommerce-Price-currencySymbol">
                          €
                        </span>
                        {totalPrice.toFixed(2)}
                      </bdi>
                    </span>
                  </td>
                </tr>
                <tr className="order-total">
                  <th>TOTAL</th>
                  <td data-title="Total">
                    <strong>
                      <span className="woocommerce-Price-amount amount">
                        <bdi>
                          <span className="woocommerce-Price-currencySymbol">
                            €
                          </span>
                          {totalPrice.toFixed(2)}
                        </bdi>
                      </span>
                    </strong>
                  </td>
                </tr>
              </tfoot>
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
        <div className="mt-lg-3 mb-30">
          <div className="woocommerce-checkout-payment">
            <ul className="wc_payment_methods payment_methods methods">
              <PaymentMethod />
            </ul>
            <div className="form-row place-order">
              <button type="submit" className="btn">
                <span className="link-effect">
                  <span className="effect-1">PLACE ORDER</span>
                  <span className="effect-1">PLACE ORDER</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
