const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const Item = require('./models/Item');
const User = require('./models/User');

const app = express();

const CURRENCY = process.env.CURRENCY || 'GBP';
const LIST_NAME = process.env.LIST_NAME || 'My Wishlist';
const LIST_TYPE = process.env.LIST_TYPE || 'bday';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '27017';
const PORT = process.env.PORT || 8092;

// Currency symbols mapping
const currencySymbols = {
    'USD': '$',
    'GBP': '£',
    'EUR': '€',
};

// List Types
const occasion = {
    'bday': 'wishlist-present.png',
    'xmas': 'wishlist-xmas.png',
    'wedding': 'wishlist-wedding.png',
};

const connectWithRetry = (retries) => {
    return mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/simple-wishlist`, {
        serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
        console.log('Connected to MongoDB');
        startServer();
    })
    .catch((err) => {
        if (retries > 0) {
            console.log(`MongoDB connection failed. Retrying... (${retries} attempts left)`);
            setTimeout(() => connectWithRetry(retries - 1), 5000);
        } else {
            console.error('Failed to connect to MongoDB after multiple attempts. Shutting down...');
            process.exit(1);
        }
    });
};

connectWithRetry(3);

app.use(session({
    secret: process.env.SESSION_SECRET || 'yjtfkuhgkuygibjlljbvkuvykjvjlkvv',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

const auth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

const checkAdminSetup = async (req, res, next) => {
    const adminCount = await User.countDocuments();
    if (adminCount === 0) {
        return res.redirect('/setup');
    }
    next();
};

app.use((req, res, next) => {
    if (req.path !== '/setup') {
        return checkAdminSetup(req, res, next);
    }
    next();
});

app.get('/setup', async (req, res) => {
    const adminCount = await User.countDocuments();
    if (adminCount === 0) {
        res.render('setup', {
            listType: occasion[LIST_TYPE]
        });
    } else {
        res.redirect('/login');
    }
});

app.post('/setup', [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').isLength({ min: 8 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const adminCount = await User.countDocuments();
    if (adminCount === 0) {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        
        res.redirect('/login');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login', {
        listType: occasion[LIST_TYPE]
    });
});

app.post('/login', [
    body('username').trim().escape(),
    body('password').trim()
], passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

app.get('/admin', auth, async (req, res) => {
    const items = await Item.find().sort({ _id: -1 });
    res.render('admin', {
        listType: occasion[LIST_TYPE],
        currency: CURRENCY, 
        currencySymbol: currencySymbols[CURRENCY],
        items: items
    });
});

app.post('/admin/add-item', auth, [
    body('name').trim().escape(),
    body('price').isFloat({ min: 0, max: 1000000 }).toFloat(),
    body('url').isURL().customSanitizer(value => {
        if (!/^https?:\/\//i.test(value)) {
            value = 'http://' + value;
        }
        return value;
    }),
    body('imageUrl').isURL().customSanitizer(value => {
        if (!/^https?:\/\//i.test(value)) {
            value = 'http://' + value;
        }
        return value;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, price, url, imageUrl } = req.body;
    
    const sanitizedName = sanitizeHtml(name, {
        allowedTags: [],
        allowedAttributes: {}
    });

    try {
        await Item.create({ name: sanitizedName, price, url, imageUrl, purchased: false });
        res.redirect('/');
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).send('Error adding item');
    }
});

app.post('/admin/delete-item/:id', auth, async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).send('Error deleting item');
    }
});

app.get('/', async (req, res) => {
    const wishlistItems = await Item.find({ purchased: false }).sort({ _id: -1 });
    const purchasedItems = await Item.find({ purchased: true }).sort({ _id: -1 });
    
    res.render('index', { 
        wishlistItems, 
        purchasedItems, 
        currency: CURRENCY, 
        currencySymbol: currencySymbols[CURRENCY],
        listName: LIST_NAME,
        listType: occasion[LIST_TYPE]
    });
});

app.post('/purchase/:id', async (req, res) => {
    try {
        await Item.findByIdAndUpdate(req.params.id, { purchased: true });
        res.redirect('/');
    } catch (error) {
        console.error('Error purchasing item:', error);
        res.status(500).send('Error purchasing item');
    }
});

app.post('/restore/:id', async (req, res) => {
    try {
        await Item.findByIdAndUpdate(req.params.id, { purchased: false });
        res.redirect('/');
    } catch (error) {
        console.error('Error restoring item:', error);
        res.status(500).send('Error restoring item');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    });
});