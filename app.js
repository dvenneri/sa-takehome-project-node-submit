const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

var app = express();

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json({}));

/**
 * Home route
 */
app.get('/', function(req, res) {
  res.render('index');
});

/**
 * Checkout route
 */
app.get('/checkout', function(req, res) {
  // Just hardcoding amounts here to avoid using a database
  const item = req.query.item;
  let title, amount, error;

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering"
      amount = 2300      
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993"
      amount = 2500
      break;     
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source"
      amount = 2800  
      break;     
    default:
      // Included in layout view, feel free to assign error
      error = "No item selected"      
      break;
  }

  let displayAmount;
  if (amount) {
    displayAmount = (amount / 100).toFixed(2); // 2300 -> "23.00"
  }

  res.render('checkout', {
    title,
    amount,               // still in cents
    displayAmount,        // friendly string for UI
    error,
    item,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

/**
 * Success route
 */
app.get('/success', function(req, res) {
  const paymentIntentId = req.query.payment_intent;
  const amountParam = req.query.amount;

  let displayAmount;
  if (amountParam) {
    displayAmount = (Number(amountParam) / 100).toFixed(2);
  }

  res.render('success', {
    paymentIntentId: paymentIntentId,
    amount: displayAmount
  });
});

app.post('/create-payment-intent', async (req, res) => {
  const { item } = req.body;
  let amount;

  if (item === '1') amount = 2300;
  else if (item === '2') amount = 2500;
  else if (item === '3') amount = 2800;
  else return res.status(400).json({ error: 'Invalid item' });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'aud',
      automatic_payment_methods: { enabled: true }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount
    });
  } catch (err) {
    console.error('Error creating PaymentIntent', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Start server
 */
app.listen(3000, () => {
  console.log('Getting served on port 3000');
});
