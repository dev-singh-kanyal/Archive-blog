const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const PORT = process.env.PORT || 8000;

app.use(express.json({ extended: false }));

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://127.0.0.1");
    const db = client.db("blog");
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to database", error });
  }
};

app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articlesCollection = db.collection("articles");
    const articleInfo = await articlesCollection.findOne({
      name: articleName,
    });
    res.status(200).json(articleInfo);
  }, res);
});

app.post("/api/articles/:name/add-comments", (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;
  withDB(async (db) => {
    const articlesCollection = db.collection("articles");
    const articleInfo = await articlesCollection.findOne({
      name: articleName,
    });
    await articlesCollection.updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }),
        },
      }
    );
    const updateArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updateArticleInfo);
  }, res);
});

app.listen(PORT, () => console.log(`Server started at port ${PORT}`));
