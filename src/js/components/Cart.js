import { select, classNames, templates, settings } from "../settings.js";
import utils from "../utils.js";
import CartProduct from "./CartProduct.js";

class Cart{
    constructor(element) {
      const thisCart = this;

      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      // console.log('new Cart', thisCart);
      // console.log(thisCart.products)
    }
    getElements(element) {
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    }
    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function () {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function () {
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function (event) {
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisCart.sendOrder();
      })
    }
    add(menuProduct) {
      const thisCart = this;
      // console.log('adding product', menuProduct);

      /* generate HTML based on template */
      const generatedHTML = templates.cartProduct(menuProduct);
      /* create element using utils.createElementFromHTML */
      thisCart.element = utils.createDOMFromHTML(generatedHTML);
      const generatedDOM = thisCart.element;
      // console.log(generatedDOM)
      /* add element to product list */
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      // console.log('thisCart.products', thisCart.products)
      thisCart.update();
    }
    update() {
      const thisCart = this;
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
      for (let product of thisCart.products) {
        // console.log(product)
        thisCart.totalNumber += product.value;
        thisCart.subtotalPrice += product.price;
      }
      if (thisCart.totalNumber == 0) {
        thisCart.deliveryFee = 0;
        thisCart.totalPrice = 0;
      } else {
        thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      }
      // console.log({ deliveryFee }, { totalNumber }, { subtotalPrice }, thisCart.totalPrice)
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      for (const totalPrice of thisCart.dom.totalPrice) {
        totalPrice.innerHTML = thisCart.totalPrice;
      }
    }
    remove(cartProduct) {
      const thisCart = this;
      console.log(cartProduct)
      cartProduct.dom.wrapper.remove();
      const indexOfRemovedProduct = thisCart.products.indexOf(cartProduct);
      // console.log('index - removed product', indexOfRemovedProduct);
      thisCart.products.splice(indexOfRemovedProduct, 1);
      // console.log('products', thisCart.products);
      thisCart.update();
    }
    clearCart() {
      const thisCart = this;
      for (let product of thisCart.products) {
        product.dom.wrapper.remove();
      }
      thisCart.products = [];
      thisCart.update();
      thisCart.dom.address.value = '';
      thisCart.dom.phone.value = '';
    }
    sendOrder() {
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.orders;
      const payload = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };
      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      };
      fetch(url, options)
      // console.log(payload);
      // console.log(this);
        .then(function (response) {
          return response.json();
        }).then(function (parsedResponse) {
          console.log('parsedResponse', parsedResponse);
        });
      this.clearCart();
    }
}
  
export default Cart;