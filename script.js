/*
============================================================
BATCH 28 CONFIGURATION
============================================================

Replace this with your Google Apps Script Web App URL
AFTER you create the Apps Script.

Example:

const GOOGLE_SCRIPT_URL =
"https://script.google.com/macros/s/XXXXX/exec";
*/

const GOOGLE_SCRIPT_URL =
"YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";


/* ============================================================
   CART / ORDER VARIABLES
============================================================ */

let cart = [];

let collections = [];

let currentOrder = null;

/*
Holds a collection object when the customer picks their own
Sunday via the "Need a different Sunday?" date field, instead
of one of the auto-generated radio options.
*/
let customCollection = null;


/* ============================================================
   INITIALISE
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  loadCollections();

  renderCart();

  updateBrowniePrice();

});


/* ============================================================
   HAMBURGER MENU
============================================================ */

function toggleMobileMenu() {

  const menu =
    document.getElementById("mobileMenu");

  menu.classList.toggle("open");

}


function closeMobileMenu() {

  const menu =
    document.getElementById("mobileMenu");

  menu.classList.remove("open");

}


/* ============================================================
   PRODUCT CART
============================================================ */

function addToCart(id, name, price) {

  const existing =
    cart.find(item => item.id === id);

  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({

      id,

      name,

      price,

      quantity: 1

    });

  }

  renderCart();

  showToast(
    `${name} added to cart 🍪`
  );

}


/* ============================================================
   BROWNIE SELECTOR
============================================================ */

function updateBrowniePrice() {

  const selector =
    document.getElementById(
      "brownieSelector"
    );

  const selected =
    selector.options[
      selector.selectedIndex
    ];

  const price =
    Number(
      selected.dataset.price
    );

  const priceDisplay =
    document.getElementById(
      "browniePrice"
    );

  if (
    selector.selectedIndex === 0
  ) {

    priceDisplay.textContent =
      "From $10.80";

  } else {

    priceDisplay.textContent =
      `$${price.toFixed(2)}`;

  }

}


function addSelectedBrownie() {

  const selector =
    document.getElementById(
      "brownieSelector"
    );

  const selected =
    selector.options[
      selector.selectedIndex
    ];

  const id =
    selected.value;

  const name =
    selected.dataset.name;

  const price =
    Number(
      selected.dataset.price
    );

  addToCart(
    id,
    name,
    price
  );

}


/* ============================================================
   QUANTITY
============================================================ */

function changeQuantity(id, change) {

  const item =
    cart.find(
      product => product.id === id
    );

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {

    cart =
      cart.filter(
        product => product.id !== id
      );

  }

  renderCart();

}


/* ============================================================
   CART TOTAL
============================================================ */

function getCartTotal() {

  return cart.reduce(
    (total, item) =>
      total +
      item.price *
      item.quantity,
    0
  );

}


/* ============================================================
   RENDER CART
============================================================ */

function renderCart() {

  const cartItems =
    document.getElementById(
      "cartItems"
    );

  const emptyCart =
    document.getElementById(
      "emptyCart"
    );

  const cartSummary =
    document.getElementById(
      "cartSummary"
    );

  const cartCount =
    document.getElementById(
      "cartCount"
    );

  const cartTotal =
    document.getElementById(
      "cartTotal"
    );


  const itemCount =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );


  cartCount.textContent =
    itemCount;


  if (cart.length === 0) {

    cartItems.innerHTML = "";

    emptyCart.classList.remove(
      "hidden"
    );

    cartSummary.classList.add(
      "hidden"
    );

    return;

  }


  emptyCart.classList.add(
    "hidden"
  );

  cartSummary.classList.remove(
    "hidden"
  );


  cartItems.innerHTML =
    cart.map(item => `

      <div class="cart-item">

        <div>

          <strong>
            ${escapeHtml(item.name)}
          </strong>

          <small>
            $${item.price.toFixed(2)} each
          </small>

          <div class="quantity-controls">

            <button
              type="button"
              onclick="changeQuantity(
                '${item.id}',
                -1
              )"
            >
              −
            </button>

            <strong>
              ${item.quantity}
            </strong>

            <button
              type="button"
              onclick="changeQuantity(
                '${item.id}',
                1
              )"
            >
              +
            </button>

          </div>

        </div>

        <strong>
          $${(
            item.price *
            item.quantity
          ).toFixed(2)}
        </strong>

      </div>

    `).join("");


  cartTotal.textContent =
    getCartTotal().toFixed(2);

}


/* ============================================================
   CART DRAWER
============================================================ */

function openCart() {

  document
    .getElementById("cartDrawer")
    .classList.add("open");

}


function closeCart() {

  document
    .getElementById("cartDrawer")
    .classList.remove("open");

}


/* ============================================================
   COLLECTIONS
============================================================ */

function loadCollections() {

  /*
  Temporary demo collections.

  Once Google Apps Script is connected,
  these can be replaced with values
  from your COLLECTIONS tab.
  */

  const today =
    new Date();

  collections = [];


  for (
    let i = 0;
    i < 6;
    i++
  ) {

    const sunday =
      getNextSunday(
        today,
        i
      );


    collections.push({

      id:
        `C${String(i + 1).padStart(3, "0")}`,

      date:
        formatDateForInput(
          sunday
        ),

      displayDate:
        formatFriendlyDate(
          sunday
        ),

      time:
        "2:00 PM – 5:00 PM",

      address:
        "Collection address will be provided",

      status:
        "OPEN"

    });

  }


  /*
  If Google Apps Script endpoint
  is available, attempt to fetch
  real collection information.
  */

  if (
    GOOGLE_SCRIPT_URL &&
    !GOOGLE_SCRIPT_URL.includes(
      "YOUR_GOOGLE"
    )
  ) {

    fetch(
      GOOGLE_SCRIPT_URL +
      "?action=getCollections"
    )

      .then(
        response =>
          response.json()
      )

      .then(
        data => {

          if (
            data &&
            Array.isArray(
              data.collections
            )
          ) {

            collections =
              data.collections;

          }

          renderCollectionOptions();

          renderCollectionPreview();

        }
      )

      .catch(() => {

        renderCollectionOptions();

        renderCollectionPreview();

      });

  } else {

    renderCollectionOptions();

    renderCollectionPreview();

  }

}


/* ============================================================
   GET NEXT SUNDAY
============================================================ */

function getNextSunday(
  date,
  weeksAhead
) {

  const result =
    new Date(date);

  const day =
    result.getDay();

  const daysUntilSunday =
    (7 - day) % 7;


  result.setDate(
    result.getDate() +
    daysUntilSunday +
    (weeksAhead * 7)
  );


  /*
  If today is Sunday,
  that week's collection
  has already passed.
  */

  if (
    weeksAhead === 0 &&
    day === 0
  ) {

    result.setDate(
      result.getDate() + 7
    );

  }


  return result;

}


/* ============================================================
   CHECK COLLECTION DEADLINE
============================================================ */

function isCollectionOpen(
  collectionDate
) {

  const date =
    new Date(
      collectionDate +
      "T23:59:59"
    );


  /*
  Thursday immediately before
  the Sunday collection.
  */

  const cutoff =
    new Date(date);

  cutoff.setDate(
    cutoff.getDate() - 3
  );

  cutoff.setHours(
    23,
    59,
    59,
    999
  );


  return new Date() <= cutoff;

}


/* ============================================================
   COLLECTION OPTIONS
============================================================ */

function renderCollectionOptions() {

  const container =
    document.getElementById(
      "collectionOptions"
    );

  if (!container) return;


  const openCollections =
    collections.filter(
      collection =>
        collection.status !== "CLOSED" &&
        isCollectionOpen(
          collection.date
        )
    );


  if (
    openCollections.length === 0
  ) {

    container.innerHTML = `

      <div class="status-note">
        No upcoming collection dates
        are currently available.
      </div>

    `;

    return;

  }


  container.innerHTML =
    openCollections
      .map(
        (collection, index) => `

        <div class="collection-option">

          <input
            type="radio"
            name="collection"
            id="collection-${collection.id}"
            value="${collection.id}"
            ${index === 0 ? "checked" : ""}
            onclick="clearCustomCollectionDate()"
          >

          <label
            class="collection-label"
            for="collection-${collection.id}"
          >

            <strong>
              ${escapeHtml(
                collection.displayDate ||
                formatFriendlyDate(
                  new Date(
                    collection.date +
                    "T12:00:00"
                  )
                )
              )}
            </strong>

            <span>
              ${escapeHtml(
                collection.time
              )}
            </span>

            <span>
              Order by Thursday
              11:59 PM
            </span>

          </label>

        </div>

      `
      )
      .join("");

}


/* ============================================================
   COLLECTION PREVIEW
============================================================ */

function renderCollectionPreview() {

  const container =
    document.getElementById(
      "collectionPreview"
    );

  if (!container) return;


  const openCollections =
    collections.filter(
      collection =>
        collection.status !== "CLOSED" &&
        isCollectionOpen(
          collection.date
        )
    );


  container.innerHTML =
    openCollections
      .map(
        collection => `

        <div class="collection-card">

          <strong>
            ${escapeHtml(
              collection.displayDate ||
              formatFriendlyDate(
                new Date(
                  collection.date +
                  "T12:00:00"
                )
              )
            )}
          </strong>

          <div>
            ${escapeHtml(
              collection.time
            )}
          </div>

          <div>
            Pre-orders close Thursday
            at 11:59 PM
          </div>

        </div>

      `
      )
      .join("");

}


/* ============================================================
   CUSTOM COLLECTION DATE
============================================================ */

function toggleCustomDatePicker() {

  const picker =
    document.getElementById(
      "customDatePicker"
    );

  if (!picker) return;

  picker.classList.toggle("show");

}


/*
Called whenever a customer clicks one of the
auto-generated Sunday radio buttons — makes sure
a previously picked custom date doesn't silently
stay selected underneath it.
*/
function clearCustomCollectionDate() {

  customCollection = null;

  const input =
    document.getElementById(
      "customCollectionDate"
    );

  if (input) input.value = "";

}


function selectCustomCollectionDate() {

  const input =
    document.getElementById(
      "customCollectionDate"
    );

  if (!input || !input.value) {

    customCollection = null;

    return;

  }


  const date =
    new Date(
      input.value + "T12:00:00"
    );


  if (isNaN(date.getTime())) {

    showToast(
      "Please choose a valid date."
    );

    customCollection = null;

    return;

  }


  /*
  Collection is only offered on Sundays.
  */
  if (date.getDay() !== 0) {

    showToast(
      "Please choose a Sunday for collection."
    );

    input.value = "";

    customCollection = null;

    return;

  }


  customCollection = {

    id: "CUSTOM",

    date: input.value,

    displayDate:
      formatFriendlyDate(date),

    time:
      "To be confirmed",

    address:
      "Collection address will be provided",

    status: "OPEN"

  };


  /*
  Uncheck the standard radio options so this
  custom date is unambiguously the active choice.
  */
  document
    .querySelectorAll(
      'input[name="collection"]'
    )
    .forEach(radio => {

      radio.checked = false;

    });


  showToast(
    `Selected ${customCollection.displayDate} for collection.`
  );

}


/* ============================================================
   CHECKOUT
============================================================ */

function showCheckout() {

  if (cart.length === 0) {

    showToast(
      "Your cart is empty."
    );

    return;

  }


  document
    .getElementById("checkout")
    .classList.add("show");


  document
    .getElementById("checkout")
    .scrollIntoView({
      behavior: "smooth"
    });

}


/* ============================================================
   CREATE ORDER
============================================================ */

async function createOrder() {

  const name =
    document
      .getElementById(
        "customerName"
      )
      .value
      .trim();


  const whatsapp =
    document
      .getElementById(
        "whatsapp"
      )
      .value
      .trim();


  const notes =
    document
      .getElementById(
        "notes"
      )
      .value
      .trim();


  const selectedRadio =
    document.querySelector(
      'input[name="collection"]:checked'
    );


  if (!name) {

    showToast(
      "Please enter your name."
    );

    return;

  }


  if (!whatsapp) {

    showToast(
      "Please enter your WhatsApp number."
    );

    return;

  }


  /*
  A collection can come from either a standard
  radio option OR a custom picked Sunday.
  */
  let collection = null;

  if (selectedRadio) {

    collection =
      collections.find(
        item =>
          item.id ===
          selectedRadio.value
      );

    customCollection = null;

  } else if (customCollection) {

    collection = customCollection;

  }


  if (!collection) {

    showToast(
      "Please select a collection Sunday."
    );

    return;

  }


  if (
    !isCollectionOpen(
      collection.date
    )
  ) {

    showToast(
      "Sorry, that collection date has closed."
    );

    loadCollections();

    return;

  }


  const orderId =
    generateOrderId();


  const total =
    getCartTotal();


  const items =
    cart.map(
      item => ({

        productId:
          item.id,

        name:
          item.name,

        quantity:
          item.quantity,

        price:
          item.price,

        lineTotal:
          Number(
            (
              item.price *
              item.quantity
            ).toFixed(2)
          )

      })
    );


  currentOrder = {

    orderId,

    timestamp:
      new Date().toISOString(),

    customerName:
      name,

    whatsapp:
      whatsapp,

    collectionId:
      collection.id,

    collectionDate:
      collection.date,

    collectionTime:
      collection.time,

    collectionAddress:
      collection.address,

    items,

    subtotal:
      total,

    total,

    paymentStatus:
      "PENDING",

    orderStatus:
      "AWAITING PAYMENT",

    notes

  };


  /*
  Send order to Google Apps Script.
  */

  if (
    GOOGLE_SCRIPT_URL &&
    !GOOGLE_SCRIPT_URL.includes(
      "YOUR_GOOGLE"
    )
  ) {

    try {

      await fetch(
        GOOGLE_SCRIPT_URL,
        {

          method:
            "POST",

          mode:
            "no-cors",

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify(
              currentOrder
            )

        }
      );

    } catch (error) {

      console.error(
        "Could not submit order:",
        error
      );

    }

  }


  document
    .getElementById(
      "paynowOrderId"
    )
    .textContent =
    orderId;


  document
    .getElementById(
      "paynowAmount"
    )
    .textContent =
    total.toFixed(2);


  document
    .getElementById(
      "paynow"
    )
    .classList.add("show");


  document
    .getElementById(
      "paynow"
    )
    .scrollIntoView({
      behavior: "smooth"
    });

}


/* ============================================================
   CUSTOMER MARKS PAYMENT
============================================================ */

function markCustomerPaid() {

  if (!currentOrder) return;


  /*
  IMPORTANT:

  This does NOT set payment to PAID.

  It only tells the spreadsheet that
  the customer says they have paid.

  You manually verify the actual
  PayNow payment.
  */


  currentOrder.customerMarkedPaid =
    true;


  if (
    GOOGLE_SCRIPT_URL &&
    !GOOGLE_SCRIPT_URL.includes(
      "YOUR_GOOGLE"
    )
  ) {

    fetch(
      GOOGLE_SCRIPT_URL,
      {

        method:
          "POST",

        mode:
          "no-cors",

        headers: {

          "Content-Type":
            "text/plain;charset=utf-8"

        },

        body:
          JSON.stringify({

            action:
              "customerMarkedPaid",

            orderId:
              currentOrder.orderId

          })

      }
    );

  }


  showConfirmation();

}


/* ============================================================
   CONFIRMATION
============================================================ */

function showConfirmation() {

  const card =
    document.getElementById(
      "confirmationCard"
    );


  card.innerHTML = `

    <div>

      <strong>Order:</strong>

      ${escapeHtml(
        currentOrder.orderId
      )}

    </div>


    <div>

      <strong>Name:</strong>

      ${escapeHtml(
        currentOrder.customerName
      )}

    </div>


    <div>

      <strong>Total:</strong>

      $${currentOrder.total.toFixed(2)}

    </div>


    <div>

      <strong>Collection:</strong>

      ${escapeHtml(
        formatFriendlyDate(
          new Date(
            currentOrder.collectionDate +
            "T12:00:00"
          )
        )
      )}

    </div>


    <div>

      <strong>Time:</strong>

      ${escapeHtml(
        currentOrder.collectionTime
      )}

    </div>

  `;


  document
    .getElementById(
      "paynow"
    )
    .classList.remove(
      "show"
    );


  document
    .getElementById(
      "checkout"
    )
    .classList.remove(
      "show"
    );


  document
    .getElementById(
      "cartSummary"
    )
    .classList.add(
      "hidden"
    );


  document
    .getElementById(
      "cartItems"
    )
    .innerHTML = "";


  document
    .getElementById(
      "confirmation"
    )
    .classList.add(
      "show"
    );


  cart = [];

  customCollection = null;


  renderCart();

}


/* ============================================================
   HELPERS
============================================================ */

function generateOrderId() {

  const random =
    Math.floor(
      1000 +
      Math.random() * 9000
    );

  return `B28-${random}`;

}


function formatDateForInput(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;

}


function formatFriendlyDate(date) {

  return date.toLocaleDateString(
    "en-SG",
    {

      weekday:
        "long",

      day:
        "numeric",

      month:
        "long",

      year:
        "numeric"

    }
  );

}


function escapeHtml(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    2500
  );

}
