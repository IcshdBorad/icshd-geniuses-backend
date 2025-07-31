require('dotenv').config();  // تحميل المتغيرات من .env
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ خطأ: متغير البيئة MONGO_URI غير معرف!");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ تم الاتصال بقاعدة البيانات بنجاح!");
  } catch (error) {
    console.error("❌ حدث خطأ أثناء الاتصال بقاعدة البيانات:", error);
  } finally {
    await client.close();
  }
}

run();
