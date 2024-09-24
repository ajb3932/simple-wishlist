<div align="center">
<a href="https://github.com/ajb3932/simple-wishlist"><img src="https://raw.githubusercontent.com/ajb3932/simple-wishlist/refs/heads/main/public/images/wishlist-present.png" title="Logo" style="max-width:100%;" width="128" /></a>
</div>

# 📝 Simple Wishlist
Simple Wishlist is a Node.js application that allows users to conveniently organize their desired items in one place. 

It features a secure admin panel for adding and deleting items, while family and friends can mark items as 'Purchased' to prevent duplicate gifts.

💁 Please be kind, this is my first Node.Js app.

## 📷 Screenshot 

<img src="https://raw.githubusercontent.com/ajb3932/simple-wishlist/refs/heads/main/public/images/Screenshot%202024-09-24.png" title="App Screenshot" style="max-width:100%;"/>



## 🐳 Docker 

**Docker Compose:**

```yaml
version: '3'
services:
  wishlist:
    image: ajb3932/simple-wishlist:latest
    container_name: wishlist
    hostname: wishlist
    ports:
      - 8092:8092
    environment:
      - DBHOST=mongodb:27017
      - CURRENCY=USD
      - LIST_NAME=My Wishlist
      - LIST_TYPE=bday
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    container_name: wishlist-db
    hostname: mongodb
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

**Docker CLI:**

⚠️ Must have a MongoDB to connect too.

```bash
docker run -d -p 8092:8092 -e DBHOST=10.0.0.10:27017 ajb3932/simple-wishlist
```

## 🌍 Environment Variables

The following Environment Variables are available:

| Variable Name | Description                               | Options                   | Default Value     |
|---------------|-------------------------------------------|---------------------------|-------------------|
| `CURRENCY`    | Change the site to display `£`,`$` or `€` | `USD`, `GBP`, `EUR`       | `USD`             |
| `LIST_NAME`   | Change the heading to display             | `Any String`              | `My Wishlist`     |
| `LIST_TYPE`   | Change to Favicon and Logo                | `xmas`, `bday`, `wedding` | `bday`            |
| `DBHOST`      | Set the MongoDB Host                      | `[IP_Address]:[PORT]`     | `localhost:27017` |
| `DBNAME`      | Set the name of the database              | `any_string`              | `simple-wishlist` |
| `PORT`        | Change the port the application runs on   | `[PORT]`                  | `8092`            |

## 🚀 First Run

When the app first runs it will take you to `/setup` where you will be asked to set up an admin login user.

## 💻 Usage

**`/`**
The public wishlist page is the root of the web app.
If you click purchased it will move the item to the 'Purchased' table 

**`/admin`**
The admin panel for the app. Here you can add and delete items on the wishlist.

Available fields to add an item:

| Field     | Description                                           |
|-----------|-------------------------------------------------------|
| Name      | The name of the item and other information i.e size   |
| Item URL  | The URL to the item                                   |
| Price     | The price of the item                                 |
| Image URL | A URL for a product photo                             |

**`/setup`**
Only used on the first run and will not be available once an admin user has been set up.

## 🙋 I want to run this myself

🐳 Docker
``` bash
git clone https://github.com/ajb3932/simple-wishlist.git
cd simple-wishlist
docker build -t my-wishlist .
docker run -d -p 8092:8092 -e DBHOST=10.0.0.10:27017 my-wishlist
```

💾 Node.js
``` bash
git clone https://github.com/ajb3932/simple-wishlist.git
cd simple-wishlist
npm install --production
node server.js
```